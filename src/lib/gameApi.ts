import { supabase } from './supabase';
import type { Pack } from '@/types';

export interface SavedPlayer {
  id: string;
  name: string;
  avatar_color: string;
  wins: number;
  losses: number;
  games_played: number;
  score: number;
}

export interface PublicPackRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  words: any[];
  likes_count: number;
  uses_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  profiles?: { username: string } | null;
}

// Flag para evitar requests repetidos si las tablas no existen
let tablesExist: boolean | null = null;

function checkError(error: any): boolean {
  if (error?.code === 'PGRST205' || error?.message?.includes('schema cache')) {
    tablesExist = false;
    return false;
  }
  return true;
}

export async function fetchSavedPlayers(): Promise<SavedPlayer[]> {
  if (tablesExist === false) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('saved_players')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      if (!checkError(error)) return [];
      return [];
    }

    tablesExist = true;
    return data || [];
  } catch {
    return [];
  }
}

export async function upsertSavedPlayer(name: string, avatarColor: string, score?: number): Promise<SavedPlayer | null> {
  if (tablesExist === false) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const payload: any = { user_id: session.user.id, name, avatar_color: avatarColor };
    if (typeof score === 'number') payload.score = score;

    const { data, error } = await supabase
      .from('saved_players')
      .upsert(payload, { onConflict: 'user_id,name' })
      .select()
      .single();

    if (error) {
      if (!checkError(error)) return null;
      return null;
    }

    tablesExist = true;
    return data;
  } catch {
    return null;
  }
}

export async function deleteSavedPlayer(name: string): Promise<boolean> {
  if (tablesExist === false) return false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from('saved_players')
      .delete()
      .eq('user_id', session.user.id)
      .eq('name', name);

    if (error) {
      if (!checkError(error)) return false;
      return false;
    }

    tablesExist = true;
    return true;
  } catch {
    return false;
  }
}


// ============================================================
// PROFILE HELPERS
// ============================================================

async function ensureProfile(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const userId = session.user.id;
    const email = session.user.email || '';
    const username = session.user.user_metadata?.username || email.split('@')[0] || 'usuario';

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) return true;

    // Try direct insert first (works if INSERT RLS policy exists)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, username, avatar_color: '#00E5CC' });

    if (!insertError) return true;

    // If RLS blocked us (42501), fallback to RPC with SECURITY DEFINER
    if (insertError.code === '42501') {
      console.log('[ensureProfile] RLS blocked direct insert, using RPC fallback');
      const { error: rpcError } = await supabase.rpc('ensure_profile', {
        user_uuid: userId,
        user_username: username,
        user_avatar: '#00E5CC',
      });
      if (!rpcError) return true;
      console.error('[ensureProfile] RPC fallback error:', rpcError);
      return false;
    }

    console.error('[ensureProfile] insert error:', insertError);
    return false;
  } catch (e) {
    console.error('[ensureProfile] exception:', e);
    return false;
  }
}

// ============================================================
// PUBLIC PACKS API
// ============================================================

