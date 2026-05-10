import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Zap, Monitor, User } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const { vibrationEnabled, toggleVibration, vibrationSupported, animationsEnabled, toggleAnimations } = useSettingsStore();

  return (
    <>
      {/* Botón de settings */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={() => setOpen(true)}
        className="absolute top-6 left-5 z-10 w-10 h-10 rounded-full bg-[#14141C] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#8A8A9A] active:scale-90 transition-transform"
        aria-label="Configuracion"
      >
        <Settings size={18} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[300] flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              className="relative bg-[#14141C] rounded-t-[24px] px-5 pb-8 pt-3 max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="w-10 h-1 bg-[#5A5A6A] rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#F0F0F5]">OPCIONES</h2>
                <button onClick={() => setOpen(false)} className="p-1">
                  <X size={20} className="text-[#5A5A6A]" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Animaciones */}
                <button
                  onClick={toggleAnimations}
                  className="w-full flex items-center justify-between bg-[#1E1E2A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <Monitor size={20} className="text-[#00E5CC]" />
                    <div>
                      <p className="text-sm font-semibold text-[#F0F0F5]">Animaciones</p>
                      <p className="text-xs text-[#8A8A9A]">{animationsEnabled ? 'Activadas' : 'Desactivadas'}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full p-1 transition-colors ${animationsEnabled ? 'bg-[#00E5CC]' : 'bg-[#3A3A4A]'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${animationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* Vibración */}
                {vibrationSupported && (
                  <button
                    onClick={toggleVibration}
                    className="w-full flex items-center justify-between bg-[#1E1E2A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={20} className={vibrationEnabled ? 'text-[#00E5CC]' : 'text-[#5A5A6A]'} />
                      <div>
                        <p className="text-sm font-semibold text-[#F0F0F5]">Vibracion</p>
                        <p className="text-xs text-[#8A8A9A]">{vibrationEnabled ? 'Activada' : 'Desactivada'}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${vibrationEnabled ? 'bg-[#00E5CC]' : 'bg-[#3A3A4A]'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${vibrationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </button>
                )}
              </div>

              {/* Info del creador */}
              <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-3 mb-3">
                  <User size={16} className="text-[#5A5A6A]" />
                  <p className="text-sm text-[#8A8A9A]">Creador: <span className="text-[#F0F0F5] font-medium">Hung Nicolas</span></p>
                </div>
                <p className="text-xs text-[#5A5A6A]">Version v1.0</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
