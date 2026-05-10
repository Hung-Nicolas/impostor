import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export function QuitGameButton() {
  const navigate = useNavigate();
  const resetGame = useGameStore((s) => s.resetGame);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleQuit = () => {
    resetGame();
    setShowConfirm(false);
    navigate('/');
  };

  return (
    <>
      {/* Botón de salir */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setShowConfirm(true)}
        className="absolute top-6 left-5 z-50 w-10 h-10 rounded-full bg-[#14141C] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#8A8A9A] active:scale-90 transition-transform"
        aria-label="Salir de la partida"
      >
        <X size={18} />
      </motion.button>

      {/* Modal de confirmación */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative bg-[#14141C] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 w-full max-w-[320px]"
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-[#EF4444]" />
              </div>
              <h3 className="text-xl font-bold text-[#F0F0F5] mb-1 text-center">
                ¿Salir de la partida?
              </h3>
              <p className="text-sm text-[#8A8A9A] text-center mb-6">
                Se perderá el progreso actual y volverás al inicio.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#8A8A9A] font-semibold active:scale-[0.97] transition-transform text-sm"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleQuit}
                  className="flex-1 py-3.5 rounded-xl bg-[#EF4444] text-white font-bold active:scale-[0.97] transition-transform text-sm shadow-[0_4px_16px_rgba(239,68,68,0.25)]"
                >
                  SALIR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
