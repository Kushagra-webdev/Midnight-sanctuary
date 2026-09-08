import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);
  const { enabled = true } = options;
  const urlRef = useRef(url);
  urlRef.current = url;

  const refetch = useCallback(async () => {
    const currentUrl = urlRef.current;
    if (!currentUrl || !enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data: result } = await api.get(currentUrl);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!url || !enabled) {
      setLoading(false);
      setData(null);
      return;
    }
    refetch();
  }, [url, enabled, refetch]);

  return { data, loading, error, refetch };
}
