declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: TurnstileRenderParameters
      ) => number | undefined;
      execute: (widgetId?: number) => void;
      reset: (widgetId?: number) => void;
      remove: (widgetId?: number) => void;
    };
  }

  interface TurnstileRenderParameters {
    sitekey: string;
    mode?: "managed";
    appearance?: "always" | "execute" | "interaction-only";
    size?: "invisible" | "compact" | "normal";
    action?: string;
    cData?: string;
    callback?: (token: string) => void;
    "error-callback"?: () => void;
    "expired-callback"?: () => void;
    theme?: "light" | "dark" | "auto";
    language?: string;
    tabindex?: number;
    retry?: "auto" | "never";
  }
}

const TURNSTILE_DEFAULT_CONFIG = {};

export class TurnstileService {
  private static instance: TurnstileService;
  private loadPromise: Promise<void> | null = null;
  private widgetId: number | undefined;
  private readonly mode = "managed";
  // private readonly appearance = "interaction-only";
  private readonly appearance = "always"; // debug
  private readonly containerId = "#cf-turnstile-container";

  private constructor(private siteKey: string) {}

  public static getInstance(siteKey: string): TurnstileService {
    if (!TurnstileService.instance) {
      TurnstileService.instance = new TurnstileService(siteKey);
    }
    return TurnstileService.instance;
  }

  private loadScript(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      const actualScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      );

      if (actualScript) {
        actualScript.addEventListener("load", () => resolve());
        actualScript.addEventListener("error", () =>
          reject(new Error("Failed to load Turnstile script"))
        );
        return;
      }

      const cfTurnstileScript = document.createElement("script");
      cfTurnstileScript.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      cfTurnstileScript.async = true;
      cfTurnstileScript.defer = true;
      cfTurnstileScript.onload = () => resolve();
      cfTurnstileScript.onerror = () =>
        reject(new Error("Failed to load Turnstile script"));
      document.head.appendChild(cfTurnstileScript);
    });

    return this.loadPromise;
  }

  public async executeChallenge(
    action?: string,
    cData?: string
  ): Promise<string> {
    await this.loadScript();

    return new Promise<string>((resolve, reject) => {
      let container = document.querySelector(
        this.containerId
      ) as HTMLDivElement | null;

      if (container) {
        this.widgetId = window.turnstile?.render(container, {
          ...(action && { action }),
          ...(cData && { cData }),
          sitekey: this.siteKey,
          mode: this.mode,
          appearance: this.appearance,
          callback: (token: string) => {
            resolve(token);
            window.turnstile?.reset(this.widgetId!);
          },
          "error-callback": () =>
            reject(new Error("Turnstile challenge error")),
          "expired-callback": () =>
            reject(new Error("Turnstile challenge expired")),
        });
      }

      if (this.widgetId === undefined) {
        reject(new Error("Turnstile render failed"));
        return;
      }

      window.turnstile?.execute(this.widgetId);
    });
  }
}
