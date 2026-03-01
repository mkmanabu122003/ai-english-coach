export interface PushQuestion {
  id: string;
  category: string;
  question: string;
}

export const QUESTION_POOL: PushQuestion[] = [
  // ── shrine_temple (5) ──
  {
    id: "q001",
    category: "shrine_temple",
    question:
      "How would you explain the difference between a shrine and a temple to an American tourist?",
  },
  {
    id: "q002",
    category: "shrine_temple",
    question:
      "A guest notices the shimenawa rope at a shrine entrance and asks what it means. How do you explain it?",
  },
  {
    id: "q003",
    category: "shrine_temple",
    question:
      "Your guest wants to know why people clap their hands at a shrine but not at a temple. How do you answer?",
  },
  {
    id: "q004",
    category: "shrine_temple",
    question:
      "A visitor asks about goshuin. How would you describe the appeal of collecting them?",
  },
  {
    id: "q005",
    category: "shrine_temple",
    question:
      "A guest sees a torii gate and asks why it's painted red. How do you explain it using a comparison they'd relate to?",
  },

  // ── food (5) ──
  {
    id: "q006",
    category: "food",
    question:
      "A guest asks why sushi tastes so different in Japan compared to back home. How do you explain it?",
  },
  {
    id: "q007",
    category: "food",
    question:
      "Your guest is hesitant about trying natto. How would you describe it in a way that makes them curious?",
  },
  {
    id: "q008",
    category: "food",
    question:
      "A visitor wonders why Japanese people say 'itadakimasu' before eating. How do you explain the meaning behind it?",
  },
  {
    id: "q009",
    category: "food",
    question:
      "Your guest notices that ramen shops have ticket machines. How do you explain the system and why it exists?",
  },
  {
    id: "q010",
    category: "food",
    question:
      "A guest from Italy asks how Japanese cuisine approaches seasoning differently from European cooking. What do you say?",
  },

  // ── daily_life (5) ──
  {
    id: "q011",
    category: "daily_life",
    question:
      "A guest asks why Japanese people bow. How do you explain the different types and when to use them?",
  },
  {
    id: "q012",
    category: "daily_life",
    question:
      "Your guest is surprised that people wear masks even when they're not sick. How do you explain this cultural habit?",
  },
  {
    id: "q013",
    category: "daily_life",
    question:
      "A visitor asks why shoes must be removed before entering a home. How do you explain it beyond just 'cleanliness'?",
  },
  {
    id: "q014",
    category: "daily_life",
    question:
      "Your guest notices how quiet the train is and asks if there's a rule about it. How do you respond?",
  },
  {
    id: "q015",
    category: "daily_life",
    question:
      "A guest asks why Japanese convenience stores are so much better than ones in their country. How do you describe what makes them special?",
  },

  // ── concept (5) ──
  {
    id: "q016",
    category: "concept",
    question:
      "Describe wabi-sabi to a European guest using a comparison they'd understand.",
  },
  {
    id: "q017",
    category: "concept",
    question:
      "A guest hears the word 'omotenashi' and asks how it differs from Western hospitality. What do you say?",
  },
  {
    id: "q018",
    category: "concept",
    question:
      "Your guest asks what 'ikigai' means. How do you explain it without simply translating the word?",
  },
  {
    id: "q019",
    category: "concept",
    question:
      "A guest is fascinated by the concept of 'mottainai'. How would you explain it using everyday examples they can relate to?",
  },
  {
    id: "q020",
    category: "concept",
    question:
      "Your guest asks why 'reading the air' (kuuki wo yomu) is so important in Japan. How do you explain this concept?",
  },

  // ── practical (5) ──
  {
    id: "q021",
    category: "practical",
    question:
      "Your guest is lost in Shinjuku Station and panicking. What do you say to calm them down and guide them?",
  },
  {
    id: "q022",
    category: "practical",
    question:
      "A guest feels sick during a tour in a rural area. How do you explain the situation and next steps in English?",
  },
  {
    id: "q023",
    category: "practical",
    question:
      "Your guest's credit card doesn't work at a local restaurant. How do you handle the situation and explain the cash culture?",
  },
  {
    id: "q024",
    category: "practical",
    question:
      "A guest asks you to recommend a one-day itinerary in Kyoto. How do you present your suggestion?",
  },
  {
    id: "q025",
    category: "practical",
    question:
      "Your guest wants to buy souvenirs but doesn't know what's authentic. How do you advise them?",
  },

  // ── nature (5) ──
  {
    id: "q026",
    category: "nature",
    question:
      "A guest asks why cherry blossoms are so important to Japanese people. How do you explain it beyond 'they're beautiful'?",
  },
  {
    id: "q027",
    category: "nature",
    question:
      "Your guest wants to know why Japan has so many hot springs. How do you explain the geological and cultural reasons?",
  },
  {
    id: "q028",
    category: "nature",
    question:
      "A guest asks about the Japanese concept of 'forest bathing' (shinrin-yoku). How would you describe it and why it matters?",
  },
  {
    id: "q029",
    category: "nature",
    question:
      "Your guest notices that Japanese gardens look very different from Western gardens. How do you explain the design philosophy?",
  },
  {
    id: "q030",
    category: "nature",
    question:
      "A guest is visiting during typhoon season and asks why Japan gets so many natural disasters. How do you explain it and reassure them?",
  },
];

export type NudgeType = "gentle_nudge" | "strong_nudge" | "streak_boost";

const NUDGE_MESSAGES: Record<NudgeType, string[]> = {
  gentle_nudge: [
    "昨日はお休みでしたね。今日は1問だけ挑戦してみませんか？ 💪",
    "少しだけ英語に触れてみませんか？ 今日のお題です👇",
  ],
  strong_nudge: [
    "しばらく間が空きましたね。短い1問から再開しましょう！ 🔄",
    "お久しぶりです！リハビリがてら、軽い問題からどうですか？ 👋",
  ],
  streak_boost: [
    "連続学習が続いています！今日も1問チャレンジして記録を伸ばしましょう 🔥",
    "ストリーク継続中！この調子で今日もやってみましょう 🎯",
  ],
};

export function getNudgeMessage(type: NudgeType): string {
  const messages = NUDGE_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function pickQuestion(recentQuestionIds: string[]): PushQuestion {
  const available = QUESTION_POOL.filter(
    (q) => !recentQuestionIds.includes(q.id)
  );
  const pool = available.length > 0 ? available : QUESTION_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}
