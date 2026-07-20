import React, { useState } from 'react';
import { Calendar, Tag, ArrowUpRight, ArrowDownLeft, Trash2, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PassbookEntry } from '../types';

interface StudyPassbookProps {
  passbook: PassbookEntry[];
  onAddManualEntry: (date: string, task: string, pt: number, category: string) => void;
  onDeleteEntry: (id: string) => void;
  onImportPassbook: (entries: PassbookEntry[]) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  '英語': '#3b82f6',
  '数学': '#10b981',
  'ドイツ語': '#a78bfa',
  'フランス語': '#f472b6',
  '国語': '#f59e0b',
  'ルーレット': '#06b6d4',
  'ビーカー': '#38bdf8',
  'ご褒美': '#ef4444',
  'その他': '#6b7280',
};

export default function StudyPassbook({
  passbook,
  onAddManualEntry,
  onDeleteEntry,
  onImportPassbook,
}: StudyPassbookProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [task, setTask] = useState('');
  const [amount, setAmount] = useState(20); // minutes or points
  const [graphMode, setGraphMode] = useState<7 | 'all'>(7);
  const [category, setCategory] = useState('その他');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  
  // Import/Export States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const handleOpenExport = () => {
    setImportText(JSON.stringify(passbook, null, 2));
    setImportError('');
    setIsImportOpen(true);
  };

  // Pre-configured Categories
  const categories = ['英語', '数学', '国語', 'ドイツ語', 'フランス語', 'その他'];

  // Balance calculation
  const totalBalance = passbook.reduce((sum, entry) => sum + entry.pt, 0);

  // Generate chart data based on passbook entries
  const getChartData = () => {
    // Only positive entries are counted as study time/points in graph
    const studyEntries = passbook.filter((e) => e.pt > 0);

    // Get unique sorted dates
    let dates = Array.from(new Set(studyEntries.map((e) => e.date))).sort();

    if (graphMode === 7) {
      // Get past 7 dates including today or last 7 recorded study dates
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
      }
      dates = last7Days;
    }

    // Determine all active categories in studyEntries
    const allCategories = Array.from(new Set(studyEntries.map((e) => e.category || 'その他')));

    // Build data structure for Recharts: { name: "07-20", "数学": 20, "英語": 15, ... }
    return dates.map((d) => {
      const dayData: { [key: string]: any } = { name: d.slice(5) }; // "MM-DD"
      
      allCategories.forEach((cat) => {
        const sum = studyEntries
          .filter((e) => e.date === d && e.category === cat)
          .reduce((acc, e) => acc + e.pt, 0);
        dayData[cat] = sum;
      });
      return dayData;
    });
  };

  const chartData = getChartData();
  const activeCategories = Array.from(new Set(passbook.filter(e => e.pt > 0).map(e => e.category || 'その他')));

  const handleDeposit = () => {
    if (!task.trim()) return;
    // Save learning
    onAddManualEntry(date, `📖 ${task} (${amount}分)`, Math.floor(amount), category);
    setTask('');
  };

  const handleWithdraw = () => {
    if (!task.trim()) return;
    // Save reward (withdraw)
    onAddManualEntry(date, `🎁 ${task}`, -Math.floor(amount), 'ご褒美');
    setTask('');
  };

  // Safe delete with inline confirmation
  const triggerDelete = (id: string) => {
    setEntryToDelete(id);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete);
      setEntryToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Current Balance & Chart */}
      <div className="grid grid-cols-12 gap-4">
        {/* Passbook Balance */}
        <div className="col-span-12 md:col-span-4 flex flex-col justify-between bg-gradient-to-br from-[#5d9b9d] to-[#4a7c7e] rounded-2xl p-4 shadow-lg text-white">
          <div>
            <div className="text-[10px] tracking-widest text-emerald-100 uppercase font-bold font-display">
              Passbook Balance
            </div>
            <div className="text-[11px] text-emerald-200 mt-1">
              現在の差引残高
            </div>
          </div>
          <div className="my-3 flex items-baseline justify-center">
            <span className="text-3xl font-bold font-mono tracking-tight">{totalBalance.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-100 ml-1.5 font-display">pt</span>
          </div>
          <div className="text-[10px] text-emerald-200/80 text-center leading-normal">
            1分学習 ＝ 1pt 貯まる！<br />貯まったポイントをご褒美チケットに交換しよう
          </div>
        </div>

        {/* Chart Card */}
        <div className="col-span-12 md:col-span-8 bg-brand-surface border border-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-display">
              学習成長グラフ
            </span>
            <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-0.5 space-x-0.5">
              <button
                onClick={() => setGraphMode(7)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  graphMode === 7 ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                1週間
              </button>
              <button
                onClick={() => setGraphMode('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  graphMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                全期間
              </button>
            </div>
          </div>

          {/* Chart Wrapper */}
          <div className="h-44 w-full">
            {chartData.length === 0 || !activeCategories.some(cat => chartData.some(d => d[cat] > 0)) ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-600">
                表示する学習データがありません
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ fontSize: '11px', padding: '1px 0' }}
                  />
                  {/* Legend hidden for smaller displays unless there are many items */}
                  {graphMode === 'all' && (
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', bottom: -5 }} />
                  )}
                  {/* Stacked Bars for active categories */}
                  {activeCategories.map((cat, index) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="study"
                      fill={CATEGORY_COLORS[cat] || '#6b7280'}
                      radius={index === activeCategories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-brand-surface border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-display">
          手動で記帳
        </div>
        
        <div className="grid grid-cols-12 gap-2">
          {/* Date Picker */}
          <div className="col-span-6 md:col-span-3 flex items-center bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-2.5 py-1.5 transition-all">
            <Calendar className="w-3.5 h-3.5 text-gray-500 mr-2" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs text-gray-300 outline-none w-full"
            />
          </div>

          {/* Category Picker */}
          <div className="col-span-6 md:col-span-3 flex items-center bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-2.5 py-1.5 transition-all">
            <Tag className="w-3.5 h-3.5 text-gray-500 mr-2" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-xs text-gray-300 outline-none w-full cursor-pointer appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-950 text-gray-300">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Task Description */}
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="摘要（例: 数学1A、読書、映画）"
            className="col-span-8 md:col-span-4 bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-gray-300 outline-none transition-all"
          />

          {/* Amount (pt / minutes) */}
          <div className="col-span-4 md:col-span-2 flex items-center bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1.5">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-transparent text-center text-xs font-bold font-mono text-blue-400 outline-none"
            />
            <span className="text-[10px] text-gray-500 ml-1">分/pt</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDeposit}
            className="flex items-center justify-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>預け入れ (学習を記録)</span>
          </button>
          <button
            onClick={handleWithdraw}
            className="flex items-center justify-center space-x-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>引き出し (ご褒美・消費)</span>
          </button>
        </div>
      </div>

      {/* Classic Passbook Ledger Card */}
      <div className="bg-[#fcf7ec] border border-[#e4d7bf] rounded-2xl shadow-md overflow-hidden text-[#2c3e50] flex flex-col h-[300px]">
        {/* Ledger Header */}
        <div className="bg-[#e9dec9] px-4 py-2 flex items-center justify-between text-[10px] tracking-wider font-bold border-b border-[#d1bfa7]">
          <span>STUDY PASSBOOK LEDGER (学習通帳履歴)</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenExport}
              className="flex items-center space-x-1 bg-[#fcf7ec] hover:bg-[#f4ebd9] text-[#2c3e50] border border-[#d1bfa7] px-2 py-0.5 rounded transition-all cursor-pointer text-[9px]"
              title="バックアップ用にコピー / エクスポート"
            >
              <Download className="w-2.5 h-2.5" />
              <span>エクスポート</span>
            </button>
            <button
              onClick={() => {
                setImportText('');
                setImportError('');
                setIsImportOpen(true);
              }}
              className="flex items-center space-x-1 bg-[#2c3e50] hover:bg-[#1a252f] text-white px-2 py-0.5 rounded transition-all cursor-pointer text-[9px]"
              title="以前の通帳データをインポート"
            >
              <Upload className="w-2.5 h-2.5" />
              <span>インポート</span>
            </button>
            <span className="font-mono text-gray-500">v5.0</span>
          </div>
        </div>

        {/* Table Structure */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full border-collapse font-sans text-xs">
            <thead className="sticky top-0 bg-[#f4ebd9] text-[#5c4a37] text-[10px] font-bold z-10 border-b border-[#e0d2b7]">
              <tr>
                <th className="w-[15%] text-left px-3 py-1.5">日付</th>
                <th className="w-[45%] text-left px-3 py-1.5">摘要</th>
                <th className="w-[20%] text-right px-3 py-1.5">預入/払出 (pt)</th>
                <th className="w-[20%] text-right px-3 py-1.5 pr-4">差引残高 (pt)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-[#dcd1ba]">
              {passbook.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 font-medium">
                    記帳データがありません
                  </td>
                </tr>
              ) : (
                // Render reversely (newest on top) but keep balance calculations ascending
                (() => {
                  let runningBalance = 0;
                  const entriesWithBalance = passbook.map((e) => {
                    runningBalance += e.pt;
                    return { ...e, balance: runningBalance };
                  });

                  const reversed = entriesWithBalance.reverse();
                  const displayed = reversed.slice(0, visibleCount);

                  return (
                    <>
                      {displayed.map((entry) => {
                        const isDeposit = entry.pt > 0;
                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-[#f6eed9] group transition-colors duration-150 relative cursor-pointer"
                            onClick={() => triggerDelete(entry.id)}
                            title="行をクリックして抹消"
                          >
                            <td className="px-3 py-2 text-[10px] font-mono text-[#5c5040]">
                              {entry.date.slice(5)}
                            </td>
                            <td className="px-3 py-2 text-[#2c3e50] font-medium max-w-[200px] truncate">
                              {entry.task}
                            </td>
                            <td className={`px-3 py-2 text-right font-bold font-mono ${
                              isDeposit ? 'text-blue-700' : 'text-red-600'
                            }`}>
                              {isDeposit ? `+${entry.pt}` : entry.pt}
                            </td>
                            <td className="px-3 py-2 text-right font-bold font-mono text-gray-700 pr-4">
                              {entry.balance}
                              {/* Hover Trash trigger */}
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#f6eed9] pl-2">
                                <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {reversed.length > visibleCount && (
                        <tr>
                          <td colSpan={4} className="text-center py-3 bg-[#f4ebd9]/30">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVisibleCount(prev => prev + 50);
                              }}
                              className="text-xs font-bold text-[#5c4a37] hover:text-[#2c3e50] bg-[#e9dec9] hover:bg-[#e0d2b7] border border-[#d1bfa7] px-3 py-1 rounded transition-all cursor-pointer inline-flex items-center space-x-1"
                            >
                              <span>もっと表示する (残り {reversed.length - visibleCount} 件)</span>
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Iframe-safe custom overlay) */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-brand-surface border border-gray-800 rounded-2xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl">
            <div>
              <div className="text-xl">⚠️</div>
              <h3 className="text-sm font-bold text-gray-200 font-display mt-2">記帳を抹消しますか？</h3>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                この通帳履歴を削除すると、差引残高および学習グラフが再計算されます。
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                抹消する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import / Export JSON dialog modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-brand-surface border border-gray-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-gray-200 font-display">通帳データのインポート / エクスポート</h3>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                以前のアプリの「学習通帳」データ（JSON形式の配列）を貼り付けて「復元する」ボタンを押すか、現在のデータをコピーしてバックアップしてください。
              </p>
            </div>

            {importError && (
              <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-2.5 text-red-400 text-[10px] text-center font-semibold">
                ⚠️ {importError}
              </div>
            )}

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"date":"2026-07-20","task":"📖 数学 (20分)","pt":20,"category":"数学"}]'
              className="w-full h-40 bg-gray-900 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-xs text-gray-300 font-mono outline-none resize-none"
            />

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportText('');
                  setImportError('');
                }}
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                閉じる
              </button>
              <button
                onClick={() => {
                  try {
                    setImportError('');
                    if (!importText.trim()) {
                      throw new Error('データが入力されていません。');
                    }
                    const parsed = JSON.parse(importText);
                    if (!Array.isArray(parsed)) {
                      throw new Error('データは配列形式である必要があります。');
                    }
                    
                    const normalized: PassbookEntry[] = parsed.map((item: any, idx: number) => {
                      return {
                        id: item.id || `imported-pb-${idx}-${Date.now()}`,
                        date: item.date || new Date().toISOString().split('T')[0],
                        task: item.task || '',
                        category: item.category || (item.rawTask === '__withdraw__' ? 'ご褒美' : (item.rawTask || 'その他')),
                        pt: typeof item.pt === 'number' ? item.pt : 0
                      };
                    });

                    onImportPassbook(normalized);
                    setIsImportOpen(false);
                    setImportText('');
                    alert('データを正常に復元・インポートしました！');
                  } catch (err: any) {
                    setImportError(err.message || 'JSONデータの解析に失敗しました。形式をもう一度お確かめください。');
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                復元する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
