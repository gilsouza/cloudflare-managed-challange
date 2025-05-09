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
type RejectFn = (err: any) => void;

export class TurnstileService {
  private siteKey: string;
  private widgetId?: number;
  private ready!: Promise<void>;
  private container!: HTMLDivElement;

  constructor(siteKey: string) {
    this.siteKey = siteKey;
  }

  private injectScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).turnstile) return resolve();

      // cria e esconde o container uma única vez
      this.container = document.createElement("div");
      this.container.style.display = "none";
      document.body.appendChild(this.container);

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
    if (!this.ready) {
      this.ready = this.injectScript();
    }

    await this.ready;

    return new Promise<string>((resolve: ResolveFn, reject: RejectFn) => {
      const turnstile = (window as any).turnstile;

      // primeira vez: renderiza o widget invisível
      if (this.widgetId == null) {
        this.widgetId = turnstile.render(this.container, {
          sitekey: this.siteKey,
          size: "compact",
          callback: resolve,
          "error-callback": reject,
        });
      } else {
        // garante que o widget está limpo antes de re-executar
        turnstile.reset(this.widgetId);
      }

      // dispara o desafio
      turnstile.execute(this.widgetId);
    });
  }
}
