// Générateur de factures professionnelles épurées
// CVD = Commission sur Ventes Directes

// NOUVEAU SYSTÈME FISCAL PERMANENT FA YYYY MM 00000001
async function generateOrGetFiscalInvoice(data: ClientInvoiceData, mois: number, annee: number): Promise<{
  numeroFacture: string;
  dateFacturation: string;
  dateEcheance: string;
  isExisting: boolean;
}> {
  try {
    // Récupérer l'utilisateur connecté
    const userResponse = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (!userResponse.ok) {
      throw new Error('Utilisateur non connecté');
    }
    
    const user = await userResponse.json();
    
    const response = await fetch('/api/invoice/generate-or-get', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mois,
        annee,
        vendeurId: user.id,
        vendeurNom: data.vendeurNom,
        vendeurPrenom: data.vendeurPrenom,
        vendeurEmail: data.vendeurEmail,
        montantCommission: data.commission,
        pointsTotal: data.points,
        nombreInstallations: data.total,
        detailsVentes: data.installationsReelles
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ ERREUR système fiscal permanent:', error);
    throw error;
  }
}

// Service de numérotation basique (FALLBACK)
async function generateInvoiceNumber(): Promise<string> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `F${year}-${month}-${timestamp}`;
  } catch (error) {
    console.error('❌ ERREUR génération numéro facture:', error);
    return `F${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
  }
}

export interface ClientInvoiceData {
  periode: string;
  total: number;
  commission: number;
  points: number;
  vendeurPrenom: string;
  vendeurNom: string;
  vendeurEmail: string;
  installationsReelles?: Array<{
    nom: string;
    prenom: string;
    produit: string;
    points: number;
    dateInstallation: string;
  }>;
}

// Convertit le nom du mois en numéro
function getMoisNumero(moisTexte: string): number | null {
  const mois: { [key: string]: number } = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
    'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
  };
  return mois[moisTexte.toLowerCase()] || null;
}

// Récupère le logo de l'entreprise
async function getCompanyLogo(): Promise<string> {
  try {
    const response = await fetch('/api/settings/logo', { credentials: 'include' });
    if (response.ok) {
      const logoData = await response.json();
      return logoData.logoUrl || '';
    }
  } catch (error) {
    console.warn('Logo non disponible:', error);
  }
  return '';
}

// Barème CVD par tranche - CORRIGÉ 28/08/2025
const BAREME_CVD = {
  1: { "Freebox Ultra": 50, "Freebox Pop": 50, "Freebox Essentiel": 50, "Forfait 5G": 10 },
  2: { "Freebox Ultra": 80, "Freebox Pop": 60, "Freebox Essentiel": 70, "Forfait 5G": 10 },
  3: { "Freebox Ultra": 100, "Freebox Pop": 70, "Freebox Essentiel": 90, "Forfait 5G": 10 },
  4: { "Freebox Ultra": 120, "Freebox Pop": 90, "Freebox Essentiel": 100, "Forfait 5G": 10 }
};

// Détermine la tranche selon les points cumulés
function determinerTranche(pointsCumules: number): number {
  if (pointsCumules >= 101) return 4;
  if (pointsCumules >= 51) return 3;
  if (pointsCumules >= 26) return 2;
  return 1;
}

// Calcule les commissions selon la logique CVD par paliers de 5 points
function calculerCommissionsParPaliers(installationsReelles: Array<{nom: string, prenom: string, produit: string, points: number, dateInstallation: string}>): Array<{produit: string, client: string, points: number, commission: number, tranche: number, pointsCumules: number}> {
  let pointsCumules = 0;
  const ventesAvecCommissions = [];
  
  for (const installation of installationsReelles) {
    const pointsAvant = pointsCumules;
    pointsCumules += installation.points;
    
    // Vérifier si un palier de 5 points est franchi
    const palierAvant = Math.floor(pointsAvant / 5);
    const palierApres = Math.floor(pointsCumules / 5);
    
    let commission = 0;
    
    if (palierApres > palierAvant) {
      // Palier franchi - calculer commission selon la tranche actuelle
      const tranche = determinerTranche(pointsCumules);
      const baremeTranche = BAREME_CVD[tranche as keyof typeof BAREME_CVD];
      commission = baremeTranche[installation.produit as keyof typeof baremeTranche] || 0;
    }
    // Sinon commission = 0 (pas de palier franchi)
    
    // SÉCURITÉ FISCALE : Vérifier la présence obligatoire du nom client
    const nomClient = `${installation.prenom || ''} ${installation.nom || ''}`.trim();
    if (!nomClient || nomClient.length === 0) {
      console.error(`⚠️ ERREUR FISCALE CRITIQUE: Installation sans nom client détectée`, installation);
      throw new Error(`ERREUR FISCALE: Une installation sans nom client a été détectée. Ceci viole les exigences légales de facturation.`);
    }
    
    ventesAvecCommissions.push({
      produit: installation.produit || 'Produit non défini',
      client: nomClient,
      points: installation.points || 0,
      commission,
      tranche: determinerTranche(pointsCumules),
      pointsCumules
    });
  }
  
  return ventesAvecCommissions;
}

// Utilise les vraies données CVD ou génère des données de fallback
function getVentesParPeriode(periode: string, totalVentes: number, totalPoints: number, installationsReelles?: Array<{nom: string, prenom: string, produit: string, points: number, dateInstallation: string}>): Array<{produit: string, client: string, points: number, commission?: number, tranche?: number, pointsCumules?: number}> {
  
  // Si on a les vraies données CVD, les utiliser avec calcul des paliers
  if (installationsReelles && installationsReelles.length > 0) {
    console.log(`📊 FACTURE: Utilisation des vraies données CVD - ${installationsReelles.length} installations`);
    return calculerCommissionsParPaliers(installationsReelles);
  }
  
  // Fallback uniquement si pas de données réelles (ne devrait plus arriver)
  console.warn(`⚠️ FACTURE: Fallback - pas de données CVD réelles disponibles`);
  const produits = [
    { nom: 'Freebox Ultra', points: 6 },
    { nom: 'Freebox Essentiel', points: 5 },
    { nom: 'Freebox Pop', points: 4 },
    { nom: 'Forfait 5G', points: 1 }
  ];
  
  const nomsClients = [
    'Client Fallback 1', 'Client Fallback 2', 'Client Fallback 3'
  ];
  
  const ventes = [];
  let pointsRestants = totalPoints;
  
  for (let i = 0; i < totalVentes; i++) {
    let produit;
    if (i === totalVentes - 1) {
      produit = produits.find(p => p.points === pointsRestants) || produits[3];
    } else {
      const produitsDisponibles = produits.filter(p => p.points <= pointsRestants);
      produit = produitsDisponibles[Math.floor(Math.random() * produitsDisponibles.length)] || produits[3];
    }
    
    const client = nomsClients[Math.floor(Math.random() * nomsClients.length)];
    
    ventes.push({
      produit: produit.nom,
      client: client,
      points: produit.points
    });
    
    pointsRestants -= produit.points;
  }
  
  return ventes;
}

export function generateProfessionalInvoiceHTML(data: ClientInvoiceData, logoUrl?: string, numeroFacture?: string, dateFacturation?: string, dateEcheance?: string): string {
  // Utiliser les dates fiscales conformes ou fallback
  const dateFactureFormatee = dateFacturation ? new Date(dateFacturation).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const dateEcheanceFormatee = dateEcheance ? new Date(dateEcheance).toLocaleDateString('fr-FR') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
  
  // Utiliser le numéro fiscal ou fallback
  const factureNumber = numeroFacture || `F${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-TEMP${Date.now().toString().slice(-6)}`;
  const ventesData = getVentesParPeriode(data.periode, data.total, data.points, data.installationsReelles);
  
  // Calculer la vraie somme des commissions selon les paliers
  const vraieTotalCommission = ventesData.reduce((total, vente) => total + (vente.commission || 0), 0);
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture de la période ${data.periode} - Commission sur Ventes Directes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #2d3748;
            background: #ffffff;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header {
            background: #f7fafc;
            padding: 20px;
            border-bottom: 2px solid #e2e8f0;
            text-align: center;
        }
        
        .company-logo {
            max-height: 70px;
            max-width: 250px;
            width: auto;
            height: auto;
            object-fit: contain;
            margin-bottom: 12px;
        }
        
        .header h1 {
            color: #2d3748;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            color: #4a5568;
            font-size: 0.9rem;
            font-weight: 400;
        }
        
        .company-details {
            padding: 15px 25px;
            background: #ffffff;
            line-height: 1.4;
        }
        
        .company-details p {
            margin: 2px 0;
            color: #2d3748;
            font-size: 0.9rem;
        }
        
        .invoice-details {
            padding: 0 30px;
        }
        
        /* Styles pour le tableau mobile optimisé */
        .mobile-invoice-summary table {
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            .mobile-invoice-summary table {
                font-size: 12px;
            }
            
            .mobile-invoice-summary th,
            .mobile-invoice-summary td {
                padding: 8px 4px !important;
            }
            
            .header {
                padding: 15px;
            }
            
            .company-logo {
                max-height: 60px;
                max-width: 200px;
                margin-bottom: 10px;
            }
            
            .header h1 {
                font-size: 1.3rem;
                margin-bottom: 3px;
            }
            
            .header .subtitle {
                font-size: 0.85rem;
            }
            
            .company-details {
                padding: 12px 15px;
            }
            
            .company-details p {
                font-size: 0.85rem;
                margin: 1px 0;
            }
            
            .cvd-analysis {
                margin: 15px 20px !important;
                padding: 15px !important;
            }
            
            .content {
                padding: 0 20px;
            }
            
            /* Tableau scrollable horizontalement pour mobile */
            .detail-table-scroll {
                position: relative;
            }
            
            .detail-table-scroll::after {
                content: '← Faites glisser pour voir toutes les colonnes →';
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                color: #666;
                font-style: italic;
                white-space: nowrap;
            }
            
            .detail-table-scroll table {
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .detail-table-scroll table th:first-child,
            .detail-table-scroll table td:first-child {
                position: sticky;
                left: 0;
                background: inherit;
                z-index: 2;
            }
            
            .detail-table-scroll table th:first-child {
                background: #4a90e2 !important;
            }
            
            .detail-table-scroll table tbody tr:nth-child(even) td:first-child {
                background: #f8f9fa !important;
            }
            
            .detail-table-scroll table tbody tr:nth-child(odd) td:first-child {
                background: white !important;
            }
        }
        
        /* Styles pour les détails expandables */
        #detailsCVD {
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
                overflow: hidden;
            }
            to {
                opacity: 1;
                max-height: 1000px;
                overflow: visible;
            }
        }
        
        .document-info h3 {
            color: #2d3748;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .document-info p {
            color: #4a5568;
            font-size: 0.95rem;
            margin: 2px 0;
        }
        
        .content {
            padding: 30px;
        }
        
        .commission-summary {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .commission-summary h2 {
            color: #2d3748;
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .commission-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            color: #4a5568;
            font-size: 1rem;
        }
        
        .commission-row.total {
            border-top: 2px solid #2d3748;
            margin-top: 15px;
            padding-top: 15px;
            font-weight: 600;
            font-size: 1.1rem;
            color: #2d3748;
        }
        
        .expand-section {
            margin: 20px 0;
        }
        
        .expand-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #e2e8f0;
            cursor: pointer;
        }
        
        .expand-header h3 {
            color: #2d3748;
            font-size: 1rem;
            font-weight: 600;
        }
        
        .expand-btn {
            background: #4299e1;
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .expand-btn:hover {
            background: #3182ce;
            transform: scale(1.1);
        }
        
        .ventes-details {
            display: none;
            margin-top: 15px;
            padding: 20px;
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        
        .ventes-details.show {
            display: block;
        }
        
        .vente-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .vente-item:last-child {
            border-bottom: none;
        }
        
        .vente-produit {
            font-weight: 500;
            color: #2d3748;
        }
        
        .vente-points {
            background: #edf2f7;
            color: #2d3748;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px;
            background: #f7fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #4a5568;
            font-size: 0.9rem;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        .footer strong {
            color: #2d3748;
        }
        
        /* Styles d'impression */
        @media print {
            body {
                background: white !important;
                padding: 0 !important;
            }
            
            .invoice-container {
                box-shadow: none !important;
                border: none !important;
            }
            
            .expand-btn {
                display: none !important;
            }
            
            .ventes-details {
                display: block !important;
            }
        }
        
        /* Styles mobile */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 1.5rem;
            }
            
            .document-info {
                flex-direction: column;
                padding: 15px 20px;
            }
            
            .document-info div {
                margin-bottom: 15px;
            }
            
            .content {
                padding: 20px;
            }
            
            .commission-summary {
                padding: 20px;
            }
            
            .commission-row {
                font-size: 0.9rem;
            }
            
            .vente-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .vente-points {
                align-self: flex-end;
            }
        }
    </style>
    
    <script>
        function toggleVentesDetails() {
            const details = document.getElementById('ventesDetails');
            const btn = document.getElementById('expandBtn');
            
            if (details.classList.contains('show')) {
                details.classList.remove('show');
                btn.textContent = '+';
            } else {
                details.classList.add('show');
                btn.textContent = '−';
            }
        }
    </script>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo entreprise" class="company-logo" />` : ''}
            <h1>Facture ${data.periode.charAt(0).toUpperCase() + data.periode.slice(1)}</h1>
        </div>
        
        <!-- ÉTAPE 1/5 : Informations personnelles et professionnelles (conformité légale EI) -->
        <div class="company-details">
            <p><strong>Nom commercial :</strong> Synergie Mobile Group</p>
            <p><strong>Adresse professionnelle :</strong> 123 Avenue des Télécoms, 75001 Paris, France</p>
            <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
            <p><strong>Email :</strong> ab@test.com</p>
            <p><strong>Site internet :</strong> www.smg-telecom.fr</p>
            <p><strong>SIRET :</strong> 12345678901234</p>
            <p><strong>RCS :</strong> Paris 123 456 789 (Greffe de Paris)</p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #000; margin: 20px 0;">
        
        <!-- ÉTAPE 2/5 : Coordonnées du client -->
        <div class="invoice-details">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-bottom: 15px; color: #2d3748;">🎯 Facturé à :</h3>
                <p><strong>Nom/Raison sociale :</strong> ${data.vendeurPrenom} ${data.vendeurNom}</p>
                <p><strong>Adresse :</strong> 456 Boulevard Commercial, 69000 Lyon, France</p>
                <p><strong>Code Vendeur :</strong> FR98445061</p>
                <p><strong>Email :</strong> ${data.vendeurEmail}</p>
                <p><strong>Période de facturation :</strong> ${data.periode}</p>
            </div>
        </div>
        
        <!-- ÉTAPE 3/5 : Numéro de facturation chronologique -->
        <div style="background: #e8f4fd; border: 1px solid #4a90e2; padding: 20px; margin: 20px 30px; border-radius: 8px;">
            <h3 style="color: #2d3748; margin-bottom: 15px; display: flex; align-items: center;">
                📋 Informations de facturation
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <p><strong>Date de facturation :</strong> ${dateFactureFormatee}</p>
                    <p><strong>Numéro de facture :</strong> ${factureNumber}</p>
                </div>
                <div>
                    <p><strong>Date d'exécution :</strong> ${data.periode}</p>
                    <p><strong>Échéance de paiement :</strong> ${dateEcheanceFormatee}</p>
                </div>
            </div>
        </div>

        <div class="cvd-analysis" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 20px 30px; border-radius: 8px;">
            <h3 style="color: #856404; margin-bottom: 15px; display: flex; align-items: center;">
                📊 Analyse des Points CVD
            </h3>
            <p><strong>Points totaux accumulés :</strong> ${data.points} points</p>
            <p><strong>Tranche actuelle :</strong> Tranche ${Math.ceil(data.points / 25) || 1}</p>
            <p><strong>Progression vers tranche supérieure :</strong> ${25 - (data.points % 25)} points restants pour la Tranche ${Math.ceil(data.points / 25) + 1}</p>
        </div>
        
        <div class="content">
            <!-- Tableau mobile optimisé (vue générale) -->
            <div class="mobile-invoice-summary">
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ccc;">
                    <thead>
                        <tr style="background: #4a90e2; color: white;">
                            <th style="border: 1px solid #ccc; padding: 12px; text-align: left;">Désignation</th>
                            <th style="border: 1px solid #ccc; padding: 12px; text-align: center;">Quantité</th>
                            <th style="border: 1px solid #ccc; padding: 12px; text-align: right;">Montant</th>
                            <th style="border: 1px solid #ccc; padding: 8px; text-align: center; width: 40px;">Détails</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; font-weight: bold;">Commission sur Ventes Directes</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center; font-weight: bold;">${data.total} ventes</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: right; font-weight: bold;">${vraieTotalCommission.toFixed(2)} €</td>
                            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
                                <button onclick="toggleDetailsCVD()" 
                                        style="background: #4a90e2; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 16px;"
                                        id="detailsBtn">+</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Détails expandables (masqués par défaut) -->
            <div id="detailsCVD" style="display: none; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #ddd;">
                <h4 style="margin-bottom: 15px; color: #4a90e2;">📋 Détail complet - Commission sur Ventes Directes</h4>
                
                <!-- Tableau scrollable horizontalement pour mobile -->
                <div class="detail-table-scroll" style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -20px; padding: 0 20px;">
                    <table style="width: 100%; min-width: 500px; border-collapse: collapse; font-size: 12px; white-space: nowrap;">
                        <thead>
                            <tr style="background: #4a90e2; color: white;">
                                <th style="border: 1px solid #2980b9; padding: 10px 8px; text-align: left; font-size: 11px; min-width: 120px;">Client</th>
                                <th style="border: 1px solid #2980b9; padding: 10px 8px; text-align: center; font-size: 11px; min-width: 100px;">Produit</th>
                                <th style="border: 1px solid #2980b9; padding: 10px 8px; text-align: center; font-size: 11px; min-width: 60px;">Points</th>
                                <th style="border: 1px solid #2980b9; padding: 10px 8px; text-align: center; font-size: 11px; min-width: 70px;">Tranche</th>
                                <th style="border: 1px solid #2980b9; padding: 10px 8px; text-align: right; font-size: 11px; min-width: 80px;">Prix Unit.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ventesData.map((vente, index) => `
                                <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
                                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 11px; font-weight: 500;">${vente.client}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: center;">${vente.produit}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: #4a90e2; font-size: 11px;">${vente.points}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 10px;">T${vente.tranche || 1}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 500; font-size: 11px;">${(vente.commission || 0).toFixed(2)} €</td>
                                </tr>
                            `).join('')}
                            <tr style="background: #e8f4fd; font-weight: bold;">
                                <td colspan="2" style="border: 1px solid #4a90e2; padding: 10px 8px; font-size: 11px;">Total: ${data.total} ventes (${data.points} points CVD)</td>
                                <td style="border: 1px solid #4a90e2; padding: 10px 8px; text-align: center; font-size: 11px;">${data.points}pts</td>
                                <td style="border: 1px solid #4a90e2; padding: 10px 8px; text-align: center; font-size: 10px;">CVD</td>
                                <td style="border: 1px solid #4a90e2; padding: 10px 8px; text-align: right; color: #4a90e2; font-size: 12px;">${vraieTotalCommission.toFixed(2)} €</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; border: 1px solid #ffeaa7;">
                    <small><strong>Note réglementaire :</strong> Ce détail constitue la pièce annexe obligatoire justifiant la facturation des commissions sur ventes directes pour la période ${data.periode}.</small>
                </div>
            </div>
            
            <div style="border: 2px solid #000; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="border: 1px solid #000; padding: 12px; font-weight: bold;">Total HT</td>
                        <td style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold;">${vraieTotalCommission.toFixed(2)} €</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 12px;">
                            TVA<br>
                            <span style="font-size: 0.55em; color: #666;">TVA NON APPLICABLE, ART. 293 B DU CGI</span>
                        </td>
                        <td style="border: 1px solid #000; padding: 12px; text-align: right;">0,00 €</td>
                    </tr>
                    <tr style="background: #f0f8ff;">
                        <td style="border: 1px solid #000; padding: 12px; font-weight: bold; font-size: 1.1em;">TOTAL TTC</td>
                        <td style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold; font-size: 1.1em;">${vraieTotalCommission.toFixed(2)} €</td>
                    </tr>
                </table>
            </div>
            

        </div>
        
        <!-- Encadré bleu avec informations de paiement essentielles -->
        <div style="background: #e8f4fd; border: 1px solid #4a90e2; padding: 10px; border-radius: 6px; margin-top: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; font-size: 0.85em;">
                <div>
                    <span style="color: #2d3748; font-weight: bold;">Mode de paiement :</span>
                    <span style="color: #666; margin-left: 5px;">Virement bancaire</span>
                </div>
                <div>
                    <span style="color: #2d3748; font-weight: bold;">RIB :</span>
                    <span style="color: #666; margin-left: 5px;">FR76 1751 2000 0003 0569 8750 016</span>
                </div>
            </div>
            <div style="margin-top: 6px; font-size: 0.85em;">
                <span style="color: #2d3748; font-weight: bold;">Conditions :</span>
                <span style="color: #666; margin-left: 5px;">Paiement à 30 jours fin de mois</span>
            </div>
        </div>
        
        <!-- Footer simple avec numéro chronologique uniquement -->
        <div style="text-align: center; margin-top: 20px; font-size: 0.85em; color: #666;">
            <p>Pénalités de retard : 3 fois le taux légal, Dès le 1er jour de retard. 40€ pour frais de recouvrement - Numéro chronologique : ${factureNumber}</p>
            <p>Autofacturation : Facture établie par Synergie Marketing Group au nom et pour le compte de ${data.vendeurPrenom} ${data.vendeurNom}</p>
        </div>
    </div>
    
    <script>
        function toggleDetailsCVD() {
            const details = document.getElementById('detailsCVD');
            const btn = document.getElementById('detailsBtn');
            
            if (details.style.display === 'none' || details.style.display === '') {
                details.style.display = 'block';
                btn.textContent = '-';
                btn.style.transform = 'rotate(0deg)';
                btn.style.background = '#dc3545';
                btn.title = 'Masquer les détails';
            } else {
                details.style.display = 'none';
                btn.textContent = '+';
                btn.style.transform = 'rotate(0deg)';
                btn.style.background = '#4a90e2';
                btn.title = 'Afficher les détails';
            }
        }
        
        // Ajouter l'événement au chargement de la page
        window.onload = function() {
            const btn = document.getElementById('detailsBtn');
            if (btn) {
                btn.title = 'Afficher les détails';
            }
        };
    </script>
