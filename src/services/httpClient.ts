import axios, { AxiosError } from "axios";
import { TurnstileService } from "./TurnstileService";

console.log("Turnstile site key", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const api = axios.create({
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const res = err.response;

    if (res?.status === 403 && res.headers["cf-mitigated"] === "challenge") {
      console.log("HttpClient :: 403 + cf-mitigated");

      try {
        console.log("HttpClient :: executing challenge Turnstile");
        const token = await TurnstileService.getInstance(
          process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
        ).executeChallenge();

        console.log("HttpClient :: challenge token", token);
        const config = {
          ...err.config,
          headers: {
            ...err.config?.headers,
            "cf-turnstile-response": token,
          },
        };

        console.log("HttpClient :: request config", config);
        return api.request(config);
      } catch (e) {
        console.log("HttpClient :: interceptor error", e);
        return Promise.reject(err);
      }
    }

    console.error("Falha ao executar request", err);
    return Promise.reject(err);
  }
);

export { api };
