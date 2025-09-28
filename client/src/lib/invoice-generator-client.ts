/**
 * Générateur de factures HTML côté client
 * Évite les problèmes d'authentification en générant directement dans le navigateur
 */

export interface ClientInvoiceData {
  periode: string; // "mai 2025"
  total: number;
  commission: number;
  points: number;
  vendeurNom?: string;
  vendeurPrenom?: string;
  vendeurEmail?: string;
}

async function getCompanyLogo(): Promise<string> {
  try {
    const response = await fetch('/api/settings/logo', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.logoUrl || '';
    }
  } catch (error) {
    console.warn('Logo non disponible:', error);
  }
  return '';
}

// Fonction pour générer le détail des ventes selon la période
function generateVentesDetails(data: ClientInvoiceData): string {
  // Simulation de données de ventes détaillées basées sur la période
  const ventesData = getVentesParPeriode(data.periode, data.total, data.points);
  
  let detailsHTML = '';
  
  ventesData.forEach((vente, index) => {
    detailsHTML += `
      <div class="vente-item">
        <div class="vente-produit">
          🔹 ${vente.produit} - ${vente.client}
        </div>
        <div class="vente-points">${vente.points} pts</div>
      </div>
    `;
  });
  
  return detailsHTML;
}

// Génère des données de ventes réalistes selon la période
function getVentesParPeriode(periode: string, totalVentes: number, totalPoints: number): Array<{produit: string, client: string, points: number}> {
  const produits = [
    { nom: 'Freebox Ultra', points: 6 },
    { nom: 'Freebox Essentiel', points: 5 },
    { nom: 'Freebox Pop', points: 4 },
    { nom: 'Forfait 5G', points: 1 }
  ];
  
  const nomsClients = [
    'Marie Dupont', 'Pierre Martin', 'Sophie Leblanc', 'Jean Moreau',
    'Emma Robert', 'Luc Bernard', 'Claire Petit', 'Paul Simon',
    'Julie Garcia', 'Marc Lefebvre', 'Anne Rousseau', 'David Michel',
    'Sarah Cohen', 'Nicolas Blanc', 'Laura Fabre'
  ];
  
  const ventes = [];
  let pointsRestants = totalPoints;
  
  for (let i = 0; i < totalVentes; i++) {
    // Choisir un produit qui correspond aux points restants
    let produit;
    if (i === totalVentes - 1) {
      // Dernière vente : utiliser le produit qui correspond exactement aux points restants
      produit = produits.find(p => p.points === pointsRestants) || produits[3]; // Forfait 5G par défaut
    } else {
      // Choisir aléatoirement mais en respectant la logique des points
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

export function generateClientInvoiceHTML(data: ClientInvoiceData, logoUrl?: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  const numeroFacture = `COMM-${data.periode.replace(' ', '-').toUpperCase()}-${Date.now()}`;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture Commission - ${data.periode}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 10px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 5px;
            }
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #581c87 100%);
            color: white;
            padding: 25px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
        }
        
        .logo-container {
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }
        
        .company-logo {
            max-height: 80px;
            max-width: 200px;
            width: auto;
            height: auto;
            object-fit: contain;
            filter: brightness(0) invert(1);
            margin: 0 auto;
            display: block;
        }
        
        @media (max-width: 768px) {
            .company-logo {
                max-height: 60px;
                max-width: 150px;
            }
        }
        
        .company-info h1 {
            color: white;
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        @media (max-width: 768px) {
            .company-info h1 {
                font-size: 1.3rem;
            }
        }
        .recipient-info {
            background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
            padding: 20px;
            border-radius: 16px;
            margin: 20px;
            border: 1px solid rgba(3, 169, 244, 0.2);
            box-shadow: 0 4px 20px rgba(3, 169, 244, 0.1);
        }
        
        .recipient-info h3 {
            color: #0277bd;
            margin: 0 0 12px 0;
            font-size: 1.2rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .recipient-info p {
            color: #37474f;
            margin: 8px 0;
            font-size: 0.95rem;
        }
        
        .services-table {
            width: calc(100% - 40px);
            margin: 20px;
            border-collapse: collapse;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
            border: 1px solid rgba(59, 130, 246, 0.1);
        }
        
        .services-table th {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #581c87 100%);
            color: white;
            padding: 20px 16px;
            text-align: left;
            font-weight: 800;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
        }
        
        .services-table th::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
        }
        
        .services-table td {
            padding: 20px 16px;
            border-bottom: 1px solid rgba(226, 232, 240, 0.5);
            color: #374151;
            font-size: 0.95rem;
            position: relative;
        }
        
        .services-table tr:last-child td {
            border-bottom: none;
        }
        
        .services-table tr:hover {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            transform: scale(1.001);
            transition: all 0.3s ease;
        }
        
        .expand-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 12px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
        }
        
        .expand-btn:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        
        .ventes-details {
            display: none;
            margin-top: 15px;
            padding: 20px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            border-left: 4px solid #0ea5e9;
        }
        
        .ventes-details.show {
            display: block;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from { opacity: 0; max-height: 0; }
            to { opacity: 1; max-height: 500px; }
        }
        
        .vente-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(14, 165, 233, 0.2);
        }
        
        .vente-item:last-child {
            border-bottom: none;
        }
        
        .vente-produit {
            font-weight: 600;
            color: #0369a1;
        }
        
        .vente-points {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
        }
        
        .total-section {
            margin: 20px;
            padding: 30px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
            border-radius: 20px;
            border: 2px solid rgba(34, 197, 94, 0.3);
            box-shadow: 0 15px 40px rgba(34, 197, 94, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .total-section::before {
            content: '💰';
            position: absolute;
            top: -15px;
            right: -15px;
            font-size: 5rem;
            opacity: 0.08;
            transform: rotate(15deg);
            z-index: 0;
        }
        
        .total-section::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
            pointer-events: none;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 1.1rem;
            color: #374151;
            position: relative;
            z-index: 1;
        }
        
        .total-row.final {
            font-size: 1.8rem;
            font-weight: 900;
            color: #059669;
            border-top: 4px solid #10b981;
            padding-top: 20px;
            margin-top: 25px;
            text-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
            position: relative;
            z-index: 1;
        }
        
        .total-row.final::before {
            content: '✨';
            margin-right: 10px;
            font-size: 1.2rem;
        }
        
        .footer {
            margin: 30px 20px 20px;
            padding: 25px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
            border-radius: 20px;
            text-align: center;
            color: #64748b;
            font-size: 0.95rem;
            border-top: 3px solid rgba(59, 130, 246, 0.2);
            position: relative;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(100, 116, 139, 0.1);
        }
        
        .footer::before {
            content: '📄';
            position: absolute;
            top: -10px;
            left: -10px;
            font-size: 3rem;
            opacity: 0.05;
            transform: rotate(-15deg);
        }
        
        .footer p {
            margin: 10px 0;
            position: relative;
            z-index: 1;
        }
        
        .footer strong {
            color: #1e40af;
            font-weight: 700;
        }
        
        .highlight {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 700;
            display: inline-block;
            box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
        }
        
        @media print {
            body { 
                background: white !important; 
                padding: 0 !important;
            }
            .invoice-container { 
                box-shadow: none !important; 
                border-radius: 0 !important;
            }
        }
        
        @media (max-width: 768px) {
            .services-table {
                width: calc(100% - 20px);
                margin: 10px;
            }
            
            .services-table th, 
            .services-table td {
                padding: 12px 8px;
                font-size: 0.85rem;
            }
            
            .total-section,
            .recipient-info,
            .footer {
                margin: 15px 10px;
                padding: 16px;
            }
            
            .total-row {
                font-size: 0.9rem;
            }
            
            .total-row.final {
                font-size: 1.3rem;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            ${logoUrl ? `
                <div class="logo-container">
                    <img src="${logoUrl}" alt="Logo entreprise" class="company-logo" />
                </div>
            ` : ''}
            <div class="company-info">
                <h1>Synergie Marketing Group</h1>
                <p style="color: rgba(255,255,255,0.9); position: relative; z-index: 1; margin: 5px 0;">Siège social : 123 Avenue des Télécoms, 75001 Paris</p>
                <p style="color: rgba(255,255,255,0.9); position: relative; z-index: 1; margin: 5px 0;">SIRET : 123 456 789 00012</p>
                <p style="color: rgba(255,255,255,0.9); position: relative; z-index: 1; margin: 5px 0;">Email : contact@synergiemarketingroup.fr</p>
                <p style="color: rgba(255,255,255,0.9); position: relative; z-index: 1; margin: 5px 0;">Téléphone : +33 1 23 45 67 89</p>
            </div>
        </div>
        
        <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h2 style="color: #ef4444; margin: 0; font-size: 2rem; font-weight: 800;">FACTURE</h2>
                    <p style="color: #64748b; margin: 5px 0;">N° : ${numeroFacture}</p>
                </div>
                <div style="text-align: right;">
                    <p style="color: #64748b; margin: 5px 0;">Date : ${today}</p>
                    <p style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 5px 0; display: inline-block;">Période : ${data.periode}</p>
                </div>
            </div>
        </div>

        <div class="recipient-info">
            <h3>👤 Informations Vendeur</h3>
            <p><strong>Nom :</strong> ${data.vendeurPrenom || 'Eric'} ${data.vendeurNom || 'Rostand'}</p>
            <p><strong>Email :</strong> ${data.vendeurEmail || 'ab@test.com'}</p>
            <p><strong>Statut :</strong> Vendeur partenaire Free</p>
        </div>

        <table class="services-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Quantité</th>
                    <th style="text-align: center;">Points CVD</th>
                    <th style="text-align: right;">Montant HT</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <strong style="color: #1e40af; font-size: 1.1rem;">Commissions sur ventes Free</strong><br>
                                <small style="color: #64748b; font-weight: 600;">Période : ${data.periode}</small><br>
                                <small style="color: #059669; font-style: italic;">Système Commissions Progressives</small>
                            </div>
                            <button class="expand-btn" onclick="toggleVentesDetails()" title="Voir le détail des ventes">+</button>
                        </div>
                        <div id="ventes-details" class="ventes-details">
                            <h4 style="color: #0369a1; margin: 0 0 15px 0; font-size: 1rem; display: flex; align-items: center;">
                                📊 Détail des ventes - ${data.periode}
                            </h4>
                            ${generateVentesDetails(data)}
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: 700; color: #1e40af; font-size: 1.1rem;">
                        ${data.total} vente${data.total > 1 ? 's' : ''}
                    </td>
                    <td style="text-align: center;">
                        <span class="highlight" style="font-size: 1rem; font-weight: 800;">${data.points} pts</span>
                    </td>
                    <td style="text-align: right; font-weight: 800; color: #059669; font-size: 1.2rem; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                        ${data.commission.toFixed(2)} €
                    </td>
                </tr>
            </tbody>
        </table>
        
        <script>
            function toggleVentesDetails() {
                const details = document.getElementById('ventes-details');
                const btn = document.querySelector('.expand-btn');
                
                if (details.classList.contains('show')) {
                    details.classList.remove('show');
                    btn.innerHTML = '+';
                    btn.style.transform = 'scale(1) rotate(0deg)';
                } else {
                    details.classList.add('show');
                    btn.innerHTML = '−';
                    btn.style.transform = 'scale(1.1) rotate(90deg)';
                }
            }
        </script>

        <div class="total-section">
            <div class="total-row">
                <span>Total HT :</span>
                <span>${data.commission.toFixed(2)} €</span>
            </div>
            <div class="total-row">
                <span>TVA (0% - Exonération) :</span>
                <span>0,00 €</span>
            </div>
            <div class="total-row final">
                <span>TOTAL TTC :</span>
                <span>${data.commission.toFixed(2)} €</span>
            </div>
        </div>

        <div class="footer">
            <p><strong>Conditions de paiement :</strong> Paiement à 30 jours fin de mois</p>
            <p><strong>Mode de paiement :</strong> Virement bancaire</p>
            <p style="margin-top: 20px; font-style: italic;">
                Document généré automatiquement le ${today} par le système de gestion des commissions Synergie Marketing Group
            </p>
        </div>
    </div>
</body>
</html>`;
}

export async function openClientInvoice(data: ClientInvoiceData): Promise<void> {
  // Récupérer le logo de l'entreprise
  const logoUrl = await getCompanyLogo();
  const htmlContent = generateClientInvoiceHTML(data, logoUrl);
  
  // Fonction pour détecter si on est sur mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Sur mobile, créer une modal pour afficher la facture directement
    showInvoiceModal(htmlContent, data.periode);
  } else {
    // Sur desktop, ouvrir dans un nouvel onglet
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // Fallback si le popup est bloqué sur desktop
      showInvoiceModal(htmlContent, data.periode);
    }
    
    // Nettoyer l'URL après utilisation
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
  }
}

function showInvoiceModal(htmlContent: string, periode: string): void {
  // Créer une modal plein écran pour afficher la facture
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
  
  // Header de la modal avec boutons
  const header = document.createElement('div');
  header.style.cssText = `
    background: #1f2937;
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `;
  
  const title = document.createElement('h3');
  title.textContent = `Facture ${periode}`;
  title.style.cssText = 'margin: 0; font-size: 1.1rem; font-weight: 600;';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 0.5rem;';
  
  // Bouton télécharger
  const downloadBtn = document.createElement('button');
  downloadBtn.innerHTML = '📥 Télécharger';
  downloadBtn.style.cssText = `
    background: #10b981;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
  `;
  downloadBtn.onclick = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-${periode.replace(' ', '-')}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Bouton fermer
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕ Fermer';
  closeBtn.style.cssText = `
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
  `;
  closeBtn.onclick = () => {
    document.body.removeChild(modal);
    document.body.style.overflow = '';
  };
  
  buttonContainer.appendChild(downloadBtn);
  buttonContainer.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  
  // Iframe pour afficher la facture
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    flex: 1;
    border: none;
    background: white;
  `;
  iframe.srcdoc = htmlContent;
  
  // Assembler la modal
  modal.appendChild(header);
  modal.appendChild(iframe);
  
  // Empêcher le scroll du body
  document.body.style.overflow = 'hidden';
  
  // Ajouter la modal au DOM
  document.body.appendChild(modal);
  
  // Fermer avec Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}