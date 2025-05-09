import { turnstileServiceInstance } from '@/service/turnstile/TurnstileService';

interface ApiRequest {
    field1: string;
    field2: string;
  }
  
export const requestApi = async ({field1, field2}: ApiRequest): Promise<Response> => {
    const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field1, field2 }),
      });

      const requestChallenge = response.status === 403 && response.headers.get('cf-mitigated') === 'challenge'

      if (requestChallenge) {
        console.log('Executando challenge')
        await turnstileServiceInstance!.execute()
        return await requestApi({field1, field2})
      }

      return response
}