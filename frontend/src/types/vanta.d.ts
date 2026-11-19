declare module 'vanta/dist/vanta.net.min' {
  const NET: (options: Record<string, any>) => {
    destroy: () => void;
    resize?: () => void;
  };
  export default NET;
}

declare module 'vanta/dist/vanta.dots.min' {
  const DOTS: (options: Record<string, any>) => {
    destroy: () => void;
    resize?: () => void;
  };
  export default DOTS;
}
