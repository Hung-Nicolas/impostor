import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function LoginModal() {
  const { loginModalOpen, loginMode, closeLogin, signIn, signUp, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const isRegister = loginMode === 'register';

  useEffect(() => {
    if (loginModalOpen) {
      setTimeout(() => {
        if (isRegister) {
          usernameRef.current?.focus();
        } else {
          emailRef.current?.focus();
        }
      }, 300);
    }
  }, [loginModalOpen, isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Completa todos los campos'); shakeInput(); return; }
    if (isRegister && username.length < 3) { setError('El usuario debe tener al menos 3 caracteres'); shakeInput(); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); shakeInput(); return; }

    const err = isRegister
      ? await signUp(email, password, username)
      : await signIn(email, password);

    if (err) { setError(err); shakeInput(); }
  };

  const shakeInput = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        handleSubmit(e as any);
      }
    }
  };

  const switchMode = () => {
    setError('');
    useAuthStore.setState({ loginMode: isRegister ? 'login' : 'register' });
  };

  return (
    <AnimatePresence>
      {loginModalOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeLogin} />
          <motion.div
            className="relative bg-[#14141C] rounded-t-[20px] px-5 pb-8 pt-3 max-h-[85vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="w-10 h-1 bg-[#5A5A6A] rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-6">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={loginMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-2xl font-bold text-[#F0F0F5]"
                >
                  {isRegister ? 'CREAR CUENTA' : 'INICIAR SESION'}
                </motion.h2>
              </AnimatePresence>
              <button onClick={closeLogin} className="p-1">
                <X size={20} className="text-[#5A5A6A]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="text-sm text-[#8A8A9A] mb-1 block">Nombre de usuario</label>
                    <input
                      ref={usernameRef}
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, emailRef)}
                      placeholder="tu_usuario"
                      className="w-full bg-[#1E1E2A] border border-[rgba(255,255,255,0.06)] rounded-[10px] px-4 py-3.5 text-[#F0F0F5] placeholder-[#5A5A6A] focus:border-[rgba(0,229,204,0.5)] focus:outline-none transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-sm text-[#8A8A9A] mb-1 block">Email</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                  placeholder="tu@email.com"
                  className="w-full bg-[#1E1E2A] border border-[rgba(255,255,255,0.06)] rounded-[10px] px-4 py-3.5 text-[#F0F0F5] placeholder-[#5A5A6A] focus:border-[rgba(0,229,204,0.5)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-[#8A8A9A] mb-1 block">Contraseña</label>
                <motion.div animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
                  <input
                    ref={passwordRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    placeholder="******"
                    className="w-full bg-[#1E1E2A] border border-[rgba(255,255,255,0.06)] rounded-[10px] px-4 py-3.5 text-[#F0F0F5] placeholder-[#5A5A6A] focus:border-[rgba(0,229,204,0.5)] focus:outline-none transition-colors"
                  />
                </motion.div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[#EF4444]"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold text-lg rounded-xl py-4 shadow-[0_4px_16px_rgba(0,229,204,0.25)] active:scale-[0.97] transition-transform disabled:opacity-40"
              >
                {isLoading ? '...' : isRegister ? 'CREAR CUENTA' : 'INICIAR SESION'}
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
                <span className="text-xs text-[#5A5A6A]">o</span>
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
              </div>

              <p className="text-center text-sm text-[#8A8A9A]">
                {isRegister ? '¿Ya tenes cuenta?' : '¿No tenes cuenta?'}{' '}
                <button type="button" onClick={switchMode} className="text-[#00E5CC] font-medium">
                  {isRegister ? 'INICIAR SESION' : 'CREAR CUENTA'}
                </button>
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
