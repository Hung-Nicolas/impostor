import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Save, Plus, X, Trash2, Pencil, GripVertical, Copy } from 'lucide-react';
import { usePacksStore } from '@/stores/packsStore';
import { useAuthStore } from '@/stores/authStore';
import { createPublicPack, updatePublicPack } from '@/lib/gameApi';
import { showToast } from '@/components/Toast';
import type { Word, Pack } from '@/types';

const CATEGORIES = ['General', 'Memes', 'Escuela', 'Tecnologia', 'Deportes', 'Musica', 'Peliculas', 'Comida', 'Viajes', 'Otro'];

export function PackEditorScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { packs, createPack, updatePack, updateDefaultPack, publicPacks } = usePacksStore();
  const { isAuthenticated, user, isAdmin } = useAuthStore();
  const isEdit = !!id;
  const existingLocal = isEdit ? packs.find((p: Pack) => p.id === id) : null;
  const existingPublic = isEdit ? publicPacks.find((p: Pack) => p.id === id && p.user_id === user?.id) : null;
  const existing = existingLocal || existingPublic;
  const isImported = existingLocal?.id.startsWith('imported-') || false;
  const isMyPublicPack = !!existingPublic;
  const isDefaultPack = existing?.id.startsWith('default-') || false;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [words, setWords] = useState<Word[]>([]);
  const [hintInputs, setHintInputs] = useState<Record<string, string>>({});
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editWordValue, setEditWordValue] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description || '');
      setCategory(existing.category);
      setWords(existing.words);
      setIsPublic(existing.is_public || false);
    }
  }, [existing]);

  const addWord = () => {
    const w: Word = { id: `w-${Date.now()}`, word: '', hints: [] };
    setWords([...words, w]);
    setEditingWordId(w.id);
    setEditWordValue('');
  };

  const saveWordEdit = (wordId: string) => {
    if (!editWordValue.trim()) return;
    setWords(words.map((w) => (w.id === wordId ? { ...w, word: editWordValue.trim() } : w)));
    setEditingWordId(null);
  };

  const addHint = (wordId: string) => {
    const text = hintInputs[wordId]?.trim();
    if (!text) return;
    const w = words.find((x) => x.id === wordId);
    if (!w || w.hints.length >= 5) return;
    setWords(words.map((w) => (w.id === wordId ? { ...w, hints: [...w.hints, text] } : w)));
    setHintInputs({ ...hintInputs, [wordId]: '' });
  };

  const removeHint = (wordId: string, hi: number) => {
    setWords(words.map((w) => (w.id === wordId ? { ...w, hints: w.hints.filter((_, i) => i !== hi) } : w)));
  };

  const removeWord = (wordId: string) => {
    setWords(words.filter((w) => w.id !== wordId));
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Ingresa un nombre', 'error'); return; }
    const valid = words.filter((w) => w.word.trim());
    if (valid.length < 1) { showToast('Agrega al menos 1 palabra', 'error'); return; }
    if (isPublic && valid.length < 3) { showToast('Un pack publico necesita al menos 3 palabras', 'error'); return; }

    const data = {
      name: name.trim(), description: description.trim(), category,
      is_public: isAuthenticated && !isImported ? isPublic : false, words: valid, likes_count: existing?.likes_count || 0, uses_count: existing?.uses_count || 0, downloads_count: existing?.downloads_count || 0, user_id: null as string | null,
    };

    if (isImported) {
      // Create a local editable copy
      createPack({
        name: name.trim() + ' (copia)',
        description: description.trim(),
        category,
        is_public: false,
        words: valid,
        likes_count: 0,
        uses_count: 0,
        downloads_count: 0,
        user_id: null,
      });
      showToast('Copia creada', 'success');
      navigate('/packs');
      return;
    }

    if (isDefaultPack && isAdmin) {
      updateDefaultPack(id!, data);
      showToast('Pack predeterminado actualizado', 'success');
    } else if (isMyPublicPack && existing) {
      const ok = await updatePublicPack(id!, data);
      if (ok) {
        // Also update local copy if exists
        if (existingLocal) updatePack(id!, data);
        showToast('Paquete publico actualizado', 'success');
      } else {
        showToast('Error al actualizar en Supabase', 'error');
        return;
      }
    } else if (isEdit && existing) {
      updatePack(id!, data);
      showToast('Paquete actualizado', 'success');
    } else if (isPublic && isAuthenticated) {
      const result = await createPublicPack(data);
      if (result) {
        // Also save locally so it appears in "Tus paquetes"
        createPack(data);
        showToast('Paquete publicado', 'success');
      } else {
        showToast('Error al publicar. Revisa la consola (F12) para mas detalles.', 'error');
        return; // No navegar si fallo
      }
    } else {
      createPack(data);
      showToast('Paquete creado', 'success');
    }
    navigate('/packs');
  };

  return (
    <div className="flex flex-col min-h-full select-none" style={{ background: 'var(--bg-primary)' }}>
      <div className="shrink-0 flex items-center px-5 pt-4 pb-3">
        <button onClick={() => navigate('/packs')} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[#F0F0F5]" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-[#F0F0F5]">{isImported ? 'IMPORTADO' : isDefaultPack && isAdmin ? 'EDITAR PREDET' : isMyPublicPack ? 'EDITAR PUBLICO' : isEdit ? 'EDITAR' : 'CREAR'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4 space-y-5">
        {/* Name */}
        <div>
          <label className="text-[10px] font-semibold text-[#5A5A6A] uppercase tracking-wider mb-1.5 block">Nombre del paquete</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={isImported}
            placeholder="Ej: Series de Netflix"
            className={`w-full bg-transparent border-b border-[rgba(255,255,255,0.08)] pb-2 text-lg font-bold text-[#F0F0F5] placeholder-[#3A3A4A] outline-none transition-colors ${isImported ? '' : 'focus:border-[#00E5CC]'}`}
          />
        </div>

        {/* Public toggle */}
        {isAuthenticated && !isImported && (
          <div className="flex items-center justify-between bg-[#14141C] border border-[rgba(255,255,255,0.06)] rounded-xl p-3.5">
            <div>
              <p className="text-sm font-semibold text-[#F0F0F5]">Hacer publico</p>
              <p className="text-[11px] text-[#5A5A6A]">Cualquiera podra ver y usar este pack</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${isPublic ? 'bg-[#00E5CC]' : 'bg-[#3A3A4A]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-[10px] font-semibold text-[#5A5A6A] uppercase tracking-wider mb-1.5 block">Categoria</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => !isImported && setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === c ? 'bg-[rgba(0,229,204,0.15)] text-[#00E5CC]' : 'bg-[#14141C] text-[#8A8A9A]'
                } ${isImported ? 'cursor-default' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Words */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-semibold text-[#5A5A6A] uppercase tracking-wider">Palabras</label>
            <span className="text-xs text-[#5A5A6A]">{words.filter((w) => w.word.trim()).length}</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {words.map((word) => (
                <motion.div
                  key={word.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#14141C] border border-[rgba(255,255,255,0.04)] rounded-2xl p-4"
                >
                  {/* Word row */}
                  <div className="flex items-center gap-2 mb-3">
                    {!isImported && <GripVertical size={14} className="text-[#3A3A4A] flex-shrink-0" />}
                    {editingWordId === word.id && !isImported ? (
                      <input
                        autoFocus
                        value={editWordValue}
                        onChange={(e) => setEditWordValue(e.target.value)}
                        onBlur={() => saveWordEdit(word.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveWordEdit(word.id); if (e.key === 'Escape') setEditingWordId(null); }}
                        placeholder="Palabra..."
                        className="flex-1 bg-[#1E1E2A] border border-[rgba(0,229,204,0.3)] rounded-lg px-3 py-2 text-sm font-bold text-[#F0F0F5] outline-none"
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-bold text-[#F0F0F5]">
                          {word.word || <span className="text-[#3A3A4A] font-normal italic">Sin nombre...</span>}
                        </span>
                        {!isImported && (
                          <button onClick={() => { setEditingWordId(word.id); setEditWordValue(word.word); }} className="p-1">
                            <Pencil size={12} className="text-[#5A5A6A]" />
                          </button>
                        )}
                      </>
                    )}
                    {!isImported && (
                      <button onClick={() => removeWord(word.id)} className="p-1">
                        <Trash2 size={12} className="text-[#5A5A6A]" />
                      </button>
                    )}
                  </div>

                  {/* Hints */}
                  <div className="pl-5">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {word.hints.map((hint, hi) => (
                        <span key={hi} className={`inline-flex items-center gap-1 bg-[rgba(255,184,0,0.08)] text-[#FFB800] text-[11px] px-2 py-0.5 rounded-md ${isImported ? '' : ''}`}>
                          {hint}
                          {!isImported && (
                            <button onClick={() => removeHint(word.id, hi)}>
                              <X size={9} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {word.hints.length < 5 && !isImported && (
                      <>
                        <div className="flex gap-1.5">
                          <input
                            value={hintInputs[word.id] || ''}
                            onChange={(e) => setHintInputs({ ...hintInputs, [word.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && addHint(word.id)}
                            placeholder="+ pista"
                            className="flex-1 bg-transparent border-b border-[rgba(255,255,255,0.04)] focus:border-[rgba(255,184,0,0.3)] pb-1 text-[11px] text-[#F0F0F5] placeholder-[#3A3A4A] outline-none transition-colors"
                          />
                        </div>
                        {/* Banco de pistas de otras palabras */}
                        {(() => {
                          const used = new Set(word.hints);
                          const others = words
                            .filter((w) => w.id !== word.id)
                            .flatMap((w) => w.hints)
                            .filter((h) => !used.has(h));
                          const unique = [...new Set(others)];
                          if (unique.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {unique.slice(0, 8).map((h) => (
                                <button
                                  key={h}
                                  onClick={() => {
                                    if (word.hints.length >= 5) return;
                                    setWords(words.map((w) => (w.id === word.id ? { ...w, hints: [...w.hints, h] } : w)));
                                  }}
                                  className="text-[10px] bg-[rgba(255,184,0,0.06)] text-[#8A8A6A] px-2 py-0.5 rounded-full hover:text-[#FFB800] hover:bg-[rgba(255,184,0,0.12)] transition-colors"
                                >
                                  + {h}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add word */}
            {!isImported && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={addWord}
                className="w-full flex items-center gap-2 py-3 px-4 border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl text-[#5A5A6A] text-sm hover:border-[rgba(0,229,204,0.15)] hover:text-[#8A8A9A] transition-colors"
              >
                <Plus size={16} />
                Agregar palabra
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="shrink-0 px-5 pb-6 pt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,229,204,0.25)]"
        >
          {isImported ? <Copy size={20} /> : <Save size={20} />}
          {isImported ? 'HACER COPIA' : 'GUARDAR'}
        </motion.button>
      </div>
    </div>
  );
}
