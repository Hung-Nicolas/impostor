import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Package } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

const tabs = [
  { label: 'INICIO', icon: Play, path: '/' },
  { label: 'PAQUETES', icon: Package, path: '/packs' },
];

const gamePhases = ['revealing', 'discussion', 'voting', 'results'];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);

  if (gamePhases.includes(phase)) return null;
  const hideOnRoutes = ['/setup', '/packs/edit', '/packs/public', '/seleccionar-packs', '/reveal', '/discussion', '/acusar', '/results'];
  if (hideOnRoutes.some((r) => location.pathname.startsWith(r))) return null;

  return (
    <nav className="shrink-0 h-16 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.06)] z-[100] select-none">
      <div className="flex items-center justify-around h-full">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 w-20 h-full relative"
            >
              <motion.div animate={{ scale: isActive ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? 'text-[#00E5CC]' : 'text-[#5A5A6A]'}
                />
              </motion.div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#00E5CC]' : 'text-[#5A5A6A]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#00E5CC] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
