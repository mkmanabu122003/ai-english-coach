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

  // ── history (10) ──
  // beginner
  {
    id: "q061",
    level: "beginner",
    category: "history",
    question:
      "A guest asks who the samurai were. How do you give a simple explanation?",
  },
  {
    id: "q062",
    level: "beginner",
    category: "history",
    question:
      "Your guest sees a castle and asks what it was used for. How do you explain Japanese castles simply?",
  },
  {
    id: "q063",
    level: "beginner",
    category: "history",
    question:
      "A guest asks why there are so many old wooden buildings in Japan. How do you explain the tradition of wooden architecture?",
  },
  // intermediate
  {
    id: "q064",
    level: "intermediate",
    category: "history",
    question:
      "Your guest wants to know how Japan modernized so quickly during the Meiji era. How do you summarize this transformation?",
  },
  {
    id: "q065",
    level: "intermediate",
    category: "history",
    question:
      "A guest visiting a castle asks why Japanese castles look so different from European ones. How do you explain the design philosophy?",
  },
  {
    id: "q066",
    level: "intermediate",
    category: "history",
    question:
      "Your guest asks about geisha and seems to have misconceptions. How do you explain the tradition accurately and respectfully?",
  },
  {
    id: "q067",
    level: "intermediate",
    category: "history",
    question:
      "A guest is walking through old Edo-period streets and asks what daily life was like back then. How do you paint the picture?",
  },
  // advanced
  {
    id: "q068",
    level: "advanced",
    category: "history",
    question:
      "A guest asks about the samurai code of bushido and whether it still influences modern Japanese society. How do you respond?",
  },
  {
    id: "q069",
    level: "advanced",
    category: "history",
    question:
      "Your guest asks how Japan's period of isolation (sakoku) shaped its unique culture. How do you explain the lasting effects?",
  },
  {
    id: "q070",
    level: "advanced",
    category: "history",
    question:
      "A guest asks about the relationship between Japan's imperial family and Shinto religion throughout history. How do you navigate this nuanced topic?",
  },

  // ── seasonal_events (10) ──
  // beginner
  {
    id: "q071",
    level: "beginner",
    category: "seasonal_events",
    question:
      "A guest asks what Japanese people do on New Year's Day. How do you explain it simply?",
  },
  {
    id: "q072",
    level: "beginner",
    category: "seasonal_events",
    question:
      "Your guest sees people in yukata at a summer festival. How do you explain what a matsuri is?",
  },
  {
    id: "q073",
    level: "beginner",
    category: "seasonal_events",
    question:
      "A guest asks about Golden Week. How do you explain why everything is so crowded?",
  },
  // intermediate
  {
    id: "q074",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "A guest asks about Japanese New Year traditions. How do you explain hatsumode, osechi, and otoshidama?",
  },
  {
    id: "q075",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "Your guest visits during Obon and sees lanterns floating on a river. How do you explain this festival and its meaning?",
  },
  {
    id: "q076",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "A guest asks about setsubun and why people throw beans. How do you make this tradition interesting and understandable?",
  },
  {
    id: "q077",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "Your guest wants to experience a summer matsuri. How do you describe what happens and how to join in the fun?",
  },
  // advanced
  {
    id: "q078",
    level: "advanced",
    category: "seasonal_events",
    question:
      "A guest asks why Christmas in Japan involves KFC and illuminations instead of church. How do you explain the Japanese adaptation of foreign holidays?",
  },
  {
    id: "q079",
    level: "advanced",
    category: "seasonal_events",
    question:
      "Your guest asks about the significance of Shichi-Go-San and how Japanese rites of passage compare to Western ones. How do you explain?",
  },
  {
    id: "q080",
    level: "advanced",
    category: "seasonal_events",
    question:
      "A guest is fascinated by how Japan celebrates the changing seasons through food, clothing, and decorations. How do you explain this deep connection to seasonal awareness?",
  },

  // ── pop_culture (10) ──
  // beginner
  {
    id: "q081",
    level: "beginner",
    category: "pop_culture",
    question:
      "A guest asks what anime they should watch to learn about Japanese culture. What do you recommend and why?",
  },
  {
    id: "q082",
    level: "beginner",
    category: "pop_culture",
    question:
      "Your guest wants to visit Akihabara. How do you describe what they can find there?",
  },
  {
    id: "q083",
    level: "beginner",
    category: "pop_culture",
    question:
      "A guest asks about purikura (photo booths). How do you explain what they are and why they're fun?",
  },
  // intermediate
  {
    id: "q084",
    level: "intermediate",
    category: "pop_culture",
    question:
      "A guest asks why anime and manga are so popular worldwide. How do you explain Japan's influence on global pop culture?",
  },
  {
    id: "q085",
    level: "intermediate",
    category: "pop_culture",
    question:
      "Your guest asks about the concept of 'kawaii' and why cute things are everywhere in Japan, even in official settings. How do you explain it?",
  },
  {
    id: "q086",
    level: "intermediate",
    category: "pop_culture",
    question:
      "A guest asks about Japanese video game history, from Nintendo to modern gaming. How do you tell this story?",
  },
  {
    id: "q087",
    level: "intermediate",
    category: "pop_culture",
    question:
      "Your guest is curious about capsule toys (gacha) and asks why adults collect them. How do you explain this aspect of Japanese culture?",
  },
  // advanced
  {
    id: "q088",
    level: "advanced",
    category: "pop_culture",
    question:
      "A guest asks about J-pop and idol culture. How do you explain the phenomenon and the unique relationship between idols and fans?",
  },
  {
    id: "q089",
    level: "advanced",
    category: "pop_culture",
    question:
      "Your guest asks how manga and anime have influenced Japan's 'soft power' diplomacy. How do you discuss this cultural export strategy?",
  },
  {
    id: "q090",
    level: "advanced",
    category: "pop_culture",
    question:
      "A guest asks about the otaku subculture and how it went from stigmatized to mainstream. How do you explain this cultural shift?",
  },

  // ── transport (10) ──
  // beginner
  {
    id: "q091",
    level: "beginner",
    category: "transport",
    question:
      "A guest asks how to buy a train ticket. How do you explain the basic steps?",
  },
  {
    id: "q092",
    level: "beginner",
    category: "transport",
    question:
      "Your guest wants to know what a Suica card is and how to use it. How do you explain it simply?",
  },
  {
    id: "q093",
    level: "beginner",
    category: "transport",
    question:
      "A guest asks about the Shinkansen. How do you describe what makes it special?",
  },
  // intermediate
  {
    id: "q094",
    level: "intermediate",
    category: "transport",
    question:
      "A guest asks how the Shinkansen manages to stay so punctual. How do you explain the system behind Japan's bullet trains?",
  },
  {
    id: "q095",
    level: "intermediate",
    category: "transport",
    question:
      "Your guest is confused by Suica, PASMO, and ICOCA cards. How do you explain the IC card system clearly?",
  },
  {
    id: "q096",
    level: "intermediate",
    category: "transport",
    question:
      "A guest asks why Japan has so many different railway companies. How do you explain the system?",
  },
  {
    id: "q097",
    level: "intermediate",
    category: "transport",
    question:
      "Your guest asks about the Japan Rail Pass. How do you explain when it's worth buying and how to use it?",
  },
  // advanced
  {
    id: "q098",
    level: "advanced",
    category: "transport",
    question:
      "A guest asks about Japan's approach to public transportation and why car ownership is less common in cities. How do you explain the urban design philosophy?",
  },
  {
    id: "q099",
    level: "advanced",
    category: "transport",
    question:
      "Your guest asks why Japanese trains are so clean and orderly compared to other countries. How do you connect this to broader cultural values?",
  },
  {
    id: "q100",
    level: "advanced",
    category: "transport",
    question:
      "A guest asks about the future of Japan's transportation — maglev trains, autonomous vehicles, and flying taxis. How do you discuss Japan's vision for mobility?",
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

  // ── history (10) ──
  // beginner
  {
    id: "es_q049",
    level: "beginner",
    category: "history",
    question:
      "「侍」とは何かをスペイン語で簡単に説明してみてください。",
  },
  {
    id: "es_q050",
    level: "beginner",
    category: "history",
    question:
      "日本のお城を見たゲストに、お城の役割をスペイン語で簡単に紹介してください。",
  },
  {
    id: "es_q051",
    level: "beginner",
    category: "history",
    question:
      "「忍者」について興味を持ったゲストに、スペイン語で簡単に説明してください。",
  },
  // intermediate
  {
    id: "es_q052",
    level: "intermediate",
    category: "history",
    question:
      "明治維新による日本の近代化をスペイン語で説明してください。",
  },
  {
    id: "es_q053",
    level: "intermediate",
    category: "history",
    question:
      "日本のお城の特徴を、スペインの城と比較しながらスペイン語で説明してください。",
  },
  {
    id: "es_q054",
    level: "intermediate",
    category: "history",
    question:
      "芸者の伝統について、よくある誤解を正しながらスペイン語で説明してください。",
  },
  {
    id: "es_q055",
    level: "intermediate",
    category: "history",
    question:
      "江戸時代の暮らしと文化について、興味を引くようにスペイン語で紹介してください。",
  },
  // advanced
  {
    id: "es_q056",
    level: "advanced",
    category: "history",
    question:
      "侍の武士道精神が現代の日本社会にどう影響しているか、スペイン語で論じてください。",
  },
  {
    id: "es_q057",
    level: "advanced",
    category: "history",
    question:
      "日本の鎖国政策（sakoku）が独自の文化形成にどう寄与したか、スペイン語で説明してください。",
  },
  {
    id: "es_q058",
    level: "advanced",
    category: "history",
    question:
      "スペインの「レコンキスタ」と日本の「戦国時代」を比較しながら、両国の統一過程をスペイン語で論じてください。",
  },

  // ── seasonal_events (10) ──
  // beginner
  {
    id: "es_q059",
    level: "beginner",
    category: "seasonal_events",
    question:
      "日本のお正月の過ごし方をスペイン語で簡単に紹介してください。",
  },
  {
    id: "es_q060",
    level: "beginner",
    category: "seasonal_events",
    question:
      "日本の夏祭りで何ができるか、スペイン語で簡単に説明してください。",
  },
  {
    id: "es_q061",
    level: "beginner",
    category: "seasonal_events",
    question:
      "日本のバレンタインデーの過ごし方がスペインと違う点をスペイン語で説明してみましょう。",
  },
  // intermediate
  {
    id: "es_q062",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "お盆の意味と風習をスペイン語で説明してください。メキシコの「死者の日」と比較しても構いません。",
  },
  {
    id: "es_q063",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "節分の豆まきの由来と楽しみ方をスペイン語で説明してください。",
  },
  {
    id: "es_q064",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "日本の夏祭り（盆踊り、屋台、花火）の楽しみ方をスペイン語で紹介してください。",
  },
  {
    id: "es_q065",
    level: "intermediate",
    category: "seasonal_events",
    question:
      "日本のお正月の過ごし方（初詣、おせち、お年玉など）をスペイン語で詳しく紹介してください。",
  },
  // advanced
  {
    id: "es_q066",
    level: "advanced",
    category: "seasonal_events",
    question:
      "日本のクリスマスの過ごし方がスペイン語圏の国々と違う点をスペイン語で説明してください。文化的背景にも触れましょう。",
  },
  {
    id: "es_q067",
    level: "advanced",
    category: "seasonal_events",
    question:
      "日本の季節感（旬の食材、行事、衣替えなど）が日常生活に与える影響をスペイン語で論じてください。",
  },
  {
    id: "es_q068",
    level: "advanced",
    category: "seasonal_events",
    question:
      "スペインの「セマナ・サンタ」と日本の「お盆」を比較し、宗教的行事が社会に果たす役割をスペイン語で考察してください。",
  },

  // ── pop_culture (10) ──
  // beginner
  {
    id: "es_q069",
    level: "beginner",
    category: "pop_culture",
    question:
      "好きなアニメやマンガをスペイン語で紹介してください。なぜ好きか簡単に説明しましょう。",
  },
  {
    id: "es_q070",
    level: "beginner",
    category: "pop_culture",
    question:
      "日本のカラオケ文化をスペイン語で簡単に紹介してください。",
  },
  {
    id: "es_q071",
    level: "beginner",
    category: "pop_culture",
    question:
      "ゲストが「かわいい」の意味を知りたがっています。スペイン語で簡単に説明してください。",
  },
  // intermediate
  {
    id: "es_q072",
    level: "intermediate",
    category: "pop_culture",
    question:
      "アニメ・マンガが世界中で人気な理由を、スペイン語で説明してください。",
  },
  {
    id: "es_q073",
    level: "intermediate",
    category: "pop_culture",
    question:
      "秋葉原の見どころと楽しみ方をスペイン語で紹介してください。",
  },
  {
    id: "es_q074",
    level: "intermediate",
    category: "pop_culture",
    question:
      "「かわいい」文化が日本社会に与える影響をスペイン語で説明してください。",
  },
  {
    id: "es_q075",
    level: "intermediate",
    category: "pop_culture",
    question:
      "任天堂からPlayStationまで、日本のゲーム産業の歴史と影響力をスペイン語で説明してください。",
  },
  // advanced
  {
    id: "es_q076",
    level: "advanced",
    category: "pop_culture",
    question:
      "日本のアニメ・マンガが「ソフトパワー」として外交にどう貢献しているか、スペイン語で論じてください。",
  },
  {
    id: "es_q077",
    level: "advanced",
    category: "pop_culture",
    question:
      "オタク文化がかつての偏見から主流文化へと変化した経緯をスペイン語で説明してください。",
  },
  {
    id: "es_q078",
    level: "advanced",
    category: "pop_culture",
    question:
      "コスプレ文化の起源と日本での発展、そして世界への広がりをスペイン語で紹介してください。",
  },

  // ── transport (10) ──
  // beginner
  {
    id: "es_q079",
    level: "beginner",
    category: "transport",
    question:
      "新幹線とは何か、スペイン語で簡単に説明してください。",
  },
  {
    id: "es_q080",
    level: "beginner",
    category: "transport",
    question:
      "Suicaカードの使い方をスペイン語で簡単に説明してください。",
  },
  {
    id: "es_q081",
    level: "beginner",
    category: "transport",
    question:
      "日本で電車に乗るときの基本的なルールをスペイン語で説明してください。",
  },
  // intermediate
  {
    id: "es_q082",
    level: "intermediate",
    category: "transport",
    question:
      "新幹線の特徴（速さ、正確さ、快適さ）をスペインのAVEと比較しながらスペイン語で説明してください。",
  },
  {
    id: "es_q083",
    level: "intermediate",
    category: "transport",
    question:
      "日本に鉄道会社が複数ある理由と乗り換えのコツをスペイン語で説明してください。",
  },
  {
    id: "es_q084",
    level: "intermediate",
    category: "transport",
    question:
      "Japan Rail Passの使い方とお得な活用法をスペイン語で紹介してください。",
  },
  {
    id: "es_q085",
    level: "intermediate",
    category: "transport",
    question:
      "日本での自転車レンタルの利用方法と交通ルールをスペイン語で説明してください。",
  },
  // advanced
  {
    id: "es_q086",
    level: "advanced",
    category: "transport",
    question:
      "日本の公共交通機関がなぜこれほど発達しているか、都市設計の観点からスペイン語で論じてください。",
  },
  {
    id: "es_q087",
    level: "advanced",
    category: "transport",
    question:
      "日本の電車がなぜ清潔で秩序正しいか、文化的価値観と結びつけてスペイン語で説明してください。",
  },
  {
    id: "es_q088",
    level: "advanced",
    category: "transport",
    question:
      "リニア中央新幹線や自動運転技術など、日本の交通の未来についてスペイン語で論じてください。",
  },
];

export type NudgeType = "gentle_nudge" | "strong_nudge" | "streak_boost" | "comeback";

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
