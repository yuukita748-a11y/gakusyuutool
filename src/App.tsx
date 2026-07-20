import React, { useState, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  Compass, 
  TrendingUp, 
  Zap, 
  HelpCircle,
  Plus,
  Flame,
  Minus,
  CheckCircle,
  Clock,
  Menu,
  X
} from 'lucide-react';
import Confetti from './components/Confetti';
import BeakerQuest from './components/BeakerQuest';
import Roulette from './components/Roulette';
import StudyPassbook from './components/StudyPassbook';
import { AppState, PassbookEntry, QuestTask, RouletteState } from './types';
import { INITIAL_PASSBOOK_DATA } from './initialData';

// Default initial tasks for Roulette Modes
const DEFAULT_ROULETTE = {
  a: {
    tasks: ["英語長文", "英語リスニング", "精読演習", "英文法解説", "シャドーイング", "英作文", "国語現代文", "ドイツ語単語", "ドイツ語文法", "数学1A"],
    done: []
  },
  b: {
    tasks: ["長文読解", "リスニング極", "古典文法", "古文単語", "フランス語単語", "フランス語文法"],
    done: []
  },
  c: {
    tasks: ["シャドーイング", "フランス語発音練習"],
    done: []
  }
};

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
}

export default function App() {
  // --- Integrated App States (Initialized using Lazy Initializers to prevent race conditions on reload) ---
  const [passbook, setPassbook] = useState<PassbookEntry[]>(() => {
    const savedPassbookStr = localStorage.getItem('studyPassbookV5');
    if (savedPassbookStr && savedPassbookStr !== '[]') {
      try {
        const legacyList = JSON.parse(savedPassbookStr);
        return legacyList.map((item: any, idx: number) => ({
          id: item.id || `legacy-pb-${idx}-${Date.now()}`,
          date: item.date || new Date().toISOString().split('T')[0],
          task: item.task || '',
          category: item.rawTask === '__withdraw__' ? 'ご褒美' : (item.rawTask || 'その他'),
          pt: item.pt || 0
        }));
      } catch (e) {
        console.error("Error loading legacy studyPassbookV5:", e);
      }
    }
    return INITIAL_PASSBOOK_DATA;
  });

  const [quests, setQuests] = useState<QuestTask[]>(() => {
    const savedQuestsStr = localStorage.getItem('bq_tasks');
    if (savedQuestsStr) {
      try {
        const list = JSON.parse(savedQuestsStr);
        return list.map((item: any, idx: number) => ({
          id: item.id || `quest-${idx}-${Date.now()}`,
          name: item.name || '',
          val: item.val || 10,
          done: !!item.done
        }));
      } catch (e) {
        console.error("Error loading bq_tasks:", e);
      }
    }
    return [];
  });

  const [gauge, setGauge] = useState<number>(() => {
    const savedGauge = localStorage.getItem('bq_gauge');
    return savedGauge ? (parseInt(savedGauge) || 0) : 0;
  });

  const [tickets, setTickets] = useState<number>(() => {
    const savedTickets = localStorage.getItem('bq_tickets');
    return savedTickets ? (parseInt(savedTickets) || 0) : 0;
  });

  const [roulette, setRoulette] = useState<{
    a: RouletteState;
    b: RouletteState;
    c: RouletteState;
  }>(() => {
    const savedRouletteStr = localStorage.getItem('roulette_v3');
    if (savedRouletteStr) {
      try {
        const raw = JSON.parse(savedRouletteStr);
        const r: typeof DEFAULT_ROULETTE = { ...DEFAULT_ROULETTE };
        if (raw.a) r.a = raw.a;
        if (raw.b) r.b = raw.b;
        if (raw.c) r.c = raw.c;
        return r;
      } catch (e) {
        console.error("Error loading roulette_v3:", e);
      }
    }
    return DEFAULT_ROULETTE;
  });

  const [templates, setTemplates] = useState<{ [name: string]: { name: string; val: number }[] }>(() => {
    const savedTemplatesStr = localStorage.getItem('bq_templates');
    if (savedTemplatesStr) {
      try {
        return JSON.parse(savedTemplatesStr);
      } catch (e) {
        console.error("Error loading bq_templates:", e);
      }
    }
    return {};
  });

  // --- UI Layout state ---
  const [activeTab, setActiveTab] = useState<'quest' | 'roulette' | 'passbook'>(() => {
    const saved = localStorage.getItem('studyquest_active_tab');
    if (saved === 'quest' || saved === 'roulette' || saved === 'passbook') {
      return saved;
    }
    return 'roulette';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [isTicketUseModalOpen, setIsTicketUseModalOpen] = useState(false);
  const [ticketUseCount, setTicketUseCount] = useState(1);
  const [rewardPurpose, setRewardPurpose] = useState('');

  // --- Visual Effects trigger states ---
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [stampText, setStampText] = useState<string | null>(null);

  // --- Save data whenever states change ---
  useEffect(() => {
    if (passbook.length > 0) {
      // Map back to studyPassbookV5 legacy structure so previous files remain backward-compatible
      const legacyFormat = passbook.map(e => ({
        date: e.date,
        task: e.task,
        rawTask: e.category === 'ご褒美' ? '__withdraw__' : e.category,
        pt: e.pt,
        id: e.id
      }));
      localStorage.setItem('studyPassbookV5', JSON.stringify(legacyFormat));
    } else {
      localStorage.removeItem('studyPassbookV5');
    }
  }, [passbook]);

  useEffect(() => {
    localStorage.setItem('bq_tasks', JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('bq_tickets', tickets.toString());
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('bq_gauge', gauge.toString());
  }, [gauge]);

  useEffect(() => {
    localStorage.setItem('bq_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('roulette_v3', JSON.stringify(roulette));
  }, [roulette]);

  useEffect(() => {
    localStorage.setItem('studyquest_active_tab', activeTab);
  }, [activeTab]);

  // --- Core functions & Unified synchronization ---

  // Spawn floating points animation helper
  const triggerFloatingScore = (text: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFloatingScores(prev => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(f => f.id !== id));
    }, 800);
  };

  // 1. BEAKER QUEST ACTIONS
  const handleAddQuest = (name: string, val: number) => {
    const newQuest: QuestTask = {
      id: `quest-${Date.now()}-${Math.random()}`,
      name,
      val,
      done: false
    };
    setQuests(prev => [...prev, newQuest]);
  };

  const handleDeleteQuest = (id: string) => {
    setQuests(prev => prev.filter(q => q.id !== id));
  };

  const handleToggleQuest = (id: string, x: number, y: number) => {
    setQuests(prev => {
      let isCompletedNow = false;
      let completedQuestVal = 0;
      let completedQuestName = '';

      const updated = prev.map(q => {
        if (q.id === id) {
          isCompletedNow = !q.done;
          completedQuestVal = q.val;
          completedQuestName = q.name;
          return { ...q, done: !q.done };
        }
        return q;
      });

      // Unified side effects
      if (isCompletedNow) {
        // 1. Add points to Beaker Gauge
        let newGauge = gauge + completedQuestVal;
        let newTickets = tickets;
        
        while (newGauge >= 100) {
          newGauge -= 100;
          newTickets += 1;
          // Trigger Ticket Earned celebration!
          setTimeout(() => {
            setTriggerConfetti(true);
            setStampText("TICKET !!");
          }, 300);
        }
        setGauge(newGauge);
        setTickets(newTickets);

        // 2. Automatically record in Study Passbook (Deposit)
        const dateStr = new Date().toISOString().split('T')[0];
        // Parse a category out of the name if possible, otherwise defaults to "ビーカー"
        const guessedCategory = guessCategoryByName(completedQuestName);

        const newEntry: PassbookEntry = {
          id: `beaker-auto-${id}-${Date.now()}`,
          date: dateStr,
          task: `📖 [Beaker] ${completedQuestName} (${completedQuestVal}pt)`,
          category: guessedCategory,
          pt: completedQuestVal
        };
        setPassbook(prevPb => [...prevPb, newEntry]);

        // 3. Float score visual effect
        triggerFloatingScore(`+${completedQuestVal}%`, x, y);
      } else {
        // If task was undone:
        // 1. Deduct points from gauge
        setGauge(prevGauge => Math.max(0, prevGauge - completedQuestVal));

        // 2. Remove automatic entry from passbook
        setPassbook(prevPb => prevPb.filter(e => e.id !== `beaker-auto-${id}-${Date.now()}` && e.id !== `beaker-auto-${id}`));
        triggerFloatingScore(`-${completedQuestVal}%`, x, y);
      }

      return updated;
    });
  };

  const handleAdjustQuestVal = (id: string, delta: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id && !q.done) {
        return { ...q, val: Math.max(5, q.val + delta) };
      }
      return q;
    }));
  };

  const handleClearAllQuests = () => {
    setQuests([]);
  };

  const handleSaveTemplate = (name: string) => {
    setTemplates(prev => ({
      ...prev,
      [name]: quests.map(q => ({ name: q.name, val: q.val }))
    }));
  };

  const handleLoadTemplate = (name: string) => {
    if (templates[name]) {
      const loaded = templates[name].map((t, idx) => ({
        id: `quest-${Date.now()}-${idx}`,
        name: t.name,
        val: t.val,
        done: false
      }));
      setQuests(loaded);
    }
  };

  const handleDeleteTemplate = (name: string) => {
    setTemplates(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleResetGauge = () => {
    setGauge(0);
  };

  const handleBulkAddQuests = (text: string) => {
    const lines = text.split('\n');
    const newQuests: QuestTask[] = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      const parts = line.split(',');
      const name = parts[0].trim();
      const val = parts[1] ? parseInt(parts[1].trim()) || 20 : 20;
      
      newQuests.push({
        id: `quest-bulk-${Date.now()}-${idx}`,
        name,
        val,
        done: false
      });
    });

    setQuests(prev => [...prev, ...newQuests]);
  };


  // 2. ROULETTE ACTIONS
  const handleMarkRouletteTaskDone = (mode: 'a' | 'b' | 'c', taskName: string, customPt?: number) => {
    setRoulette(prev => {
      const modeState = { ...prev[mode] };
      if (!modeState.done.includes(taskName)) {
        modeState.done = [...modeState.done, taskName];
      }
      return { ...prev, [mode]: modeState };
    });

    // Side Effects for completing a Roulette Mission:
    // 1. Energy bonus default to 20% to Beaker Quest (configurable)
    const bonusVal = customPt !== undefined ? customPt : 20;
    let newGauge = gauge + bonusVal;
    let newTickets = tickets;

    while (newGauge >= 100) {
      newGauge -= 100;
      newTickets += 1;
      // Trigger Ticket celebration!
      setTimeout(() => {
        setTriggerConfetti(true);
        setStampText("TICKET !!");
      }, 300);
    }
    setGauge(newGauge);
    setTickets(newTickets);

    // 2. Automatically record in Study Passbook (Deposit with category "ルーレット")
    const dateStr = new Date().toISOString().split('T')[0];
    const newEntry: PassbookEntry = {
      id: `roulette-auto-${mode}-${taskName.replace(/\s+/g, '')}-${Date.now()}`,
      date: dateStr,
      task: taskName,
      category: 'ルーレット',
      pt: bonusVal
    };
    setPassbook(prevPb => [...prevPb, newEntry]);

    // Toast/Float notice
    triggerFloatingScore(`+${bonusVal}% & pt!`, window.innerWidth / 2, window.innerHeight / 2 - 100);
  };

  const handleAddRouletteTask = (mode: 'a' | 'b' | 'c', task: string) => {
    setRoulette(prev => {
      const modeState = { ...prev[mode] };
      modeState.tasks = [...modeState.tasks, task];
      return { ...prev, [mode]: modeState };
    });
  };

  const handleDeleteRouletteTask = (mode: 'a' | 'b' | 'c', index: number) => {
    setRoulette(prev => {
      const modeState = { ...prev[mode] };
      const task = modeState.tasks[index];
      modeState.tasks = modeState.tasks.filter((_, idx) => idx !== index);
      modeState.done = modeState.done.filter(t => t !== task);
      return { ...prev, [mode]: modeState };
    });
  };

  const handleResetRouletteMode = (mode: 'a' | 'b' | 'c') => {
    setRoulette(prev => {
      const modeState = { ...prev[mode] };
      modeState.done = [];
      return { ...prev, [mode]: modeState };
    });
  };


  // 3. STUDY PASSBOOK ACTIONS
  const handleAddManualPassbookEntry = (date: string, task: string, pt: number, category: string) => {
    const newEntry: PassbookEntry = {
      id: `manual-pb-${Date.now()}`,
      date,
      task,
      category,
      pt
    };
    setPassbook(prev => [...prev, newEntry]);

    // If it's a deposit, float message
    if (pt > 0) {
      triggerFloatingScore(`+${pt} pt`, window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const handleDeletePassbookEntry = (id: string) => {
    setPassbook(prev => prev.filter(e => e.id !== id));
  };


  // 4. TICKET CONSUMPTION & CELEBRATION
  const handleOpenTicketModal = () => {
    if (tickets <= 0) return;
    setTicketUseCount(1);
    setRewardPurpose('');
    setIsTicketUseModalOpen(true);
  };

  const handleConfirmUseTicket = () => {
    if (tickets < ticketUseCount) return;

    // Deduct ticket
    setTickets(prev => Math.max(0, prev - ticketUseCount));
    setIsTicketUseModalOpen(false);

    // Dynamic passbook withdrawal:
    // Deduct points proportional to the number of tickets consumed (e.g. 1 ticket = -100pt value)
    const deductionVal = -100 * ticketUseCount;
    const purposeText = rewardPurpose.trim() ? ` [${rewardPurpose.trim()}]` : '';

    const dateStr = new Date().toISOString().split('T')[0];
    const newEntry: PassbookEntry = {
      id: `ticket-withdraw-${Date.now()}`,
      date: dateStr,
      task: `🎁 チケット${ticketUseCount}枚消費${purposeText}`,
      category: 'ご褒美',
      pt: deductionVal
    };
    setPassbook(prev => [...prev, newEntry]);

    // --- Start Celebration Sequence ---
    setShowFlash(true);
    setStampText(`USE × ${ticketUseCount}`);
    setTriggerConfetti(true);

    setTimeout(() => {
      setShowFlash(false);
    }, 200);

    setTimeout(() => {
      setStampText(null);
    }, 1500);
  };


  // --- Helper utility functions ---
  const guessCategoryByName = (name: string): string => {
    if (name.includes('英') || name.includes('ラジ') || name.includes('リス')) return '英語';
    if (name.includes('数') || name.includes('計') || name.includes('微')) return '数学';
    if (name.includes('独') || name.includes('ドイツ')) return 'ドイツ語';
    if (name.includes('仏') || name.includes('フランス')) return 'フランス語';
    if (name.includes('国') || name.includes('古') || name.includes('漢')) return '国語';
    return 'その他';
  };

  // Safe reset of entire app data
  const handleFullReset = () => {
    if (confirm('通帳履歴、タスク、ゲージ、チケットなど、アプリ内の全データを完全消去してリセットしますか？')) {
      localStorage.clear();
      setPassbook([]);
      setQuests([]);
      setGauge(0);
      setTickets(0);
      setRoulette(DEFAULT_ROULETTE);
      setTemplates({});
      setActiveTab('roulette');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-gray-200 selection:bg-blue-600/30">
      {/* Dynamic Splash Flash Effect */}
      {showFlash && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none" />
      )}

      {/* Celebration Stamp */}
      {stampText && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="border-4 border-amber-500 text-amber-400 font-display text-4xl font-extrabold tracking-widest px-8 py-4 rounded-xl bg-brand-bg/95 shadow-2xl animate-stamp-in uppercase">
            {stampText}
          </div>
        </div>
      )}

      {/* Floating Scores */}
      {floatingScores.map((score) => (
        <div
          key={score.id}
          className="fixed animate-float-up text-cyan-400 font-mono font-bold text-sm pointer-events-none z-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          style={{ left: score.x, top: score.y }}
        >
          {score.text}
        </div>
      ))}

      {/* Confetti Particle Component */}
      <Confetti trigger={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />

      {/* Side Navigation Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-80 max-w-[85vw] h-full bg-brand-surface border-r border-gray-800 p-5 flex flex-col justify-between shadow-2xl z-10 animate-slide-in-left">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 p-1.5 rounded-lg text-white">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display text-white">StudyQuest</h2>
                    <p className="text-[9px] text-gray-500">学習クエスト通帳 v5.0</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-gray-800/80 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Options */}
              <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold font-display px-3 mb-2">
                  メイン機能
                </div>
                <button
                  onClick={() => {
                    setActiveTab('roulette');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    activeTab === 'roulette'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/40 border border-transparent'
                  }`}
                >
                  <Compass className={`w-4 h-4 ${activeTab === 'roulette' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <div>🎯 パックルーレット</div>
                    <div className="text-[9px] text-gray-500 font-normal mt-0.5">ランダムに学習タスクを選定</div>
                  </div>
                  {activeTab === 'roulette' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </button>

                <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold font-display px-3 pt-4 mb-2">
                  サブ機能 (サイドメニュー)
                </div>
                
                <button
                  onClick={() => {
                    setActiveTab('quest');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    activeTab === 'quest'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/40 border border-transparent'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeTab === 'quest' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <div>📖 デイリークエスト</div>
                    <div className="text-[9px] text-gray-500 font-normal mt-0.5">20分単位の目標・ビーカー連携</div>
                  </div>
                  {activeTab === 'quest' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('passbook');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    activeTab === 'passbook'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/40 border border-transparent'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 ${activeTab === 'passbook' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <div>📈 学習通帳ログ</div>
                    <div className="text-[9px] text-gray-500 font-normal mt-0.5">貯蓄・記帳・成長の可視化</div>
                  </div>
                  {activeTab === 'passbook' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <div className="bg-gray-950/40 rounded-lg p-2.5 text-[9px] text-gray-500 leading-normal">
                💡 <span className="font-semibold text-gray-400">ワンポイント:</span> 毎日20分の勉強を継続して、ビーカーをエネルギーでいっぱいにしましょう！
              </div>
              <button
                onClick={handleFullReset}
                className="w-full text-center text-[10px] py-1.5 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
              >
                全データ初期化
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Navigation Header */}
      <header className="border-b border-gray-800 bg-brand-surface/80 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 border border-gray-800"
              title="サイドメニューを開く"
            >
              <Menu className="w-4 h-4" />
              <span className="text-xs font-bold font-display">メニュー</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 p-1.5 rounded-lg text-white shadow-md shadow-blue-500/10">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-sm font-bold font-display tracking-tight text-white">StudyQuest</h1>
                <p className="text-[9px] text-gray-500">学習クエスト通帳 v5.0</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleFullReset}
              className="text-[10px] text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
            >
              全データ初期化
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-12 gap-5">
        {/* Left column: Sidebar dashboard summary (Fixed Beaker, Stock Ticket control panel) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-brand-surface border border-gray-800 rounded-2xl p-4 flex flex-col space-y-4">
            {/* Header label */}
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 font-display">
                STATUS DASHBOARD
              </span>
              <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>UTC RECORD</span>
              </div>
            </div>

            {/* Beaker Quick preview inside Sidebar */}
            <div className="flex items-center space-x-4 bg-gray-900/40 rounded-xl p-3 border border-gray-800">
              <div className="relative w-10 h-16 bg-gray-950 border border-gray-700 rounded-b-lg overflow-hidden flex-shrink-0">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-700 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                  style={{ height: `${gauge}%` }}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Beaker Charge</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold font-mono text-cyan-400">{gauge}</span>
                  <span className="text-[10px] text-gray-500">/ 100%</span>
                </div>
                <p className="text-[9px] text-gray-600 leading-normal mt-0.5">タスク達成でゲージが上昇。満タンでご褒美券が1枚発行！</p>
              </div>
            </div>

            {/* Ticket Collection Board */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 flex items-center space-x-1 font-display">
                  <Award className="w-3.5 h-3.5 mr-0.5 fill-current" />
                  <span>ご褒美チケット ({tickets}枚)</span>
                </span>
                {tickets > 0 && (
                  <button
                    onClick={handleOpenTicketModal}
                    className="text-[9px] bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-gray-950 px-2 py-0.5 rounded border border-amber-500/20 font-bold transition-colors cursor-pointer"
                  >
                    消費する
                  </button>
                )}
              </div>

              {/* Graphical tickets */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3.5 min-h-[72px] flex flex-wrap gap-2 items-center justify-center">
                {tickets === 0 ? (
                  <div className="text-[10px] text-gray-600 text-center leading-normal">
                    獲得した「ご褒美チケット」がここに並びます。<br />
                    100%の学習クエストをクリアして券を手に入れましょう。
                  </div>
                ) : (
                  Array.from({ length: tickets }).map((_, idx) => (
                     <button
                       key={idx}
                       onClick={handleOpenTicketModal}
                       className="group relative flex flex-col items-center justify-center w-14 h-9 bg-amber-500/10 hover:bg-amber-500 border border-dashed border-amber-500/40 hover:border-solid rounded-lg text-amber-400 hover:text-gray-950 font-display transition-all transform hover:-translate-y-1 shadow-md hover:shadow-amber-500/20 cursor-pointer"
                     >
                       <span className="text-[9px] font-bold uppercase tracking-wider">Ticket</span>
                       <span className="text-[8px] opacity-70 font-mono">#0{idx + 1}</span>
                     </button>
                  ))
                )}
              </div>
            </div>

            {/* Current Passbook Balance Panel */}
            <div className="flex items-center justify-between bg-gray-950/40 p-3 rounded-xl border border-gray-800">
              <div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Total Savings</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  {passbook.reduce((sum, e) => sum + e.pt, 0).toLocaleString()} <span className="text-[10px]">pt</span>
                </div>
              </div>
              <div className="text-[9px] text-gray-600 text-right leading-relaxed max-w-[140px]">
                全学習による通帳の累積貯蓄。学習活動がすべてここに集約されます。
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Main action panel (Menu drawer active screen) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
          {/* Active view header context */}
          <div className="flex items-center justify-between bg-brand-surface border border-gray-800 rounded-2xl px-4 py-3 mb-4 shadow-sm">
            <div className="flex items-center space-x-2.5">
              {activeTab === 'roulette' && (
                <>
                  <div className="bg-blue-600/10 text-blue-400 p-2 rounded-xl border border-blue-500/15">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-gray-100 font-display">🎯 パックルーレット (メイン)</h2>
                    <p className="text-[10px] text-gray-500">学習時間をランダムに選定してモチベーション維持</p>
                  </div>
                </>
              )}
              {activeTab === 'quest' && (
                <>
                  <div className="bg-blue-600/10 text-blue-400 p-2 rounded-xl border border-blue-500/15">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-gray-100 font-display">📖 デイリークエスト</h2>
                    <p className="text-[10px] text-gray-500">ビーカーゲージにエネルギーをチャージする基本タスク</p>
                  </div>
                </>
              )}
              {activeTab === 'passbook' && (
                <>
                  <div className="bg-blue-600/10 text-blue-400 p-2 rounded-xl border border-blue-500/15">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-gray-100 font-display">📈 学習通帳ログ</h2>
                    <p className="text-[10px] text-gray-500">これまでの活動記録、預金残高、手動記帳とインポート</p>
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-[10px] bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
            >
              <Menu className="w-3 h-3" />
              <span>切り替え</span>
            </button>
          </div>

          {/* Render Active View component with unified synchronization */}
          <div className="flex-1 min-h-0 bg-transparent">
            {activeTab === 'quest' && (
              <BeakerQuest
                quests={quests}
                gauge={gauge}
                tickets={tickets}
                templates={templates}
                onAddTask={handleAddQuest}
                onDeleteTask={handleDeleteQuest}
                onToggleTask={handleToggleQuest}
                onAdjustTaskVal={handleAdjustQuestVal}
                onClearAllQuests={handleClearAllQuests}
                onSaveTemplate={handleSaveTemplate}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onResetGauge={handleResetGauge}
                onBulkAdd={handleBulkAddQuests}
              />
            )}

            {activeTab === 'roulette' && (
              <Roulette
                roulette={roulette}
                onMarkDone={handleMarkRouletteTaskDone}
                onAddTask={handleAddRouletteTask}
                onDeleteTask={handleDeleteRouletteTask}
                onResetMode={handleResetRouletteMode}
              />
            )}

            {activeTab === 'passbook' && (
              <StudyPassbook
                passbook={passbook}
                onAddManualEntry={handleAddManualPassbookEntry}
                onDeleteEntry={handleDeletePassbookEntry}
                onImportPassbook={(imported) => setPassbook(imported)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Ticket Consumption dialog modal */}
      {isTicketUseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-brand-surface border border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div>
              <div className="flex items-center space-x-1.5 text-amber-500 font-display">
                <Award className="w-4 h-4 fill-current" />
                <h3 className="text-sm font-bold">ご褒美チケットを使う</h3>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                所持しているチケットを消費して、設定したご褒美（ゲーム、映画、甘いもの等）を自分にプレゼントしましょう！
              </p>
            </div>

            {/* Adjust ticket amount */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase">使用する枚数</span>
              <div className="flex items-center justify-center space-x-4">
                <button
                  disabled={ticketUseCount <= 1}
                  onClick={() => setTicketUseCount(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 border border-gray-700 rounded-full text-xs transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xl font-bold font-mono text-amber-500 min-w-[32px]">{ticketUseCount}</span>
                <button
                  disabled={ticketUseCount >= tickets}
                  onClick={() => setTicketUseCount(prev => Math.min(tickets, prev + 1))}
                  className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 border border-gray-700 rounded-full text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-gray-600">
                現在のチケット残高: {tickets}枚
              </p>
            </div>

            {/* Reward Purpose */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase">ご褒美の内容・目的 (オプション)</label>
              <input
                type="text"
                value={rewardPurpose}
                onChange={(e) => setRewardPurpose(e.target.value)}
                placeholder="例: ゲーム1時間、ケーキを食べる"
                className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none transition-all"
              />
            </div>

            <div className="text-[9px] text-gray-500 leading-normal bg-amber-950/10 border border-amber-900/30 rounded-lg p-2.5">
              💡 <span className="text-amber-400 font-semibold">記帳連動:</span> チケットを消費すると、1枚につき<span className="font-semibold text-amber-400">-100pt</span>の「引き出し」が学習通帳に自動記帳されます。
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setIsTicketUseModalOpen(false)}
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmUseTicket}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl py-2 text-xs transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>消費する！</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
