import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("cf-turnstile-response");
    const cf_clearance = request.cookies.get("cf_clearance");

    console.log("Turnstile token", token);
    console.log("Turnstile cf_clearance", cf_clearance);

    // FIXME: Isso aqui está dando erro
    // if (!token && !!cf_clearance) {
    //   return NextResponse.json({ status: 403 });
    // }

    if (token && !!cf_clearance) {
      try {
        const secret = process.env.TURNSTILE_SECRET_KEY!;
        const remoteIp =
          request.headers.get("CF-Connecting-IP") ||
          request.headers.get("X-Forwarded-For") ||
          request.headers.get("x-real-ip") ||
          "";

        const params = new URLSearchParams();
        params.append("secret", secret);
        params.append("response", token);
        if (remoteIp) params.append("remoteip", remoteIp);

        const cfRes = await axios.post(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          params.toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        console.log("Turnstile verify response", cfRes.data);

        if (!cfRes.data.success) {
          return NextResponse.json(
            { error: "Turnstile verification failed" },
            { status: 403 }
          );
        }
      } catch (e) {
        console.error("Turnstile verify error", e);
        return NextResponse.json({ status: 500 });
      }
    }

    const body = await request.json();
    const { field1, field2 } = body;

    console.log("Received data:", { field1, field2 });

    // Simulate some processing time
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 1000))
    );

    return NextResponse.json(
      {
        message: `Successfully received: Field 1: '${field1}', Field 2: '${field2}'`,
        data: { field1, field2 },
      },
      { status: 200 }
    );
  } catch (error) {
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error processing request:", error);

    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { message: "Invalid request format.", error: errorMessage },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error processing request.", error: errorMessage },
      { status: 500 }
    );
  }
}
