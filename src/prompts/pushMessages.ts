import { TargetLanguage, getLangStrings } from "../config/languages";

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

// ── Spanish Question Pool ──
export const QUESTION_POOL_ES: PushQuestion[] = [
  // ── greetings_basics (10) ──
  // beginner
  {
    id: "es_q001",
    level: "beginner",
    category: "greetings_basics",
    question:
      "スペイン語で自己紹介をしてみましょう。名前、出身、趣味を含めてください。",
  },
  {
    id: "es_q002",
    level: "beginner",
    category: "greetings_basics",
    question:
      "レストランでスペイン語で注文する場面を想像してください。「水を一杯ください」はどう言いますか？",
  },
  {
    id: "es_q003",
    level: "beginner",
    category: "greetings_basics",
    question:
      "道で迷ったとき、スペイン語で道を尋ねるにはどう言いますか？「駅はどこですか？」を表現してみましょう。",
  },
  // intermediate
  {
    id: "es_q004",
    level: "intermediate",
    category: "greetings_basics",
    question:
      "スペインの友人に日本の新年の過ごし方をスペイン語で説明してください。",
  },
  {
    id: "es_q005",
    level: "intermediate",
    category: "greetings_basics",
    question:
      "「昨日映画を見に行ったけど、あまり面白くなかった」をスペイン語で表現してみてください。過去形を使いましょう。",
  },
  {
    id: "es_q006",
    level: "intermediate",
    category: "greetings_basics",
    question:
      "スペイン語で「もし宝くじが当たったら何をしますか？」という質問に答えてみてください。条件法を使いましょう。",
  },
  // advanced
  {
    id: "es_q007",
    level: "advanced",
    category: "greetings_basics",
    question:
      "スペインとラテンアメリカでのスペイン語の違いについて、スペイン語で説明してみてください。",
  },
  {
    id: "es_q008",
    level: "advanced",
    category: "greetings_basics",
    question:
      "環境問題についてあなたの意見をスペイン語で述べてください。接続法を使った表現を含めましょう。",
  },

  // ── travel (10) ──
  // beginner
  {
    id: "es_q009",
    level: "beginner",
    category: "travel",
    question:
      "ホテルでチェックインする場面をスペイン語で練習しましょう。「予約があります」はどう言いますか？",
  },
  {
    id: "es_q010",
    level: "beginner",
    category: "travel",
    question:
      "空港でスペイン語で「搭乗口はどこですか？」と尋ねてみてください。",
  },
  {
    id: "es_q011",
    level: "beginner",
    category: "travel",
    question:
      "タクシーに乗る場面を想像してください。「この住所まで連れて行ってください」をスペイン語で言ってみましょう。",
  },
  // intermediate
  {
    id: "es_q012",
    level: "intermediate",
    category: "travel",
    question:
      "スペイン旅行の思い出をスペイン語で話してみてください。過去形と不完了過去を使い分けましょう。",
  },
  {
    id: "es_q013",
    level: "intermediate",
    category: "travel",
    question:
      "マドリードとバルセロナの違いをスペイン語で説明してみてください。比較表現を使いましょう。",
  },
  {
    id: "es_q014",
    level: "intermediate",
    category: "travel",
    question:
      "スペインのバルでタパスを注文する場面をスペイン語でロールプレイしてみましょう。おすすめを聞く表現を使って。",
  },
  // advanced
  {
    id: "es_q015",
    level: "advanced",
    category: "travel",
    question:
      "観光がスペインの地方経済に与える影響について、スペイン語で意見を述べてください。",
  },
  {
    id: "es_q016",
    level: "advanced",
    category: "travel",
    question:
      "持続可能な観光（turismo sostenible）の重要性について、スペイン語で説明してください。",
  },

  // ── culture (10) ──
  // beginner
  {
    id: "es_q017",
    level: "beginner",
    category: "culture",
    question:
      "「日本ではお花見をします」をスペイン語で説明してみましょう。お花見とは何か簡単に伝えてください。",
  },
  {
    id: "es_q018",
    level: "beginner",
    category: "culture",
    question:
      "好きなスペイン語の歌や映画について、スペイン語で簡単に紹介してください。",
  },
  {
    id: "es_q019",
    level: "beginner",
    category: "culture",
    question:
      "スペインの食事の時間は日本と違います。スペイン語で「スペインでは夜9時に夕食を食べます」と言ってみましょう。",
  },
  // intermediate
  {
    id: "es_q020",
    level: "intermediate",
    category: "culture",
    question:
      "スペインの「シエスタ」文化をスペイン語で説明してみてください。日本の昼寝文化と比較してみましょう。",
  },
  {
    id: "es_q021",
    level: "intermediate",
    category: "culture",
    question:
      "フラメンコの魅力をスペイン語で説明してみてください。音楽、ダンス、感情表現について触れましょう。",
  },
  {
    id: "es_q022",
    level: "intermediate",
    category: "culture",
    question:
      "日本の「もったいない」の概念をスペイン語で友人に説明するとしたら、どう表現しますか？",
  },
  // advanced
  {
    id: "es_q023",
    level: "advanced",
    category: "culture",
    question:
      "ガウディの建築哲学について、スペイン語であなたの見解を述べてください。",
  },
  {
    id: "es_q024",
    level: "advanced",
    category: "culture",
    question:
      "スペイン語圏の「マチスモ（machismo）」文化とその変化について、スペイン語で考察してください。",
  },

  // ── food (10) ──
  // beginner
  {
    id: "es_q025",
    level: "beginner",
    category: "food",
    question:
      "好きな食べ物をスペイン語で3つ挙げて、なぜ好きか簡単に説明してください。",
  },
  {
    id: "es_q026",
    level: "beginner",
    category: "food",
    question:
      "スペイン語で「パエリアの作り方」を簡単なステップで説明してみましょう。",
  },
  {
    id: "es_q027",
    level: "beginner",
    category: "food",
    question:
      "レストランで「アレルギーがあります」とスペイン語で伝える練習をしましょう。",
  },
  // intermediate
  {
    id: "es_q028",
    level: "intermediate",
    category: "food",
    question:
      "日本料理とスペイン料理の共通点と違いをスペイン語で比較してみてください。",
  },
  {
    id: "es_q029",
    level: "intermediate",
    category: "food",
    question:
      "スペインのワイン文化についてスペイン語で紹介してください。リオハやカバについて触れましょう。",
  },
  {
    id: "es_q030",
    level: "intermediate",
    category: "food",
    question:
      "「おふくろの味」に当たるスペイン語の概念はありますか？スペイン語で考えを述べてみてください。",
  },
  // advanced
  {
    id: "es_q031",
    level: "advanced",
    category: "food",
    question:
      "ミシュラン星レストランのスペイン料理（Ferran Adrià等）が世界の料理に与えた影響をスペイン語で論じてください。",
  },
  {
    id: "es_q032",
    level: "advanced",
    category: "food",
    question:
      "地中海式食事法（dieta mediterránea）がUNESCO無形文化遺産に登録された意義をスペイン語で説明してください。",
  },

  // ── daily_life (10) ──
  // beginner
  {
    id: "es_q033",
    level: "beginner",
    category: "daily_life",
    question:
      "あなたの一日のスケジュールをスペイン語で説明してください。再帰動詞を使ってみましょう。",
  },
  {
    id: "es_q034",
    level: "beginner",
    category: "daily_life",
    question:
      "週末の予定をスペイン語で話してみてください。「〜するつもりです（voy a + 動詞）」を使いましょう。",
  },
  {
    id: "es_q035",
    level: "beginner",
    category: "daily_life",
    question:
      "家族をスペイン語で紹介してみてください。家族の名前、年齢、職業を含めましょう。",
  },
  // intermediate
  {
    id: "es_q036",
    level: "intermediate",
    category: "daily_life",
    question:
      "日本の通勤ラッシュをスペイン人の友人にスペイン語で説明してみてください。",
  },
  {
    id: "es_q037",
    level: "intermediate",
    category: "daily_life",
    question:
      "最近読んだ本や見たドラマの感想をスペイン語で述べてみてください。",
  },
  {
    id: "es_q038",
    level: "intermediate",
    category: "daily_life",
    question:
      "日本の季節の行事（お盆、七夕など）を一つ選んでスペイン語で説明してください。",
  },
  // advanced
  {
    id: "es_q039",
    level: "advanced",
    category: "daily_life",
    question:
      "テレワークのメリットとデメリットについてスペイン語でディベートしてみましょう。",
  },
  {
    id: "es_q040",
    level: "advanced",
    category: "daily_life",
    question:
      "日本とスペインの働き方の違いについて、スペイン語で比較分析してください。",
  },

  // ── grammar_practice (10) ──
  // beginner
  {
    id: "es_q041",
    level: "beginner",
    category: "grammar_practice",
    question:
      "ser と estar の違いを意識して、自分自身について5つの文をスペイン語で作ってみてください。",
  },
  {
    id: "es_q042",
    level: "beginner",
    category: "grammar_practice",
    question:
      "スペイン語で「〜が好きです」を使って、好きなものを5つ紹介してください（gustar動詞）。",
  },
  {
    id: "es_q043",
    level: "beginner",
    category: "grammar_practice",
    question:
      "天気についてスペイン語で話してみましょう。「今日は暑い」「明日は雨が降るでしょう」など。",
  },
  // intermediate
  {
    id: "es_q044",
    level: "intermediate",
    category: "grammar_practice",
    question:
      "線過去と点過去を使い分けて、子供の頃の思い出をスペイン語で語ってください。",
  },
  {
    id: "es_q045",
    level: "intermediate",
    category: "grammar_practice",
    question:
      "接続法を使って「〜してほしい」「〜であることを願う」という表現をスペイン語で3つ作ってみてください。",
  },
  {
    id: "es_q046",
    level: "intermediate",
    category: "grammar_practice",
    question:
      "関係代名詞（que, quien, donde）を使って、あなたの住んでいる街をスペイン語で描写してください。",
  },
  // advanced
  {
    id: "es_q047",
    level: "advanced",
    category: "grammar_practice",
    question:
      "接続法過去を使って「もし〜だったら」の仮定文をスペイン語で3つ作ってみてください。",
  },
  {
    id: "es_q048",
    level: "advanced",
    category: "grammar_practice",
    question:
      "スペイン語の慣用表現（modismos）を5つ使って、短い物語を書いてみてください。",
  },
];

export type NudgeType = "gentle_nudge" | "strong_nudge" | "streak_boost";

export function getNudgeMessage(type: NudgeType, lang: TargetLanguage = "en"): string {
  const strings = getLangStrings(lang);
  const messages = strings.nudgeMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function pickQuestion(
  recentQuestionIds: string[],
  userLevel?: string,
  lang: TargetLanguage = "en"
): PushQuestion {
  let pool = lang === "es" ? QUESTION_POOL_ES : QUESTION_POOL;

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
