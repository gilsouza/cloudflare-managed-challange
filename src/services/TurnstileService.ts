// declare global {
//   interface Window {
//     turnstile?: {
//       render: (container: string | HTMLElement) => number | undefined;
//       execute: (widgetId?: number) => void;
//       reset: (widgetId?: number) => void;
//       remove: (widgetId?: number) => void;
//     };
//     onTurnstileLoad?: () => void;
//   }
// }
// type ResolveFn = (token: string) => void;
// type RejectFn = (err: any) => void;

// export class TurnstileService {
//   private siteKey: string;
//   private widgetId?: number;
//   private ready!: Promise<void>;
//   private container!: HTMLDivElement;

//   constructor(siteKey: string) {
//     this.siteKey = siteKey;
//     this.ready = this.injectScript();
//   }

//   private injectScript(): Promise<void> {
//     return new Promise((resolve, reject) => {
//       console.log("TurnstileService :: Executando injectScript");
//       if ((window as any).turnstile) return resolve();

//       // cria e esconde o container uma única vez
//       // this.container = document.createElement("div");
//       // this.container.style.display = "none";
//       // document.body.appendChild(this.container);
//       this.container = document.querySelector(
//         "#turnstile-container"
//       ) as HTMLDivElement;

//       const script = document.createElement("script");
//       script.src =
//         "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
//       script.async = true;
//       script.onerror = () => reject(new Error("Falha ao carregar Turnstile"));
//       window.onTurnstileLoad = () => {
//         resolve();
//         console.log("TurnstileService :: Turnstile carregado");
//       };
//       document.head.appendChild(script);
//     });
//   }

//   private render() {
//     const turnstile = (window as any).turnstile;

//     // Primeira vez: renderiza o widget invisível
//     if (this.widgetId == null) {
//       console.log("TurnstileService :: Widget é null");
//       this.widgetId = turnstile.render(this.container, {
//         sitekey: this.siteKey,
//         callback: () => {},
//         "error-callback": () => {},
//         mode: "managed",
//         appearance: "interaction-only",
//       });
//     }
//     console.log("TurnstileService :: render executado", this.widgetId);
//   }

//   public async executeChallenge(): Promise<string> {
//     console.log("TurnstileService :: Executando executeChallenge");
//     if (!this.ready) {
//       this.ready = this.injectScript();
//     }

//     await this.ready;

//     if (this.widgetId != null) {
//       console.log("TurnstileService :: Executando executeChallenge :: reset");
//       // Garante que o widget está limpo antes de re-executar
//       (window as any).turnstile.reset(this.widgetId);
//       console.log("TurnstileService :: Widget Resetado");
//     }

//     return new Promise<string>((resolve: ResolveFn, reject: RejectFn) => {
//       const turnstile = (window as any).turnstile;

//       // Primeira vez: renderiza o widget invisível
//       if (this.widgetId == null) {
//         console.log("TurnstileService :: Widget é null");
//         this.widgetId = turnstile.render(this.container, {
//           sitekey: this.siteKey,
//           mode: "managed",
//           callback: resolve,
//           "error-callback": reject,
//           appearance: "interaction-only",
//         });
//       }
//       console.log("TurnstileService :: render executado", this.widgetId);

//       // Dispara o desafio
//       turnstile.execute(this.widgetId);
//       console.log("TurnstileService :: executado", this.widgetId);
//     });
//   }
// }

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: TurnstileRenderParameters
      ) => number | undefined;
      execute: (widgetId?: number, params?: TurnstileRenderParameters) => void;
      reset: (widgetId?: number) => void;
      remove: (widgetId?: number) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

interface TurnstileRenderParameters {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  language?: string;
  tabindex?: number;
  "response-field"?: boolean;
  "response-field-name"?: string;
  size?: "normal" | "invisible" | "compact";
  retry?: "auto" | "never";
  "retry-interval"?: number;
  "refresh-expired"?: "auto" | "manual" | "never";
  appearance?: "always" | "execute" | "interaction-only";
}

export class TurnstileService {
  private siteKey: string;
  private widgetId?: number;
  private resolveChallenge?: () => void;
  private container!: HTMLDivElement;
  private ready!: Promise<void>;

  constructor(siteKey: string) {
    this.siteKey = siteKey;
    this.ready = this.injectScript();
  }

  private injectScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("TurnstileService :: injectScript :: Injetando script");

      if ((window as any).turnstile) return resolve();

      (window as any).onTurnstileLoaded = () => {
        console.log("TurnstileService :: injectScript :: onTurnstileLoaded");
        this.container = document.querySelector(
          "#turnstile-container"
        ) as HTMLDivElement;
        this.container.className = "cf-turnstile";
        // this.container.style.display = "none";
        this.container.style.margin = "1rem 0";

        resolve();
      };

      const s = document.createElement("script");
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    });
  }

  async executeChallenge(): Promise<void> {
    console.log(
      "TurnstileService :: executeChallenge",
      this.widgetId,
      this.ready
    );

    // Aguarda o carregamento do script turnstile ser carregado
    if (!this.widgetId) {
      // console.log(
      //   "TurnstileService :: executeChallenge :: Aguardando carregamento do script"
      // );
      // await new Promise<void>((r) => {
      //   const check = () => (this.widgetId ? r() : setTimeout(check, 50));
      //   check();
      // });
      console.log(
        "TurnstileService :: executeChallenge :: Renderizando Turnstile"
      );
      this.widgetId = (window as any).turnstile?.render(this.container, {
        sitekey: this.siteKey,
        mode: "managed",
        // appearance: "interaction-only",
        appearance: "always", // debug
        callback: () => {
          console.log(
            "TurnstileService :: executeChallenge :: executando callback"
          );
          this.container.style.display = "none";
          this.resolveChallenge && this.resolveChallenge();
        },
      });
    }

    if (this.widgetId != null) {
      console.log("TurnstileService :: executeChallenge :: reset");
      // Garante que o widget está limpo antes de re-executar
      (window as any).turnstile.reset(this.widgetId);
      console.log("TurnstileService :: executeChallenge :: widget resetado");
    }

    return new Promise<void>((resolve) => {
      this.resolveChallenge = resolve;
      this.container.style.display = "block";
      console.log(
        "TurnstileService :: executeChallenge :: executando challenge"
      );
      (window as any).turnstile?.execute(this.widgetId);
    });
  }
}
