import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shield, Dices, UserPlus, X, ChevronDown, ChevronUp, Pencil, Users, Cloud, Trash2, Eye, EyeOff } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchSavedPlayers, upsertSavedPlayer, deleteSavedPlayer } from '@/lib/gameApi';

export function GameSetupScreen() {
  const navigate = useNavigate();
  const {
    players, addPlayer, editPlayer, removePlayer, getPlayerCount, togglePlayerActive,
    gameMode, setGameMode, impostorCount, setImpostorCount,
  } = useGameStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showPlayers, setShowPlayers] = useState(true);
  const [error, setError] = useState('');
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  // Cargar jugadores guardados de Supabase automaticamente
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const saved = await fetchSavedPlayers();
      if (saved.length > 0) {
        setCloudEnabled(true);
        const currentNames = new Set(useGameStore.getState().players.map((p) => p.name.toLowerCase()));
        saved.forEach((p) => {
          if (!currentNames.has(p.name.toLowerCase())) {
            useGameStore.getState().addPlayer(p.name);
          }
          // Merge cloud score into local player
          const local = useGameStore.getState().players.find((lp) => lp.name.toLowerCase() === p.name.toLowerCase());
          if (local && typeof p.score === 'number') {
            useGameStore.getState().editPlayer(local.id, { score: p.score });
          }
        });
      }
    };
    load();
  }, [isAuthenticated]);

  // Ajustar cantidad de impostores si excede el maximo permitido
  useEffect(() => {
    const count = getPlayerCount();
    const max = Math.max(1, Math.min(3, Math.floor((count - 1) / 2)));
    if (impostorCount > max) {
      setImpostorCount(max);
    }
  }, [players, impostorCount, setImpostorCount]);

  const handleAdd = async () => {
    setError('');
    const trimmed = newName.trim();
    if (!trimmed) return;

    const res = addPlayer(trimmed);
    if (res.success) {
      setNewName('');
      if (isAuthenticated && cloudEnabled) {
        const color = useGameStore.getState().players.find((p) => p.name === trimmed)?.avatarColor || '#00E5CC';
        await upsertSavedPlayer(trimmed, color);
      }
    } else {
      setError(res.error || 'Error');
    }
  };

  const askDelete = (id: number, name: string) => {
    setConfirmDelete({ id, name });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    removePlayer(confirmDelete.id);
    if (isAuthenticated && cloudEnabled) {
      await deleteSavedPlayer(confirmDelete.name);
    }
    setConfirmDelete(null);
  };

  const handleStart = () => {
    setError('');
    if (getPlayerCount() < 3) { setError('Minimo 3 jugadores'); return; }
    navigate('/seleccionar-packs');
  };

  const maxImpostors = Math.max(1, Math.min(3, Math.floor((getPlayerCount() - 1) / 2)));

  return (
    <div className="flex flex-col min-h-full select-none" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="shrink-0 flex items-center px-5 pt-4 pb-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[#F0F0F5]" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-[#F0F0F5]">CONFIGURAR</h1>
        {isAuthenticated && cloudEnabled && (
          <div className="absolute right-5 top-4 flex items-center gap-1 text-[#00E5CC]">
            <Cloud size={14} />
            <span className="text-[10px]">Nube activa</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-6">
        {/* ===== MODO DE JUEGO ===== */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A6A] uppercase tracking-wider mb-3">Modo de juego</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGameMode('normal')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                gameMode === 'normal'
                  ? 'border-[rgba(0,229,204,0.3)] bg-[rgba(0,229,204,0.08)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#14141C]'
              }`}
            >
              <Shield size={26} className={gameMode === 'normal' ? 'text-[#00E5CC]' : 'text-[#5A5A6A]'} />
              <span className={`text-sm font-bold ${gameMode === 'normal' ? 'text-[#00E5CC]' : 'text-[#F0F0F5]'}`}>Normal</span>
              <span className="text-[10px] text-[#8A8A9A] text-center leading-tight">Saben cuantos<br />impostores hay</span>
            </button>

            <button
              onClick={() => setGameMode('caos')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                gameMode === 'caos'
                  ? 'border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#14141C]'
              }`}
            >
              <Dices size={26} className={gameMode === 'caos' ? 'text-[#8B5CF6]' : 'text-[#5A5A6A]'} />
              <span className={`text-sm font-bold ${gameMode === 'caos' ? 'text-[#8B5CF6]' : 'text-[#F0F0F5]'}`}>Caos</span>
              <span className="text-[10px] text-[#8A8A9A] text-center leading-tight">Nadie sabe.<br />El caos decide.</span>
            </button>
          </div>
        </div>

        {/* ===== IMPOSTORES (solo Normal) ===== */}
        <AnimatePresence>
          {gameMode === 'normal' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <h2 className="text-sm font-semibold text-[#5A5A6A] uppercase tracking-wider mb-3">Impostores</h2>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setImpostorCount(Math.max(1, impostorCount - 1))}
                  disabled={impostorCount <= 1}
                  className="w-10 h-10 rounded-xl bg-[#1E1E2A] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#8A8A9A] font-bold disabled:opacity-25 active:scale-90 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-2xl font-bold text-[#00E5CC] tabular-nums w-8 text-center">{impostorCount}</span>
                <button
                  onClick={() => setImpostorCount(Math.min(maxImpostors, impostorCount + 1))}
                  disabled={impostorCount >= maxImpostors}
                  className="w-10 h-10 rounded-xl bg-[#1E1E2A] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#8A8A9A] font-bold disabled:opacity-25 active:scale-90 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== GESTIÓN DE JUGADORES (expandible) ===== */}
        <div className="mb-6">
          <button
            onClick={() => setShowPlayers(!showPlayers)}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#5A5A6A] uppercase tracking-wider">Jugadores</h2>
              <span className="text-xs bg-[#1E1E2A] text-[#8A8A9A] px-2 py-0.5 rounded-full">{getPlayerCount()} / {players.length}</span>
            </div>
            {showPlayers ? <ChevronUp size={16} className="text-[#5A5A6A]" /> : <ChevronDown size={16} className="text-[#5A5A6A]" />}
          </button>

          <AnimatePresence>
            {showPlayers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {/* Add input */}
                <div className="flex gap-2 mb-3">
                  <input
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && newName.trim() && handleAdd()}
                    placeholder="Nombre..."
                    maxLength={20}
                    className="flex-1 bg-[#1E1E2A] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-[#F0F0F5] placeholder-[#5A5A6A] focus:border-[rgba(0,229,204,0.5)] focus:outline-none transition-colors text-sm"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] rounded-xl px-4 font-bold disabled:opacity-30"
                  >
                    <UserPlus size={18} />
                  </motion.button>
                </div>

                {error && <p className="text-xs text-[#EF4444] mb-2">{error}</p>}

                {/* Player list */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {players.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: p.active ? 1 : 0.4, scale: 1 }}
                        exit={{ opacity: 0, x: -50, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center gap-3 bg-[#14141C] border rounded-xl p-3 ${p.active ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(255,255,255,0.02)]'}`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: p.avatarColor, opacity: p.active ? 1 : 0.5 }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>

                        {editingId === p.id ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => { if (editName.trim()) editPlayer(p.id, { name: editName }); setEditingId(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { if (editName.trim()) editPlayer(p.id, { name: editName }); setEditingId(null); }
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 bg-[#1E1E2A] border border-[rgba(0,229,204,0.3)] rounded-lg px-3 py-1.5 text-sm text-[#F0F0F5] focus:outline-none"
                          />
                        ) : (
                          <span
                            className={`flex-1 text-sm font-semibold cursor-pointer select-none ${p.active ? 'text-[#F0F0F5]' : 'text-[#5A5A6A]'}`}
                            onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                          >
                            {p.name}
                          </span>
                        )}

                        <button
                          onClick={() => togglePlayerActive(p.id)}
                          className="p-1.5 rounded-lg hover:bg-[#1E1E2A] transition-colors"
                          title={p.active ? 'Desactivar' : 'Activar'}
                        >
                          {p.active ? <Eye size={14} className="text-[#00E5CC]" /> : <EyeOff size={14} className="text-[#5A5A6A]" />}
                        </button>
                        <button
                          onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                          className="p-1.5 rounded-lg hover:bg-[#1E1E2A] transition-colors"
                        >
                          <Pencil size={13} className="text-[#5A5A6A]" />
                        </button>
                        <button
                          onClick={() => askDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                        >
                          <X size={14} className="text-[#5A5A6A]" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== INICIAR ===== */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          disabled={getPlayerCount() < 3}
          className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold text-lg rounded-2xl py-4.5 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,229,204,0.25)] disabled:opacity-30 transition-all"
        >
          <Users size={20} />
          INICIAR JUEGO
        </motion.button>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#14141C] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 w-full max-w-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-bold text-[#F0F0F5] text-center mb-1">Eliminar jugador</h3>
              <p className="text-sm text-[#8A8A9A] text-center mb-5">"{confirmDelete.name}"</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#8A8A9A] font-semibold text-sm active:scale-[0.97]"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-bold text-sm active:scale-[0.97]"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
