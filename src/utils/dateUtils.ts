const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJSTDate(date: Date = new Date()): Date {
  return new Date(date.getTime() + JST_OFFSET_MS);
}

export function getTodayJST(): string {
  return toJSTDate().toISOString().slice(0, 10);
}

export function getYesterdayJST(today: string): string {
  const date = new Date(today + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function getCurrentHourJST(): string {
  const jst = toJSTDate();
  return jst.toISOString().slice(11, 13);
}

export function getWeekId(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  // ISO week number: the week containing the year's first Thursday
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
