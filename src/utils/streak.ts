import { User } from "../types";
import { getYesterdayJST } from "./dateUtils";

export function updateStreak(
  user: User,
  todayJST: string
): Partial<User> {
  if (user.lastActiveDate === todayJST) {
    return { lastActiveDate: todayJST };
  }

  const yesterday = getYesterdayJST(todayJST);

  if (user.lastActiveDate === yesterday) {
    const newStreak = user.currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      lastActiveDate: todayJST,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(user.longestStreak, 1),
    lastActiveDate: todayJST,
  };
}