function rowToPack(row: PublicPackRow): Pack {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    category: row.category,
    is_public: row.is_public,
    words: (row.words || []).map((w: any) => ({
      id: w.id || crypto.randomUUID(),
      word: w.word || '',
      hints: Array.isArray(w.hints) ? w.hints : [],
      category: w.category,
    })),
    likes_count: row.likes_count || 0,
    uses_count: row.uses_count || 0,
    downloads_count: row.downloads_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchPublicPacks(): Promise<Pack[]> {
  try {
    const { data, error } = await supabase
      .from('packs')
      .select('*, profiles:user_id (username)')
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .order('uses_count', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[fetchPublicPacks] error:', error);
      checkError(error);
      return [];
    }

    tablesExist = true;
    return (data || []).map((row: any) => rowToPack({
      ...row,
      profiles: row.profiles,
    }));
  } catch (e) {
    console.error('[fetchPublicPacks] exception:', e);
    return [];
  }
}

export async function createPublicPack(pack: Omit<Pack, 'id' | 'created_at' | 'updated_at'>): Promise<Pack | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('[createPublicPack] no session');
      return null;
    }

    // Ensure profile exists before inserting pack
    const profileOk = await ensureProfile();
    if (!profileOk) {
      console.error('[createPublicPack] failed to ensure profile');
      return null;
    }

    // Full payload with counters
    const fullPayload = {
      user_id: session.user.id,
      name: pack.name,
      description: pack.description || '',
      category: pack.category || 'General',
      is_public: true,
      words: pack.words || [],
      likes_count: 0,
      uses_count: 0,
      downloads_count: 0,
    };

    const { data, error } = await supabase
      .from('packs')
      .insert(fullPayload)
      .select()
      .single();

    if (!error) {
      tablesExist = true;
      return rowToPack(data);
    }

    // Fallback: if columns are missing, try minimal insert
    if (error.code === 'PGRST204') {
      console.warn('[createPublicPack] columns missing, trying minimal insert');
      const minimalPayload = {
        user_id: session.user.id,
        name: pack.name,
        description: pack.description || '',
        category: pack.category || 'General',
        is_public: true,
        words: pack.words || [],
      };
      const { data: minData, error: minError } = await supabase
        .from('packs')
        .insert(minimalPayload)
        .select()
        .single();

      if (minError) {
        console.error('[createPublicPack] minimal insert error:', minError);
        checkError(minError);
        return null;
      }

      tablesExist = true;
      return rowToPack(minData);
    }

    console.error('[createPublicPack] error:', error);
    checkError(error);
    return null;
  } catch (e) {
    console.error('[createPublicPack] exception:', e);
    return null;
  }
}

export async function deletePublicPack(packId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from('packs')
      .delete()
      .eq('id', packId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[deletePublicPack] error:', error);
      checkError(error);
      return false;
    }

    tablesExist = true;
    return true;
  } catch (e) {
    console.error('[deletePublicPack] exception:', e);
    return false;
  }
}

export async function updatePublicPack(packId: string, updates: Partial<Pack>): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.words !== undefined) payload.words = updates.words;
    if (updates.is_public !== undefined) payload.is_public = updates.is_public;

    const { error } = await supabase
      .from('packs')
      .update(payload)
      .eq('id', packId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[updatePublicPack] error:', error);
      checkError(error);
      return false;
    }

    tablesExist = true;
    return true;
  } catch (e) {
    console.error('[updatePublicPack] exception:', e);
    return false;
  }
}

export async function fetchUserLikes(): Promise<string[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('pack_likes')
      .select('pack_id')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[fetchUserLikes] error:', error);
      return [];
    }
    return (data || []).map((r) => r.pack_id);
  } catch (e) {
    console.error('[fetchUserLikes] exception:', e);
    return [];
  }
}

export async function likePack(packId: string): Promise<number | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const profileOk = await ensureProfile();
    if (!profileOk) {
      console.error('[likePack] failed to ensure profile');
      return null;
    }

    const userId = session.user.id;

    // Upsert like (no-op if already exists — avoids 409 entirely)
    const { error: upsertError } = await supabase
      .from('pack_likes')
      .upsert(
        { pack_id: packId, user_id: userId },
        { onConflict: 'pack_id,user_id' }
      );
    if (upsertError) {
      console.error('[likePack] upsert error:', upsertError);
      return null;
    }

    // Increment counter
    const { error: rpcError } = await supabase.rpc('increment_pack_likes', { pack_uuid: packId });
    if (rpcError) {
      console.warn('[likePack] RPC failed, using fallback:', rpcError);
      const { data: pack } = await supabase.from('packs').select('likes_count').eq('id', packId).single();
      const next = (pack?.likes_count || 0) + 1;
      await supabase.from('packs').update({ likes_count: next }).eq('id', packId);
      return next;
    }
    const { data: pack } = await supabase.from('packs').select('likes_count').eq('id', packId).single();
    return pack?.likes_count || 0;
  } catch (e) {
    console.error('[likePack] exception:', e);
    return null;
  }
}

