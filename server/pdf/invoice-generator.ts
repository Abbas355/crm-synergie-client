/**
 * Générateur de factures HTML pour les commissions des vendeurs
 * Version HTML temporaire pour consultation immédiate
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as fs from 'fs';
import * as path from 'path';

export interface InvoiceData {
  vendeurId: number;
  vendeurNom: string;
  vendeurPrenom: string;
  vendeurEmail: string;
  vendeurCode: string;
  periode: {
    debut: string;
    fin: string;
  };
  commissions: {
    id: number;
    clientNom: string;
    clientPrenom: string;
    produit: string;
    points: number;
    montant: number;
    dateInstallation: string;
    tranche: number;
  }[];
  totaux: {
    totalPoints: number;
    totalCommission: number;
    tranche: number;
  };
  entreprise: {
    nom: string;
    adresse: string;
    siret: string;
    email: string;
    telephone: string;
  };
}

/**
 * Récupère le logo de l'entreprise depuis les paramètres
 */
function getLogo(): string | null {
  try {
    const settingsFile = path.join(process.cwd(), 'public', 'app-settings.json');
    
    if (fs.existsSync(settingsFile)) {
      const fileContent = fs.readFileSync(settingsFile, 'utf8');
      const settings = JSON.parse(fileContent);
      
      if (settings.company_logo && settings.company_logo.value) {
        return settings.company_logo.value;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du logo:", error);
    return null;
  }
}

export async function generateCommissionInvoice(data: InvoiceData): Promise<Buffer> {
  try {
    console.log('🔄 GÉNÉRATION FACTURE COMPACTE - Style optimisé appliqué', {
      timestamp: new Date().toISOString(),
      vendeur: data.vendeurNom,
      commissions: data.commissions.length
    });
    
    // Récupérer le logo de l'entreprise
    const logoUrl = getLogo();
    console.log(`🔍 FACTURE LOGO: ${logoUrl ? `Logo trouvé: ${logoUrl}` : 'Aucun logo configuré, utilisation du nom d\'entreprise'}`);
    
    // Générer un numéro de facture avec format officiel français
    const numeroFacture = `FC-${format(new Date(), 'yyyy')}-${String(data.vendeurId).padStart(4, '0')}-${format(new Date(), 'MM')}`;
    
    // Regrouper les commissions par tranche pour affichage détaillé
    const commissionsByTranche = data.commissions.reduce((acc: any, commission) => {
      const tranche = commission.tranche;
      if (!acc[tranche]) {
        acc[tranche] = {
          commissions: [],
          totalPoints: 0,
          totalMontant: 0
        };
      }
      acc[tranche].commissions.push(commission);
      acc[tranche].totalPoints += commission.points;
      acc[tranche].totalMontant += commission.montant;
      return acc;
    }, {});

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${numeroFacture}</title>
    <style>
        @page { margin: 2cm; }
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px;
            color: #333; 
            line-height: 1.4;
            font-size: 12px;
        }
        .container {
            max-width: 21cm;
            margin: 0 auto;
            background: white;
        }
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .company-info {
            flex: 1;
        }
        .company-name { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 8px;
            color: #000;
        }
        .company-logo {
            max-height: 80px;
            max-width: 280px;
            object-fit: contain;
            margin-bottom: 8px;
        }
        .company-details {
            font-size: 11px;
            line-height: 1.3;
        }
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
        }
        .invoice-number {
            font-size: 12px;
            margin-bottom: 5px;
        }
        .vendor-section {
            background: #f8f9fa;
            padding: 15px;
            margin: 20px 0;
            border: 1px solid #ddd;
        }
        .vendor-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 13px;
        }
        .legal-mentions {
            text-align: center;
            font-style: italic;
            margin: 15px 0;
            font-size: 11px;
            color: #666;
        }
        .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            border: 1px solid #000;
        }
        .table th, .table td { 
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            font-size: 10px;
            line-height: 1.2;
        }
        .table th { 
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        .table td.number {
            text-align: right;
        }
        .table td.center {
            text-align: center;
        }
        .tranche-header {
            background: #e3f2fd !important;
            font-weight: bold;
            color: #1976d2;
        }
        .tranche-total {
            background: #f5f5f5 !important;
            font-weight: bold;
        }
        .total-section {
            margin-top: 15px;
            text-align: right;
        }
        .total-table {
            margin-left: auto;
            width: 300px;
            border: 1px solid #000;
        }
        .total-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 10px;
        }
        .total-final {
            background: #f0f0f0;
            font-weight: bold;
            font-size: 14px;
        }
        .tva-mention {
            margin-top: 10px;
            font-size: 11px;
            font-weight: bold;
        }
        .progression-section {
            margin: 10px 0;
            padding: 8px;
            background: #fff3e0;
            border: 1px solid #ff9800;
            border-radius: 5px;
        }
        .progression-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #e65100;
            font-size: 11px;
        }
        .footer { 
            margin-top: 20px; 
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 9px; 
            color: #666; 
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- En-tête officiel -->
        <div class="header">
            <div class="header-row">
                <div class="company-info">
                    ${logoUrl ? 
                        `<img src="${logoUrl}" alt="Logo de l'entreprise" class="company-logo">` : 
                        `<div class="company-name">${data.entreprise.nom}</div>`
                    }
                    <div class="company-details">
                        ${data.entreprise.adresse}<br>
                        SIRET : ${data.entreprise.siret}<br>
                        Tél : ${data.entreprise.telephone}<br>
                        Email : ${data.entreprise.email}
                    </div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-title">FACTURE</div>
                    <div class="invoice-number">N° ${numeroFacture}</div>
                    <div class="invoice-number">Date : ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}</div>
                </div>
            </div>
        </div>

        <!-- Informations vendeur -->
        <div class="vendor-section">
            <div class="vendor-title">Facturé à :</div>
            <strong>${data.vendeurPrenom} ${data.vendeurNom}</strong><br>
            Code Vendeur : ${data.vendeurCode}<br>
            Email : ${data.vendeurEmail}<br>
            Période : ${data.periode.debut} au ${data.periode.fin}
        </div>



        <!-- Calcul et progression des tranches -->
        <div class="progression-section">
            <div class="progression-title">📊 Analyse des Points CVD</div>
            <p><strong>Points totaux accumulés :</strong> ${data.totaux.totalPoints} points</p>
            <p><strong>Tranche actuelle :</strong> Tranche ${data.totaux.tranche}</p>
            ${data.totaux.totalPoints < 100 ? `
            <p><strong>Progression vers tranche supérieure :</strong> 
            ${data.totaux.totalPoints < 25 ? `${25 - data.totaux.totalPoints} points restants pour la Tranche 2` :
              data.totaux.totalPoints < 50 ? `${50 - data.totaux.totalPoints} points restants pour la Tranche 3` :
              `${100 - data.totaux.totalPoints} points restants pour la Tranche 4`}
            </p>` : '<p><strong>Tranche maximale atteinte !</strong></p>'}
        </div>

        <!-- Tableau des commissions détaillé -->
        <table class="table">
            <thead>
                <tr>
                    <th style="width: 35%">Désignation</th>
                    <th style="width: 20%">Produit</th>
                    <th style="width: 10%">Points</th>
                    <th style="width: 10%">Tranche</th>
                    <th style="width: 15%">Prix Unitaire</th>
                    <th style="width: 10%">Quantité</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(commissionsByTranche).map(tranche => `
                    <!-- En-tête de tranche -->
                    <tr>
                        <td colspan="6" class="tranche-header">
                            TRANCHE ${tranche} - Commissions applicables
                        </td>
                    </tr>
                    ${commissionsByTranche[tranche].commissions.map((commission: any) => `
                    <tr>
                        <td>${commission.clientPrenom} ${commission.clientNom}</td>
                        <td class="center">${commission.produit}</td>
                        <td class="center">${commission.points}</td>
                        <td class="center">T${commission.tranche}</td>
                        <td class="number">${commission.montant},00 €</td>
                        <td class="center">1</td>
                    </tr>
                    `).join('')}
                    <!-- Total de tranche -->
                    <tr>
                        <td colspan="4" class="tranche-total">Sous-total Tranche ${tranche}</td>
                        <td class="number tranche-total">${commissionsByTranche[tranche].totalMontant},00 €</td>
                        <td class="center tranche-total">${commissionsByTranche[tranche].commissions.length}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Section totaux -->
        <div class="total-section">
            <table class="total-table">
                <tr>
                    <td>Total HT</td>
                    <td class="number">${data.totaux.totalCommission},00 €</td>
                </tr>
                <tr>
                    <td>TVA</td>
                    <td class="number">0,00 €</td>
                </tr>
                <tr class="total-final">
                    <td>TOTAL TTC</td>
                    <td class="number">${data.totaux.totalCommission},00 €</td>
                </tr>
            </table>
            <div class="tva-mention">Sans TVA</div>
        </div>

        <!-- Pied de page -->
        <div class="footer">
            <p><strong>Document généré automatiquement</strong></p>
            <p>Le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
            <p>En cas de question, contactez ${data.entreprise.email}</p>
        </div>
    </div>
</body>
</html>`;

    return Buffer.from(html, 'utf8');
    
  } catch (error) {
    console.error('Erreur génération facture HTML:', error);
    throw new Error('Impossible de générer la facture');
  }
}