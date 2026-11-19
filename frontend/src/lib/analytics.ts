/// <reference types="vite/client" />

export interface TelemetryEvent {
  category: 'analysis' | 'navigation' | 'security' | 'system' | 'error';
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class TelemetryManager {
  private events: TelemetryEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError('Window Error', event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError('Unhandled Promise Rejection', String(event.reason));
      });
    }
  }

  public track(event: Omit<TelemetryEvent, 'timestamp'>) {
    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.events.push(fullEvent);

    if (this.events.length > 200) {
      this.events.shift();
    }
  }

  public trackScan(fileName: string, fileSize: number, verdict: string, tamperProb: number) {
    this.track({
      category: 'analysis',
      action: 'scan_completed',
      label: verdict,
      value: tamperProb,
      metadata: {
        fileName,
        fileSizeBytes: fileSize,
      },
    });
  }

  public trackError(name: string, message: string, details?: Record<string, unknown>) {
    this.track({
      category: 'error',
      action: name,
      label: message,
      metadata: details,
    });
    console.error(`[ForensIQ ErrorTrack] ${name}: ${message}`, details);
  }

  public getHistory(): TelemetryEvent[] {
    return [...this.events];
  }
}

export const analytics = new TelemetryManager();
