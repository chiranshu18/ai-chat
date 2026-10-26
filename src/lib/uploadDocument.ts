import type { Attachment } from "@/types/chat";
import {
  DOCUMENT_UNREADABLE,
  documentFileError,
} from "@/lib/document";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(DOCUMENT_UNREADABLE));
        return;
      }
      const comma = reader.result.indexOf(",");
      resolve(comma >= 0 ? reader.result.slice(comma + 1) : reader.result);
    };
    reader.onerror = () => reject(new Error(DOCUMENT_UNREADABLE));
    reader.readAsDataURL(file);
  });
}

export async function uploadDocument(file: File): Promise<Attachment> {
  const problem = documentFileError(file);
  if (problem) throw new Error(problem);

  const data = await fileToBase64(file);
  const response = await fetch("/api/document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      data,
    }),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const errorMessage =
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error.trim()
      ? body.error
      : DOCUMENT_UNREADABLE;

  if (!response.ok) throw new Error(errorMessage);

  if (
    !body ||
    typeof body !== "object" ||
    !("name" in body) ||
    !("mimeType" in body) ||
    !("text" in body) ||
    typeof body.name !== "string" ||
    typeof body.mimeType !== "string" ||
    typeof body.text !== "string"
  ) {
    throw new Error(DOCUMENT_UNREADABLE);
  }

  return {
    name: body.name,
    mimeType: body.mimeType,
    text: body.text,
  };
}
