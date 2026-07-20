import React, { useState, useRef } from 'react';
import { Plus, Trash2, FolderPlus, HelpCircle, Save, Check, RefreshCw } from 'lucide-react';
import { QuestTask } from '../types';

interface BeakerQuestProps {
  quests: QuestTask[];
  gauge: number;
  tickets: number;
  templates: { [name: string]: { name: string; val: number }[] };
  onAddTask: (name: string, val: number) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string, x: number, y: number) => void;
  onAdjustTaskVal: (id: string, delta: number) => void;
  onClearAllQuests: () => void;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (name: string) => void;
  onDeleteTemplate: (name: string) => void;
  onResetGauge: () => void;
  onBulkAdd: (text: string) => void;
}

export default function BeakerQuest({
  quests,
  gauge,
  tickets,
  templates,
  onAddTask,
  onDeleteTask,
  onToggleTask,
  onAdjustTaskVal,
  onClearAllQuests,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onResetGauge,
  onBulkAdd,
}: BeakerQuestProps) {
  const [taskName, setTaskName] = useState('');
  const [taskVal, setTaskVal] = useState(20);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleAdd = () => {
    if (!taskName.trim()) return;
    onAddTask(taskName.trim(), taskVal);
    setTaskName('');
  };

  const handleBulkSubmit = () => {
    if (!bulkInput.trim()) return;
    onBulkAdd(bulkInput);
    setBulkInput('');
    setIsBulkOpen(false);
  };

  const handleSaveTemplateClick = () => {
    const name = prompt('テンプレート名を入力してください:');
    if (name && name.trim()) {
      onSaveTemplate(name.trim());
    }
  };

  // Font scale logic depending on quest count
  const count = quests.length;
  const fontSizeClass = count <= 10 ? 'text-sm' : count <= 15 ? 'text-xs' : 'text-[10px]';
  const paddingClass = count <= 10 ? 'py-3 px-4' : count <= 15 ? 'py-2 px-3' : 'py-1.5 px-2';
  const btnSizeClass = count <= 10 ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Upper Status Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Beaker column */}
        <div className="col-span-4 flex flex-col items-center justify-between bg-brand-surface border border-gray-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold font-display">
            Energy Beaker
          </div>

          {/* Styled Beaker Glass */}
          <div 
            onClick={onResetGauge}
            title="クリックでゲージリセット"
            className="relative w-16 h-48 bg-gray-900 border-2 border-gray-700 hover:border-brand-accent transition-colors duration-200 rounded-b-2xl overflow-hidden cursor-pointer my-2"
          >
            {/* Beaker Liquid with waves/glow */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(56,189,248,0.5)]"
              style={{ height: `${Math.min(gauge, 100)}%` }}
            >
              {/* Liquid surface wave effect */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-cyan-300 opacity-80 animate-pulse" />
              
              {/* Floating Bubbles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute bottom-2 left-3 w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '2s' }} />
                <div className="absolute bottom-8 left-10 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
                <div className="absolute bottom-16 left-6 w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '1.8s' }} />
              </div>
            </div>

            {/* Beaker Reflection line */}
            <div className="absolute top-0 left-2 w-1.5 h-full bg-white/5 pointer-events-none" />

            {/* Beaker Volume Marks */}
            <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-6 pointer-events-none text-[8px] text-gray-600 font-mono">
              <span>- 100</span>
              <span>- 75</span>
              <span>- 50</span>
              <span>- 25</span>
              <span>- 0</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-cyan-400">{gauge}</div>
            <div className="text-[10px] text-gray-500 font-mono">/ 100 %</div>
          </div>
          
          <button 
            onClick={onResetGauge}
            className="text-[9px] text-gray-500 hover:text-red-400 underline transition-colors cursor-pointer mt-1"
          >
            リセット
          </button>
        </div>

        {/* Quests column */}
        <div className="col-span-8 flex flex-col bg-brand-surface border border-gray-800 rounded-2xl p-4 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-display">
              Quest Log ({quests.length})
            </span>
            <button
              onClick={onClearAllQuests}
              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              × 全消去
            </button>
          </div>

          {/* Quest Scroll List */}
          <div 
            ref={listContainerRef}
            className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-[220px] max-h-[280px]"
          >
            {quests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <HelpCircle className="w-8 h-8 text-gray-700 mb-1" />
                <p className="text-xs text-gray-500">タスクがありません。</p>
                <p className="text-[10px] text-gray-600 mt-1">下のフォームから追加するか、テンプレートを選んでください。</p>
              </div>
            ) : (
              quests.map((q) => (
                <div
                  key={q.id}
                  onClick={(e) => {
                    // Prevent trigger when clicking inner buttons
                    if ((e.target as HTMLElement).closest('button')) return;
                    onToggleTask(q.id, e.clientX, e.clientY);
                  }}
                  className={`group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    q.done 
                      ? 'border-blue-500/30 bg-blue-500/5' 
                      : 'border-gray-800 hover:border-gray-700 bg-gray-900/40'
                  }`}
                >
                  <div className={`flex items-center justify-between ${paddingClass} transition-opacity duration-300 ${q.done ? 'opacity-30' : ''}`}>
                    {/* Task Title */}
                    <div className="flex-1 min-width-0 pr-2">
                      <div className={`font-medium ${fontSizeClass} truncate text-gray-200`}>
                        {q.name}
                      </div>
                    </div>

                    {/* Controls & Value */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <button
                          disabled={q.done}
                          onClick={() => onAdjustTaskVal(q.id, -5)}
                          className={`flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700 disabled:opacity-30 ${btnSizeClass} transition-colors`}
                        >
                          -
                        </button>
                        <span className={`font-bold font-mono text-blue-400 text-center min-w-[20px] ${fontSizeClass}`}>
                          {q.val}
                        </span>
                        <span className="text-[10px] text-gray-600">%</span>
                        <button
                          disabled={q.done}
                          onClick={() => onAdjustTaskVal(q.id, 5)}
                          className={`flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700 disabled:opacity-30 ${btnSizeClass} transition-colors`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onDeleteTask(q.id)}
                        className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Absolute CLEAR stamp wrapper */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className={`border-2 border-blue-500 text-blue-500 text-[10px] font-bold tracking-widest px-3 py-1 rounded bg-brand-bg/95 transition-all duration-300 transform ${
                          q.done ? 'scale-100 rotate-[-8deg] opacity-100' : 'scale-150 rotate-0 opacity-0'
                        }`}
                      >
                        CLEAR
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Input panel at bottom of BeakerQuest */}
      <div className="bg-brand-surface border border-gray-800 rounded-2xl p-4 space-y-3">
        {/* Quick template chip area */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 overflow-x-auto custom-scrollbar flex space-x-1.5 py-1">
            {Object.keys(templates).length === 0 ? (
              <span className="text-[10px] text-gray-600 py-1">テンプレートがありません。「リスト保存」で登録できます</span>
            ) : (
              Object.keys(templates).map((name) => (
                <div
                  key={name}
                  className="flex items-center space-x-1.5 bg-gray-800 hover:border-gray-600 border border-gray-700 rounded-full px-2.5 py-1 text-[10px] text-gray-300 transition-colors flex-shrink-0 cursor-pointer"
                >
                  <span onClick={() => onLoadTemplate(name)}>{name}</span>
                  <button
                    onClick={() => onDeleteTemplate(name)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Row */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="新しいタスクを入力..."
            className="flex-1 bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none transition-all"
          />
          <div className="relative flex items-center bg-gray-900 border border-gray-800 rounded-xl px-2.5">
            <input
              type="number"
              value={taskVal}
              onChange={(e) => setTaskVal(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-10 bg-transparent text-center text-xs font-bold font-mono text-blue-400 outline-none"
            />
            <span className="text-[10px] text-gray-600 ml-1">%</span>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-2.5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveTemplateClick}
            className="flex items-center justify-center space-x-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl py-2 text-[11px] font-medium text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>リストをテンプレート保存</span>
          </button>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center justify-center space-x-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl py-2 text-[11px] font-medium text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>タスクを一括追加</span>
          </button>
        </div>
      </div>

      {/* Bulk Add Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-brand-surface border border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-gray-200 font-display">タスク一括追加 (1行に1タスク)</h3>
              <p className="text-[10px] text-gray-500 mt-1">「タスク名, %」の形式で記述します。%を省略した場合は一律10%になります。</p>
            </div>
            
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="例:&#10;英語長文,20&#10;ドイツ語単語,15&#10;数学,25"
              className="w-full h-36 bg-gray-900 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-xs text-gray-200 font-mono outline-none resize-none"
            />

            <div className="flex space-x-2">
              <button
                onClick={() => setIsBulkOpen(false)}
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-2 text-xs transition-colors cursor-pointer"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
