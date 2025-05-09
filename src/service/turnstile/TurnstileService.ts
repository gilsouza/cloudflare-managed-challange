
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, params: TurnstileRenderParameters) => number | undefined;
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
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  tabindex?: number;
  'response-field'?: boolean;
  'response-field-name'?: string;
  size?: 'normal' | 'invisible' | 'compact';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

class TurnstileService {
  private widgetId?: number;
  private resolveChallenge?: () => void;
  private container!: HTMLDivElement;

  constructor(private siteKey: string) {
    // só roda no browser
    if (typeof window === 'undefined') {
      // evita erro no SSR
      return;
    }

    console.log('define onTurnstileLoaded handler');
    (window as Window).onTurnstileLoaded = () => {
      this.widgetId = (window as Window).turnstile?.render(this.container, {
        sitekey: this.siteKey,
        size: 'compact',
        callback: () => {
          this.container.style.display = 'none';
          this.resolveChallenge && this.resolveChallenge();
        }
      });
    };

    console.log('cria container turnstile no body');
    this.container = document.createElement('div');
    this.container.className = 'cf-turnstile'
    this.container.style.display = 'none';
    this.container.style.margin = '1rem 0';
    document.body.appendChild(this.container);

    console.log('carrega script');
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded';
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  }

  async execute(): Promise<void> {
    if (!this.widgetId) {
      // aguarda script e renderização
      await new Promise<void>((r) => {
        const check = () => this.widgetId ? r() : setTimeout(check, 50);
        check();
      });
    }

    return new Promise<void>((resolve) => {
      this.resolveChallenge = resolve;
      this.container.style.display = 'block';
      (window as Window).turnstile?.execute(this.widgetId);
    });
  }
}

const turnstileServiceInstance = 
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ? new TurnstileService(
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      )
    : null;

export { turnstileServiceInstance };
