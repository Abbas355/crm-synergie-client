import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastPing, setLastPing] = useState<number>(Date.now());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ping serveur toutes les 30 secondes
    const pingInterval = setInterval(async () => {
      try {
        const start = Date.now();
        const response = await fetch('/api/auth/user', { 
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          setLastPing(Date.now());
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
        <span>Connexion perdue - Tentative de reconnexion...</span>
        <button 
          onClick={() => window.location.reload()}
          className="ml-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
        >
          Rafraîchir
        </button>
      </div>
    </div>
  );
}