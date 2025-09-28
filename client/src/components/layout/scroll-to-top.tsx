import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Composant qui force le scroll vers le haut à chaque changement de page
 * Compatible avec tous les navigateurs et dispositifs mobiles
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Fonction pour forcer le scroll en haut
    const scrollToTop = () => {
      try {
        // Méthode 1: window.scrollTo avec behavior instant
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        
        // Méthode 2: Propriétés directes pour compatibilité
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Méthode 3: Pour les éléments avec overflow sur mobile
        const scrollableElements = document.querySelectorAll('[data-scroll-container], .overflow-auto, .overflow-y-auto, .max-h-96, .h-96');
        scrollableElements.forEach(element => {
          if (element.scrollTop > 0) {
            element.scrollTop = 0;
          }
        });

        // Méthode 4: Pour les conteneurs de pages spécifiques
        const pageContainers = document.querySelectorAll('.page-container, main, [role="main"], .container, .min-h-screen');
        pageContainers.forEach(container => {
          if (container.scrollTop > 0) {
            container.scrollTop = 0;
          }
        });

        // Méthode 5: Pour les modals et dialogs
        const modalElements = document.querySelectorAll('[data-radix-dialog-content], .modal-content, .dialog-content');
        modalElements.forEach(modal => {
          if (modal.scrollTop > 0) {
            modal.scrollTop = 0;
          }
        });
      } catch (error) {
        console.warn('Erreur lors du scroll vers le haut:', error);
      }
    };

    // Exécuter immédiatement
    scrollToTop();
    
    // Exécuter après un délai pour s'assurer que le DOM est mis à jour
    const timeout = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timeout);
  }, [location]);

  return null;
}