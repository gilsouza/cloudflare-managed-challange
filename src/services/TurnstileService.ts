declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: TurnstileRenderParameters
      ) => string | undefined;
      execute: (
        container: string | HTMLElement,
        params: Partial<TurnstileRenderParameters>
      ) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      isExpired: (widgetId: string) => boolean;
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
    "refresh-expired": "auto" | "never" | "manual";
  }
}

export class TurnstileService {
  private static instance: TurnstileService;
  private loadPromise: Promise<void> | null = null;
  private resolveChallenge?: (token: string) => void;
  private rejectChallenge?: (error: Error) => void;
  private widgetId: string | undefined;
  private readonly mode = "managed";
  // private readonly appearance = "interaction-only";
  private readonly appearance = "always"; // debug
  private readonly containerId = "#cf-turnstile-container";
  private readonly refreshExpired = "never";
  private readonly refreshTimeout = "manual";

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

        this.render();

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

  private render() {
    let container = document.querySelector(
      this.containerId
    ) as HTMLDivElement | null;

    if (container) {
      console.log(
        "TurnstileService :: render :: start promise :: container exists"
      );
      this.widgetId = window.turnstile?.render(container, {
        sitekey: this.siteKey,
        mode: this.mode,
        appearance: this.appearance,
        "refresh-expired": this.refreshExpired,
        "refresh-timeout": this.refreshTimeout,
        callback: (token: string) => {
          console.log("TurnstileService :: render :: callback");

          this.resolveChallenge && this.resolveChallenge(token);

          console.log("TurnstileService :: reseted");
        },
        // @ts-ignore
        "error-callback": (error) => {
          console.log("TurnstileService :: render :: error-callback", error);
          this.rejectChallenge &&
            this.rejectChallenge(new Error("Turnstile challenge error"));
        },
        // @ts-ignore
        "expired-callback": (error) => {
          console.log("TurnstileService :: render :: expired-callback", error);
          this.rejectChallenge &&
            this.rejectChallenge(new Error("Turnstile challenge expired"));
        },
      });
    }
  }

  public remove() {
    console.log("TurnstileService :: remove");

    if (this.widgetId) {
      window.turnstile?.remove(this.widgetId);
      this.widgetId = undefined;
      this.resolveChallenge = undefined;
      this.rejectChallenge = undefined;
    } else {
      console.log("TurnstileService :: remove :: widgetId is null");
    }
  }

  public async executeChallenge(
    action?: string,
    cData?: string
  ): Promise<string> {
    console.log("TurnstileService :: executeChallenge");
    await this.loadScript();

    return new Promise<string>((resolve, reject) => {
      if (!window.turnstile) {
        reject(new Error("Turnstile load script failed"));
        return;
      }

      console.log(
        "TurnstileService :: executeChallenge :: start and setting promises"
      );

      this.resolveChallenge = resolve;
      this.rejectChallenge = reject;

      if (!this.widgetId) {
        console.log("TurnstileService :: executeChallenge :: widgetId is null");
        reject(new Error("Turnstile render failed"));
        return;
      }

      if (window.turnstile.isExpired(this.widgetId)) {
        console.log("TurnstileService :: executeChallenge :: reset widget");
        window.turnstile?.reset(this.widgetId);
      }

      window.turnstile.execute(this.widgetId, {
        ...(action && { action }),
        ...(cData && { cData }),
      });

      console.log("TurnstileService :: executeChallenge :: executed");
    });
  }
}
