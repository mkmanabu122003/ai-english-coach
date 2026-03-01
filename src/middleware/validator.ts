import { MAX_TEXT_LENGTH } from "../config/constants";

export function sanitizeTextInput(text: string): string {
  // Remove control characters except newline (\n) and carriage return (\r)
  const cleaned = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.slice(0, MAX_TEXT_LENGTH).trim();
}
