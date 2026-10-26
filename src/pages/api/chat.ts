import type { NextApiRequest, NextApiResponse } from "next";
import { gemini } from "@/lib/gemini";
import { DOCUMENT_TOO_LONG, MAX_DOCUMENT_CHARS } from "@/lib/document";
import { toPublicError } from "@/lib/publicError";
import { STREAM_ERROR_MARKER } from "@/lib/streamMarker";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

type IncomingMessage = {
  role?: string;
  content?: unknown;
  attachment?: {
    name?: unknown;
    text?: unknown;
  };
};

function messageText(message: IncomingMessage): string {
  const content = typeof message.content === "string" ? message.content : "";
  const text = message.attachment?.text;
  if (message.role === "assistant" || typeof text !== "string" || text.length === 0) {
    return content;
  }

  const name =
    typeof message.attachment?.name === "string" && message.attachment.name.trim()
      ? message.attachment.name.trim()
      : "document";

  return `${content}\n\nDocument: ${name}\n${text}`;
}

function attachmentIsTooLong(messages: IncomingMessage[]): boolean {
  return messages.some((message) => {
    const text = message?.attachment?.text;
    return typeof text === "string" && text.length > MAX_DOCUMENT_CHARS;
  });
}

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

    if (attachmentIsTooLong(messages)) {
      return res.status(400).json({
        error: DOCUMENT_TOO_LONG,
      });
    }

    if (!process.env.GEMINI_API_KEY?.trim()) {
      return res.status(500).json({
        error: "API key is not configured",
      });
    }

    const response = await gemini.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: messages.map((message: IncomingMessage) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: messageText(message),
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