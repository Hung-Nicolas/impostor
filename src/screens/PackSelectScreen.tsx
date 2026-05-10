import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Layers, ArrowRight } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { usePacksStore } from '@/stores/packsStore';
import { showToast } from '@/components/Toast';
import type { Pack } from '@/types';

export function PackSelectScreen() {
  const navigate = useNavigate();
  const { selectedPackIds, togglePack, startGame, players, loadUserWordStats } = useGameStore();
  const packs = usePacksStore((s: { packs: Pack[] }) => s.packs);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (selectedPackIds.length === 0) {
      showToast('Selecciona al menos un pack', 'error');
      return;
    }
    setLoading(true);
    await loadUserWordStats(selectedPackIds);
    const res = startGame();
    setLoading(false);
    if (res.success) {
      navigate('/reveal');
    } else {
      showToast(res.error || 'Error', 'error');
    }
  };

  const selectedCount = packs.filter((p: Pack) => selectedPackIds.includes(p.id)).reduce((s: number, p: Pack) => s + p.words.length, 0);

  return (
    <div className="flex flex-col min-h-full select-none" style={{ background: 'var(--bg-primary)' }}>
      <div className="shrink-0 flex items-center px-5 pt-4 pb-3">
        <button onClick={() => navigate('/setup')} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[#F0F0F5]" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-[#F0F0F5]">SELECCIONAR PACKS</h1>
      </div>

      <div className="px-5 mb-3">
        <p className="text-xs text-[#8A8A9A]">
          {selectedPackIds.length} packs · {selectedCount} palabras · {players.length} jugadores
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4 space-y-2.5">
        {[...packs]
          .sort((a, b) => (b.uses_count || 0) - (a.uses_count || 0))
          .map((pack: Pack) => {
            const selected = selectedPackIds.includes(pack.id);
            return (
              <motion.button
                key={pack.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => togglePack(pack.id)}
                className={`w-full flex items-center gap-4 rounded-2xl p-4 text-left border transition-all ${
                  selected
                    ? 'border-[rgba(0,229,204,0.3)] bg-[rgba(0,229,204,0.06)]'
                    : 'border-[rgba(255,255,255,0.06)] bg-[#14141C]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected ? 'border-[#00E5CC] bg-[#00E5CC]' : 'border-[#5A5A6A]'
                }`}>
                  {selected && <Check size={15} className="text-[#0A0A0F]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selected ? 'text-[#00E5CC]' : 'text-[#F0F0F5]'}`}>
                    {pack.name}
                  </p>
                  <p className="text-xs text-[#5A5A6A]">{pack.words.length} palabras · {pack.uses_count || 0} usos</p>
                </div>

                <Layers size={16} className={selected ? 'text-[#00E5CC]' : 'text-[#5A5A6A]'} />
              </motion.button>
            );
          })}
      </div>

      {/* Start */}
      <div className="shrink-0 px-5 pb-6 pt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          disabled={selectedPackIds.length === 0 || loading}
          className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold text-lg rounded-2xl py-4.5 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,229,204,0.25)] disabled:opacity-30 transition-all"
        >
          {loading ? '...' : <><ArrowRight size={20} /> COMENZAR</>}
        </motion.button>
      </div>
    </div>
  );
}
