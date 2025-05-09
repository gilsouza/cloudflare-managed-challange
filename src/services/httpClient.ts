import axios, { AxiosError } from "axios";
import { TurnstileService } from "./TurnstileService";

const TS = new TurnstileService(process.env.REACT_APP_TURNSTILE_SITEKEY!);

// Cria instância axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Intercepta erro
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const res = err.response;
    if (res?.status === 403 && res.headers["cf-mitigated"] === "challenge") {
      try {
        const token = await TS.executeChallenge();
        // injeta token no header que o Cloudflare espera (exemplo)
        const config = {
          ...err.config,
          headers: {
            ...err.config?.headers,
            "cf-turnstile-response": token,
          },
        };
        // reenvia a requisição original
        return api.request(config);
      } catch (e) {
        // se falhar o Turnstile, repassa o erro original
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export { api };