</body>
</html>
  `;
}

export async function openProfessionalInvoice(data: ClientInvoiceData): Promise<void> {
  console.log('🧪 GÉNÉRATION FACTURE PROFESSIONNELLE CVD - Commission sur Ventes Directes', {
    mois: data.periode,
    total: data.total,
    commission: data.commission,
    points: data.points
  });
  
  try {
    const logoUrl = await getCompanyLogo();
    
    console.log('🎯 GÉNÉRATION FACTURE CVD (Commission sur Ventes Directes):', {
      periode: data.periode,
      total: data.total,
      commission: data.commission,
      points: data.points,
      vendeurPrenom: data.vendeurPrenom,
      vendeurNom: data.vendeurNom,
      vendeurEmail: data.vendeurEmail
    });
    
    // Parser la période pour extraire mois et année (ex: "juin 2025")
    const [moisTexte, anneeTexte] = data.periode.split(' ');
    const moisNumero = getMoisNumero(moisTexte);
    const annee = parseInt(anneeTexte);
    
    if (!moisNumero || !annee) {
      throw new Error(`Format de période invalide: ${data.periode}`);
    }
    
    let htmlContent: string;
    
    // NOUVEAU SYSTÈME FISCAL PERMANENT - FA YYYY MM 00000001
    try {
      const factureData = await generateOrGetFiscalInvoice(data, moisNumero, annee);
      
      if (factureData.isExisting) {
        console.log(`✅ FACTURE FISCALE PERMANENTE RÉCUPÉRÉE: ${factureData.numeroFacture}`);
      } else {
        console.log(`🆕 NOUVELLE FACTURE FISCALE CRÉÉE: ${factureData.numeroFacture}`);
      }
      
      htmlContent = generateProfessionalInvoiceHTML(data, logoUrl, factureData.numeroFacture, factureData.dateFacturation, factureData.dateEcheance);
      
    } catch (error) {
      console.error('❌ ERREUR système fiscal, fallback vers ancien système:', error);
      // Fallback vers l'ancien système en cas d'erreur
      const invoiceNumber = await generateInvoiceNumber();
      htmlContent = generateProfessionalInvoiceHTML(data, logoUrl, invoiceNumber);
    }
    
    // Détection mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile : Modal plein écran
      showMobileInvoiceModal(htmlContent, data.periode);
    } else {
      // Desktop : Nouvel onglet
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Fallback si popup bloqué
        showMobileInvoiceModal(htmlContent, data.periode);
      }
    }
    
    console.log('✅ FACTURE CVD (Commission sur Ventes Directes) GÉNÉRÉE pour période:', data.periode);
    
  } catch (error) {
    console.error('❌ Erreur génération facture CVD:', error);
    alert('Erreur lors de la génération de la facture CVD (Commission sur Ventes Directes)');
  }
}

function showMobileInvoiceModal(htmlContent: string, periode: string): void {
  // Créer modal mobile
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 10000;
    display: flex;
    flex-direction: column;
  `;
  
  // Header modal
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #2d3748, #4a5568);
    color: white;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  `;
  
  header.innerHTML = `
    <span style="font-weight: 600; font-size: 16px;">Facture ${periode.charAt(0).toUpperCase() + periode.slice(1)}</span>
    <div style="display: flex; gap: 12px;">
      <button id="downloadInvoiceBtn" style="
        background: linear-gradient(135deg, #4299e1, #3182ce);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(66, 153, 225, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(66, 153, 225, 0.3)'">
        📥 Télécharger
      </button>
      <button id="closeInvoiceBtn" style="
        background: linear-gradient(135deg, #e53e3e, #c53030);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(229, 62, 62, 0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(229, 62, 62, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(229, 62, 62, 0.3)'">
        ✕ Fermer
      </button>
    </div>
  `;
  
  // Iframe pour contenu
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: 100%;
    height: calc(100% - 70px);
    border: none;
    background: white;
  `;
  
  modal.appendChild(header);
  modal.appendChild(iframe);
  document.body.appendChild(modal);
  
  // Charger contenu dans iframe
  iframe.onload = () => {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  };
  iframe.src = 'about:blank';
  
  // Événements
  document.getElementById('closeInvoiceBtn')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('downloadInvoiceBtn')?.addEventListener('click', () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture-${periode.replace(' ', '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  });
}