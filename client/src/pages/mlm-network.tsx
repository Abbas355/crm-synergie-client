import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  ChevronDown, 
  ChevronRight, 
  Eye,
  Users, 
  Crown,
  Star,
  Award,
  TrendingUp,
  ArrowLeft,
  Target,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X
} from "lucide-react";
import { useState } from "react";
import { getLevelDisplayTitle, getLevelColor } from "@/utils/mlm-levels";
import { MLM_QUALIFICATIONS } from "@shared/mlm-qualifications";
import { Progress } from "@/components/ui/progress";

interface NetworkMember {
  id: string;
  prenom: string;
  nom: string;
  codeVendeur: string;
  role: string;
  niveau: number;
  clientsCount: number;
  equipeComplete: boolean;
  children?: NetworkMember[];
}

interface VendeurDetails {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  codeVendeur: string;
  codeParrainage: string;
  niveau: string;
  ville: string;
  codePostal: string;
  createdAt: string;
  active: boolean;
  statistiques: {
    clientsPersonnels: number;
    pointsPersonnels: number;
    recruesDirectes: number;
    produitStats: Record<string, number>;
  };
  recrues: Array<{
    id: number;
    prenom: string;
    nom: string;
    codeVendeur: string;
    niveau: string;
    active: boolean;
    statistiques: {
      clientsPersonnels: number;
      pointsPersonnels: number;
      recruesDirectes: number;
    };
  }>;
}

// Fonction pour calculer le prochain objectif MLM
const calculateNextObjective = (vendeurDetails: VendeurDetails) => {
  const niveauActuel = vendeurDetails.niveau?.toUpperCase() || 'CONSEILLER';
  const pointsPersonnels = vendeurDetails.statistiques.pointsPersonnels;
  const recruesDirectes = vendeurDetails.statistiques.recruesDirectes;
  
  // Ordre des niveaux MLM
  const niveaux = ['CONSEILLER', 'CQ', 'ETT', 'ETL', 'MANAGER'];
  const indexActuel = niveaux.indexOf(niveauActuel);
  
  if (indexActuel === -1 || indexActuel >= niveaux.length - 1) {
    return {
      nextLevel: 'Niveau Maximum',
      progression: 100,
      pointsRequis: 0,
      pointsManquants: 0,
      recruesRequises: 0,
      recruesManquantes: 0,
      conditions: []
    };
  }
  
  const prochainNiveau = niveaux[indexActuel + 1];
  const criteresProchain = MLM_QUALIFICATIONS[prochainNiveau];
  
  if (!criteresProchain) {
    return {
      nextLevel: 'Niveau suivant non défini',
      progression: 0,
      pointsRequis: 0,
      pointsManquants: 0,
      recruesRequises: 0,
      recruesManquantes: 0,
      conditions: []
    };
  }
  
  const pointsRequis = criteresProchain.pointsPersonnelsRequis;
  const pointsManquants = Math.max(0, pointsRequis - pointsPersonnels);
  const progressionPoints = Math.min(100, (pointsPersonnels / pointsRequis) * 100);
  
  const recruesRequises = criteresProchain.equipeRequise?.nombreVendeurs || 0;
  const recruesManquantes = Math.max(0, recruesRequises - recruesDirectes);
  const progressionRecrues = recruesRequises > 0 ? Math.min(100, (recruesDirectes / recruesRequises) * 100) : 100;
  
  // Progression globale (moyenne pondérée)
  const progressionGlobale = Math.min(100, (progressionPoints + progressionRecrues) / 2);
  
  const conditions = [
    {
      type: 'points',
      label: `${pointsRequis} points personnels cumulés`,
      current: pointsPersonnels,
      required: pointsRequis,
      completed: pointsPersonnels >= pointsRequis,
      progression: progressionPoints
    }
  ];
  
  if (recruesRequises > 0) {
    conditions.push({
      type: 'recrues',
      label: `Minimum ${recruesRequises} groupes`,
      current: recruesDirectes,
      required: recruesRequises,
      completed: recruesDirectes >= recruesRequises,
      progression: progressionRecrues
    });
  }
  
  return {
    nextLevel: getLevelDisplayTitle(prochainNiveau),
    nextLevelKey: prochainNiveau,
    progression: progressionGlobale,
    pointsRequis,
    pointsManquants,
    recruesRequises,
    recruesManquantes,
    conditions,
    description: criteresProchain.description,
    bonus: criteresProchain.bonusMontant
  };
};

