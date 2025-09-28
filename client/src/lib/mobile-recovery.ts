// Système de récupération pour problèmes de cache mobile
export class MobileRecovery {
  private static instance: MobileRecovery;
  private failureCount: number = 0;
  private lastFailure: number = 0;

  static getInstance(): MobileRecovery {
    if (!MobileRecovery.instance) {
      MobileRecovery.instance = new MobileRecovery();
    }
    return MobileRecovery.instance;
  }

  // Détecte si on est sur mobile
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Détecte les problèmes de cache
  detectCacheIssues(): boolean {
    const now = Date.now();
    
    // Si plusieurs échecs rapides, c'est probablement un problème de cache
    if (this.failureCount > 2 && (now - this.lastFailure) < 30000) {
      return true;
    }

    return false;
  }

  // Enregistre un échec de connexion
  recordFailure(): void {
    this.failureCount++;
    this.lastFailure = Date.now();
    
    if (this.detectCacheIssues() && this.isMobile()) {
      this.showMobileRecoveryModal();
    }
  }

  // Affiche les instructions de récupération mobile
  showMobileRecoveryModal(): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: #1f2937;
        padding: 20px;
        border-radius: 10px;
        max-width: 90%;
        text-align: center;
      ">
        <h2>🔧 Problème de cache détecté</h2>
        <p>Pour résoudre :</p>
        <ol style="text-align: left; padding-left: 20px;">
          <li>Paramètres Chrome → Confidentialité</li>
          <li>Effacer données navigation</li>
          <li>Cocher "Images et fichiers en cache"</li>
          <li>Cliquer "Effacer les données"</li>
          <li>Rafraîchir cette page</li>
        </ol>
        <button onclick="window.location.reload()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
          font-size: 16px;
        ">
          Rafraîchir maintenant
        </button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
          margin-left: 10px;
          font-size: 16px;
        ">
          Fermer
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Réinitialise le compteur après succès
  recordSuccess(): void {
    this.failureCount = 0;
    this.lastFailure = 0;
  }

  // Système de heartbeat pour maintenir la connexion
  startHeartbeat(): void {
    setInterval(async () => {
      try {
        const response = await fetch('/api/auth/user', { 
          credentials: 'include',
          cache: 'no-cache' // Force pas de cache
        });
        
        if (response.ok) {
          this.recordSuccess();
        } else {
          this.recordFailure();
        }
      } catch (error) {
        this.recordFailure();
      }
    }, 30000); // Toutes les 30 secondes
  }
}

// Initialisation automatique
if (typeof window !== 'undefined') {
  const recovery = MobileRecovery.getInstance();
  recovery.startHeartbeat();
}