export async function unlikePack(packId: string): Promise<number | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const userId = session.user.id;

    // Delete like (ignore if not exists)
    await supabase
      .from('pack_likes')
      .delete()
      .eq('pack_id', packId)
      .eq('user_id', userId);

    // Decrement counter
    const { error: rpcError } = await supabase.rpc('decrement_pack_likes', { pack_uuid: packId });
    if (rpcError) {
      console.warn('[unlikePack] RPC failed, using fallback:', rpcError);
      const { data: pack } = await supabase.from('packs').select('likes_count').eq('id', packId).single();
      const next = Math.max(0, (pack?.likes_count || 1) - 1);
      await supabase.from('packs').update({ likes_count: next }).eq('id', packId);
      return next;
    }
    const { data: pack } = await supabase.from('packs').select('likes_count').eq('id', packId).single();
    return pack?.likes_count || 0;
  } catch (e) {
    console.error('[unlikePack] exception:', e);
    return null;
  }
}

export async function incrementPackUses(packId: string): Promise<void> {
  try {
    const { error: rpcError } = await supabase.rpc('increment_pack_uses', { pack_uuid: packId });
    if (!rpcError) return;

    // Fallback: direct update if RPC doesn't exist
    try {
      const { data: pack, error: selError } = await supabase.from('packs').select('uses_count').eq('id', packId).single();
      if (selError) return;
      const next = (pack?.uses_count || 0) + 1;
      await supabase.from('packs').update({ uses_count: next }).eq('id', packId);
    } catch {
      // Silently ignore if column doesn't exist
    }
  } catch (e) {
    console.error('[incrementPackUses] exception:', e);
  }
}

export async function incrementPackDownloads(packId: string): Promise<void> {
  try {
    const { error: rpcError } = await supabase.rpc('increment_pack_downloads', { pack_uuid: packId });
    if (!rpcError) return;

    // Fallback: direct update if RPC doesn't exist
    try {
      const { data: pack, error: selError } = await supabase.from('packs').select('downloads_count').eq('id', packId).single();
      if (selError) return;
      const next = (pack?.downloads_count || 0) + 1;
      await supabase.from('packs').update({ downloads_count: next }).eq('id', packId);
    } catch {
      // Silently ignore if column doesn't exist
    }
  } catch (e) {
    console.error('[incrementPackDownloads] exception:', e);
  }
}

export interface UserWordStat {
  pack_id: string;
  word_id: string;
  seen_count: number;
}

export async function fetchUserWordStats(packIds: string[]): Promise<UserWordStat[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('user_word_stats')
      .select('pack_id, word_id, seen_count')
      .eq('user_id', session.user.id)
      .in('pack_id', packIds);

    if (error) {
      console.error('[fetchUserWordStats] error:', error);
      return [];
    }
    return (data || []) as UserWordStat[];
  } catch (e) {
    console.error('[fetchUserWordStats] exception:', e);
    return [];
  }
}

export async function incrementWordStat(packId: string, wordId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error: rpcError } = await supabase.rpc('increment_word_stat', {
      user_uuid: session.user.id,
      pack: packId,
      word: wordId,
    });
    if (!rpcError) return;

    // Fallback: direct upsert if RPC doesn't exist
    try {
      const { data: existing } = await supabase
        .from('user_word_stats')
        .select('seen_count')
        .eq('user_id', session.user.id)
        .eq('pack_id', packId)
        .eq('word_id', wordId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_word_stats')
          .update({ seen_count: existing.seen_count + 1 })
          .eq('user_id', session.user.id)
          .eq('pack_id', packId)
          .eq('word_id', wordId);
      } else {
        await supabase
          .from('user_word_stats')
          .insert({ user_id: session.user.id, pack_id: packId, word_id: wordId, seen_count: 1 });
      }
    } catch {
      // Silently ignore if table doesn't exist
    }
  } catch (e) {
    console.error('[incrementWordStat] exception:', e);
  }
}

export async function syncPlayerScores(players: { name: string; avatar_color: string; score: number }[]): Promise<boolean> {
  if (tablesExist === false) return false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    if (players.length === 0) return true;

    const rows = players.map((p) => ({
      user_id: session.user.id,
      name: p.name,
      avatar_color: p.avatar_color,
      score: p.score,
    }));

    const { error } = await supabase
      .from('saved_players')
      .upsert(rows, { onConflict: 'user_id,name' });

    if (error) {
      if (!checkError(error)) return false;
      console.error('[syncPlayerScores] error:', error);
      return false;
    }

    tablesExist = true;
    return true;
  } catch (e) {
    console.error('[syncPlayerScores] exception:', e);
    return false;
  }
}
