import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { TabBar } from '@/components/TabBar';
import { ToastContainer } from '@/components/Toast';
import { HomeScreen } from '@/screens/HomeScreen';
import { GameSetupScreen } from '@/screens/GameSetupScreen';
import { PackSelectScreen } from '@/screens/PackSelectScreen';
import { RevealScreen } from '@/screens/RevealScreen';
import { DiscussionScreen } from '@/screens/DiscussionScreen';
import { AccusationScreen } from '@/screens/AccusationScreen';
import { ResultsScreen } from '@/screens/ResultsScreen';
import { PacksScreen } from '@/screens/PacksScreen';
import { PackEditorScreen } from '@/screens/PackEditorScreen';
import { NotFoundScreen } from '@/screens/NotFoundScreen';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

const tabBarRoutes = ['/', '/packs', '/packs/edit', '/packs/public'];
const gameRoutes = ['/reveal', '/discussion', '/acusar', '/results', '/setup', '/seleccionar-packs'];

export default function App() {
  const location = useLocation();
  useEffect(() => {
    useAuthStore.getState().initSession();
  }, []);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const showTabBar = tabBarRoutes.some((r) => location.pathname === r || (r !== '/' && location.pathname.startsWith(r)));
  const isGameActive = gameRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <MotionConfig transition={animationsEnabled ? undefined : { duration: 0 }}>
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: '#08080D' }}>
      <div className="flex-1 flex justify-center w-full overflow-hidden">
        <div className="w-full max-w-[430px] h-full flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

          <main className="flex-1 overflow-y-auto scrollbar-hide overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: isGameActive ? 0 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isGameActive ? 0 : -15 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                className="h-full flex flex-col"
              >
                <Routes location={location}>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/setup" element={<GameSetupScreen />} />
                  <Route path="/seleccionar-packs" element={<PackSelectScreen />} />
                  <Route path="/reveal" element={<RevealScreen />} />
                  <Route path="/discussion" element={<DiscussionScreen />} />
                  <Route path="/acusar" element={<AccusationScreen />} />
                  <Route path="/results" element={<ResultsScreen />} />
                  <Route path="/packs" element={<PacksScreen />} />
                  <Route path="/packs/edit/:id?" element={<PackEditorScreen />} />
                  <Route path="*" element={<NotFoundScreen />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {showTabBar && !isGameActive && <TabBar />}
        </div>
      </div>
      <ToastContainer />
    </div>
    </MotionConfig>
  );
}
