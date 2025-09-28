import React, { useState } from "react";
import { PageTitleHeader } from "@/components/layout/page-title-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Mail, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DocumentPreviewModal } from "@/components/recruitment/document-preview-modal";

// Fonction pour générer du contenu HTML dynamique
const generateAttestationHTML = (nom = "Nom", prenom = "Prénom") => {
  const dateFormation = new Date().toLocaleDateString('fr-FR');
  const dateAttestation = new Date().toLocaleDateString('fr-FR');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attestation de formation validée</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }
    .content {
      margin-bottom: 30px;
    }
    .signature-section {
      margin-top: 40px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 200px;
      margin-top: 5px;
    }
    ul {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/images/smg-logo-hd.svg" alt="SMG" class="logo" style="max-width: 180px; height: 80px; margin: 0 auto 20px auto; display: block;" />
    <h1>Attestation sur l'honneur de formation et de réussite aux tests</h1>
  </div>
  
  <div class="content">
    <p>Je soussigné(e), <strong>${prenom} ${nom}</strong>, atteste sur l'honneur avoir suivi l'intégralité de la formation obligatoire pour devenir vendeur indépendant chez Synergie Marketing Group.</p>
    
    <p>Je confirme avoir compris et accepté :</p>
    <ul>
      <li>Les règles éthiques de vente et de démarchage</li>
      <li>Les droits et obligations des vendeurs indépendants</li>
      <li>Les procédures de vente et de suivi client</li>
      <li>Les caractéristiques des produits et services commercialisés</li>
      <li>Les règles de confidentialité et de protection des données</li>
    </ul>
    
    <p>Je m'engage à respecter scrupuleusement ces règles dans l'exercice de mes fonctions de vendeur indépendant.</p>
    
    <p><strong>Date de fin de formation :</strong> ${dateFormation}</p>
    <p><strong>Date d'attestation :</strong> ${dateAttestation}</p>
  </div>
  
  <div class="signature-section">
    <p>Signature du vendeur :</p>
    <div class="signature-line"></div>
  </div>
</body>
</html>
`;
};

// Fonction pour générer le contrat avec information personnalisée
const generateContratHTML = (nom = "Nom", prenom = "Prénom") => {
  const dateSignature = new Date().toLocaleDateString('fr-FR');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat de Vente Indépendant</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }
    h2 {
      font-size: 18px;
      margin-top: 30px;
      color: #444;
    }
    .content {
      margin-bottom: 30px;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 100%;
      margin-top: 5px;
      margin-bottom: 10px;
    }
    ul {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/images/smg-logo-hd.svg" alt="SMG" class="logo" style="max-width: 180px; height: 80px; margin: 0 auto 20px auto; display: block;" />
    <h1>Contrat de Vente Indépendant</h1>
  </div>
  
  <div class="content">
    <p>Entre la société Synergie Marketing Group, ci-après dénommée "la Société", et <strong>${prenom} ${nom}</strong>, ci-après dénommé(e) "le Vendeur Indépendant".</p>
    
    <h2>Article 1 - Objet du Contrat</h2>
    <p>Le présent contrat a pour objet de définir les conditions dans lesquelles le Vendeur Indépendant exercera son activité de commercialisation des produits et services de la Société.</p>
    
    <h2>Article 2 - Statut du Vendeur Indépendant</h2>
    <p>Le Vendeur Indépendant exerce son activité en toute indépendance. Il n'est lié à la Société par aucun lien de subordination.</p>
    
    <h2>Article 3 - Obligations du Vendeur Indépendant</h2>
    <p>Le Vendeur Indépendant s'engage à :</p>
    <ul>
      <li>Respecter la réglementation en vigueur</li>
      <li>Suivre les formations obligatoires</li>
      <li>Présenter de manière loyale et transparente les produits et services</li>
      <li>Ne pas faire de promesses non autorisées par la Société</li>
    </ul>
    
    <h2>Article 4 - Rémunération</h2>
    <p>Le Vendeur Indépendant percevra des commissions selon le barème en vigueur au moment de la vente.</p>
    
    <h2>Article 5 - Durée</h2>
    <p>Le présent contrat est conclu pour une durée indéterminée à compter de sa signature.</p>
  </div>
  
  <div class="signature-section">
    <div class="signature-box">
      <p>Pour la Société :</p>
      <div class="signature-line"></div>
      <p>Date : ${dateSignature}</p>
    </div>
    
    <div class="signature-box">
      <p>Le Vendeur Indépendant :</p>
      <div class="signature-line"></div>
      <p>Date : ${dateSignature}</p>
    </div>
  </div>
</body>
</html>
`;
};

