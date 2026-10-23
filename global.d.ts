export {};

declare global {
  interface Window {
    ktt10?: {
      setup: (options: { id: string; accountId: string; color: string }) => void;
    };
  }
}

declare module "*.css";
declare module "*.scss";
declare module "*.sass";
