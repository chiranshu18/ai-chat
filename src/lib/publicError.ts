export function toPublicError(error: unknown): string {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return "API key is not configured";
  }

  const status = readStatus(error);
  const detail = error instanceof Error ? error.message : "";

  if (status === 429 || /RESOURCE_EXHAUSTED|\bquota\b/i.test(detail)) {
    return "Rate limit reached. Try again in a moment.";
  }

  if (
    status === 404 ||
    /NOT_FOUND|not found|is not supported for generateContent/i.test(detail)
  ) {
    return "This model is unavailable";
  }

  return "Something went wrong";
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const status = (error as { status: unknown }).status;
  return typeof status === "number" ? status : undefined;
}
