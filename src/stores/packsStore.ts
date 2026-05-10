import { create } from 'zustand';
import type { Pack } from '@/types';
import { defaultPacks } from '@/data/defaultPacks';
import { fetchPublicPacks, likePack, unlikePack, incrementPackUses, incrementPackDownloads, fetchUserLikes } from '@/lib/gameApi';

const STORAGE_KEY = 'impostor_guest_packs';
const ADMIN_OVERRIDES_KEY = 'impostor_admin_overrides';
const GUEST_ID_KEY = 'impostor_guest_id';

function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

function loadGuestPacks(): Pack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestPacks(packs: Pack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
}

function loadAdminOverrides(): Record<string, Pack> {
  try {
    const raw = localStorage.getItem(ADMIN_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAdminOverrides(overrides: Record<string, Pack>) {
  localStorage.setItem(ADMIN_OVERRIDES_KEY, JSON.stringify(overrides));
}

function mergeDefaultPacks(): Pack[] {
  const overrides = loadAdminOverrides();
  return defaultPacks.map((p) => overrides[p.id] ?? p);
}

interface PacksState {
  packs: Pack[];
  selectedPackId: string;
  isLoading: boolean;
  publicPacks: Pack[];
  isPublicPacksLoading: boolean;
  likedPackIds: Set<string>;

  setSelectedPack: (id: string) => void;
  loadPacks: () => void;
  createPack: (pack: Omit<Pack, 'id'>) => Pack;
  updatePack: (id: string, data: Partial<Pack>) => void;
  deletePack: (id: string) => void;
  updateDefaultPack: (id: string, data: Partial<Pack>) => void;
  loadPublicPacks: () => Promise<void>;
  loadUserLikes: () => Promise<void>;
  importPublicPack: (pack: Pack) => Promise<Pack>;
  likePublicPack: (packId: string) => Promise<void>;
  usePublicPack: (packId: string) => void;
  incrementUses: (packId: string) => void;
}

export const usePacksStore = create<PacksState>((set) => ({
  packs: [...mergeDefaultPacks(), ...loadGuestPacks()],
  selectedPackId: 'default-animales',
  isLoading: false,
  publicPacks: [],
  isPublicPacksLoading: false,
  likedPackIds: new Set(),

  setSelectedPack: (id) => set({ selectedPackId: id }),

  loadPacks: () => {
    const guestPacks = loadGuestPacks();
    set({
      packs: [...mergeDefaultPacks(), ...guestPacks],
      isLoading: false,
    });
  },

  createPack: (packData) => {
    const newPack: Pack = {
      ...packData,
      id: `guest-${Date.now()}`,
      user_id: `guest-${getGuestId()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => {
      const updated = [...state.packs, newPack];
      const customPacks = updated.filter(p => !p.id.startsWith('default-'));
      saveGuestPacks(customPacks);
      return { packs: updated };
    });
    return newPack;
  },

  updatePack: (id, data) => {
    set((state) => {
      const updated = state.packs.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      );
      const customPacks = updated.filter(p => !p.id.startsWith('default-'));
      saveGuestPacks(customPacks);
      return { packs: updated };
    });
  },

  deletePack: (id) => {
    set((state) => {
      const updated = state.packs.filter((p) => p.id !== id);
      const customPacks = updated.filter(p => !p.id.startsWith('default-'));
      saveGuestPacks(customPacks);
      return { packs: updated };
    });
  },

  updateDefaultPack: (id, data) => {
    set((state) => {
      const overrides = loadAdminOverrides();
      const existing = state.packs.find((p) => p.id === id) ?? defaultPacks.find((p) => p.id === id);
      const updated = { ...(existing as Pack), ...data, id, updated_at: new Date().toISOString() };
      overrides[id] = updated;
      saveAdminOverrides(overrides);
      const mergedPacks = [...mergeDefaultPacks(), ...loadGuestPacks()];
      return { packs: mergedPacks };
    });
  },

  loadPublicPacks: async () => {
    set({ isPublicPacksLoading: true });
    const packs = await fetchPublicPacks();
    set({ publicPacks: packs, isPublicPacksLoading: false });
  },

  loadUserLikes: async () => {
    const ids = await fetchUserLikes();
    set({ likedPackIds: new Set(ids) });
  },

  likePublicPack: async (packId) => {
    const state = usePacksStore.getState();

    // Optimistic update: flip immediately, no cooldown
    const wasLiked = state.likedPackIds.has(packId);
    const optimisticCount =
      (state.publicPacks.find((p: Pack) => p.id === packId)?.likes_count || 0) +
      (wasLiked ? -1 : 1);

    set((s) => {
      const nextLiked = new Set(s.likedPackIds);
      if (wasLiked) nextLiked.delete(packId);
      else nextLiked.add(packId);
      return {
        likedPackIds: nextLiked,
        publicPacks: s.publicPacks.map((p: Pack) =>
          p.id === packId ? { ...p, likes_count: Math.max(0, optimisticCount) } : p
        ),
      };
    });

    const serverCount = wasLiked
      ? await unlikePack(packId)
      : await likePack(packId);

    if (serverCount === null) {
      // Revert on failure
      set((s) => {
        const nextLiked = new Set(s.likedPackIds);
        if (wasLiked) nextLiked.add(packId);
        else nextLiked.delete(packId);
        const revertCount =
          (s.publicPacks.find((p: Pack) => p.id === packId)?.likes_count || 0) +
          (wasLiked ? 1 : -1);
        return {
          likedPackIds: nextLiked,
          publicPacks: s.publicPacks.map((p: Pack) =>
            p.id === packId ? { ...p, likes_count: Math.max(0, revertCount) } : p
          ),
        };
      });
      return;
    }

    // Sync only the numeric count from server
    set((state) => ({
      publicPacks: state.publicPacks.map((p: Pack) =>
        p.id === packId ? { ...p, likes_count: serverCount } : p
      ),
    }));
  },

  usePublicPack: (packId) => {
    incrementPackUses(packId);
    set((state) => ({
      publicPacks: state.publicPacks.map((p) =>
        p.id === packId ? { ...p, uses_count: p.uses_count + 1 } : p
      ),
    }));
  },

  incrementUses: (packId) => {
    set((state) => {
      const pack = state.packs.find((p) => p.id === packId);
      if (!pack) return state;

      const nextUses = (pack.uses_count || 0) + 1;
      const updated = state.packs.map((p) =>
        p.id === packId ? { ...p, uses_count: nextUses } : p
      );

      // Persistir segun tipo de pack
      if (pack.id.startsWith('default-')) {
        const overrides = loadAdminOverrides();
        overrides[packId] = { ...(overrides[packId] ?? pack), uses_count: nextUses };
        saveAdminOverrides(overrides);
      } else if (!pack.id.startsWith('imported-') && !state.publicPacks.some((p) => p.id === packId)) {
        const customPacks = updated.filter((p) => !p.id.startsWith('default-'));
        saveGuestPacks(customPacks);
      }

      // Si es un pack importado, tambien incrementar el uso del pack original en Supabase
      if (pack.source_pack_id) {
        incrementPackUses(pack.source_pack_id);
      }

      return { packs: updated };
    });
  },

  importPublicPack: async (pack) => {
    await incrementPackDownloads(pack.id);
    const imported: Pack = {
      ...pack,
      id: `imported-${Date.now()}`,
      user_id: `guest-${getGuestId()}`,
      is_public: false,
      likes_count: 0,
      uses_count: 0,
      downloads_count: 0,
      source_pack_id: pack.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => {
      const updated = [...state.packs, imported];
      const customPacks = updated.filter(p => !p.id.startsWith('default-'));
      saveGuestPacks(customPacks);
      return {
        packs: updated,
        publicPacks: state.publicPacks.map((p) =>
          p.id === pack.id ? { ...p, downloads_count: p.downloads_count + 1 } : p
        ),
      };
    });
    return imported;
  },
}));
