import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Skull, Home, ArrowRight, Crown, X, Target, Frown, RotateCcw, AlertTriangle } from 'lucide-react';
import { QuitGameButton } from '@/components/QuitGameButton';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { syncPlayerScores } from '@/lib/gameApi';
import { useConfetti, ConfettiCanvas } from '@/components/ConfettiCanvas';

export function ResultsScreen() {
  const navigate = useNavigate();
  const { results, players, resetKeepConfig, resetGame, resetScores } = useGameStore();
  const { animationsEnabled } = useSettingsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { canvasRef, trigger } = useConfetti();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // Trigger confetti on crewmate win
  useEffect(() => {
    if (!results) return;
    if (results.winner === 'crewmates') {
      const t = setTimeout(trigger, animationsEnabled ? 300 : 0);
      return () => clearTimeout(t);
    }
  }, [results, trigger]);

  // Sync scores to cloud once on mount
  useEffect(() => {
    if (!results || !isAuthenticated) return;
    syncPlayerScores(players.map((p) => ({ name: p.name, avatar_color: p.avatarColor, score: p.score ?? 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 relative overflow-hidden select-none" style={{ background: 'var(--bg-primary)' }}>
        <QuitGameButton />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-[#8A8A9A] text-sm mb-4">No hay resultados disponibles</p>
          <button
            onClick={() => { resetGame(); navigate('/'); }}
            className="bg-[#1E1E2A] border border-[rgba(255,255,255,0.08)] text-[#F0F0F5] font-bold text-sm rounded-xl px-6 py-3"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  const impostorNames = results.impostorIndices.map((i) => players[i]?.name || '???');
  const isCrewWin = results.winner === 'crewmates';
  const isChaos = results.winner === 'chaos';

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetKeepConfig();
    navigate('/seleccionar-packs');
  };

  const handleHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetGame();
    navigate('/');
  };

  const handleResetScores = () => {
    resetScores();
    setConfirmReset(false);
    setShowLeaderboard(false);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] px-6 relative overflow-hidden select-none"
      style={{ background: 'var(--bg-primary)' }}
    >
      <QuitGameButton />
      <ConfettiCanvas canvasRef={canvasRef} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isChaos
            ? 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)'
            : isCrewWin
              ? 'radial-gradient(ellipse at 50% 50%, rgba(0,229,204,0.1) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(255,77,138,0.1) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-xs"
      >
        {/* Titulo ganador */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: animationsEnabled ? 0.1 : 0, duration: animationsEnabled ? undefined : 0 }}
          className="mb-6"
        >
          {isChaos ? (
            <Skull size={48} className="text-[#8B5CF6] mx-auto mb-3" />
          ) : isCrewWin ? (
            <Trophy size={48} className="text-[#00E5CC] mx-auto mb-3" />
          ) : (
            <Flame size={48} className="text-[#FF4D8A] mx-auto mb-3" />
          )}
          <h1
            className={`text-3xl font-extrabold ${
              isChaos ? 'text-[#8B5CF6]' : isCrewWin ? 'text-[#00E5CC]' : 'text-[#FF4D8A]'
            }`}
          >
            {isChaos ? '¡EL CAOS GANO!' : isCrewWin ? '¡GANAN LOS INOCENTES!' : '¡GANAN LOS IMPOSTORES!'}
          </h1>
        </motion.div>

        {/* Palabra secreta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationsEnabled ? 0.25 : 0, duration: animationsEnabled ? undefined : 0 }}
          className="bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 mb-4"
        >
          <p className="text-xs text-[#8A8A9A] uppercase tracking-wider mb-2">Palabra secreta</p>
          <p
            className="text-4xl font-extrabold text-[#00E5CC]"
            style={{ textShadow: '0 0 20px rgba(0,229,204,0.3)' }}
          >
            {results.roundWord}
          </p>
        </motion.div>

        {/* Impostor/es */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationsEnabled ? 0.4 : 0, duration: animationsEnabled ? undefined : 0 }}
          className="bg-[#14141C] border border-[rgba(255,77,138,0.15)] rounded-3xl p-5 mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Skull size={18} className="text-[#FF4D8A]" />
            <p className="text-xs text-[#FF4D8A] uppercase tracking-wider font-bold">
              {impostorNames.length > 1 ? 'Los impostores' : 'El impostor'}
            </p>
          </div>
          {impostorNames.map((name, i) => (
            <p key={i} className="text-xl font-bold text-[#F0F0F5]">
              {name}
            </p>
          ))}
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationsEnabled ? 0.55 : 0, duration: animationsEnabled ? undefined : 0 }}
          className="space-y-3"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLeaderboard(true)}
            className="w-full bg-[#1E1E2A] border border-[rgba(255,255,255,0.08)] text-[#F0F0F5] font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2"
          >
            <Crown size={20} className="text-[#FFB800]" /> Ver clasificacion
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-extrabold text-xl rounded-2xl py-6 flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(0,229,204,0.35)]"
          >
            <ArrowRight size={24} /> CONTINUAR
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleHome}
            className="w-full bg-transparent text-[#5A5A6A] font-medium rounded-2xl py-2 flex items-center justify-center gap-2 text-xs"
          >
            <Home size={14} /> Volver al inicio
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Modal de clasificacion */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            className="fixed inset-0 z-[250] flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowLeaderboard(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-[#14141C] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 w-full max-w-[340px] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[#F0F0F5] flex items-center gap-2">
                  <Crown size={18} className="text-[#FFB800]" /> Clasificacion
                </h3>
                <button onClick={() => setShowLeaderboard(false)} className="p-1">
                  <X size={18} className="text-[#5A5A6A]" />
                </button>
              </div>

              <div className="space-y-2">
                {[...players]
                  .filter((p) => p.active)
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map((p, i) => {
                    const wasImpostor = p.isImpostor;
                    const wasEliminated = results.eliminatedPlayers.some((e) => e.name === p.name);
                    const survived = results.survivingPlayers.includes(p.name);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-xl p-3 border ${
                          wasImpostor
                            ? 'bg-[rgba(255,77,138,0.08)] border-[rgba(255,77,138,0.15)]'
                            : 'bg-[#1E1E2A] border-[rgba(255,255,255,0.04)]'
                        }`}
                      >
                        <span className={`text-xs font-bold w-4 ${i === 0 ? 'text-[#FFB800]' : 'text-[#5A5A6A]'}`}>
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: p.avatarColor }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F0F0F5] truncate">{p.name}</p>
                        </div>
                        <span className="text-sm font-bold text-[#F0F0F5]">{p.score ?? 0}</span>
                        {wasImpostor && <Target size={14} className="text-[#FF4D8A] flex-shrink-0" />}
                        {survived && !wasImpostor && <Crown size={14} className="text-[#00E5CC] flex-shrink-0" />}
                        {wasEliminated && !wasImpostor && <Frown size={14} className="text-[#8A8A9A] flex-shrink-0" />}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                <p className="text-xs text-[#5A5A6A] text-center">
                  {results.winner === 'crewmates'
                    ? 'Ganaron los inocentes'
                    : results.winner === 'impostors'
                      ? 'Ganaron los impostores'
                      : 'El caos gano'}
                </p>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-3 rounded-xl border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                >
                  <RotateCcw size={14} /> Resetear clasificacion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm reset modal */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setConfirmReset(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#14141C] border border-[rgba(239,68,68,0.2)] rounded-3xl p-6 w-full max-w-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={22} className="text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-bold text-[#F0F0F5] text-center mb-1">Resetear clasificacion</h3>
              <p className="text-sm text-[#8A8A9A] text-center mb-5">Se borraran todos los puntos de los jugadores. Esta accion no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#8A8A9A] font-semibold text-sm active:scale-[0.97]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetScores}
                  className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-bold text-sm active:scale-[0.97]"
                >
                  Resetear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
