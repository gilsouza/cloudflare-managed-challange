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

export class TurnstileService {
  private static instance: TurnstileService;
  private loadPromise: Promise<void> | null = null;
  private widgetId: number | undefined;
  private readonly mode = "managed";
  // private readonly appearance = "interaction-only";
  private readonly appearance = "always"; // debug
  private readonly containerId = "#cf-turnstile-container";

  private constructor(private siteKey: string) {
    console.log("TurnstileService :: constructor");
  }

  public static getInstance(siteKey: string): TurnstileService {
    console.log("TurnstileService :: getInstance");
    if (!TurnstileService.instance) {
      console.log("TurnstileService :: getInstance :: new instance");
      TurnstileService.instance = new TurnstileService(siteKey);
    }
    return TurnstileService.instance;
  }

  private loadScript(): Promise<void> {
    console.log("TurnstileService :: loadScript");
    if (this.loadPromise) {
      console.log("TurnstileService :: loadScript :: already loading");
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      console.log("TurnstileService :: loadScript :: start promise");
      const actualScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      );

      if (actualScript) {
        console.log(
          "TurnstileService :: loadScript :: start promise :: already loaded"
        );
        actualScript.addEventListener("load", () => resolve());
        actualScript.addEventListener("error", () =>
          reject(new Error("Failed to load Turnstile script"))
        );
        return;
      }

      console.log("TurnstileService :: loadScript :: start promise :: create");

      const cfTurnstileScript = document.createElement("script");
      cfTurnstileScript.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      cfTurnstileScript.async = true;
      cfTurnstileScript.defer = true;
      cfTurnstileScript.onload = () => {
        console.log(
          "TurnstileService :: loadScript :: start promise :: onload"
        );
        resolve();
      };
      cfTurnstileScript.onerror = () => {
        console.log(
          "TurnstileService :: loadScript :: start promise :: onerror"
        );
        reject(new Error("Failed to load Turnstile script"));
      };
      document.head.appendChild(cfTurnstileScript);
    });

    return this.loadPromise;
  }

  public async executeChallenge(
    action?: string,
    cData?: string
  ): Promise<string> {
    console.log("TurnstileService :: executeChallenge");
    await this.loadScript();

    return new Promise<string>((resolve, reject) => {
      console.log("TurnstileService :: executeChallenge :: start promise");
      let container = document.querySelector(
        this.containerId
      ) as HTMLDivElement | null;

      if (container) {
        console.log(
          "TurnstileService :: executeChallenge :: start promise :: container exists"
        );
        this.widgetId = window.turnstile?.render(container, {
          ...(action && { action }),
          ...(cData && { cData }),
          sitekey: this.siteKey,
          mode: this.mode,
          appearance: this.appearance,
          callback: (token: string) => {
            console.log(
              "TurnstileService :: executeChallenge :: render :: callback"
            );
            resolve(token);
            window.turnstile?.reset(this.widgetId!);
            console.log("TurnstileService :: executeChallenge :: reseted");
          },
          // @ts-ignore
          "error-callback": (error) => {
            console.log(
              "TurnstileService :: executeChallenge :: render :: error-callback",
              error
            );
            reject(new Error("Turnstile challenge error"));
          },
          // @ts-ignore
          "expired-callback": (error) => {
            console.log(
              "TurnstileService :: executeChallenge :: render :: expired-callback",
              error
            );
            reject(new Error("Turnstile challenge expired"));
          },
        });
      }

      if (!this.widgetId) {
        console.log("TurnstileService :: executeChallenge :: widgetId is null");
        reject(new Error("Turnstile render failed"));
        return;
      }

      window.turnstile?.execute(this.widgetId);
      console.log("TurnstileService :: executeChallenge :: executed");
    });
  }
}
