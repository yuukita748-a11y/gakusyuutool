import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  rotationSpeed: number;
  horizontalVelocity: number;
  fallSpeed: number;
  shape: 'circle' | 'square';
}

interface ConfettiProps {
  trigger: boolean;
  onComplete: () => void;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#a78bfa', '#f472b6', '#06b6d4'];

export default function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: 80 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100, // percentage of screen width
      y: -10 - Math.random() * 20, // initial top
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      horizontalVelocity: (Math.random() - 0.5) * 1.5,
      fallSpeed: 1.5 + Math.random() * 2.5,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }));

    setParticles(newParticles);

    // Animation Loop
    let animationFrameId: number;
    const startTime = Date.now();

    const updateParticles = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 3000) {
        setParticles([]);
        onComplete();
        return;
      }

      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.fallSpeed,
            x: p.x + p.horizontalVelocity + Math.sin(p.y / 15) * 0.2, // weave left and right
            angle: p.angle + p.rotationSpeed,
          }))
          .filter((p) => p.y < 110) // Keep particles inside viewport height
      );

      animationFrameId = requestAnimationFrame(updateParticles);
    };

    animationFrameId = requestAnimationFrame(updateParticles);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            transform: `rotate(${p.angle}deg)`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
