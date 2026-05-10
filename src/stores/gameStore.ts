import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GamePhase, GameMode, GameResults, Pack } from '@/types';
import { usePacksStore } from './packsStore';
import { incrementPackUses, fetchUserWordStats, incrementWordStat } from '@/lib/gameApi';

interface GameState {
  // Config
  phase: GamePhase;
  gameMode: GameMode;
  impostorCount: number;
  selectedPackIds: string[];
  giveImpostorHint: boolean;

  // Players
  players: Player[];
  nextPlayerId: number;

  // Round state
  roundNumber: number;
  currentRevealIndex: number;
  currentVoterIndex: number;
  timeRemaining: number;
  votesThisRound: Record<number, number>;

  // Game data
  roundWord: string;
  impostorWord: string;
  results: GameResults | null;

  // Word stats
  userWordStats: Record<string, number>;

  // Player management
  addPlayer: (name: string) => { success: boolean; error?: string };
  editPlayer: (id: number, updates: Partial<Omit<Player, 'id'>>) => void;
  removePlayer: (id: number) => void;
  getPlayerCount: () => number;
  togglePlayerActive: (id: number) => void;
  deactivateAllPlayers: () => void;

  // Config
  setGameMode: (mode: GameMode) => void;
  setImpostorCount: (count: number) => void;
  togglePack: (packId: string) => void;
  setGiveImpostorHint: (val: boolean) => void;

  // Game flow
  startGame: () => { success: boolean; error?: string };
  setRevealIndex: (idx: number) => void;
  startDiscussion: () => void;
  tickTimer: () => void;
  castVote: (voterIdx: number, votedIdx: number) => { gameOver: boolean; eliminatedName?: string; wasImpostor?: boolean };
  nextRound: () => void;
  endGame: (reason: 'impostors_found' | 'too_few_crewmates') => void;
  addScores: (winner: 'crewmates' | 'impostors' | 'chaos') => void;
  resetGame: () => void;
  resetKeepConfig: () => void;
  resetScores: () => void;

  // Getters
  getActivePlayers: () => Player[];
  getCurrentRevealingPlayer: () => Player | null;
  getCurrentVoter: () => Player | null;
  getVotingOptions: () => Player[];
  getEliminatedThisRound: () => { name: string; wasImpostor: boolean }[];

  // Word stats
  loadUserWordStats: (packIds: string[]) => Promise<void>;
  getWordCount: (packId: string, wordId: string) => number;
  incrementWordCount: (packId: string, wordId: string) => void;
}

const AVATAR_COLORS = [
  '#00E5CC', '#FF4D8A', '#8B5CF6', '#FFB800', '#22C55E',
  '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F59E0B',
  '#6366F1', '#10B981',
];

function getAvatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateHint(word: string, packCategories: string[]): string | undefined {
  const hintMap: Record<string, string> = {
    gato: 'Animal', perro: 'Animal', pajaro: 'Animal', pez: 'Animal',
    pizza: 'Comida', hamburguesa: 'Comida', sushi: 'Comida', pasta: 'Comida',
    playa: 'Lugar', montana: 'Lugar', ciudad: 'Lugar', bosque: 'Lugar',
    guitarra: 'Musica', piano: 'Musica', bateria: 'Musica', violin: 'Musica',
    futbol: 'Deporte', basketball: 'Deporte', tenis: 'Deporte', natacion: 'Deporte',
    avion: 'Transporte', coche: 'Transporte', tren: 'Transporte', barco: 'Transporte',
    doctor: 'Profesion', maestro: 'Profesion', policia: 'Profesion', bombero: 'Profesion',
    rojo: 'Color', azul: 'Color', verde: 'Color', amarillo: 'Color',
    sol: 'Naturaleza', luna: 'Naturaleza', estrella: 'Naturaleza', nube: 'Naturaleza',
    telefono: 'Tecnologia', computadora: 'Tecnologia', robot: 'Tecnologia', internet: 'Tecnologia',
    amor: 'Emocion', felicidad: 'Emocion', miedo: 'Emocion', enojo: 'Emocion',
    rey: 'Personaje', pirata: 'Personaje', astronauta: 'Personaje', ninja: 'Personaje',
  };
  const lower = word.toLowerCase();
  if (hintMap[lower]) return hintMap[lower];
  if (packCategories.length > 0) return packCategories[Math.floor(Math.random() * packCategories.length)];
  return undefined;
}

