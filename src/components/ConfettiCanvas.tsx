import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  life: number;
  maxLife: number;
}

const COLORS = ['#00E5CC', '#FF4D8A', '#FFB800', '#8B5CF6', '#22C55E'];

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  const createParticles = useCallback((count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * w * 0.2,
        y: cy + (Math.random() - 0.5) * h * 0.1,
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * -15 - 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        life: 0,
        maxLife: 2.5 + Math.random() * 1,
      });
    }
  }, []);

  const trigger = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = [];
    createParticles(100);
    activeRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    animate();
  }, [createParticles]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dt = 1 / 60;
    let alive = false;

    particlesRef.current.forEach((p) => {
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.opacity = Math.max(0, 1 - (p.life - p.maxLife) / 0.5);
      }
      if (p.opacity <= 0) return;
      alive = true;

      p.vy += 0.4;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });

    particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0);

    if (alive) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      activeRef.current = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { canvasRef, trigger };
}

export function ConfettiCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[150]"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
