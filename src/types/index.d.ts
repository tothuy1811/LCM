export {};

declare global {
  interface Window {
    [K: string]: any; // eslint-disable-line
  }
}
