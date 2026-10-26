export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_CHARS = 200_000;
export const DEFAULT_DOCUMENT_QUESTION = "Review this document.";

export const UNSUPPORTED_DOCUMENT = "This file type is not supported.";
export const DOCUMENT_TOO_LARGE = "This file is too large.";
export const PDF_NO_TEXT = "This PDF has no readable text.";
export const DOCUMENT_NO_TEXT = "This document has no readable text.";
export const DOCUMENT_TOO_LONG = "This document is too long.";
export const DOCUMENT_UNREADABLE = "Could not read that document.";

const EXTENSIONS = new Set([".pdf", ".txt", ".md"]);

export function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

export function mimeTypeForExtension(extension: string): string | null {
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".txt") return "text/plain";
  if (extension === ".md") return "text/markdown";
  return null;
}

export function documentFileName(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "document";
  return base.slice(0, 120);
}

export function documentFileError(file: { name: string; size: number }): string | null {
  if (!EXTENSIONS.has(fileExtension(file.name))) return UNSUPPORTED_DOCUMENT;
  if (file.size > MAX_DOCUMENT_BYTES) return DOCUMENT_TOO_LARGE;
  return null;
}

export class DocumentReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentReadError";
  }
}

export function readableDocumentText(text: string, extension: string): string {
  const readable = text.replace(/\u0000/g, "").trim();
  if (!readable) {
    throw new DocumentReadError(extension === ".pdf" ? PDF_NO_TEXT : DOCUMENT_NO_TEXT);
  }
  if (readable.length > MAX_DOCUMENT_CHARS) {
    throw new DocumentReadError(DOCUMENT_TOO_LONG);
  }
  return readable;
}
