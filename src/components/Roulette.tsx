import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Settings, Plus, X, Check, Eye, EyeOff } from 'lucide-react';
import { RouletteState } from '../types';

interface RouletteProps {
  roulette: {
    a: RouletteState;
    b: RouletteState;
    c: RouletteState;
  };
  onMarkDone: (mode: 'a' | 'b' | 'c', task: string, points: number) => void;
  onAddTask: (mode: 'a' | 'b' | 'c', task: string) => void;
  onDeleteTask: (mode: 'a' | 'b' | 'c', index: number) => void;
  onResetMode: (mode: 'a' | 'b' | 'c') => void;
}

const MODE_LABELS = {
  a: 'Aモード (ベーシック)',
  b: 'Bモード (アドバンス)',
  c: 'Cモード (ショートカット)',
};

// Mode customized colors
const MODE_COLORS = {
  a: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e3a8a', '#29487d', '#102a43', '#486581'],
  b: ['#065f46', '#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#022c22', '#14532d', '#166534', '#3f6212'],
  c: ['#9a3412', '#ea580c', '#f97316', '#fb923c', '#ffedd5', '#c2410c', '#7c2d12', '#431407', '#5f370e', '#78350f'],
};

export default function Roulette({
  roulette,
  onMarkDone,
  onAddTask,
  onDeleteTask,
  onResetMode,
}: RouletteProps) {
  const [currentMode, setCurrentMode] = useState<'a' | 'b' | 'c'>('a');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [resultPoints, setResultPoints] = useState(20);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const activeTasks = roulette[currentMode].tasks.filter(
    (t) => !roulette[currentMode].done.includes(t)
  );

  // Colors
  const colors = MODE_COLORS[currentMode];

  // Draw the wheel
  const drawWheel = (highlightIndex = -1, rotation = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = (size / 2) - 10;

    ctx.clearRect(0, 0, size, size);

    if (activeTasks.length === 0) {
      // Draw placeholder
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1f2937';
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('タスクがありません', cx, cy);
      return;
    }

    const slice = (Math.PI * 2) / activeTasks.length;

    activeTasks.forEach((label, i) => {
      const s = rotation + i * slice - Math.PI / 2;
      const e = s + slice;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, s, e);
      ctx.closePath();

      // Highlight coloring
      if (highlightIndex === i) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = colors[i % colors.length];
      }
      ctx.fill();

      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label text inside slice
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(s + slice / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      if (highlightIndex === i) {
        ctx.fillStyle = '#090d16';
      } else {
        ctx.fillStyle = '#ffffff';
      }

      // Dynamically adjust text size based on segment count
      const fontSize = activeTasks.length > 10 ? 11 : activeTasks.length > 6 ? 13 : 15;
      ctx.font = `bold ${fontSize}px sans-serif`;
      
      // Shadow
      if (highlightIndex !== i) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
      }

      // Check long task texts
      let displayLabel = label;
      if (displayLabel.length > 8) {
        displayLabel = displayLabel.slice(0, 7) + '..';
      }

      ctx.fillText(displayLabel, r - 15, 0);
      ctx.restore();
    });

    // Center pin / circle
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  // Redraw when state updates
  useEffect(() => {
    drawWheel();
  }, [activeTasks.length, currentMode, roulette]);

  // Spin function
  const handleSpin = () => {
    if (isSpinning || activeTasks.length === 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setSelectedTask(null);

    const targetIndex = Math.floor(Math.random() * activeTasks.length);
    const slice = (Math.PI * 2) / activeTasks.length;
    
    // Calculate angle that places selected task right under the arrow (at the top: -PI/2)
    const baseAngle = -(targetIndex * slice + slice / 2);
    const extraRotations = (6 + Math.floor(Math.random() * 4)) * Math.PI * 2;
    const totalRotation = extraRotations + baseAngle;

    const duration = 4000; // ms
    const startTime = performance.now();

    const easeOutQuad = (t: number) => t * (2 - t);
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      const easedT = easeOutQuart(t);
      const currentRotation = totalRotation * easedT;
      rotationRef.current = currentRotation;

      drawWheel(-1, currentRotation);

      if (t < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Spin finished
        setIsSpinning(false);
        const finalSelected = activeTasks[targetIndex];
        setSelectedTask(finalSelected);
        setResultPoints(20); // Default to 20pt on finish
        setShowResult(true);
        drawWheel(targetIndex, totalRotation);
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleMarkDone = () => {
    if (!selectedTask) return;
    onMarkDone(currentMode, selectedTask, resultPoints);
    setShowResult(false);
    setSelectedTask(null);
  };

  const handleReroll = () => {
    setShowResult(false);
    setSelectedTask(null);
    // Let event loop run to close the card then spin again
    setTimeout(() => {
      handleSpin();
    }, 100);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    onAddTask(currentMode, newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Mode selectors */}
      <div className="grid grid-cols-3 gap-2">
        {(['a', 'b', 'c'] as const).map((m) => {
          const isActive = currentMode === m;
          const activeClass =
            m === 'a'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : m === 'b'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-orange-500 text-orange-400 bg-orange-500/10';

          return (
            <button
              key={m}
              onClick={() => {
                if (isSpinning) return;
                setCurrentMode(m);
                setShowResult(false);
                setSelectedTask(null);
              }}
              className={`py-2 px-1 text-xs font-bold border rounded-xl transition-all duration-200 cursor-pointer text-center ${
                isActive ? activeClass : 'border-gray-800 text-gray-500 bg-gray-900/40 hover:border-gray-700'
              }`}
            >
              {m.toUpperCase()}モード
            </button>
          );
        })}
      </div>

      {/* Header bar inside Roulette */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold font-display">
          {MODE_LABELS[currentMode]}
        </span>
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{showEdit ? '閉じる' : 'タスク編集'}</span>
        </button>
      </div>

      {/* Main Wheel View & Status */}
      {!showEdit ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-2">
          {/* Status badge above wheel */}
          <div className="text-[11px] tracking-wider text-gray-400 font-medium">
            {isSpinning 
              ? '選別中...' 
              : activeTasks.length === 0 
              ? '全ミッション完了！🎉' 
              : 'ルーレットを回して勉強しよう！'}
          </div>

          {/* Wheel Frame */}
          <div className="relative w-72 h-72">
            {/* The pointer Arrow */}
            <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[18px] border-t-red-500 z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse" />

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={576}
              height={576}
              className="w-72 h-72 rounded-full"
            />

            {/* Inner spin button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || activeTasks.length === 0}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-950 text-white rounded-full border-2 border-gray-800 hover:border-brand-accent hover:text-brand-accent disabled:opacity-40 disabled:border-gray-800 disabled:text-gray-500 flex flex-col items-center justify-center transition-all duration-200 z-10 font-bold shadow-lg"
            >
              <Play className="w-4 h-4 mb-0.5 fill-current" />
              <span className="text-[9px] uppercase tracking-wider">Spin</span>
            </button>
          </div>

          {/* Badges of current mode's progress */}
          <div className="w-full max-w-sm flex flex-wrap gap-1.5 justify-center overflow-y-auto max-h-[80px] custom-scrollbar px-2">
            {roulette[currentMode].tasks.map((task) => {
              const isDone = roulette[currentMode].done.includes(task);
              return (
                <span
                  key={task}
                  className={`text-[9px] px-2 py-1 rounded-full border transition-all ${
                    isDone
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-gray-600 line-through'
                      : 'border-gray-800 bg-gray-900/60 text-gray-300'
                  }`}
                >
                  {isDone && '✓ '}{task}
                </span>
              );
            })}
          </div>

          {/* All Clear message */}
          {activeTasks.length === 0 && (
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 text-center w-full max-w-xs animate-pulse">
              <div className="text-xl">🏆</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">ALL CLEAR!</div>
              <p className="text-[10px] text-gray-500 mt-1">このモードの全課題を制覇しました。</p>
              <button
                onClick={() => onResetMode(currentMode)}
                className="mt-3 inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>進捗リセット</span>
              </button>
            </div>
          )}

          {/* Result Overlay Card */}
          {showResult && selectedTask && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40">
              <div className="relative bg-brand-surface border border-gray-800 rounded-2xl max-w-xs w-full p-6 text-center space-y-5 shadow-2xl animate-stamp-in">
                {/* Close Button (X) */}
                <button
                  onClick={() => {
                    setShowResult(false);
                    setSelectedTask(null);
                  }}
                  className="absolute top-3 right-3 text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800/80 transition-all cursor-pointer"
                  title="閉じる"
                >
                  <X className="w-4 h-4" />
                </button>

                <div>
                  <div className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">ルーレット結果</div>
                  <div className="text-xl font-bold text-gray-100 font-display mt-2 line-clamp-2 leading-relaxed">
                    {selectedTask}
                  </div>
                </div>

                {/* Points Adjuster */}
                <div className="flex flex-col space-y-1.5 bg-gray-900/60 border border-gray-800/80 rounded-xl p-2.5">
                  <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">獲得pt調整</div>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => setResultPoints(p => Math.max(5, p - 5))}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={resultPoints}
                      onChange={(e) => setResultPoints(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 bg-transparent text-center font-bold text-sm text-blue-400 outline-none"
                    />
                    <span className="text-[10px] text-gray-500 font-bold">pt</span>
                    <button
                      onClick={() => setResultPoints(p => p + 5)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 bg-gray-900 border border-gray-800 rounded-lg p-2 leading-normal">
                  完了するとビーカーゲージが<span className="text-blue-400 font-bold">{resultPoints}%</span>増え、学習通帳に<span className="text-blue-400 font-bold">{resultPoints}pt</span>貯まります！
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleReroll}
                    className="flex-1 bg-gray-900 border border-gray-800 hover:text-gray-200 text-gray-400 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    リロール
                  </button>
                  <button
                    onClick={handleMarkDone}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ やった！</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit Panel */
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-4 flex flex-col h-[340px]">
          <div className="text-xs text-gray-400 font-bold mb-2">
            課題一覧
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 mb-3">
            {roulette[currentMode].tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-gray-600">
                登録課題がありません。
              </div>
            ) : (
              roulette[currentMode].tasks.map((task, idx) => {
                const isDone = roulette[currentMode].done.includes(task);
                return (
                  <div
                    key={task + idx}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs"
                  >
                    <span className={`text-gray-300 ${isDone ? 'line-through text-gray-600' : ''}`}>
                      {task}
                    </span>
                    <button
                      onClick={() => onDeleteTask(currentMode, idx)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom actions in Edit panel */}
          <div className="space-y-2">
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="追加する課題..."
                className="flex-1 bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none transition-all"
              />
              <button
                onClick={handleAddTask}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 hover:text-white rounded-xl px-3 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm('本当にこのモードの進捗を最初からやり直しますか？')) {
                  onResetMode(currentMode);
                }
              }}
              className="w-full bg-gray-900/60 hover:bg-red-950/20 border border-gray-800 hover:border-red-900/40 text-[10px] text-gray-500 hover:text-red-400 rounded-xl py-2 transition-all cursor-pointer"
            >
              ↺ このモードの進捗をリセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
