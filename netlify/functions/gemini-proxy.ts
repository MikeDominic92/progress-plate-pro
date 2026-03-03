import type { Handler } from "@netlify/functions";

const GEMINI_MODEL = "gemini-3.1-pro-preview";
const ALLOWED_ORIGINS = ["https://kbfit.netlify.app"];

const handler: Handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "GEMINI_API_KEY not configured on server" }) };
  }

  let payload: { contents: unknown; generationConfig?: unknown; systemInstruction?: unknown };
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!payload.contents) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing 'contents' field" }) };
  }

  const geminiBody: Record<string, unknown> = {
    contents: payload.contents,
  };
  if (payload.generationConfig) geminiBody.generationConfig = payload.generationConfig;
  if (payload.systemInstruction) geminiBody.systemInstruction = payload.systemInstruction;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 26_000);

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        statusCode: 504,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Gemini API request timed out after 26s. Please try again." }),
      };
    }
    const message = err instanceof Error ? err.message : "Unknown proxy error";
    return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: message }) };
  }
};

export { handler };
