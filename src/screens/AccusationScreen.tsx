import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Skull, UserX } from 'lucide-react';
import { QuitGameButton } from '@/components/QuitGameButton';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function AccusationScreen() {
  const navigate = useNavigate();
  const { players, castVote, nextRound, startDiscussion, roundNumber } = useGameStore();
  const { vibrationEnabled, vibrationSupported, animationsEnabled } = useSettingsStore();

  const [confirming, setConfirming] = useState<number | null>(null);
  const [eliminating, setEliminating] = useState<{ name: string; wasImpostor: boolean } | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Set phase to voting when this screen mounts
  useEffect(() => {
    useGameStore.setState({ phase: 'voting' });
  }, []);

  const activePlayers = players.filter((p) => !p.eliminated && p.active);

  const handleAccuse = (votedIdx: number) => setConfirming(votedIdx);

  const confirmAccuse = () => {
    if (confirming === null || isVoting) return;
    setIsVoting(true);
    const votedIdx = confirming;
    setConfirming(null);

    const res = castVote(0, votedIdx);

    if (res.gameOver) {
      if (vibrationEnabled && vibrationSupported) navigator.vibrate([150, 50, 150, 50, 300]);
      setEliminating({ name: res.eliminatedName || '', wasImpostor: res.wasImpostor || false });
      setTimeout(() => navigate('/results'), animationsEnabled ? 2800 : 0);
    } else {
      if (vibrationEnabled && vibrationSupported) navigator.vibrate([80, 40, 80]);
      setEliminating({ name: res.eliminatedName || '', wasImpostor: false });
      setTimeout(() => {
        setEliminating(null);
        setIsVoting(false);
        nextRound();
        startDiscussion();
        navigate('/discussion');
      }, animationsEnabled ? 2200 : 0);
    }
  };

  // Dramatic elimination
  if (eliminating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 select-none" style={{ background: 'var(--bg-primary)' }}>
        <AnimatePresence>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} transition={animationsEnabled ? { type: 'spring', stiffness: 200, damping: 15 } : { duration: 0 }} className="text-center">
            {eliminating.wasImpostor ? (
              <>
                <motion.div animate={animationsEnabled ? { rotate: [0, -8, 8, -4, 4, 0] } : {}} transition={{ duration: animationsEnabled ? 0.5 : 0 }}>
                  <Skull size={60} className="text-[#FF4D8A] mx-auto mb-5" />
                </motion.div>
                <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: animationsEnabled ? 0.2 : 0, duration: animationsEnabled ? undefined : 0 }} className="text-3xl font-extrabold text-[#FF4D8A] mb-2" style={{ textShadow: '0 0 20px rgba(255,77,138,0.4)' }}>
                  ¡IMPOSOR ENCONTRADO!
                </motion.h2>
                <p className="text-lg text-[#F0F0F5] font-semibold">{eliminating.name}</p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: animationsEnabled ? 0.5 : 0, duration: animationsEnabled ? undefined : 0 }} className="text-sm text-[#22C55E] mt-3 font-medium">
                  La partida termina
                </motion.p>
              </>
            ) : (
              <>
                <motion.div animate={animationsEnabled ? { y: [0, -12, 0], rotate: [0, 5, -5, 0] } : {}} transition={{ duration: animationsEnabled ? 0.4 : 0 }}>
                  <UserX size={52} className="text-[#FFB800] mx-auto mb-5" />
                </motion.div>
                <h2 className="text-2xl font-bold text-[#FFB800] mb-2">Eliminado</h2>
                <p className="text-lg text-[#F0F0F5]">{eliminating.name}</p>
                <p className="text-sm text-[#8A8A9A] mt-3">No era el impostor...</p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: animationsEnabled ? 0.8 : 0, duration: animationsEnabled ? undefined : 0 }} className="text-sm text-[#5A5A6A] mt-1">Siguiente ronda</motion.p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 pt-10 pb-6 select-none" style={{ background: 'var(--bg-primary)' }}>
      <QuitGameButton />

      {/* Round badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-1.5">
        <p className="text-xs text-[#8A8A9A]">Ronda <span className="text-[#00E5CC] font-bold">{roundNumber}</span> — Acusacion</p>
      </div>

      <h1 className="text-3xl font-extrabold text-[#F0F0F5] text-center mb-1 mt-4">
        ¿A quien
      </h1>
      <h1 className="text-3xl font-extrabold text-[#FF4D8A] text-center mb-2" style={{ textShadow: '0 0 15px rgba(255,77,138,0.3)' }}>
        ACUSAS?
      </h1>
      <p className="text-xs text-[#5A5A6A] text-center mb-6">
        Si aciertas, el impostor cae. Si no, sigue el juego.
      </p>

      <div className="space-y-2.5 flex-1">
        {activePlayers.map((p) => {
          const realIdx = players.indexOf(p);
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAccuse(realIdx)}
              className="w-full flex items-center gap-4 bg-[#14141C] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,77,138,0.25)] active:border-[rgba(255,77,138,0.4)] rounded-2xl p-4 text-left transition-all"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ background: p.avatarColor, boxShadow: `0 0 12px ${p.avatarColor}30` }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#F0F0F5]">{p.name}</p>
              </div>
              <Swords size={16} className="text-[#5A5A6A]" />
            </motion.button>
          );
        })}
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirming !== null && players[confirming] && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setConfirming(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-[#14141C] border border-[rgba(255,77,138,0.2)] rounded-3xl p-7 w-full max-w-[320px]"
            >
              <div className="w-16 h-16 rounded-full bg-[rgba(255,77,138,0.15)] flex items-center justify-center mx-auto mb-4">
                <Skull size={28} className="text-[#FF4D8A]" />
              </div>
              <h3 className="text-xl font-bold text-[#F0F0F5] mb-1 text-center">¿Acusar?</h3>
              <p className="text-sm text-[#8A8A9A] text-center mb-6">
                Vas a acusar a <span className="text-[#F0F0F5] font-bold">{players[confirming].name}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 py-4 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#8A8A9A] font-semibold active:scale-[0.97] transition-transform text-sm"
                >
                  CANCELAR
                </button>
                <button
                  onClick={confirmAccuse}
                  disabled={isVoting}
                  className={`flex-[1.5] py-5 rounded-xl bg-gradient-to-r from-[#FF4D8A] to-[#EC4899] text-white font-extrabold transition-transform text-base shadow-[0_4px_24px_rgba(255,77,138,0.35)] ${isVoting ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                >
                  {isVoting ? '...' : 'ACUSAR'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
