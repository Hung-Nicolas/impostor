import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Package, ChevronLeft, BookOpen, Globe, Heart, Download, X, Sparkles, Play, Type, Loader2 } from 'lucide-react';
import { usePacksStore } from '@/stores/packsStore';
import { useAuthStore } from '@/stores/authStore';
import { deletePublicPack } from '@/lib/gameApi';
import { showToast } from '@/components/Toast';
import type { Pack } from '@/types';

export function PacksScreen() {
  const navigate = useNavigate();
  const { packs, deletePack, publicPacks, isPublicPacksLoading, loadPublicPacks, loadUserLikes, importPublicPack, likePublicPack, likedPackIds } = usePacksStore();
  const { isAuthenticated, user, isAdmin } = useAuthStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [deletingType, setDeletingType] = useState<'local' | 'public'>('local');
  const [viewingPack, setViewingPack] = useState<Pack | null>(null);
  const [showAllWords, setShowAllWords] = useState(false);
  const [likingPackId, setLikingPackId] = useState<string | null>(null);
  const [importingPackId, setImportingPackId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPublicPacks();
    if (isAuthenticated) loadUserLikes();
  }, [loadPublicPacks, loadUserLikes, isAuthenticated]);

  const defaultPacks = packs.filter((p: Pack) => p.id.startsWith('default-'));
  const customPacks = packs.filter((p: Pack) => !p.id.startsWith('default-'));

  const askDelete = (id: string, name: string, type: 'local' | 'public' = 'local') => {
    setConfirmDelete(id);
    setDeletingName(name);
    setDeletingType(type);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      if (deletingType === 'public') {
        const ok = await deletePublicPack(confirmDelete);
        if (ok) {
          showToast('Paquete eliminado', 'success');
          loadPublicPacks();
        } else {
          showToast('Error al eliminar', 'error');
        }
      } else {
        deletePack(confirmDelete);
        showToast('Paquete eliminado', 'success');
      }
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const openPack = (pack: Pack) => {
    setShowAllWords(false);
    setViewingPack(pack);
  };

  const handleImport = async (pack: Pack) => {
    if (importingPackId === pack.id) return;
    setImportingPackId(pack.id);
    try {
      importPublicPack(pack);
      showToast(`"${pack.name}" importado`, 'success');
      setViewingPack(null);
    } finally {
      setImportingPackId(null);
    }
  };

  const handleLike = async (packId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      showToast('Inicia sesion para dar like', 'error');
      return;
    }
    if (likingPackId === packId) return;
    setLikingPackId(packId);
    try {
      await likePublicPack(packId);
    } finally {
      setLikingPackId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full select-none" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="shrink-0 flex items-center px-5 pt-4 pb-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[#F0F0F5]" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-[#F0F0F5]">PAQUETES</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-6">
        {/* Create button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/packs/edit')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[rgba(0,229,204,0.1)] to-[rgba(0,229,204,0.05)] border border-dashed border-[rgba(0,229,204,0.3)] rounded-2xl py-4 text-[#00E5CC] font-bold mb-5 active:bg-[rgba(0,229,204,0.08)] transition-colors"
        >
          <Plus size={20} />
          Crear paquete
        </motion.button>

        {/* Default packs */}
        <div className="mb-5">
          <h2 className="text-[10px] font-semibold text-[#5A5A6A] uppercase tracking-wider mb-2">Predeterminados</h2>
          <div className="space-y-2">
            {defaultPacks.map((pack: Pack) => (
              <motion.div
                key={pack.id}
                layout
                className="flex items-center gap-3 bg-[#14141C] border border-[rgba(255,255,255,0.04)] rounded-xl p-3"
              >
                <button
                  onClick={() => openPack(pack)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-[rgba(0,229,204,0.1)] flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-[#00E5CC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#F0F0F5] truncate">{pack.name}</p>
                    <p className="text-[11px] text-[#5A5A6A]">{pack.words.length} palabras</p>
                  </div>
                </button>
                {isAdmin && (
                  <button onClick={() => navigate(`/packs/edit/${pack.id}`)} className="p-2 rounded-lg hover:bg-[#1E1E2A] transition-colors">
                    <Pencil size={14} className="text-[#8A8A9A]" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Custom packs */}
        {customPacks.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-semibold text-[#5A5A6A] uppercase tracking-wider mb-2">Tus paquetes</h2>
            <div className="space-y-2">
              {customPacks.map((pack: Pack) => (
                <motion.div
                  key={pack.id}
                  layout
                  className="flex items-center gap-3 bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-xl p-3"
                >
                  <button
                    onClick={() => openPack(pack)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-[#8B5CF6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F0F0F5] truncate">{pack.name}</p>
                      <p className="text-[11px] text-[#5A5A6A]">{pack.words.length} palabras</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => navigate(`/packs/edit/${pack.id}`)} className="p-2 rounded-lg hover:bg-[#1E1E2A] transition-colors">
                      <Pencil size={14} className="text-[#8A8A9A]" />
                    </button>
                    <button onClick={() => askDelete(pack.id, pack.name)} className="p-2 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                      <Trash2 size={14} className="text-[#8A8A9A]" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Public packs */}
        <div>
          <h2 className="text-[10px] font-semibold text-[#5A5A6A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe size={12} /> Paquetes publicos
          </h2>

          {isPublicPacksLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-[#00E5CC] border-t-transparent rounded-full"
              />
            </div>
          ) : publicPacks.length === 0 ? (
            <div className="bg-[#14141C] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 text-center">
              <p className="text-sm text-[#5A5A6A]">No hay paquetes publicos todavia</p>
              <p className="text-xs text-[#3A3A4A] mt-1">Los packs publicados apareceran aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {publicPacks.map((pack: Pack) => (
                <motion.button
                  key={pack.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openPack(pack)}
                  className="w-full flex items-center gap-3 bg-[#14141C] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,229,204,0.2)] rounded-xl p-3 text-left transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-[rgba(0,229,204,0.08)] flex items-center justify-center flex-shrink-0">
                    <Globe size={16} className="text-[#00E5CC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#F0F0F5] truncate">{pack.name}</p>
                    <p className="text-[11px] text-[#5A5A6A]">
                      {(pack as any).profiles?.username || 'Anonimo'} · {pack.words.length} palabras
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span
                      onClick={(e) => handleLike(pack.id, e)}
                      role="button"
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        likedPackIds.has(pack.id) ? 'text-[#FF4D8A]' : 'text-[#8A8A9A] hover:text-[#FF4D8A]'
                      } ${likingPackId === pack.id ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {likingPackId === pack.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Heart size={13} fill={likedPackIds.has(pack.id) ? '#FF4D8A' : 'none'} />
                      )}
                      {pack.likes_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#5A5A6A]">
                      <Download size={13} />
                      {pack.downloads_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#5A5A6A]">
                      <Play size={13} />
                      {pack.uses_count}
                    </span>
                    {pack.user_id === user?.id && (
                      <>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); navigate(`/packs/edit/${pack.id}`); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); navigate(`/packs/edit/${pack.id}`); } }}
                          className="p-1.5 rounded-lg hover:bg-[#1E1E2A] transition-colors cursor-pointer inline-flex"
                        >
                          <Pencil size={13} className="text-[#8A8A9A]" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); askDelete(pack.id, pack.name, 'public'); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); askDelete(pack.id, pack.name, 'public'); } }}
                          className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer inline-flex"
                        >
                          <Trash2 size={13} className="text-[#EF4444]" />
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pack detail modal */}
      <AnimatePresence>
        {viewingPack && (
          <motion.div
            className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setViewingPack(null)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-[#14141C] border border-[rgba(255,255,255,0.08)] rounded-t-3xl sm:rounded-3xl w-full max-w-[430px] max-h-[85vh] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-[#3A3A4A] rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(0,229,204,0.1)] flex items-center justify-center">
                      <Sparkles size={18} className="text-[#00E5CC]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F0F0F5]">{viewingPack.name}</h3>
                      <p className="text-xs text-[#5A5A6A]">
                        {(viewingPack as any).profiles?.username || (viewingPack.id.startsWith('default-') ? 'Predeterminado' : 'Local')} · {viewingPack.category}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setViewingPack(null)} className="p-1">
                    <X size={20} className="text-[#5A5A6A]" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {publicPacks.some((p) => p.id === viewingPack.id) && (
                    <>
                      <span className="text-xs text-[#8A8A9A] flex items-center gap-1">
                        <Heart size={12} className="text-[#FF4D8A]" /> {viewingPack.likes_count}
                      </span>
                      <span className="text-xs text-[#8A8A9A] flex items-center gap-1">
                        <Play size={12} className="text-[#00E5CC]" /> {viewingPack.uses_count}
                      </span>
                      <span className="text-xs text-[#8A8A9A] flex items-center gap-1">
                        <Download size={12} className="text-[#8B5CF6]" /> {viewingPack.downloads_count}
                      </span>
                    </>
                  )}
                  <span className="text-xs text-[#8A8A9A] flex items-center gap-1">
                    <Type size={12} /> {viewingPack.words.length}
                  </span>
                </div>
              </div>

              {/* Words list */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                {(showAllWords ? viewingPack.words : viewingPack.words.slice(0, 3)).map((word, i) => (
                  <div key={word.id || i} className="bg-[#1E1E2A] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                    <p className="text-sm font-bold text-[#F0F0F5] mb-1">{word.word}</p>
                    {word.hints && word.hints.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {word.hints.map((hint, hi) => (
                          <span key={hi} className="text-[10px] bg-[rgba(0,229,204,0.08)] text-[#00E5CC] px-2 py-0.5 rounded-full">
                            {hint}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#5A5A6A] italic">Sin pistas</span>
                    )}
                  </div>
                ))}
                {viewingPack.words.length > 3 && (
                  <button
                    onClick={() => setShowAllWords(!showAllWords)}
                    className="w-full py-2.5 text-xs font-semibold text-[#00E5CC] bg-[rgba(0,229,204,0.06)] border border-[rgba(0,229,204,0.12)] rounded-xl active:scale-[0.97] transition-transform"
                  >
                    {showAllWords ? 'Ver menos' : `Mostrar todo (${viewingPack.words.length})`}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                {publicPacks.some((p) => p.id === viewingPack.id) ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleLike(viewingPack.id)}
                      disabled={likingPackId === viewingPack.id}
                      className={`flex-1 py-3.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-transform ${
                        likedPackIds.has(viewingPack.id)
                          ? 'bg-[rgba(255,77,138,0.1)] border-[rgba(255,77,138,0.3)] text-[#FF4D8A]'
                          : 'border-[rgba(255,77,138,0.2)] text-[#FF4D8A]'
                      } ${likingPackId === viewingPack.id ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                    >
                      {likingPackId === viewingPack.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Heart size={16} fill={likedPackIds.has(viewingPack.id) ? '#FF4D8A' : 'none'} />
                      )}
                      {likedPackIds.has(viewingPack.id) ? 'Liked' : 'Like'}
                    </button>
                    <button
                      onClick={() => handleImport(viewingPack)}
                      disabled={importingPackId === viewingPack.id}
                      className={`flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-extrabold text-sm flex items-center justify-center gap-2 transition-transform shadow-[0_4px_16px_rgba(0,229,204,0.25)] ${importingPackId === viewingPack.id ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                    >
                      {importingPackId === viewingPack.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {importingPackId === viewingPack.id ? 'Importando...' : 'Importar pack'}
                    </button>
                  </div>
                ) : !viewingPack.id.startsWith('default-') ? (
                  <button
                    onClick={() => { setViewingPack(null); navigate(`/packs/edit/${viewingPack.id}`); }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-[0_4px_16px_rgba(0,229,204,0.25)]"
                  >
                    <Pencil size={16} /> Editar pack
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="text-lg font-bold text-[#F0F0F5] text-center mb-1">Eliminar paquete</h3>
              <p className="text-sm text-[#8A8A9A] text-center mb-1">"{deletingName}"</p>
              <p className="text-xs text-[#5A5A6A] text-center mb-5">Esta accion no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#8A8A9A] font-semibold text-sm active:scale-[0.97]"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAction}
                  disabled={isDeleting}
                  className={`flex-1 py-3 rounded-xl bg-[#EF4444] text-white font-bold text-sm transition-transform ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}`}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
