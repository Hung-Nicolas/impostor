import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronUp, Lightbulb, ChevronRight, Lock } from 'lucide-react';
import { QuitGameButton } from '@/components/QuitGameButton';
import { useGameStore } from '@/stores/gameStore';
import { useAnimDelay } from '@/lib/animations';
import { useSettingsStore } from '@/stores/settingsStore';

type RevealState = 'locked' | 'revealed';

export function RevealScreen() {
  const navigate = useNavigate();
  const { players, currentRevealIndex, setRevealIndex, roundNumber, startDiscussion } = useGameStore();
  const d = useAnimDelay();
  const { animationsEnabled } = useSettingsStore();
  const [state, setState] = useState<RevealState>('locked');
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(0);

  const activePlayers = players.filter((p) => p.active);
  const player = activePlayers[currentRevealIndex];

  // Medir altura del contenedor
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setPanelH(Math.round(containerRef.current.offsetHeight * 0.75));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, -panelH * 0.6], [1, 0]);
  const scale = useTransform(y, [0, -panelH * 0.6], [1, 0.92]);

  const handleReveal = useCallback(() => {
    if (!panelH) return;
    animate(y, -panelH, {
      type: 'spring',
      stiffness: 300,
      damping: 32,
      onComplete: () => setState('revealed'),
    });
  }, [panelH, y]);

  const handleNext = useCallback(() => {
    if (currentRevealIndex < activePlayers.length - 1) {
      setRevealIndex(currentRevealIndex + 1);
      y.set(0);
      setState('locked');
    } else {
      startDiscussion();
      navigate('/discussion');
    }
  }, [currentRevealIndex, players.length, setRevealIndex, startDiscussion, navigate, y]);

  const isLastPlayer = currentRevealIndex >= activePlayers.length - 1;

  const onDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
      const threshold = panelH * 0.35;
      if (info.offset.y < -threshold || info.velocity.y < -400) {
        handleReveal();
      } else {
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    },
    [panelH, y, handleReveal]
  );

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <p className="text-[#8A8A9A] mb-6 text-center">No hay jugadores configurados para esta partida.</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/setup')}
            className="bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold text-lg rounded-2xl py-4 px-8 shadow-[0_4px_20px_rgba(0,229,204,0.25)]"
          >
            CONFIGURAR JUGADORES
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center h-full relative overflow-hidden select-none"
      style={{ background: 'var(--bg-primary)' }}
    >
      <QuitGameButton />

      {/* Round badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-1.5 z-30">
        <p className="text-xs text-[#8A8A9A]">
          Ronda <span className="text-[#00E5CC] font-bold">{roundNumber}</span>
        </p>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
        {activePlayers.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentRevealIndex ? 'bg-[#00E5CC] w-4' : i === currentRevealIndex ? 'bg-[#00E5CC] w-6' : 'bg-[#1E1E2A] w-1.5'
            }`}
          />
        ))}
      </div>

      {/* === 3/4 SUPERIOR: TOP SHEET que tapa la palabra === */}
      <div className="h-[75%] w-full relative">
        {/* PALABRA (renderizada debajo del panel) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-8 z-10">
          <AnimatePresence mode="wait">
            {state === 'revealed' && (
              <motion.div
                key={`word-${currentRevealIndex}`}
                className="flex flex-col items-center w-full max-w-sm"
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              >
                <div
                  className={`w-full rounded-3xl p-7 text-center relative overflow-hidden mb-6 ${
                    player.isImpostor
                      ? 'bg-gradient-to-b from-[rgba(255,77,138,0.15)] to-[#14141C] border border-[rgba(255,77,138,0.18)]'
                      : 'bg-gradient-to-b from-[rgba(0,229,204,0.15)] to-[#14141C] border border-[rgba(0,229,204,0.18)]'
                  }`}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                      background: player.isImpostor
                        ? 'radial-gradient(circle at 50% 20%, rgba(255,77,138,0.2), transparent 60%)'
                        : 'radial-gradient(circle at 50% 20%, rgba(0,229,204,0.15), transparent 60%)',
                    }}
                  />

                  {player.isImpostor ? (
                    <>
                      <div className="relative inline-block bg-[rgba(255,77,138,0.15)] border border-[rgba(255,77,138,0.25)] rounded-full px-4 py-1 mb-4">
                        <span className="text-[11px] font-bold text-[#FF4D8A] tracking-widest">SOS EL IMPOSTOR</span>
                      </div>
                      <h1
                        className="text-4xl font-extrabold text-[#F0F0F5] mb-1 relative"
                        style={{ textShadow: '0 0 25px rgba(255,77,138,0.25)' }}
                      >
                        {player.word}
                      </h1>
                      <div className="flex items-center justify-center gap-1.5 mt-3 relative">
                        <Lightbulb size={12} className="text-[#FFB800]" />
                        <span className="text-sm text-[#FFB800]">
                          Pista: {player.impostorHint || 'Sin pistas'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A8A9A] mt-3 relative">
                        Los demas tienen otra palabra
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="relative inline-block bg-[rgba(0,229,204,0.12)] border border-[rgba(0,229,204,0.2)] rounded-full px-4 py-1 mb-4">
                        <span className="text-[11px] font-bold text-[#00E5CC] tracking-widest">TU PALABRA</span>
                      </div>
                      <h1
                        className="text-5xl font-extrabold text-[#F0F0F5] mb-1 relative"
                        style={{ textShadow: '0 0 25px rgba(0,229,204,0.2)' }}
                      >
                        {player.word}
                      </h1>
                      <p className="text-xs text-[#8A8A9A] mt-3 relative">
                        Memoriza y no te descubran
                      </p>
                    </>
                  )}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: d(0.3), duration: animationsEnabled ? undefined : 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,229,204,0.25)]"
                >
                  {isLastPlayer ? (
                    <>A DISCUTIR <ChevronRight size={20} /></>
                  ) : (
                    <>SIGUIENTE JUGADOR <ChevronRight size={20} /></>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TOP SHEET: panel deslizable que tapa el 3/4 superior */}
        {state === 'locked' && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center rounded-b-[32px]"
            style={{
              background: 'linear-gradient(180deg, #0F0F16 0%, #14141C 40%, #1A1A24 100%)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(255,255,255,0.04)',
              y,
              opacity,
              scale,
            }}
            drag="y"
            dragConstraints={{ top: -panelH, bottom: 0 }}
            dragElastic={0.06}
            onDragEnd={onDragEnd}
          >
            {/* Handle pill abajo del panel */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="w-16 h-2 bg-[#3A3A4A] rounded-full" />
            </div>

            {/* Contenido del panel centrado */}
            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 pointer-events-none">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-[#1E1E2A] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                animate={animationsEnabled ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: animationsEnabled ? 2.2 : 0, repeat: animationsEnabled ? Infinity : 0 }}
              >
                <Lock size={32} className="text-[#8A8A9A]" />
              </motion.div>

              <p className="text-xl font-bold text-[#F0F0F5] mb-1">Desliza hacia arriba</p>
              <p className="text-sm text-[#8A8A9A] mb-10">para revelar tu palabra</p>

              <motion.div
                className="flex flex-col items-center gap-3"
                animate={animationsEnabled ? { y: [0, -12, 0] } : {}}
                transition={{ duration: animationsEnabled ? 1.8 : 0, repeat: animationsEnabled ? Infinity : 0, ease: 'easeInOut' }}
              >
                <div className="w-16 h-16 rounded-full border-2 border-[rgba(0,229,204,0.3)] flex items-center justify-center bg-[rgba(0,229,204,0.08)] shadow-[0_0_20px_rgba(0,229,204,0.1)]">
                  <ChevronUp size={32} className="text-[#00E5CC]" />
                </div>
                <p className="text-xs text-[#5A5A6A]">Toca o desliza para revelar</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* === 1/4 INFERIOR: info del jugador SIEMPRE visible === */}
      <div className="h-[25%] w-full flex flex-col items-center justify-center z-10">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3"
          style={{
            background: player.avatarColor,
            boxShadow: `0 0 30px ${player.avatarColor}30`,
          }}
          animate={animationsEnabled ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: animationsEnabled ? 2 : 0, repeat: animationsEnabled ? Infinity : 0, ease: 'easeInOut' }}
          key={`avatar-${currentRevealIndex}`}
        >
          {player.name.charAt(0).toUpperCase()}
        </motion.div>
        <h2 className="text-xl font-bold text-[#F0F0F5]">{player.name}</h2>
      </div>
    </div>
  );
}