export default function MLMNetworkPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showVendeurModal, setShowVendeurModal] = useState(false);

  // Requête pour récupérer les statistiques MLM
  const { data: mlmStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/mlm/stats'],
    enabled: !!user,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Requête pour récupérer la hiérarchie du réseau avec données réelles
  const { data: networkHierarchy, isLoading } = useQuery({
    queryKey: ['/api/mlm/hierarchy'],
    enabled: !!user,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Requête pour récupérer les détails d'un vendeur spécifique
  const { data: vendeurDetails, isLoading: vendeurLoading } = useQuery({
    queryKey: [`/api/mlm/vendeur/${selectedMemberId}`],
    enabled: !!selectedMemberId,
  });

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getRoleIcon = (role: string) => {
    const levelColor = getLevelColor(role);
    
    switch (levelColor) {
      case 'yellow':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'indigo':
        return <Star className="h-3 w-3 text-indigo-600" />;
      case 'purple':
        return <Award className="h-3 w-3 text-purple-600" />;
      case 'blue':
        return <Users className="h-3 w-3 text-blue-600" />;
      case 'green':
      default:
        return <Users className="h-3 w-3 text-green-600" />;
    }
  };

  const getBorderColor = (role: string) => {
    const levelColor = getLevelColor(role);
    
    switch (levelColor) {
      case 'yellow':
        return 'border-l-yellow-500';
      case 'indigo':
        return 'border-l-indigo-500';
      case 'purple':
        return 'border-l-purple-500';
      case 'blue':
        return 'border-l-blue-500';
      case 'green':
      default:
        return 'border-l-green-500';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const levelColor = getLevelColor(role);
    
    switch (levelColor) {
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'green':
      default:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  // Composant récursif pour afficher la hiérarchie
  const HierarchyNode = ({ 
    member, 
    level = 0, 
    isRoot = false 
  }: { 
    member: NetworkMember; 
    level?: number; 
    isRoot?: boolean; 
  }) => {
    const nodeId = isRoot ? 'root' : member.id;
    const hasChildren = member.children && member.children.length > 0;
    const isExpanded = expandedNodes.has(nodeId);
    const marginLeft = level * 16;

    return (
      <div className="relative">
        {/* Ligne de connexion verticale */}
        {level > 0 && (
          <div 
            className="absolute w-px bg-gray-300 top-0 bottom-0"
            style={{ left: marginLeft - 8 }}
          />
        )}
        
        {/* Ligne de connexion horizontale */}
        {level > 0 && (
          <div 
            className="absolute w-2 h-px bg-gray-300 top-6"
            style={{ left: marginLeft - 8 }}
          />
        )}

        <div 
          className="mb-2"
          style={{ marginLeft: level > 0 ? marginLeft : 0 }}
        >
          <Card className={`bg-white border shadow-sm transition-all duration-200 hover:shadow-md ${
            isRoot 
              ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' 
              : `border-gray-200 border-l-4 ${getBorderColor(member.role)}`
          }`}>
            <CardContent className="p-3">
              {/* Ligne supérieure: Chevron + Nom + Icône œil + Nombre clients */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {/* Chevron d'expansion */}
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {hasChildren ? (
                      <button
                        onClick={() => toggleNode(nodeId)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-gray-600" />
                        )}
                      </button>
                    ) : (
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  
                  {/* Nom complet */}
                  <div className={`font-semibold text-base flex-1 min-w-0 ${
                    isRoot ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    <div className="truncate">
                      {member.prenom} {member.nom}
                      {isRoot && <span className="ml-1 text-sm text-blue-600">(Vous)</span>}
                    </div>
                  </div>
                </div>

                {/* Nombre de clients + Icône œil */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-xl font-bold leading-none ${
                      isRoot ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {member.clientsCount}
                    </div>
                    <div className="text-xs text-gray-500 leading-none">clients</div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-gray-100 rounded-full flex-shrink-0"
                    onClick={() => {
                      console.log('🔍 Debug - Clic sur vendeur:', member.id, member.prenom, member.nom);
                      const cleanId = String(member.id).trim().replace(/\s+/g, '');
                      console.log('🔍 Debug - ID nettoyé:', cleanId);
                      setSelectedMemberId(cleanId);
                      setShowVendeurModal(true);
                      console.log('🔍 Debug - Modal state:', showVendeurModal);
                    }}
                  >
                    <Eye className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                  </Button>
                </div>
              </div>
              
              {/* Ligne inférieure: Badges et Code vendeur */}
              <div className="space-y-2">
                {/* Rôle et Niveau */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 h-5 ${getRoleBadgeColor(member.role)}`}
                  >
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{getLevelDisplayTitle(member.role)}</span>
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-200 h-5"
                  >
                    Niveau {member.niveau}
                  </Badge>
                </div>
                
                {/* Code vendeur */}
                <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                  {member.codeVendeur}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Afficher les enfants */}
        {hasChildren && isExpanded && (
          <div className="space-y-0">
            {member.children?.map((child) => (
              <HierarchyNode
                key={child.id}
                member={child}
                level={level + 1}
                isRoot={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Modal des détails vendeur
  const VendeurDetailsModal = () => {
    if (!vendeurDetails || vendeurLoading) {
      return (
        <Dialog open={showVendeurModal} onOpenChange={setShowVendeurModal}>
          <DialogContent className="sm:max-w-md">
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Chargement des détails...</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    const { statistiques } = vendeurDetails;
    const dateInscription = new Date(vendeurDetails.createdAt).toLocaleDateString('fr-FR');
    const prochainObjectif = calculateNextObjective(vendeurDetails);
    
    return (
      <Dialog open={showVendeurModal} onOpenChange={setShowVendeurModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {vendeurDetails.prenom} {vendeurDetails.nom}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVendeurModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Niveau Actuel */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Niveau Actuel</h3>
              <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                {getLevelDisplayTitle(vendeurDetails.niveau)}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Membre depuis le {dateInscription}
              </p>
            </div>


            {/* Statistiques principales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {statistiques.pointsPersonnels}
                </div>
                <div className="text-sm text-gray-600">Points personnels</div>
              </div>
              
              <div className="text-center bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statistiques.clientsPersonnels}
                </div>
                <div className="text-sm text-gray-600">Clients</div>
              </div>
              
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {statistiques.recruesDirectes}
                </div>
                <div className="text-sm text-gray-600">Vendeurs</div>
              </div>
              
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {vendeurDetails.recrues?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Groupes</div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Informations de contact
              </h4>
              
              <div className="space-y-3">
                {vendeurDetails.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      Téléphone
                    </div>
                    <a 
                      href={`tel:${vendeurDetails.phone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {vendeurDetails.phone}
                    </a>
                  </div>
                )}
                
                {vendeurDetails.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </div>
                    <a 
                      href={`mailto:${vendeurDetails.email}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {vendeurDetails.email}
                    </a>
                  </div>
                )}
                
                {(vendeurDetails.ville || vendeurDetails.codePostal) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      Localisation
                    </div>
                    <div className="text-gray-900 font-medium">
                      {vendeurDetails.codePostal} {vendeurDetails.ville}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    Code vendeur
                  </div>
                  <div className="text-gray-900 font-mono font-medium bg-gray-200 px-2 py-1 rounded">
                    {vendeurDetails.codeVendeur}
                  </div>
                </div>
              </div>
            </div>

            {/* Répartition des produits */}
            {Object.keys(statistiques.produitStats).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Répartition des ventes</h4>
                <div className="space-y-2">
                  {Object.entries(statistiques.produitStats).map(([produit, count]) => (
                    <div key={produit} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{produit}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progression vers Prochain Objectif - Style Page Objectif */}
            {(() => {
              const vendeurObjectif = calculateNextObjective(vendeurDetails);
              
              return (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Prochain Objectif</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-green-100 rounded-full border border-green-300 mb-2">
                      <span className="text-green-800 font-semibold">{vendeurObjectif.nextLevel}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{vendeurObjectif.description}</p>
                  </div>

                  {/* Barre de progression principale */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-sm font-bold text-gray-900">{Math.round(vendeurObjectif.progression)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${vendeurObjectif.progression}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Conditions requises */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Conditions requises :</h4>
                    <div className="space-y-3">
                      {vendeurObjectif.conditions.map((condition, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${condition.completed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <span className="text-sm font-medium text-gray-700">{condition.label}</span>
                            </div>
                            <span className="text-xs text-gray-500">{condition.current}/{condition.required}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                condition.completed ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min((condition.current / condition.required) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Détail des groupes (recrues directes) */}
                  {vendeurDetails.recrues && vendeurDetails.recrues.length > 0 && (
                    <div className="space-y-3">
                      {vendeurDetails.recrues.map((recrue) => {
                        const groupProgress = Math.min((recrue.statistiques.pointsPersonnels / 50) * 100, 100);
                        
                        return (
                          <div key={recrue.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${recrue.statistiques.pointsPersonnels >= 50 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-sm text-gray-600">Groupe {recrue.prenom} {recrue.nom}</span>
                              </div>
                              <span className="text-xs text-gray-500">{recrue.statistiques.pointsPersonnels}/50</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  groupProgress >= 100 ? 'bg-green-500' : 'bg-blue-400'
                                }`}
                                style={{ width: `${groupProgress}%` }}
                              ></div>
                            </div>
                            <div className="ml-4 text-xs text-gray-500">{Math.round(groupProgress)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions rapides */}
            <div className="flex gap-2">
              {vendeurDetails.phone && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`tel:${vendeurDetails.phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler
                </Button>
              )}
              {vendeurDetails.email && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${vendeurDetails.email}`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="p-4 sm:p-6 max-w-md mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Hiérarchie du Réseau</h1>
              <p className="text-gray-600 text-sm">Chargement...</p>
            </div>
            
            {/* Skeleton loading */}
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Modal des détails vendeur */}
        <VendeurDetailsModal />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 max-w-md mx-auto">
          {/* En-tête */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Hiérarchie du Réseau</h1>
            <p className="text-gray-600 text-sm">Vue d'ensemble de votre équipe commerciale</p>
            
            {/* Bouton retour MLM */}
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mt-4 p-0"
              onClick={() => setLocation('/mlm')}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour MLM
            </Button>
          </div>

          {/* Statistiques en grille 2x2 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : ((mlmStats as any)?.recruits || 0)}
                </div>
                <div className="text-xs text-gray-600">Vendeurs</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : ((mlmStats as any)?.totalClients || 0)}
                </div>
                <div className="text-xs text-gray-600">Clients totaux</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : ((mlmStats as any)?.personalPointsTotal || 0)}€
                </div>
                <div className="text-xs text-gray-600">Commissions</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : ((mlmStats as any)?.partenairesDirects || 0)}
                </div>
                <div className="text-xs text-gray-600">Partenaires directs</div>
              </CardContent>
            </Card>
          </div>

          {/* Structure Hiérarchique */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Structure Hiérarchique</h2>
            
            {networkHierarchy ? (
              <HierarchyNode
                member={{
                  id: networkHierarchy.id || 'root',
                  prenom: networkHierarchy.prenom || user?.prenom || 'Eric',
                  nom: networkHierarchy.nom || user?.nom || 'Rostand',
                  codeVendeur: networkHierarchy.codeVendeur || user?.codeVendeur || 'FR98445061',
                  role: networkHierarchy.role || 'conseiller',
                  niveau: 0,
                  clientsCount: networkHierarchy.clientsCount || 0,
                  equipeComplete: networkHierarchy.equipeComplete || false,
                  children: networkHierarchy.children || []
                }}
                level={0}
                isRoot={true}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune donnée de hiérarchie disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal des détails vendeur */}
      <VendeurDetailsModal />
    </AppLayout>
  );
}