const initialState = {
  phase: 'idle' as GamePhase,
  gameMode: 'normal' as GameMode,
  impostorCount: 1,
  selectedPackIds: ['default-animales'],
  giveImpostorHint: false,
  players: [] as Player[],
  nextPlayerId: 0,
  roundNumber: 1,
  currentRevealIndex: 0,
  currentVoterIndex: 0,
  timeRemaining: 120,
  votesThisRound: {} as Record<number, number>,
  roundWord: '',
  impostorWord: '',
  results: null as GameResults | null,
  userWordStats: {} as Record<string, number>,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

  // === Player Management ===
  addPlayer: (name) => {
    const state = get();
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'El nombre no puede estar vacio' };
    if (trimmed.length > 20) return { success: false, error: 'Maximo 20 caracteres' };
    if (state.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'Ya existe un jugador con ese nombre' };
    }
    const newPlayer: Player = {
      id: state.nextPlayerId,
      name: trimmed,
      isImpostor: false,
      word: '',
      eliminated: false,
      avatarColor: getAvatarColor(state.nextPlayerId),
      score: 0,
      active: false,
    };
    set({
      players: [...state.players, newPlayer],
      nextPlayerId: state.nextPlayerId + 1,
    });
    return { success: true };
  },

  editPlayer: (id, updates) => {
    set((s) => ({
      players: s.players.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...updates };
        if (typeof updates.name === 'string') next.name = updates.name.trim() || p.name;
        return next;
      }),
    }));
  },

  removePlayer: (id) => {
    set((s) => ({
      players: s.players.filter((p) => p.id !== id),
    }));
  },

  getPlayerCount: () => get().players.filter((p) => p.active).length,

  deactivateAllPlayers: () => {
    set((s) => ({
      players: s.players.map((p) => ({ ...p, active: false })),
    }));
  },

  togglePlayerActive: (id) => {
    set((s) => {
      const idx = s.players.findIndex((p) => p.id === id);
      if (idx === -1) return s;
      const player = s.players[idx];
      const without = [...s.players.slice(0, idx), ...s.players.slice(idx + 1)];

      if (player.active) {
        // Desactivar: mover al final del array
        return { players: [...without, { ...player, active: false }] };
      }

      // Activar: insertar despues del ultimo activo
      let lastActiveIdx = -1;
      for (let i = without.length - 1; i >= 0; i--) {
        if (without[i].active) { lastActiveIdx = i; break; }
      }
      const insertAt = lastActiveIdx === -1 ? 0 : lastActiveIdx + 1;
      return {
        players: [
          ...without.slice(0, insertAt),
          { ...player, active: true },
          ...without.slice(insertAt),
        ],
      };
    });
  },

  // === Config ===
  setGameMode: (mode) => set({ gameMode: mode }),
  setImpostorCount: (count) => set({ impostorCount: count }),
  togglePack: (packId) => set((s) => ({
    selectedPackIds: s.selectedPackIds.includes(packId)
      ? s.selectedPackIds.filter((id) => id !== packId)
      : [...s.selectedPackIds, packId],
  })),
  setGiveImpostorHint: (val) => set({ giveImpostorHint: val }),

  // === Start Game ===
  startGame: () => {
    const state = get();
    const activePlayers = state.players.filter((p) => p.active);
    if (activePlayers.length < 3) return { success: false, error: 'Minimo 3 jugadores activos' };
    if (state.selectedPackIds.length === 0) return { success: false, error: 'Selecciona al menos un pack' };

    const packsStore = usePacksStore.getState();
    const allPacks = [...packsStore.packs, ...packsStore.publicPacks];
    const selectedPacks = state.selectedPackIds
      .map((id) => allPacks.find((p) => p.id === id))
      .filter(Boolean) as typeof allPacks;

    if (selectedPacks.length === 0 || selectedPacks.every((p) => p.words.length === 0)) {
      return { success: false, error: 'Los packs seleccionados no tienen palabras' };
    }

    // Increment uses for all selected packs
    const publicPackIds = new Set(packsStore.publicPacks.map((p: Pack) => p.id));
    state.selectedPackIds.forEach((id) => {
      if (publicPackIds.has(id)) {
        incrementPackUses(id);
      }
      packsStore.incrementUses(id);
    });

    // Combine all words from selected packs with pack reference
    const allWordsWithPack = selectedPacks.flatMap((p) => p.words.map((w) => ({ ...w, packId: p.id })));
    if (allWordsWithPack.length < 2) return { success: false, error: 'Se necesitan al menos 2 palabras' };

    // Weighted random: prefer words with lower seen_count
    const stats = get().userWordStats;
    function pickWeighted(words: typeof allWordsWithPack) {
      const weights = words.map((w) => 1 / ((stats[`${w.packId}:${w.id}`] || 0) + 1));
      const total = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * total;
      for (let i = 0; i < words.length; i++) {
        r -= weights[i];
        if (r <= 0) return words[i];
      }
      return words[words.length - 1];
    }

    const roundWordObj = pickWeighted(allWordsWithPack);
    const roundWord = roundWordObj.word;
    const remaining = allWordsWithPack.filter((w) => w.word !== roundWord);
    const impostorWordObj = remaining.length > 0 ? pickWeighted(remaining) : pickWeighted(allWordsWithPack);
    const impostorWord = impostorWordObj.word;

    // Increment word stats (fire and forget)
    get().incrementWordCount(roundWordObj.packId, roundWordObj.id);
    if (impostorWordObj.id !== roundWordObj.id) {
      get().incrementWordCount(impostorWordObj.packId, impostorWordObj.id);
    }

    // Determine impostor count
    const playerCount = activePlayers.length;
    let actualImpostorCount = state.impostorCount;

    if (state.gameMode === 'caos') {
      const options: { count: number; weight: number }[] = [
        { count: 0, weight: 5 },
        { count: 1, weight: 40 },
        ...(playerCount >= 4 ? [{ count: 2, weight: 30 }] : []),
        ...(playerCount >= 5 ? [{ count: 3, weight: 15 }] : []),
        ...(playerCount >= 3 ? [{ count: playerCount, weight: 10 }] : []),
      ];
      const totalWeight = options.reduce((s, o) => s + o.weight, 0);
      let r = Math.random() * totalWeight;
      for (const opt of options) {
        r -= opt.weight;
        if (r <= 0) { actualImpostorCount = opt.count; break; }
      }
    }

    const maxImpostors = Math.min(actualImpostorCount, Math.floor((playerCount - 1) / 2));
    const activeIndices = fisherYatesShuffle(activePlayers.map((_, i) => i));
    const impostorIndices = new Set(activeIndices.slice(0, maxImpostors));

    // Get pack categories for hints
    const packCategories = selectedPacks.map((p) => p.category);

    const updatedPlayers = state.players.map((p) => {
      if (!p.active) return { ...p, isImpostor: false, word: '', impostorHint: undefined, eliminated: false };
      const activeIdx = activePlayers.findIndex((ap) => ap.id === p.id);
      const isImpostor = impostorIndices.has(activeIdx);
      const hint = isImpostor && state.giveImpostorHint
        ? generateHint(roundWord, packCategories)
        : undefined;
      return {
        ...p,
        isImpostor,
        word: isImpostor ? (hint ? impostorWord : '') : roundWord,
        impostorHint: hint,
        eliminated: false,
      };
    });

    set({
      phase: 'revealing',
      players: updatedPlayers,
      roundWord,
      impostorWord,
      impostorCount: actualImpostorCount,
      roundNumber: state.roundNumber,
      currentRevealIndex: 0,
      currentVoterIndex: 0,
      timeRemaining: 120,
      votesThisRound: {},
      results: null,
    });

    return { success: true };
  },

  // === Reveal ===
  setRevealIndex: (idx) => set({ currentRevealIndex: idx }),

  // === Discussion ===
  startDiscussion: () => {
    const activePlayers = get().players.filter((p) => !p.eliminated && p.active);
    const starterIndex = activePlayers.length > 0 ? Math.floor(Math.random() * activePlayers.length) : 0;
    set({
      phase: 'discussion',
      timeRemaining: Math.max(60, activePlayers.length * 25),
      currentVoterIndex: starterIndex,
    });
  },

  tickTimer: () => {
    set((s) => {
      const next = s.timeRemaining - 1;
      return { timeRemaining: Math.max(0, next) };
    });
  },

  // === Voting ===
  castVote: (_voterIdx, votedIdx) => {
    const state = get();
    const votedPlayer = state.players[votedIdx];

    if (votedPlayer.isImpostor) {
      // GAME OVER - impostor found!
      const winner = state.gameMode === 'caos' && state.impostorCount === 0 ? 'chaos' : 'crewmates';
      get().addScores(winner);

      const afterState = get();
      const eliminatedList = [...(afterState.results?.eliminatedPlayers || [])];
      const newEliminated = {
        name: votedPlayer.name,
        wasImpostor: true,
        round: state.roundNumber,
      };

      const survivingPlayers = afterState.players
        .filter((p) => !p.eliminated && p.id !== votedIdx && p.active)
        .map((p) => p.name);

      const results: GameResults = {
        impostorIndices: afterState.players
          .map((p, i) => (p.isImpostor ? i : -1))
          .filter((i) => i !== -1),
        winner,
        roundWord: afterState.roundWord,
        impostorWord: afterState.impostorWord,
        totalRounds: afterState.roundNumber,
        eliminatedPlayers: [...eliminatedList, newEliminated],
        survivingPlayers,
        chaosResult: afterState.gameMode === 'caos'
          ? afterState.impostorCount === 0
            ? 'No habia impostores... el caos gano'
            : afterState.impostorCount === afterState.players.filter((p) => p.active).length
            ? 'Todos eran impostores... el caos reino'
            : `Habia ${afterState.impostorCount} impostor(es)`
          : undefined,
      };

      set({
        phase: 'results',
        results,
        votesThisRound: {},
      });

      return { gameOver: true, eliminatedName: votedPlayer.name, wasImpostor: true };
    }

    // Not an impostor - eliminate and continue
    const updatedPlayers = state.players.map((p, i) =>
      i === votedIdx ? { ...p, eliminated: true } : p
    );

    // Check if too few crewmates remain
    const activePlayers = updatedPlayers.filter((p) => !p.eliminated && p.active);
    const activeImpostors = activePlayers.filter((p) => p.isImpostor).length;
    const activeCrewmates = activePlayers.filter((p) => !p.isImpostor).length;

    if (activeCrewmates <= activeImpostors) {
      // Impostors win!
      get().addScores('impostors');

      const afterState = get();
      const eliminatedList = [...(afterState.results?.eliminatedPlayers || [])];
      const newEliminated = {
        name: votedPlayer.name,
        wasImpostor: false,
        round: state.roundNumber,
      };

      const survivingPlayers = afterState.players
        .filter((p) => !p.eliminated && p.active)
        .map((p) => p.name);

      const results: GameResults = {
        impostorIndices: afterState.players
          .map((p, i) => (p.isImpostor ? i : -1))
          .filter((i) => i !== -1),
        winner: 'impostors',
        roundWord: afterState.roundWord,
        impostorWord: afterState.impostorWord,
        totalRounds: afterState.roundNumber,
        eliminatedPlayers: [...eliminatedList, newEliminated],
        survivingPlayers,
      };

      set({
        phase: 'results',
        players: updatedPlayers,
        results,
        votesThisRound: {},
      });

      return { gameOver: true, eliminatedName: votedPlayer.name, wasImpostor: false };
    }

    // Continue to next round
    const eliminatedList = [...(state.results?.eliminatedPlayers || [])];
    const newEliminated = {
      name: votedPlayer.name,
      wasImpostor: false,
      round: state.roundNumber,
    };

    set({
      players: updatedPlayers,
      votesThisRound: {},
      results: {
        ...(state.results || {}),
        impostorIndices: state.players
          .map((p, i) => (p.isImpostor ? i : -1))
          .filter((i) => i !== -1),
        roundWord: state.roundWord,
        impostorWord: state.impostorWord,
        totalRounds: state.roundNumber,
        eliminatedPlayers: [...eliminatedList, newEliminated],
      } as GameResults,
    });

    return { gameOver: false, eliminatedName: votedPlayer.name, wasImpostor: false };
  },

  nextRound: () => {
    console.log('[nextRound] antes:', get().roundNumber);
    set((s) => ({
      roundNumber: s.roundNumber + 1,
      currentRevealIndex: 0,
      currentVoterIndex: 0,
      timeRemaining: Math.max(60, s.players.filter((p) => !p.eliminated && p.active).length * 25),
      phase: 'revealing',
      votesThisRound: {},
    }));
  },

  addScores: (winner) => {
    set((state) => ({
      players: state.players.map((p) => {
        const current = p.score ?? 0;
        if (winner === 'chaos') {
          return { ...p, score: current + 1 };
        }
        const isImpostor = p.isImpostor;
        const crewWon = winner === 'crewmates';
        const shouldAdd = crewWon ? !isImpostor : isImpostor;
        return shouldAdd ? { ...p, score: current + 1 } : p;
      }),
    }));
  },

  endGame: (reason) => {
    const state = get();
    const activePlayers = state.players.filter((p) => !p.eliminated);
    const survivingPlayers = activePlayers.map((p) => p.name);

    const results: GameResults = {
      impostorIndices: state.players
        .map((p, i) => (p.isImpostor ? i : -1))
        .filter((i) => i !== -1),
      winner: reason === 'impostors_found' ? 'crewmates' : 'impostors',
      roundWord: state.roundWord,
      impostorWord: state.impostorWord,
      totalRounds: state.roundNumber,
      eliminatedPlayers: state.results?.eliminatedPlayers || [],
      survivingPlayers,
    };

    set({ phase: 'results', results });
  },

  // === Reset ===
  resetGame: () =>
    set((state) => ({
      ...initialState,
      gameMode: state.gameMode,
      impostorCount: state.gameMode === 'normal' ? state.impostorCount : 1,
      selectedPackIds: state.selectedPackIds,
      giveImpostorHint: state.giveImpostorHint,
      players: state.players.map((p) => ({
        ...p,
        isImpostor: false,
        word: '',
        impostorHint: undefined,
        eliminated: false,
        score: p.score ?? 0,
        active: p.active ?? true,
      })),
      nextPlayerId: state.players.length,
    })),

  resetKeepConfig: () =>
    set((state) => ({
      ...initialState,
      gameMode: state.gameMode,
      impostorCount: state.gameMode === 'normal' ? state.impostorCount : 1,
      selectedPackIds: state.selectedPackIds,
      giveImpostorHint: state.giveImpostorHint,
      roundNumber: state.roundNumber + 1,
      players: state.players.map((p) => ({
        ...p,
        isImpostor: false,
        word: '',
        impostorHint: undefined,
        eliminated: false,
        score: p.score ?? 0,
      })),
      nextPlayerId: state.players.length,
      phase: 'setup',
    })),

  resetScores: () =>
    set((state) => ({
      players: state.players.map((p) => ({ ...p, score: 0 })),
    })),

      // === Getters ===
      getActivePlayers: () => get().players.filter((p) => !p.eliminated && p.active),
      getCurrentRevealingPlayer: () => {
        const active = get().players.filter((p) => p.active);
        return active[get().currentRevealIndex] || null;
      },
      getCurrentVoter: () => {
        const active = get().players.filter((p) => p.active);
        return active[get().currentVoterIndex] || null;
      },
      getVotingOptions: () => {
        const state = get();
        return state.players.filter((p) => !p.eliminated && p.active);
      },
      getEliminatedThisRound: () => {
        const state = get();
        return state.results?.eliminatedPlayers?.filter((e) => e.round === state.roundNumber) || [];
      },

      // === Word stats ===
      loadUserWordStats: async (packIds) => {
        if (packIds.length === 0) return;
        const stats = await fetchUserWordStats(packIds);
        set((state) => {
          const next = { ...state.userWordStats };
          stats.forEach((s) => {
            next[`${s.pack_id}:${s.word_id}`] = s.seen_count;
          });
          return { userWordStats: next };
        });
      },

      getWordCount: (packId, wordId) => {
        return get().userWordStats[`${packId}:${wordId}`] || 0;
      },

      incrementWordCount: (packId, wordId) => {
        set((state) => {
          const key = `${packId}:${wordId}`;
          const next = { ...state.userWordStats, [key]: (state.userWordStats[key] || 0) + 1 };
          return { userWordStats: next };
        });
        incrementWordStat(packId, wordId);
      },
    }),
    {
      name: 'impostor-game-storage',
      version: 1,
      migrate: (persistedState: any) => {
        if (persistedState?.players && Array.isArray(persistedState.players)) {
          persistedState.players = persistedState.players.map((p: any) => ({
            ...p,
            score: typeof p?.score === 'number' ? p.score : 0,
            active: p.active !== undefined ? p.active : false,
          }));
        }
        return persistedState;
      },
      partialize: (state) => ({
        players: state.players,
        nextPlayerId: state.nextPlayerId,
        gameMode: state.gameMode,
        impostorCount: state.impostorCount,
        selectedPackIds: state.selectedPackIds,
        giveImpostorHint: state.giveImpostorHint,
        userWordStats: state.userWordStats,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Resetear estado de partida activa al rehidratar
          state.phase = 'idle';
          state.currentRevealIndex = 0;
          state.currentVoterIndex = 0;
          state.timeRemaining = 120;
          state.votesThisRound = {};
          state.roundWord = '';
          state.impostorWord = '';
          state.results = null;
        }
      },
    }
  )
);
