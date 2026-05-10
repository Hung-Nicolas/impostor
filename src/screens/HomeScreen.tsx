import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Package, User, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LoginModal } from '@/components/LoginModal';
import { SettingsModal } from '@/components/SettingsModal';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useAnimDelay } from '@/lib/animations';
import { useSettingsStore } from '@/stores/settingsStore';

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openLogin, signOut } = useAuthStore();
  useSettingsStore();
  const d = useAnimDelay();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6 select-none relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <ParticleBackground />

      {/* Auth button top-right */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d(0.8) }}
        onClick={() => isAuthenticated ? setShowLogoutConfirm(true) : openLogin('login')}
        className="absolute top-6 right-5 z-10 flex items-center gap-2 bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-2 text-sm text-[#8A8A9A] hover:border-[rgba(0,229,204,0.2)] hover:text-[#F0F0F5] transition-colors"
      >
        {isAuthenticated ? <LogOut size={16} /> : <User size={16} />}
        <span>{isAuthenticated ? user?.username ?? 'Cerrar sesion' : 'Iniciar sesion'}</span>
      </motion.button>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="mb-4"
      >
        <Logo />
      </motion.div>

      <motion.p
        className="text-sm text-[#8A8A9A] mb-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d(0.3) }}
      >
        Deduccion, palabras y paranoia
      </motion.p>

      {/* Centered buttons */}
      <div className="flex flex-col items-center w-full max-w-[280px] gap-3">
        {/* JUGAR */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(0.5), duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { useGameStore.getState().deactivateAllPlayers(); navigate('/setup'); }}
          className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-extrabold text-xl rounded-2xl py-5 flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(0,229,204,0.3)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
          <Play size={24} fill="#0A0A0F" />
          JUGAR
        </motion.button>

        {/* PAQUETES */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(0.65), duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/packs')}
          className="w-full bg-[#14141C] border border-[rgba(255,255,255,0.08)] text-[#F0F0F5] font-semibold text-base rounded-2xl py-4 flex items-center justify-center gap-2 hover:border-[rgba(0,229,204,0.2)] transition-colors"
        >
          <Package size={18} className="text-[#00E5CC]" />
          Paquetes personalizados
        </motion.button>
      </div>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#14141C] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 w-full max-w-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(255,77,138,0.1)] flex items-center justify-center mx-auto mb-3">
                <LogOut size={22} className="text-[#FF4D8A]" />
              </div>
              <h3 className="text-lg font-bold text-[#F0F0F5] text-center mb-1">Cerrar sesion</h3>
              <p className="text-sm text-[#8A8A9A] text-center mb-5">¿Estas seguro de que queres salir?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#8A8A9A] font-semibold text-sm active:scale-[0.97] transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); signOut(); }}
                  className="flex-1 py-3 rounded-xl bg-[#FF4D8A] text-white font-bold text-sm active:scale-[0.97] transition-transform"
                >
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal />

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}
