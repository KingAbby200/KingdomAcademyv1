// Polyfill for WebRTC globals
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

export {};
