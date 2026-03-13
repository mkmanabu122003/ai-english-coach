export type QuestionLevel = "beginner" | "intermediate" | "advanced";

export interface PushQuestion {
  id: string;
  category: string;
  level: QuestionLevel;
  question: string;
}

export const QUESTION_POOL: PushQuestion[] = [
  // ── shrine_temple (10) ──
  // beginner
  {
    id: "q001",
    level: "beginner",
    category: "shrine_temple",
    question:
      "How would you explain the difference between a shrine and a temple to an American tourist?",
  },
  {
    id: "q002",
    level: "beginner",
    category: "shrine_temple",
    question:
      "A guest sees a torii gate and asks what it is. How do you explain it simply?",
  },
  {
    id: "q003",
    level: "beginner",
    category: "shrine_temple",
    question:
      "Your guest wants to know how to pray at a shrine. Can you explain the basic steps?",
  },
  // intermediate
  {
    id: "q004",
    level: "intermediate",
    category: "shrine_temple",
    question:
      "A guest notices the shimenawa rope at a shrine entrance and asks what it means. How do you explain it?",
  },
  {
    id: "q005",
    level: "intermediate",
    category: "shrine_temple",
    question:
      "Your guest wants to know why people clap their hands at a shrine but not at a temple. How do you answer?",
  },
  {
    id: "q006",
    level: "intermediate",
    category: "shrine_temple",
    question:
      "A visitor asks about goshuin. How would you describe the appeal of collecting them?",
  },
  {
    id: "q007",
    level: "intermediate",
    category: "shrine_temple",
    question:
      "A guest sees a torii gate and asks why it's painted red. How do you explain it using a comparison they'd relate to?",
  },
  // advanced
  {
    id: "q008",
    level: "advanced",
    category: "shrine_temple",
    question:
      "A guest asks how Shinto and Buddhism coexist in Japan. How do you explain the concept of shinbutsu-shugo?",
  },
  {
    id: "q009",
    level: "advanced",
    category: "shrine_temple",
    question:
      "Your guest is curious why Ise Grand Shrine is rebuilt every 20 years. How do you explain the philosophy behind shikinen sengu?",
  },
  {
    id: "q010",
    level: "advanced",
    category: "shrine_temple",
    question:
      "A guest challenges you: 'If Japanese people aren't very religious, why are there so many shrines and temples?' How do you respond?",
  },

  // ── food (10) ──
  // beginner
  {
    id: "q011",
    level: "beginner",
    category: "food",
    question:
      "A guest asks why sushi tastes so different in Japan compared to back home. How do you explain it?",
  },
  {
    id: "q012",
    level: "beginner",
    category: "food",
    question:
      "Your guest asks what 'itadakimasu' means. How do you explain it simply?",
  },
  {
    id: "q013",
    level: "beginner",
    category: "food",
    question:
      "A guest asks you to recommend one must-try Japanese food. What do you suggest and how do you describe it?",
  },
  // intermediate
  {
    id: "q014",
    level: "intermediate",
    category: "food",
    question:
      "Your guest is hesitant about trying natto. How would you describe it in a way that makes them curious?",
  },
  {
    id: "q015",
    level: "intermediate",
    category: "food",
    question:
      "A visitor wonders why Japanese people say 'itadakimasu' before eating. How do you explain the deeper meaning behind it?",
  },
  {
    id: "q016",
    level: "intermediate",
    category: "food",
    question:
      "Your guest notices that ramen shops have ticket machines. How do you explain the system and why it exists?",
  },
  {
    id: "q017",
    level: "intermediate",
    category: "food",
    question:
      "A guest from Italy asks how Japanese cuisine approaches seasoning differently from European cooking. What do you say?",
  },
  // advanced
  {
    id: "q018",
    level: "advanced",
    category: "food",
    question:
      "A guest asks why kaiseki cuisine is considered an art form. How do you explain its connection to tea ceremony and seasonality?",
  },
  {
    id: "q019",
    level: "advanced",
    category: "food",
    question:
      "Your guest wants to understand 'umami' — not just as a taste, but as a cultural concept. How do you explain it?",
  },
  {
    id: "q020",
    level: "advanced",
    category: "food",
    question:
      "A food-savvy guest asks why Japanese wagashi sweets look so different from Western pastries. How do you explain the philosophy behind them?",
  },

  // ── daily_life (10) ──
  // beginner
  {
    id: "q021",
    level: "beginner",
    category: "daily_life",
    question:
      "A guest asks why Japanese people bow. How do you explain it simply?",
  },
  {
    id: "q022",
    level: "beginner",
    category: "daily_life",
    question:
      "A visitor asks why shoes must be removed before entering a home. How do you explain it?",
  },
  {
    id: "q023",
    level: "beginner",
    category: "daily_life",
    question:
      "Your guest is amazed that lost wallets get returned in Japan. How do you explain this?",
  },
  // intermediate
  {
    id: "q024",
    level: "intermediate",
    category: "daily_life",
    question:
      "Your guest is surprised that people wear masks even when they're not sick. How do you explain this cultural habit?",
  },
  {
    id: "q025",
    level: "intermediate",
    category: "daily_life",
    question:
      "A visitor asks why shoes must be removed before entering a home. How do you explain it beyond just 'cleanliness'?",
  },
  {
    id: "q026",
    level: "intermediate",
    category: "daily_life",
    question:
      "Your guest notices how quiet the train is and asks if there's a rule about it. How do you respond?",
  },
  {
    id: "q027",
    level: "intermediate",
    category: "daily_life",
    question:
      "A guest asks why Japanese convenience stores are so much better than ones in their country. How do you describe what makes them special?",
  },
  // advanced
  {
    id: "q028",
    level: "advanced",
    category: "daily_life",
    question:
      "A guest asks why Japan seems to balance extreme modernity with deep tradition. How do you explain this duality?",
  },
  {
    id: "q029",
    level: "advanced",
    category: "daily_life",
    question:
      "Your guest asks about the Japanese work culture — specifically 'karoshi' and how it's changing. How do you navigate this sensitive topic?",
  },
  {
    id: "q030",
    level: "advanced",
    category: "daily_life",
    question:
      "A guest notices vending machines everywhere and asks what this says about Japanese society. How do you turn this into a cultural insight?",
  },

  // ── concept (10) ──
  // beginner
  {
    id: "q031",
    level: "beginner",
    category: "concept",
    question:
      "A guest asks what 'omotenashi' means. How do you explain it in a simple way?",
  },
  {
    id: "q032",
    level: "beginner",
    category: "concept",
    question:
      "Your guest hears the word 'kawaii' everywhere. How do you explain what it means beyond just 'cute'?",
  },
  {
    id: "q033",
    level: "beginner",
    category: "concept",
    question:
      "A guest asks what 'mottainai' means. How do you explain it with a simple example?",
  },
  // intermediate
  {
    id: "q034",
    level: "intermediate",
    category: "concept",
    question:
      "Describe wabi-sabi to a European guest using a comparison they'd understand.",
  },
  {
    id: "q035",
    level: "intermediate",
    category: "concept",
    question:
      "A guest hears the word 'omotenashi' and asks how it differs from Western hospitality. What do you say?",
  },
  {
    id: "q036",
    level: "intermediate",
    category: "concept",
    question:
      "Your guest asks what 'ikigai' means. How do you explain it without simply translating the word?",
  },
  {
    id: "q037",
    level: "intermediate",
    category: "concept",
    question:
      "A guest is fascinated by the concept of 'mottainai'. How would you explain it using everyday examples they can relate to?",
  },
  // advanced
  {
    id: "q038",
    level: "advanced",
    category: "concept",
    question:
      "Your guest asks why 'reading the air' (kuuki wo yomu) is so important in Japan. How do you explain this concept and its impact on communication?",
  },
  {
    id: "q039",
    level: "advanced",
    category: "concept",
    question:
      "A guest challenges you: 'Isn't wabi-sabi just an excuse for imperfection?' How do you respond?",
  },
  {
    id: "q040",
    level: "advanced",
    category: "concept",
    question:
      "Your guest asks about 'honne' and 'tatemae'. How do you explain this duality without making it sound dishonest?",
  },

  // ── practical (10) ──
  // beginner
  {
    id: "q041",
    level: "beginner",
    category: "practical",
    question:
      "Your guest asks how to use a Japanese vending machine. How do you explain it?",
  },
  {
    id: "q042",
    level: "beginner",
    category: "practical",
    question:
      "A guest wants to buy a train ticket but the machine is in Japanese. How do you help them?",
  },
  {
    id: "q043",
    level: "beginner",
    category: "practical",
    question:
      "Your guest wants to know how to say 'thank you' and 'excuse me' in Japanese. How do you teach them a few key phrases?",
  },
  // intermediate
  {
    id: "q044",
    level: "intermediate",
    category: "practical",
    question:
      "Your guest is lost in Shinjuku Station and panicking. What do you say to calm them down and guide them?",
  },
  {
    id: "q045",
    level: "intermediate",
    category: "practical",
    question:
      "A guest feels sick during a tour in a rural area. How do you explain the situation and next steps in English?",
  },
  {
    id: "q046",
    level: "intermediate",
    category: "practical",
    question:
      "Your guest's credit card doesn't work at a local restaurant. How do you handle the situation and explain the cash culture?",
  },
  {
    id: "q047",
    level: "intermediate",
    category: "practical",
    question:
      "A guest asks you to recommend a one-day itinerary in Kyoto. How do you present your suggestion?",
  },
  // advanced
  {
    id: "q048",
    level: "advanced",
    category: "practical",
    question:
      "A guest complains that a restaurant refused to seat them because they don't take foreigners. How do you handle this diplomatically?",
  },
  {
    id: "q049",
    level: "advanced",
    category: "practical",
    question:
      "Your guest wants to buy souvenirs but doesn't know what's authentic vs. mass-produced. How do you advise them and explain the concept of 'meisan'?",
  },
  {
    id: "q050",
    level: "advanced",
    category: "practical",
    question:
      "A guest asks you to compare Tokyo and Kyoto, not just for sightseeing but in terms of cultural identity. How do you respond?",
  },

  // ── nature (10) ──
  // beginner
  {
    id: "q051",
    level: "beginner",
    category: "nature",
    question:
      "A guest asks why cherry blossoms are so important to Japanese people. How do you explain it simply?",
  },
  {
    id: "q052",
    level: "beginner",
    category: "nature",
    question:
      "Your guest wants to visit a hot spring but doesn't know the rules. How do you explain onsen etiquette?",
  },
  {
    id: "q053",
    level: "beginner",
    category: "nature",
    question:
      "A guest asks why Mt. Fuji is so special to Japanese people. How do you explain it?",
  },
  // intermediate
  {
    id: "q054",
    level: "intermediate",
    category: "nature",
    question:
      "A guest asks why cherry blossoms are so important to Japanese people. How do you explain it beyond 'they're beautiful'?",
  },
  {
    id: "q055",
    level: "intermediate",
    category: "nature",
    question:
      "Your guest wants to know why Japan has so many hot springs. How do you explain the geological and cultural reasons?",
  },
  {
    id: "q056",
    level: "intermediate",
    category: "nature",
    question:
      "A guest asks about the Japanese concept of 'forest bathing' (shinrin-yoku). How would you describe it and why it matters?",
  },
  {
    id: "q057",
    level: "intermediate",
    category: "nature",
    question:
      "Your guest notices that Japanese gardens look very different from Western gardens. How do you explain the design philosophy?",
  },
  // advanced
  {
    id: "q058",
    level: "advanced",
    category: "nature",
    question:
      "A guest is visiting during typhoon season and asks why Japan gets so many natural disasters. How do you explain it and connect it to Japanese resilience?",
  },
  {
    id: "q059",
    level: "advanced",
    category: "nature",
    question:
      "Your guest asks about 'mono no aware' — the beauty of transience — and how it relates to cherry blossoms. How do you explain this philosophical concept?",
  },
  {
    id: "q060",
    level: "advanced",
    category: "nature",
    question:
      "A guest notices how carefully Japanese people maintain their gardens and asks about the relationship between nature and spirituality in Japan. How do you answer?",
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

export function pickQuestion(
  recentQuestionIds: string[],
  userLevel?: string
): PushQuestion {
  let pool = QUESTION_POOL;

  // レベル別フィルタ（unset/不明の場合は全レベルからランダム）
  if (
    userLevel === "beginner" ||
    userLevel === "intermediate" ||
    userLevel === "advanced"
  ) {
    const levelPool = pool.filter((q) => q.level === userLevel);
    if (levelPool.length > 0) {
      pool = levelPool;
    }
  }

  // 最近出した質問を除外
  const available = pool.filter((q) => !recentQuestionIds.includes(q.id));
  const finalPool = available.length > 0 ? available : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
