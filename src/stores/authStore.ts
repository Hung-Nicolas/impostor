import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginModalOpen: boolean;
  loginMode: 'login' | 'register';

  openLogin: (mode?: 'login' | 'register') => void;
  closeLogin: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  initSession: () => Promise<void>;
}

async function fetchProfileRole(userId: string): Promise<'user' | 'admin'> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (error || !data) return 'user';
    return data.role === 'admin' ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}

const mapUser = async (sessionUser: any): Promise<User | null> => {
  if (!sessionUser) return null;
  const role = await fetchProfileRole(sessionUser.id);
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    username: sessionUser.user_metadata?.username ?? sessionUser.email?.split('@')[0] ?? '',
    role,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  loginModalOpen: false,
  loginMode: 'login',

  openLogin: (mode = 'login') => set({ loginModalOpen: true, loginMode: mode }),
  closeLogin: () => set({ loginModalOpen: false }),

  initSession: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    const user = await mapUser(session?.user ?? null);
    set({ user, isAuthenticated: !!user, isAdmin: user?.role === 'admin', isLoading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = await mapUser(session?.user ?? null);
      set({ user, isAuthenticated: !!user, isAdmin: user?.role === 'admin' });
    });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });

    if (error) return error.message;

    const user = await mapUser(data.user);
    set({ user, isAuthenticated: true, isAdmin: user?.role === 'admin', loginModalOpen: false });
    return null;
  },

  signUp: async (email, password, username) => {
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (username.length < 3) return 'El usuario debe tener al menos 3 caracteres';

    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    set({ isLoading: false });

    if (error) return error.message;

    const user = await mapUser(data.user);
    set({ user, isAuthenticated: true, isAdmin: user?.role === 'admin', loginModalOpen: false });
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isAdmin: false, loginModalOpen: false });
  },
}));
