# Requirements: ForensIQ

## Functional Requirements
- **REQ-01 (Media Ingestion)**: Drag-and-drop file upload with support for images and video files (`react-dropzone`).
- **REQ-02 (Interactive Comparison)**: High-precision before/after comparison slider to contrast original vs. analyzed tamper-heatmaps (`react-compare-image`).
- **REQ-03 (Timeline & Metrics)**: Dynamic probability chart displaying frame-by-frame tampering likelihood (`recharts`).
- **REQ-04 (Forensic Diagnostic Panels)**: Granular trust score breakdown including metadata validation, frequency anomalies, and spatial artifacts.

## Non-Functional Requirements
- **REQ-NF-01 (Performance)**: Sub-second interaction latency with GPU-accelerated micro-animations (`framer-motion`).
- **REQ-NF-02 (Accessibility)**: Strict adherence to WCAG 2.1 AA standards (minimum 4.5:1 text contrast, visible focus rings, aria labels).
- **REQ-NF-03 (Responsive Design)**: Seamless layout adaptation across mobile, tablet, and widescreen desktop monitors.
