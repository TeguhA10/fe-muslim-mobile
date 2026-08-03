import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post } from '../types';

const CACHE_PREFIX = 'posts_cache_v1_';
const MAX_CACHED_POSTS = 30;

export interface CachedPostsData {
  posts: Post[];
  timestamp: number;
}

export function usePostsCache() {
  /**
   * Build unique cache key based on feed parameters
   */
  const getCacheKey = useCallback(
    (
      tab: string,
      category = 'semua',
      sort = 'terbaru',
      media = 'semua',
      search = ''
    ): string => {
      const sanitizedSearch = search.trim().toLowerCase().replace(/\s+/g, '_');
      return `${CACHE_PREFIX}${tab}_cat:${category}_sort:${sort}_media:${media}_q:${sanitizedSearch}`;
    },
    []
  );

  /**
   * Get cached posts from AsyncStorage
   */
  const getCachedPosts = useCallback(async (cacheKey: string): Promise<Post[] | null> => {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed: CachedPostsData = JSON.parse(raw);
      if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
        return parsed.posts;
      }
      return null;
    } catch (error) {
      console.log('[PostsCache] Error reading cache:', error);
      return null;
    }
  }, []);

  /**
   * Save posts array to AsyncStorage (capped at MAX_CACHED_POSTS)
   */
  const savePostsToCache = useCallback(async (cacheKey: string, posts: Post[]): Promise<void> => {
    try {
      const cappedPosts = posts.slice(0, MAX_CACHED_POSTS);
      const data: CachedPostsData = {
        posts: cappedPosts,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.log('[PostsCache] Error saving cache:', error);
    }
  }, []);

  /**
   * Clear all post caches from AsyncStorage (e.g. on logout)
   */
  const clearAllPostsCache = useCallback(async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const postKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (postKeys.length > 0) {
        await AsyncStorage.multiRemove(postKeys);
      }
    } catch (error) {
      console.log('[PostsCache] Error clearing cache:', error);
    }
  }, []);

  return {
    getCacheKey,
    getCachedPosts,
    savePostsToCache,
    clearAllPostsCache,
  };
}
