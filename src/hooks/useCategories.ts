import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export interface PostCategory {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
}

const CACHE_KEY = 'post_categories_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

interface CachedCategories {
  data: PostCategory[];
  timestamp: number;
}

/**
 * Hook untuk mengambil daftar kategori postingan dari server,
 * dengan caching di AsyncStorage selama 30 menit.
 * Fallback ke cache lama jika network error.
 */
export function useCategories() {
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Cek cache dulu (kecuali force refresh)
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedCategories = JSON.parse(cached);
          const isStale = Date.now() - parsed.timestamp > CACHE_TTL_MS;

          if (!isStale && parsed.data.length > 0) {
            setCategories(parsed.data);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch dari server
      const response = await apiClient.get(ENDPOINTS.POSTS.CATEGORIES);
      const data: PostCategory[] = response.data?.data?.categories ?? [];

      if (data.length > 0) {
        setCategories(data);
        // Simpan ke cache
        const cacheEntry: CachedCategories = { data, timestamp: Date.now() };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
      }
    } catch (err: any) {
      // Jika gagal, coba pakai cache lama meski stale
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedCategories = JSON.parse(cached);
          if (parsed.data.length > 0) {
            setCategories(parsed.data);
            return; // gunakan cache stale, tidak tampilkan error
          }
        }
      } catch (_) {}

      setError('Gagal memuat kategori');
      console.error('[useCategories] Error:', err?.message ?? err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /** Paksa refresh dari server, update cache baru */
  const refresh = useCallback(() => fetchCategories(true), [fetchCategories]);

  return { categories, loading, error, refresh };
}