export default function DocumentDemoPage() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  
  // Obtenir nom et prénom à partir du username
  const getUserFullName = (): { prenom: string, nom: string } => {
    if (!user || !user.username) return { prenom: "Prénom", nom: "Nom" };
    
    // Si l'utilisateur est déjà un email, on utilise la partie avant @ comme prénom
    if (user.username.includes('@')) {
      const namePart = user.username.split('@')[0];
      // Capitaliser la première lettre
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return { prenom: capitalized, nom: "Utilisateur" };
    }
    
    // Sinon on sépare en deux parties (prénom/nom)
    const nameParts = user.username.split(' ');
    if (nameParts.length >= 2) {
      return { 
        prenom: nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1),
        nom: nameParts.slice(1).join(' ').charAt(0).toUpperCase() + nameParts.slice(1).join(' ').slice(1)
      };
    }
    
    // Par défaut si on ne peut pas séparer
    return { prenom: user.username, nom: "Utilisateur" };
  };
  
  const { prenom, nom } = getUserFullName();
  
  // Générer les contenus HTML personnalisés
  const attestationHTML = generateAttestationHTML(nom, prenom);
  const contratHTML = generateContratHTML(nom, prenom);
  
  // États pour les modales de prévisualisation
  const [attestationPreview, setAttestationPreview] = useState({
    isOpen: false,
    document: {
      id: 1,
      type: "attestationFormation",
      nomFichier: "attestationFormation.html",
      contenuDocument: attestationHTML,
      estSigne: false,
      dateUpload: new Date(),
      createdAt: new Date(),
      cheminFichier: "/documents/attestationFormation.html",
      tailleFichier: attestationHTML.length,
      prospectId: 1,
      uploadedById: 1,
      signatureData: null,
      dateSignature: null
    }
  });
  
  const [contratPreview, setContratPreview] = useState({
    isOpen: false,
    document: {
      id: 2,
      type: "contratSigne",
      nomFichier: "contrat_de_vente.html",
      contenuDocument: contratHTML,
      estSigne: true,
      dateUpload: new Date(),
      createdAt: new Date(),
      cheminFichier: "/documents/contrat_de_vente.html",
      tailleFichier: contratHTML.length,
      prospectId: 1,
      uploadedById: 1,
      signatureData: {},
      dateSignature: new Date()
    }
  });
  
  // Extraire les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user || !user.username) return "UN";
    
    // Si le nom d'utilisateur contient @ (email), on prend avant le @
    const name = user.username.split('@')[0];
    if (name.length <= 2) return name.toUpperCase();
    
    // Sinon on prend les deux premières lettres
    return name.substring(0, 2).toUpperCase();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
  };
  
  const handleDownload = (type: 'attestation' | 'contrat') => {
    // Choix du contenu selon le type de document
    const docContent = type === 'attestation' ? attestationHTML : contratHTML;
    const docName = type === 'attestation' ? 'attestationFormation.html' : 'contrat_de_vente.html';
      
    // Créer un blob pour le téléchargement
    const blob = new Blob([docContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien pour télécharger
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = docName;
    downloadLink.click();
    
    // Nettoyer l'URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    
    toast({
      title: "Téléchargement",
      description: "Le document a été téléchargé avec succès",
    });
  };
  
  const handleShare = (type: 'attestation' | 'contrat') => {
    toast({
      title: "Partage",
      description: `Le ${type === 'attestation' ? "document d'attestation" : "contrat de vente"} a été partagé par email`,
    });
  };
  
  // Ouvrir le modal de prévisualisation de l'attestation
  const openAttestationPreview = () => {
    setAttestationPreview({
      ...attestationPreview,
      isOpen: true
    });
  };
  
  // Fermer le modal de prévisualisation de l'attestation
  const closeAttestationPreview = () => {
    setAttestationPreview({
      ...attestationPreview,
      isOpen: false
    });
  };
  
  // Ouvrir le modal de prévisualisation du contrat
  const openContratPreview = () => {
    setContratPreview({
      ...contratPreview,
      isOpen: true
    });
  };
  
  // Fermer le modal de prévisualisation du contrat
  const closeContratPreview = () => {
    setContratPreview({
      ...contratPreview,
      isOpen: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec logo SMG centré exactement comme sur la capture d'écran */}
      <PageTitleHeader
        showNotifications={true}
        showSearch={true}
        username={user?.username || ""}
        userInitials={getUserInitials()}
        onLogout={handleLogout}
      />
      
      <main className="px-2 py-4 pb-20 sm:px-4 sm:py-6">
        <h1 className="text-xl font-bold mb-4 sm:text-2xl sm:mb-6">Tableau de bord</h1>
        
        {/* Cartes statistiques optimisées pour mobile */}
        <div className="grid grid-cols-2 gap-3 mb-4 sm:gap-4 sm:mb-6">
          <Card className="bg-white shadow border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 h-9 w-9 rounded-md flex items-center justify-center text-white mb-2">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Nombre total de clients</div>
              <div className="text-xl font-bold sm:text-2xl">125</div>
              <Button variant="link" className="px-0 text-blue-600 h-auto text-sm p-0 mt-1">
                Voir tous les clients
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start">
                <div className="bg-green-600 h-9 w-9 rounded-md flex items-center justify-center text-white mb-2">
                  <Mail className="h-5 w-5" />
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Campagnes Actives</div>
              <div className="text-xl font-bold sm:text-2xl">12</div>
              <Button variant="link" className="px-0 text-green-600 h-auto text-sm p-0 mt-1">
                Voir toutes les campagnes
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-lg font-bold mb-3 sm:text-xl sm:mb-4">Recrutement</h2>
        
        <div className="grid grid-cols-1 gap-4 mb-16 sm:mb-0 sm:grid-cols-2">
          {/* Document 1 - Attestation de formation */}
          <Card className="bg-white shadow border-0">
            <CardHeader className="pb-1 pt-3 px-3 sm:pb-2 sm:pt-4 sm:px-4">
              <CardTitle className="text-base flex items-center sm:text-lg">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Attestation de formation
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              <p className="text-xs text-gray-500 mb-3 sm:text-sm sm:mb-4">
                Document attestant que vous avez suivi la formation obligatoire.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={openAttestationPreview}
                  className="flex items-center flex-1 justify-center text-xs h-8 sm:text-sm"
                >
                  <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Prévisualiser
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownload('attestation')}
                  className="flex items-center flex-1 justify-center text-xs h-8 sm:text-sm"
                >
                  <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Télécharger
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleShare('attestation')}
                  className="flex items-center flex-1 justify-center text-xs h-8 sm:text-sm"
                >
                  <Mail className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Document 2 - Contrat de vente */}
          <Card className="bg-white shadow border-0">
            <CardHeader className="pb-1 pt-3 px-3 sm:pb-2 sm:pt-4 sm:px-4">
              <CardTitle className="text-base flex items-center sm:text-lg">
                <FileText className="mr-2 h-5 w-5 text-green-600" />
                Contrat de vente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              <p className="text-xs text-gray-500 mb-3 sm:text-sm sm:mb-4">
                Contrat de vente signé électroniquement.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={openContratPreview}
                  className="flex items-center flex-1 justify-center text-xs h-8 sm:text-sm"
                >
                  <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Prévisualiser
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownload('contrat')}
                  className="flex items-center flex-1 justify-center text-xs h-8 sm:text-sm"
                >
                  <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Télécharger
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleShare('contrat')}
                  className="flex items-center flex-1 justify-center text-xs h-8 sm:text-sm"
                >
                  <Mail className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Modal de prévisualisation de l'attestation */}
      <DocumentPreviewModal
        document={attestationPreview.document}
        isOpen={attestationPreview.isOpen}
        onClose={closeAttestationPreview}
        onDownload={() => handleDownload('attestation')}
      />
      
      {/* Modal de prévisualisation du contrat */}
      <DocumentPreviewModal
        document={contratPreview.document}
        isOpen={contratPreview.isOpen}
        onClose={closeContratPreview}
        onDownload={() => handleDownload('contrat')}
      />
    </div>
  );
}