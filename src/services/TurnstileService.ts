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
  private readonly containerId = "cf-turnstile-container";
  private constructor(private siteKey: string) {}

  /**
   * Singleton access
   */
  public static getInstance(siteKey: string): TurnstileService {
    if (!TurnstileService.instance) {
      TurnstileService.instance = new TurnstileService(siteKey);
    }
    return TurnstileService.instance;
  }

  /**
   * Dynamically injects the Turnstile script once
   */
  private loadScript(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load Turnstile script"))
        );
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Turnstile script"));
      document.head.appendChild(script);
    });
    return this.loadPromise;
  }

  /**
   * Executes an invisible Turnstile challenge and returns the token
   */
  public async executeChallenge(
    action?: string,
    cData?: string
  ): Promise<string> {
    await this.loadScript();
    return new Promise<string>((resolve, reject) => {
      // Create or clear challenge container
      let container = document.getElementById(this.containerId);
      if (!container) {
        container = document.createElement("div");
        container.id = this.containerId;
        container.style.position = "absolute";
        container.style.width = "0";
        container.style.height = "0";
        container.style.overflow = "hidden";
        document.body.appendChild(container);
      } else {
        container.innerHTML = "";
      }

      // Render the widget
      this.widgetId = window.turnstile?.render(container, {
        sitekey: this.siteKey,
        size: "invisible",
        action,
        cData,
        callback: (token: string) => {
          resolve(token);
          // reset for future challenges
          window.turnstile?.reset(this.widgetId!);
        },
        "error-callback": () => reject(new Error("Turnstile challenge error")),
        "expired-callback": () =>
          reject(new Error("Turnstile challenge expired")),
      });

      if (this.widgetId === undefined) {
        reject(new Error("Turnstile render failed"));
        return;
      }

      // Immediately execute the invisible challenge
      window.turnstile?.execute(this.widgetId);
    });
  }
}
