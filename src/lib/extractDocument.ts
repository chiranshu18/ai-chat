import { extractText } from "unpdf";

import type { Attachment } from "@/types/chat";
import {
  DOCUMENT_TOO_LARGE,
  DOCUMENT_UNREADABLE,
  DocumentReadError,
  MAX_DOCUMENT_BYTES,
  documentFileName,
  fileExtension,
  mimeTypeForExtension,
  readableDocumentText,
} from "@/lib/document";

export async function extractDocument(name: string, bytes: Uint8Array): Promise<Attachment> {
  const extension = fileExtension(name);
  const mimeType = mimeTypeForExtension(extension);
  if (!mimeType) throw new DocumentReadError(DOCUMENT_UNREADABLE);
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) throw new DocumentReadError(DOCUMENT_TOO_LARGE);

  let raw = "";
  if (extension === ".pdf") {
    const extracted = await extractText(bytes, { mergePages: true });
    raw = extracted.text;
  } else {
    raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  return {
    name: documentFileName(name),
    mimeType,
    text: readableDocumentText(raw, extension),
  };
}
