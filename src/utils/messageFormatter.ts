import { LINE_MAX_LENGTH, MAX_BUBBLES } from "../config/constants";

export function splitMessage(text: string): string[] {
  if (text.length <= LINE_MAX_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0 && chunks.length < MAX_BUBBLES) {
    if (remaining.length <= LINE_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find a newline to split at within the limit
    const slice = remaining.slice(0, LINE_MAX_LENGTH);
    const lastNewline = slice.lastIndexOf("\n");

    if (lastNewline > 0) {
      chunks.push(remaining.slice(0, lastNewline));
      remaining = remaining.slice(lastNewline + 1);
    } else {
      // No newline found — force split at limit
      chunks.push(slice);
      remaining = remaining.slice(LINE_MAX_LENGTH);
    }
  }

  return chunks;
}
