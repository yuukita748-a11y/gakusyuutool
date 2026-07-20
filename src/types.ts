export interface PassbookEntry {
  id: string;
  date: string; // YYYY-MM-DD
  task: string; // 摘要
  category: string; // カテゴリ (例: "数学", "チケット消費", "ルーレット", etc.)
  pt: number; // 預入/払出 (学習はプラス、ご褒美/引き出しはマイナス)
}

export interface QuestTask {
  id: string;
  name: string;
  val: number; // ゲージ増加量 (%)
  done: boolean;
}

export interface RouletteState {
  tasks: string[];
  done: string[];
}

export interface AppState {
  passbook: PassbookEntry[];
  quests: QuestTask[];
  gauge: number;
  tickets: number;
  roulette: {
    a: RouletteState;
    b: RouletteState;
    c: RouletteState;
  };
  templates: { [name: string]: { name: string; val: number }[] };
}
