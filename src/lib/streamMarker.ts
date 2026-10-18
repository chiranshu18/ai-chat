export const STREAM_ERROR_MARKER = "\n[[ai-chat:error]]";

export function consumeStreamText(
  held: string,
  chunk: string
): { visible: string; held: string; failed: boolean } {
  const combined = held + chunk;

  if (combined.endsWith(STREAM_ERROR_MARKER)) {
    return {
      visible: combined.slice(0, -STREAM_ERROR_MARKER.length),
      held: "",
      failed: true,
    };
  }

  const max = Math.min(STREAM_ERROR_MARKER.length - 1, combined.length);

  for (let size = max; size > 0; size -= 1) {
    const suffix = combined.slice(-size);
    if (STREAM_ERROR_MARKER.startsWith(suffix)) {
      return {
        visible: combined.slice(0, -size),
        held: suffix,
        failed: false,
      };
    }
  }

  return { visible: combined, held: "", failed: false };
}
