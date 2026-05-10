import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, User } from 'lucide-react';
import { QuitGameButton } from '@/components/QuitGameButton';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function DiscussionScreen() {
  const navigate = useNavigate();
  const { timeRemaining, tickTimer, phase: gamePhase, roundNumber, players, currentVoterIndex } = useGameStore();
  const { vibrationEnabled, vibrationSupported, animationsEnabled } = useSettingsStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNavigated = useRef(false);

  const activePlayers = players.filter((p) => !p.eliminated && p.active);
  const starter = activePlayers[currentVoterIndex] || activePlayers[0];

  const goToAccusation = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if (vibrationEnabled && vibrationSupported) navigator.vibrate([200, 100, 200]);
    navigate('/acusar');
  }, [navigate, vibrationEnabled, vibrationSupported]);

  useEffect(() => {
    if (gamePhase !== 'discussion') { navigate('/'); return; }
    intervalRef.current = setInterval(() => {
      const state = useGameStore.getState();
      if (state.timeRemaining <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        goToAccusation();
      } else {
        tickTimer();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gamePhase, navigate, tickTimer, goToAccusation]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const totalTime = Math.max(60, activePlayers.length * 25);
  const progress = timeRemaining / totalTime;
  const dashOffset = circumference * (1 - progress);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isLow = timeRemaining <= 30;
  const isCritical = timeRemaining <= 10;
  const progressColor = isCritical ? '#EF4444' : isLow ? '#FF4D8A' : '#00E5CC';
  const trackColor = isCritical ? 'rgba(239,68,68,0.3)' : isLow ? 'rgba(255,77,138,0.3)' : 'rgba(30,30,42,0.5)';

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 relative select-none" style={{ background: 'var(--bg-primary)' }}>
      <QuitGameButton />

      {/* Round badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-1.5 z-10">
        <p className="text-xs text-[#8A8A9A]">Ronda <span className="text-[#00E5CC] font-bold">{roundNumber}</span></p>
      </div>

      {/* Timer */}
      <div className="relative mb-10">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke={trackColor} strokeWidth="5" />
          <motion.circle
            cx="70" cy="70" r={radius} fill="none" stroke={progressColor} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circumference}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: animationsEnabled ? 1 : 0, ease: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono-game text-5xl font-bold text-[#F0F0F5] tabular-nums"
            animate={isCritical && animationsEnabled ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: animationsEnabled ? 0.3 : 0, repeat: animationsEnabled ? Infinity : 0 }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.span>
        </div>
      </div>

      {starter && (
        <motion.div
          className="flex items-center gap-3 bg-[#1E1E2A] border border-[rgba(0,229,204,0.15)] rounded-2xl px-5 py-3 mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationsEnabled ? 0.15 : 0, duration: animationsEnabled ? undefined : 0 }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: starter.avatarColor, boxShadow: `0 0 12px ${starter.avatarColor}30` }}
          >
            {starter.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-[#5A5A6A]">Empieza</p>
            <p className="text-sm font-bold text-[#00E5CC]">{starter.name}</p>
          </div>
          <User size={16} className="text-[#00E5CC] ml-auto" />
        </motion.div>
      )}

      <motion.h2 className="text-3xl font-extrabold text-[#F0F0F5] mb-3 text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: animationsEnabled ? undefined : 0 }}>
        Debatan
      </motion.h2>

      <motion.p className="text-sm text-[#8A8A9A] text-center max-w-[260px] mb-2 leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: animationsEnabled ? 0.2 : 0, duration: animationsEnabled ? undefined : 0 }}>
        Encuentren al impostor
      </motion.p>

      <motion.p className="text-xs text-[#5A5A6A] text-center mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: animationsEnabled ? 0.3 : 0, duration: animationsEnabled ? undefined : 0 }}>
        {activePlayers.length} jugadores activos
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationsEnabled ? 0.4 : 0, duration: animationsEnabled ? undefined : 0 }}
        whileTap={{ scale: 0.97 }}
        onClick={goToAccusation}
        className="w-full max-w-xs bg-gradient-to-r from-[#FF4D8A] to-[#EC4899] text-white font-bold text-lg rounded-2xl py-4.5 flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,77,138,0.3)]"
      >
        <Swords size={20} />
        ACUSAR
      </motion.button>

    </div>
  );
}
