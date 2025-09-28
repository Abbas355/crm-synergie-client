import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour détecter si l'appareil est un mobile
 * @returns Boolean indiquant si la largeur de l'écran est inférieure à 768px
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Fonction pour vérifier la taille de l'écran
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Vérification initiale
    checkMobile();
    
    // Écouter les changements de taille de fenêtre
    window.addEventListener('resize', checkMobile);
    
    // Nettoyage de l'écouteur d'événements
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}