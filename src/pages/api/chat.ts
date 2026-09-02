import type { NextApiRequest, NextApiResponse } from "next";
import { gemini } from "@/lib/gemini";

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

    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map((message) => ({
        role: message.role,
        parts: [
          {
            text: message.content,
          },
        ],
      })),
    });

    return res.status(200).json({
      message: {
        role: "assistant",
        content: response.text,
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}