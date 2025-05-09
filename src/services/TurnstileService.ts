declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement) => number | undefined;
      execute: (widgetId?: number) => void;
      reset: (widgetId?: number) => void;
      remove: (widgetId?: number) => void;
    };
    onTurnstileLoad?: () => void;
  }
}
type ResolveFn = (token: string) => void;

export class TurnstileService {
  private siteKey: string;
  private widgetId?: number;
  private ready: Promise<void>;

  constructor(siteKey: string) {
    this.siteKey = siteKey;
    this.ready = this.injectScript();
  }

  private injectScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).turnstile) return resolve();

      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
      script.async = true;
      script.onerror = () => reject(new Error("Falha ao carregar Turnstile"));
      window.onTurnstileLoad = () => {
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  public async executeChallenge(): Promise<string> {
    await this.ready;

    return new Promise<string>((resolve: ResolveFn) => {
      // Se ainda não renderizou, renderiza invisível
      if (this.widgetId == null) {
        this.widgetId = (window as any).turnstile.render(
          document.createElement("div"),
          {
            sitekey: this.siteKey,
            size: "invisible",
            callback: resolve,
          }
        );
      }
      // dispara o desafio invisível
      (window as any).turnstile.execute(this.widgetId);
    });
  }
}
