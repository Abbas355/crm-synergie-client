import { useEffect, useState, useCallback } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Handler optimisé avec throttling pour éviter les re-rendus excessifs
    let timeoutId: NodeJS.Timeout;
    const listener = useCallback(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newMatches = media.matches;
        setMatches(prev => prev !== newMatches ? newMatches : prev);
      }, 50); // 50ms de throttling
    }, [media]);
    
    // Utiliser media.addEventListener plutôt que window
    media.addEventListener('change', listener);
    
    return () => {
      media.removeEventListener('change', listener);
      clearTimeout(timeoutId);
    };
  }, [query]); // Retirer matches des dépendances pour éviter les boucles

  return matches;
}