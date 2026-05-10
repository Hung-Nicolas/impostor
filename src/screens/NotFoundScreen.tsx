import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

export function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <SearchX size={48} className="text-[#5A5A6A] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#F0F0F5] mb-2">Pagina no encontrada</h1>
        <p className="text-sm text-[#8A8A9A] mb-8">La pagina que buscas no existe o fue movida.</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#8A8A9A] font-semibold active:scale-[0.97] transition-transform"
        >
          Volver al inicio
        </button>
      </motion.div>
    </div>
  );
}
