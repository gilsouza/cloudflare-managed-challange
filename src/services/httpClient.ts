import axios, { AxiosError } from "axios";
import { TurnstileService } from "./TurnstileService";

console.log("Turnstile site key", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

// Cria instância axios
const api = axios.create({
  withCredentials: true,
});

// Intercepta erro
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const res = err.response;
    console.dir("headers", res?.headers);
    if (res?.status === 403 && res.headers["cf-mitigated"] === "challenge") {
      console.log("Executando challenge Turnstile");
      try {
        const token = await TurnstileService.getInstance(
          process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
        ).executeChallenge();
        // injeta token no header que o Cloudflare espera (exemplo)
        console.log("Challenge Turnstile token", token);
        const config = {
          ...err.config,
          headers: {
            ...err.config?.headers,
            "cf-turnstile-response": token,
          },
        };
        console.log("New request config", config);
        // reenvia a requisição original
        return api.request(config);
      } catch (e) {
        console.error("Falha ao executar challenge Turnstile", e);
        // se falhar o Turnstile, repassa o erro original
        return Promise.reject(err);
      }
    }
    console.error("Falha ao executar request", err);
    return Promise.reject(err);
  }
);

export { api };
