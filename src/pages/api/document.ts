import type { NextApiRequest, NextApiResponse } from "next";

import {
  DOCUMENT_UNREADABLE,
  DocumentReadError,
  UNSUPPORTED_DOCUMENT,
  fileExtension,
  mimeTypeForExtension,
} from "@/lib/document";
import { extractDocument } from "@/lib/extractDocument";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as { name?: unknown; data?: unknown };
  if (typeof body?.name !== "string" || typeof body.data !== "string") {
    return res.status(400).json({ error: DOCUMENT_UNREADABLE });
  }

  if (!mimeTypeForExtension(fileExtension(body.name))) {
    return res.status(400).json({ error: UNSUPPORTED_DOCUMENT });
  }

  let bytes: Uint8Array;
  try {
    const buffer = Buffer.from(body.data, "base64");
    bytes = new Uint8Array(buffer);
  } catch {
    return res.status(400).json({ error: DOCUMENT_UNREADABLE });
  }

  try {
    const attachment = await extractDocument(body.name, bytes);
    return res.status(200).json(attachment);
  } catch (error) {
    if (error instanceof DocumentReadError) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Document extract error:", error);
    return res.status(400).json({ error: DOCUMENT_UNREADABLE });
  }
}
