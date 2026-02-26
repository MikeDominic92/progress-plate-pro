import type { Handler } from "@netlify/functions";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.1-pro-preview";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY not configured on server" }) };
  }

  let payload: { contents: unknown; generationConfig?: unknown; systemInstruction?: unknown };
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!payload.contents) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing 'contents' field" }) };
  }

  const geminiBody: Record<string, unknown> = {
    contents: payload.contents,
  };
  if (payload.generationConfig) geminiBody.generationConfig = payload.generationConfig;
  if (payload.systemInstruction) geminiBody.systemInstruction = payload.systemInstruction;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown proxy error";
    return { statusCode: 502, body: JSON.stringify({ error: message }) };
  }
};

export { handler };
