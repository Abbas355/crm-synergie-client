import jsPDF from 'jspdf';

export interface FactureData {
  numeroFacture: string;
  dateEdition: string;
  periode: string;
  vendeurNom: string;
  vendeurEmail: string;
  entreprise: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    siret?: string;
  };
  performances: {
    nombreVentes: number;
    pointsGeneres: number;
    commission: number;
    details: Array<{
      produit: string;
      quantite: number;
      pointsUnitaire: number;
      commisssionUnitaire: number;
      total: number;
    }>;
  };
}

// Version PROFESSIONNELLE du générateur PDF avec facture complète
export const genererFacturePDFSimple = (moisData: any, telecharger: boolean = true): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Couleurs professionnelles
  const bleuPrimaire = '#1e40af';
  const grisSecondaire = '#6b7280';
  const vertCommission = '#059669';
  
  // === EN-TÊTE ENTREPRISE PROFESSIONNEL ===
  doc.setFillColor(30, 64, 175); // Bleu primaire
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  // Logo et nom entreprise
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SYNERGIE MARKETING GROUP', 20, 25);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Plateforme de gestion des ventes et commissions Free', 20, 35);
  doc.text('Email: contact@synergiemarketinggroup.fr | Tél: 01 23 45 67 89', 20, 45);
  
  // === TITRE FACTURE ===
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE DE COMMISSION', 20, 75);
  
  // === INFORMATIONS FACTURE ===
  let yPos = 90;
  
  // Numéro de facture et informations
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const numeroFacture = `FC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  doc.text(`N° Facture : ${numeroFacture}`, 20, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`, 20, yPos + 10);
  doc.text(`Période : ${moisData?.mois || 'Juillet 2025'}`, 20, yPos + 20);
  
  // === INFORMATIONS VENDEUR ===
  yPos += 40;
  doc.setFont('helvetica', 'bold');
  doc.text('VENDEUR :', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Nom : Vendeur Synergie', 20, yPos + 12);
  doc.text('Email : ab@test.com', 20, yPos + 22);
  doc.text('Code Vendeur : FR98445061', 20, yPos + 32);
  
  // === INFORMATIONS ENTREPRISE (droite) ===
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR :', 120, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Synergie Marketing Group', 120, yPos + 12);
  doc.text('123 Avenue des Champs', 120, yPos + 22);
  doc.text('75008 Paris, France', 120, yPos + 32);
  doc.text('SIRET : 12345678901234', 120, yPos + 42);
  
  // === TABLEAU DÉTAILLÉ DES PRESTATIONS ===
  yPos += 10;
  
  // Titre du tableau
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAIL DES PRESTATIONS', 20, yPos);
  
  yPos += 15;
  
  // Tableau simple et professionnel
  // En-tête du tableau
  doc.setFillColor(30, 64, 175);
  doc.rect(20, yPos, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Description', 25, yPos + 10);
  doc.text('Période', 85, yPos + 10);
  doc.text('Qté', 120, yPos + 10);
  doc.text('Points', 140, yPos + 10);
  doc.text('Montant', 170, yPos + 10);
  
  yPos += 15;
  
  // Lignes du tableau
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Ligne 1 - Commission principale
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');
  doc.text('Commission ventes Free', 25, yPos + 8);
  doc.text(moisData?.mois || 'Juillet 2025', 85, yPos + 8);
  doc.text(`${moisData?.total || 0}`, 120, yPos + 8);
  doc.text(`${moisData?.points || 0}`, 140, yPos + 8);
  doc.text(`${moisData?.commission || 0}€`, 170, yPos + 8);
  
  yPos += 12;
  
  // Ligne 2 - Détail Freebox Ultra
  doc.text('• Freebox Ultra (6 pts)', 25, yPos + 8);
  doc.text('Premium', 85, yPos + 8);
  doc.text('2', 120, yPos + 8);
  doc.text('12', 140, yPos + 8);
  doc.text('240€', 170, yPos + 8);
  
  yPos += 12;
  
  // Ligne 3 - Détail Freebox Essentiel
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');
  doc.text('• Freebox Essentiel (5 pts)', 25, yPos + 8);
  doc.text('Standard', 85, yPos + 8);
  doc.text('3', 120, yPos + 8);
  doc.text('15', 140, yPos + 8);
  doc.text('180€', 170, yPos + 8);
  
  yPos += 12;
  
  // Ligne 4 - Détail Freebox Pop
  doc.text('• Freebox Pop (4 pts)', 25, yPos + 8);
  doc.text('Entrée', 85, yPos + 8);
  doc.text('1', 120, yPos + 8);
  doc.text('4', 140, yPos + 8);
  doc.text('60€', 170, yPos + 8);
  
  yPos += 12;
  
  // Ligne 5 - Détail Forfait 5G
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');
  doc.text('• Forfait 5G (1 pt)', 25, yPos + 8);
  doc.text('Mobile', 85, yPos + 8);
  doc.text('2', 120, yPos + 8);
  doc.text('2', 140, yPos + 8);
  doc.text('20€', 170, yPos + 8);
  
  yPos += 25;
  
  // === RÉCAPITULATIF FINANCIER ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉCAPITULATIF FINANCIER', 20, yPos);
  
  yPos += 15;
  
  // Sous-total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total HT :', 120, yPos);
  doc.text(`${moisData?.commission || 0}€`, 170, yPos);
  
  yPos += 12;
  doc.text('TVA (non applicable) :', 120, yPos);
  doc.text('0€', 170, yPos);
  
  yPos += 12;
  doc.setLineWidth(0.5);
  doc.line(120, yPos, 190, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL TTC :', 120, yPos);
  doc.setTextColor(34, 197, 94); // Vert
  doc.setFontSize(14);
  doc.text(`${moisData?.commission || 0}€`, 170, yPos);
  
  yPos += 25;
  
  // === CONDITIONS DE PAIEMENT ===
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS DE PAIEMENT', 20, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('• Paiement : Virement bancaire à 30 jours', 20, yPos);
  yPos += 8;
  doc.text('• Échéance : ' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'), 20, yPos);
  yPos += 8;
  doc.text('• Domiciliation : BNP Paribas - IBAN : FR76 XXXX XXXX XXXX XXXX', 20, yPos);
  
  yPos += 20;
  
  // === MENTIONS LÉGALES ===
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text('MENTIONS LÉGALES', 20, yPos);
  yPos += 10;
  doc.setFontSize(8);
  doc.text('• En application de l\'article L.441-6 du Code de commerce, tout retard de paiement donnera lieu au paiement', 20, yPos);
  yPos += 6;
  doc.text('  d\'intérêts de retard calculés sur la base du taux de la BCE majoré de 10 points.', 20, yPos);
  yPos += 6;
  doc.text('• Une indemnité forfaitaire de recouvrement de 40€ sera appliquée en cas de retard de paiement.', 20, yPos);
  
  // === PIED DE PAGE PROFESSIONNEL ===
  const footerY = pageHeight - 20;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY - 5, pageWidth, 25, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Synergie Marketing Group - Plateforme de gestion commerciale Free', pageWidth / 2, footerY + 2, { align: 'center' });
  doc.text(`Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 
           pageWidth / 2, footerY + 10, { align: 'center' });
  doc.text(`Numéro de facture : ${numeroFacture} - Page 1/1`, pageWidth / 2, footerY + 18, { align: 'center' });
  
  // Télécharger ou retourner l'objet PDF
  if (telecharger) {
    doc.save(`facture-commission-${moisData?.mois?.replace(' ', '-')?.toLowerCase()}-${new Date().getFullYear()}.pdf`);
  }
  
  return doc;
};

// Fonction utilitaire pour déterminer la tranche selon les points
function getTrancheFromPoints(points: number): string {
  if (points >= 101) return 'Tranche 4 (101+ pts)';
  if (points >= 51) return 'Tranche 3 (51-100 pts)';
  if (points >= 26) return 'Tranche 2 (26-50 pts)';
  return 'Tranche 1 (0-25 pts)';
}

// Fonction pour aperçu PDF - SOLUTION DÉFINITIVE MOBILE
export const aperçuFacturePDF = (moisData: any): void => {
  console.log('🎯 APERÇU PDF - Solution définitive mobile...', moisData);
  
  try {
    // Utiliser directement la fonction de téléchargement de jsPDF
    const filename = `facture-commission-${moisData?.mois?.replace(' ', '-')?.toLowerCase()}-${new Date().getFullYear()}.pdf`;
    console.log('📄 Génération PDF avec nom:', filename);
    
    // Générer et télécharger directement via jsPDF
    genererFacturePDFSimple(moisData, true);
    console.log('✅ PDF généré et téléchargé via jsPDF.save()');
    
  } catch (error) {
    console.error('❌ ERREUR GÉNÉRATION PDF:', error);
    
    // Fallback : créer PDF et forcer téléchargement manuel
    try {
      const doc = genererFacturePDFSimple(moisData, false);
      const pdfData = doc.output('datauristring');
      
      // Créer un lien de données directement
      const a = document.createElement('a');
      a.href = pdfData;
      a.download = `facture-commission-${moisData?.mois?.replace(' ', '-')?.toLowerCase()}.pdf`;
      a.click();
      console.log('✅ FALLBACK - Téléchargement forcé réussi');
      
    } catch (fallbackError) {
      console.error('❌ FALLBACK ÉCHOUÉ:', fallbackError);
      
      // Dernier recours : afficher les données PDF dans une nouvelle page
      try {
        const doc = genererFacturePDFSimple(moisData, false);
        const pdfData = doc.output('datauristring');
        const newWindow = window.open();
        if (newWindow) {
          newWindow.location.href = pdfData;
          console.log('✅ PDF affiché dans nouvelle fenêtre');
        } else {
          console.log('❌ Impossible d\'ouvrir nouvelle fenêtre');
          alert('Téléchargement PDF bloqué. Vérifiez les paramètres de votre navigateur.');
        }
      } catch (finalError) {
        console.error('❌ TOUS LES RECOURS ÉCHOUÉS:', finalError);
        alert('Impossible de générer le PDF. Problème technique détecté.');
      }
    }
  }
};

// Fonction pour télécharger PDF
export const telechargerFacturePDF = (moisData: any): void => {
  try {
    console.log('🎯 TÉLÉCHARGEMENT PDF - Début...', moisData);
    genererFacturePDFSimple(moisData, true);
    console.log('✅ TÉLÉCHARGEMENT PDF - Terminé');
  } catch (error) {
    console.error('❌ ERREUR TÉLÉCHARGEMENT PDF:', error);
    alert('Erreur lors du téléchargement PDF');
  }
};


// Fonction pour imprimer PDF
export const imprimerFacturePDF = (moisData: any): void => {
  try {
    console.log('🎯 IMPRESSION PDF - Début...', moisData);
    const doc = genererFacturePDFSimple(moisData, false);
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    // Créer un iframe caché pour l'impression
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    
    // Fonction pour lancer l'impression
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
        console.log('✅ IMPRESSION PDF - Lancée');
      } catch (printError) {
        console.error('❌ ERREUR IMPRESSION:', printError);
        // Fallback: ouvrir dans nouvel onglet
        window.open(url, '_blank');
      }
    };
    
    document.body.appendChild(iframe);
    
    // Nettoyer après impression
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 10000);
    
  } catch (error) {
    console.error('❌ ERREUR IMPRESSION PDF:', error);
    alert('Erreur lors de l\'impression PDF');
  }
};

