import type { NextApiRequest, NextApiResponse } from "next";
import { gemini } from "@/lib/gemini";
import { toPublicError } from "@/lib/publicError";
import { STREAM_ERROR_MARKER } from "@/lib/streamMarker";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    if (!process.env.GEMINI_API_KEY?.trim()) {
      return res.status(500).json({
        error: "API key is not configured",
      });
    }

    const response = await gemini.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: message.content,
          },
        ],
      })),
    });

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    });

    for await (const chunk of response) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error) {
    console.error("Gemini API error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: toPublicError(error),
      });
    }

    res.write(STREAM_ERROR_MARKER);
    res.end();
  }
}