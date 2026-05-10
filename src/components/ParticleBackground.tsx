import { useMemo } from 'react';

const COLOR = '#00E5CC';

interface Dot {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  animClass: string;
  delay: number;
  duration: number;
}

function generateDots(count: number): Dot[] {
  const anims = ['particle-float-1', 'particle-float-2', 'particle-float-3', 'particle-float-4', 'particle-float-5', 'particle-float-6', 'particle-float-7', 'particle-float-8'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() > 0.6 ? 10 + Math.random() * 10 : 4 + Math.random() * 6,
    color: COLOR,
    animClass: anims[i % anims.length],
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 6,
  }));
}

export function ParticleBackground() {
  const dots = useMemo(() => generateDots(22), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Mesh grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,204,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,204,0.35) 1px, transparent 1px)
          `,
          backgroundSize: '55px 55px',
        }}
      />

      {/* Floating glowing dots — CSS animations */}
      {dots.map((d) => (
        <div
          key={d.id}
          className={`absolute rounded-full ${d.animClass}`}
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
            opacity: 0.12,
            boxShadow: `0 0 ${d.size / 2}px ${d.size / 4}px ${d.color}`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}

      {/* Aurora bands */}
      <div
        className="absolute w-[600px] h-[300px] rounded-full aurora-band-1"
        style={{
          background: 'linear-gradient(90deg, #00E5CC, transparent)',
          filter: 'blur(60px)',
          opacity: 0.08,
          top: '5%',
          left: '-30%',
        }}
      />
      <div
        className="absolute w-[500px] h-[250px] rounded-full aurora-band-2"
        style={{
          background: 'linear-gradient(270deg, #00E5CC, transparent)',
          filter: 'blur(50px)',
          opacity: 0.06,
          bottom: '5%',
          right: '-25%',
        }}
      />

      <style>{`
        .particle-float-1 { animation: particle1 ease-in-out infinite; }
        .particle-float-2 { animation: particle2 ease-in-out infinite; }
        .particle-float-3 { animation: particle3 ease-in-out infinite; }
        .particle-float-4 { animation: particle4 ease-in-out infinite; }
        .particle-float-5 { animation: particle5 ease-in-out infinite; }
        .particle-float-6 { animation: particle6 ease-in-out infinite; }
        .particle-float-7 { animation: particle7 ease-in-out infinite; }
        .particle-float-8 { animation: particle8 ease-in-out infinite; }

        @keyframes particle1 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.2; }
          50% { transform: translate(30px,-20px) scale(1.3); opacity: 0.4; }
        }
        @keyframes particle2 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.2; }
          50% { transform: translate(-25px,35px) scale(1.2); opacity: 0.35; }
        }
        @keyframes particle3 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.25; }
          50% { transform: translate(40px,15px) scale(1.25); opacity: 0.4; }
        }
        @keyframes particle4 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.2; }
          50% { transform: translate(-30px,-25px) scale(1.35); opacity: 0.45; }
        }
        @keyframes particle5 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.22; }
          50% { transform: translate(20px,30px) scale(1.2); opacity: 0.38; }
        }
        @keyframes particle6 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.2; }
          50% { transform: translate(-20px,-35px) scale(1.3); opacity: 0.4; }
        }
        @keyframes particle7 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.25; }
          50% { transform: translate(35px,25px) scale(1.25); opacity: 0.4; }
        }
        @keyframes particle8 {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.2; }
          50% { transform: translate(-35px,10px) scale(1.2); opacity: 0.35; }
        }

        .aurora-band-1 { animation: aurora1 15s ease-in-out infinite; }
        .aurora-band-2 { animation: aurora2 18s ease-in-out infinite; }

        @keyframes aurora1 {
          0%, 100% { transform: translate(0,0); }
          33% { transform: translate(80px,40px); }
          66% { transform: translate(40px,-30px); }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(0,0); }
          33% { transform: translate(-60px,-50px); }
          66% { transform: translate(-30px,30px); }
        }
      `}</style>
    </div>
  );
}
