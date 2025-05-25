import { api } from "./httpClient";
import { AxiosResponse } from "axios";

interface ApiRequest {
  field1: string;
  field2: string;
}

export const requestSubmit = async ({
  field1,
  field2,
}: ApiRequest): Promise<AxiosResponse> => {
  try {
    const response = await api.post("/api/submit", { field1, field2 });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
};
