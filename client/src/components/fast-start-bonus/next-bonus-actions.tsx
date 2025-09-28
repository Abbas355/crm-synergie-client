import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Users, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  Calendar,
  Phone,
  FileText,
  Star
} from "lucide-react";

interface NextBonusActionsProps {
  currentPosition: string;
  nextBonus: {
    position: string;
    montant: number;
    delai: number;
    eligible: boolean;
  };
  totalVentes: number;
  joursRestants: number;
  initialShowActions?: boolean;
  // 🔥 NOUVELLES DONNÉES MLM pour personnalisation complète
  mlmData?: {
    directRecruits?: number;
    groupPoints?: number;
    directRecruitsList?: Array<{
      prenom: string;
      nom: string;
      codeVendeur: string;
    }>;
  };
}

export function NextBonusActions({ 
  currentPosition, 
  nextBonus, 
  totalVentes, 
  joursRestants,
  initialShowActions = false,
  mlmData // 🔥 NOUVELLES DONNÉES MLM
}: NextBonusActionsProps) {
  const [showActions, setShowActions] = useState(initialShowActions);

  // Calculer les actions spécifiques selon le palier suivant
  const getActionsForPosition = (position: string) => {
    switch (position) {
      case "ETT":
        return {
          pointsRequises: 50,
          pointsActuelles: totalVentes,
          pointsManquantes: Math.max(0, 50 - totalVentes),
          actions: [
            {
              icon: ShoppingCart,
              title: "Atteindre 50 points personnels",
              description: `Vous avez ${totalVentes} points, il vous en faut ${Math.max(0, 50 - totalVentes)} de plus`,
              status: totalVentes >= 50 ? "completed" : "pending",
              priority: totalVentes >= 45 ? "medium" : "high"
            },
            {
              icon: Users,
              title: "Recruter au minimum 2 nouveaux vendeurs",
              description: mlmData?.directRecruits >= 2 
                ? `Bravo ! Vous avez déjà ${mlmData.directRecruits} partenaires. Continuez à accompagner votre équipe`
                : mlmData?.directRecruits === 1
                ? `Félicitations pour votre premier partenaire ! Recrutez encore ${2 - (mlmData?.directRecruits || 0)} partenaires pour accélérer`
                : mlmData?.directRecruits === 0
                ? "Concentrez-vous sur votre premier recrutement - commencez par votre entourage proche"
                : "Former et accompagner 2 nouveaux vendeurs actifs",
              status: (mlmData?.directRecruits >= 2) ? "completed" : "pending",
              priority: (mlmData?.directRecruits >= 1) ? "medium" : "high"
            },
            {
              icon: Star,
              title: "Réaliser 150 points avec votre groupe",
              description: mlmData?.groupPoints >= 150
                ? `Objectif atteint ! Votre groupe génère ${mlmData.groupPoints} points (${mlmData.groupPoints - 150} au-dessus du minimum)`
                : mlmData?.groupPoints > 0
                ? `Votre groupe génère déjà ${mlmData.groupPoints} points, il en faut ${150 - (mlmData?.groupPoints || 0)} de plus`
                : "Votre équipe doit générer 150 points minimum - accompagnez vos partenaires dans leurs premières ventes",
              status: (mlmData?.groupPoints >= 150) ? "completed" : "pending",
              priority: (mlmData?.groupPoints >= 100) ? "medium" : "high"
            },
            {
              icon: Clock,
              title: "Respecter le délai de 30 jours",
              description: `Temps restant : ${Math.max(0, joursRestants)} jours`,
              status: joursRestants > 0 ? "pending" : "expired",
              priority: joursRestants <= 15 ? "high" : "medium"
            }
          ],
          conseils: [
            // 🔥 CONSEIL PERSONNALISÉ POINTS PERSONNELS
            totalVentes >= 50 
              ? `Excellent ! Vos ${totalVentes} points personnels dépassent le minimum requis (50)` 
              : `Il vous faut ${Math.max(0, 50 - totalVentes)} points de plus pour atteindre le minimum requis (50)`,
            
            // 🔥 CONSEIL PERSONNALISÉ RECRUTEMENT
            mlmData?.directRecruits >= 2
              ? `Bravo pour vos ${mlmData.directRecruits} partenaires ! Concentrez-vous maintenant sur leur accompagnement pour les faire progresser`
              : mlmData?.directRecruits === 1
              ? `Félicitations pour ${mlmData.directRecruitsList?.[0]?.prenom || 'votre premier partenaire'} ! Recrutez 2-3 partenaires supplémentaires pour accélérer votre qualification`
              : "Recrutez 4 prospects parce qu'il est plus simple de faire faire 25 points à 4 personnes que 50 points à 2 personnes.",
            
            // 🔥 CONSEIL PERSONNALISÉ POINTS GROUPE
            mlmData?.groupPoints >= 150
              ? `Objectif groupe atteint avec ${mlmData.groupPoints} points ! Maintenez cette dynamique et préparez-vous pour le niveau supérieur`
              : mlmData?.groupPoints > 0
              ? `Votre groupe progresse bien (${mlmData.groupPoints} pts). Accompagnez vos partenaires pour atteindre les 150 points groupe`
              : "Organisez des présentations d'opportunité business avec vos partenaires",
            
            "Accompagnez personnellement vos recrues les premières semaines - c'est la clé du succès",
            mlmData?.directRecruits >= 1
              ? "Créez un groupe WhatsApp ou Telegram pour animer votre équipe au quotidien"
              : "Commencez par votre entourage proche : famille, amis, collègues de confiance"
          ]
        };
      
      case "ETL":
        return {
          pointsRequises: 75,
          pointsActuelles: totalVentes,
          pointsManquantes: Math.max(0, 75 - totalVentes),
          actions: [
            {
              icon: ShoppingCart,
              title: "Atteindre 75 points personnels",
              description: `Vous avez ${totalVentes} points, il vous en faut ${Math.max(0, 75 - totalVentes)} de plus`,
              status: totalVentes >= 75 ? "completed" : "pending",
              priority: totalVentes >= 70 ? "medium" : "high"
            },
            {
              icon: Users,
              title: "Former 2 vendeurs ETT",
              description: "Avoir 2 vendeurs ETT minimum dans des groupes distincts",
              status: "pending",
              priority: "high"
            },
            {
              icon: Clock,
              title: "Respecter le délai de 120 jours",
              description: `Temps restant : ${joursRestants} jours (${Math.round(joursRestants/30)} mois)`,
              status: joursRestants > 0 ? "pending" : "expired",
              priority: joursRestants <= 30 ? "high" : "medium"
            },
            {
              icon: Star,
              title: "Leadership avancé d'équipe",
              description: "Développer vos compétences de leadership avec 2 ETT",
              status: "pending",
              priority: "medium"
            }
          ],
          conseils: [
            "Maintenez votre rythme : 10 points supplémentaires requis",
            "Identifiez vos 2 meilleurs vendeurs pour les former au niveau ETT",
            "Organisez des sessions de formation hebdomadaires",
            "Créez 2 groupes distincts avec un leader par groupe",
            "Développez un système de suivi des performances détaillé"
          ]
        };
      
      case "Manager":
        return {
          pointsRequises: 50,
          pointsActuelles: totalVentes,
          pointsManquantes: Math.max(0, 50 - totalVentes),
          actions: [
            {
              icon: ShoppingCart,
              title: "Réaliser 50 ventes",
              description: `Vous avez ${totalVentes} ventes, il vous en faut ${Math.max(0, 50 - totalVentes)} de plus`,
              status: totalVentes >= 50 ? "completed" : "pending",
              priority: "high"
            },
            {
              icon: Users,
              title: "Constituer une équipe de 5 vendeurs",
              description: "Avoir 5 vendeurs actifs dans votre équipe",
              status: "pending",
              priority: "high"
            },
            {
              icon: TrendingUp,
              title: "Atteindre 100 ventes d'équipe",
              description: "Votre équipe doit réaliser 100 ventes cumulées",
              status: "pending",
              priority: "high"
            },
            {
              icon: Clock,
              title: "Respecter le délai de 120 jours",
              description: `Temps restant : ${joursRestants} jours`,
              status: joursRestants > 0 ? "pending" : "expired",
              priority: joursRestants <= 20 ? "high" : "medium"
            }
          ],
          conseils: [
            "Développez votre réseau professionnel activement",
            "Organisez des événements de prospection d'équipe",
            "Mettez en place un système de suivi des performances",
            "Motivez votre équipe avec des challenges et récompenses"
          ]
        };

      case "RC":
        return {
          pointsRequises: 100,
          pointsActuelles: totalVentes,
          pointsManquantes: Math.max(0, 100 - totalVentes),
          actions: [
            {
              icon: ShoppingCart,
              title: "Réaliser 100 ventes personnelles",
              description: `Vous avez ${totalVentes} ventes, il vous en faut ${Math.max(0, 100 - totalVentes)} de plus`,
              status: totalVentes >= 100 ? "completed" : "pending",
              priority: totalVentes >= 90 ? "medium" : "high"
            },
            {
              icon: Users,
              title: "Développer une équipe de 15+ vendeurs",
              description: "Recruter et former au minimum 15 vendeurs actifs",
              status: "pending",
              priority: "high"
            },
            {
              icon: TrendingUp,
              title: "Atteindre 500 ventes d'organisation",
              description: "Total cumulé de votre équipe : 500 ventes minimum",
              status: "pending",
              priority: "high"
            },
            {
              icon: Star,
              title: "Formation leadership avancée",
              description: "Compléter la formation RC de 8h obligatoire",
              status: "pending",
              priority: "medium"
            },
            {
              icon: Clock,
              title: "Respecter le délai de 360 jours",
              description: `Temps restant : ${joursRestants} jours (${Math.round(joursRestants/30)} mois)`,
              status: joursRestants > 0 ? "pending" : "expired",
              priority: joursRestants <= 60 ? "high" : "medium"
            }
          ],
          conseils: [
            "Maintenez votre rythme actuel de 2-3 ventes par semaine",
            "Identifiez et formez 2-3 leaders potentiels dans votre équipe",
            "Organisez des événements de prospection d'équipe mensuels",
            "Mettez en place un système de suivi des performances détaillé",
            "Développez votre réseau via LinkedIn et les réseaux sociaux",
            "Créez un programme de mentorat pour vos nouveaux vendeurs"
          ]
        };

      default:
        return null;
    }
  };

  const actionData = getActionsForPosition(nextBonus.position);
  
  if (!actionData) return null;

  const progressPercentage = Math.min((actionData.pointsActuelles / actionData.pointsRequises) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Carte résumé cliquable */}
      <Card 
        className={`bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-200 shadow-xl cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] ${
          showActions ? 'ring-2 ring-blue-400' : ''
        }`}
        onClick={() => setShowActions(!showActions)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Prochain objectif : {nextBonus.position}
                </p>
                <p className="text-xs text-blue-600">
                  {actionData.pointsManquantes} points manquants • {joursRestants} jours restants
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {nextBonus.montant.toLocaleString()}€
              </Badge>
              <ArrowRight className={`h-4 w-4 text-blue-600 transition-transform ${showActions ? 'rotate-90' : ''}`} />
            </div>
          </div>
          
          {/* Barre de progression rapide */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-blue-600">
              <span>Progression points</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel d'actions détaillé */}
      {showActions && (
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl animate-in slide-in-from-top duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Plan d'action pour {nextBonus.position}</span>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                {nextBonus.montant.toLocaleString()}€
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Actions à effectuer */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Actions à effectuer</span>
              </h3>
              
              {actionData.actions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <div 
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      action.status === 'completed' 
                        ? 'bg-green-50 border-green-200' 
                        : action.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      action.status === 'completed' 
                        ? 'bg-green-100' 
                        : action.priority === 'high'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        action.status === 'completed' 
                          ? 'text-green-600' 
                          : action.priority === 'high'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {action.description}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        action.status === 'completed' ? 'default' :
                        action.priority === 'high' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {action.status === 'completed' ? '✓' : 
                       action.priority === 'high' ? 'Urgent' : 'À faire'}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Conseils stratégiques */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span>Conseils stratégiques</span>
              </h3>
              
              <div className="grid gap-2">
                {actionData.conseils.map((conseil, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{conseil}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton d'action */}
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              onClick={() => setShowActions(false)}
            >
              Compris ! Je me lance
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}