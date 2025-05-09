
import { type NextRequest, NextResponse } from 'next/server';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { field1, field2 } = body;

    console.log('Received data:', { field1, field2 });

    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      { message: `Successfully received: Field 1: '${field1}', Field 2: '${field2}'`, data: { field1, field2 } },
      { status: 200 }
    );
  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error processing request:', error);
    // Check if it's a JSON parsing error specifically
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
       return NextResponse.json(
        { message: 'Invalid request format.', error: errorMessage },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Error processing request.', error: errorMessage },
      { status: 500 } // Use 500 for server-side errors
    );
  }
}
