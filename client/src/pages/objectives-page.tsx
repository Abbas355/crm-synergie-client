import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageTitleHeader } from '@/components/layout/page-title-header';
import { ArrowLeft, Target, TrendingUp, Users, Award, Crown, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// CORRECTION : Import de la logique MLM centralisée
import { MLM_QUALIFICATIONS, determinerQualificationMLM, computeRCQualification } from '@shared/mlm-qualifications';

interface MLMStats {
  personalPoints: number;
  groupPoints: number;
  recruits: number;
  groups: number;
  totalRevenue: number;
  currentLevel: string;
  totalClients: number;
  installedClients: number;
  pendingRecruits: number;
}

interface ObjectiveLevel {
  id: string;
  name: string;
  shortName: string;
  description: string;
  conditions: string[];
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  order: number;
}

const MLM_LEVELS: ObjectiveLevel[] = [
  {
    id: 'conseiller',
    name: 'Conseiller',
    shortName: 'C',
    description: 'Point de départ de votre parcours MLM',
    conditions: ['Statut initial pour tous les nouveaux vendeurs'],
    icon: Users,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    order: 1
  },
  {
    id: 'cq',
    name: 'Conseiller Qualifié',
    shortName: 'CQ',
    description: 'Premier niveau de qualification avec vos premières ventes',
    conditions: ['Réaliser 25 points personnels'],
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    order: 2
  },
  {
    id: 'ett',
    name: 'Executive Team Trainer',
    shortName: 'ETT',
    description: 'Développement de votre équipe et compétences de formation',
    conditions: [
      '50 points personnels cumulés depuis le démarrage',
      'Minimum 2 groupes (vendeurs directs)',
      'Chaque groupe minimum 50 points',
      'Total 150 points (50 personnel + 100 groupes, max 50/groupe)'
    ],
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    order: 3
  },
  {
    id: 'etl',
    name: 'Executive Team Leader',
    shortName: 'ETL',
    description: 'Leadership avancé avec développement de leaders',
    conditions: [
      'Avoir 75 points personnels minimum',
      'Avoir 2 vendeurs ETT minimum dans des groupes distincts'
    ],
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    order: 4
  },
  {
    id: 'manager',
    name: 'Manager',
    shortName: 'M',
    description: 'Gestion multi-groupes avec objectifs élevés',
    conditions: [
      'Avoir 100 points personnels minimum',
      'Avoir 4 groupes avec 500 points minimum chacun'
    ],
    icon: Crown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    order: 5
  },
  {
    id: 'rc',
    name: 'Regional Coordinator',
    shortName: 'RC',
    description: 'Coordination régionale avec répartition équilibrée',
    conditions: [
      'Avoir 4 groupes minimum',
      'Réaliser un total de 16 000 points',
      'Avec maximum 4000 points par équipe'
    ],
    icon: Star,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    order: 6
  },
  {
    id: 'rd',
    name: 'Regional Director',
    shortName: 'RD',
    description: 'Direction régionale avec chiffre d\'affaires significatif',
    conditions: [
      'Avoir 5 groupes minimum',
      'Chiffre d\'affaires cumulé de 400 000€'
    ],
    icon: Crown,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    order: 7
  },
  {
    id: 'rvp',
    name: 'Regional Vice-President',
    shortName: 'RVP',
    description: 'Vice-présidence avec leadership multi-niveaux',
    conditions: [
      'Avoir 6 groupes minimum',
      'Chiffre d\'affaires cumulé de 600 000€',
      '3 groupes avec distributeur RD',
      '2 groupes avec distributeur RC',
      '1 groupe avec distributeur M'
    ],
    icon: Crown,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    order: 8
  },
  {
    id: 'svp',
    name: 'Senior Vice-President',
    shortName: 'SVP',
    description: 'Niveau suprême avec excellence exceptionnelle',
    conditions: [
      'Avoir 6 groupes minimum',
      'Chiffre d\'affaires cumulé de 1 000 000€',
      'CA maximum 200 000€ par branche',
      '3 groupes avec distributeur RVP',
      '2 groupes avec distributeur RD',
      '1 groupe avec distributeur RC'
    ],
    icon: Crown,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    order: 9
  }
];

export default function ObjectivesPage() {
  const { user } = useAuth();
  
  // CORRECTION : Récupération des vraies données MLM depuis l'API avec système centralisé
  const { data: mlmStats, isLoading } = useQuery<MLMStats>({
    queryKey: ['/api/mlm/stats'],
    enabled: !!user
  });

  // API générique pour les données de groupes (tous vendeurs)
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/mlm/groups-data'],
    enabled: !!user
  });

  // Nouvelle API pour l'analyse détaillée ETL
  const { data: etlAnalysis, isLoading: etlLoading } = useQuery({
    queryKey: ['/api/mlm/etl-analysis'],
    enabled: !!user
  });

  // CORRECTION CRITIQUE : Extraire les points d'équipe et utiliser la nouvelle logique RC
  const teamPoints = (groupsData?.groups ?? []).map(g => Number(g.points) || 0);
  
  // Calculer la qualification actuelle avec la logique centralisée ET les points d'équipe pour RC
  const currentQualification = mlmStats ? determinerQualificationMLM(
    mlmStats.personalPoints,
    mlmStats.recruits, 
    mlmStats.groupPoints,
    14, // jours depuis démarrage (à récupérer de l'API)
    teamPoints // NOUVEAU: Points d'équipe pour qualification RC précise
  ) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600/30 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600">Chargement de vos objectifs...</p>
        </div>
      </div>
    );
  }

  const userStats: MLMStats = mlmStats || {
    personalPoints: 0,
    groupPoints: 0,
    recruits: 0,
    groups: 0,
    totalRevenue: 0,
    currentLevel: 'conseiller',
    totalClients: 0,
    installedClients: 0,
    pendingRecruits: 0
  };

  const getCurrentLevelData = () => {
    return MLM_LEVELS.find(level => level.id === userStats.currentLevel) || MLM_LEVELS[0];
  };

  const getNextLevelData = () => {
    const currentLevelData = getCurrentLevelData();
    return MLM_LEVELS.find(level => level.order === currentLevelData.order + 1);
  };

  const calculateProgress = (level: ObjectiveLevel) => {
    switch (level.id) {
      case 'cq':
        return Math.min((userStats.personalPoints / 25) * 100, 100);
      case 'ett':
        // Calcul plus strict : toutes les conditions doivent être remplies
        const personalCompleted = userStats.personalPoints >= 50;
        const groupsCompleted = userStats.recruits >= 2;
        const groupPointsCompleted = userStats.groupPoints >= 100;
        
        if (personalCompleted && groupsCompleted && groupPointsCompleted) {
          return 100;
        } else {
          // Calcul proportionnel basé sur les critères partiellement remplis
          const personalProgress = Math.min((userStats.personalPoints / 50) * 33, 33);
          const groupsProgress = Math.min((userStats.recruits / 2) * 33, 33);
          const groupPointsProgress = Math.min((userStats.groupPoints / 100) * 34, 34);
          return personalProgress + groupsProgress + groupPointsProgress;
        }
      case 'etl':
        return Math.min((userStats.personalPoints / 75) * 50 + (userStats.recruits / 2) * 50, 100);
      case 'manager':
        return Math.min((userStats.personalPoints / 100) * 50 + (userStats.groups / 4) * 50, 100);
      case 'rc':
        // NOUVEAU : Calcul RC avec nouvelle logique métier
        if (currentQualification?.positionActuelle === 'RC') {
          return 100; // Déjà qualifié RC
        }
        
        // Utiliser la fonction computeRCQualification pour le calcul précis
        if (teamPoints.length > 0) {
          const rcResult = computeRCQualification(teamPoints);
          const teamsProgress = Math.min((rcResult.qualifiedTeams / 4) * 50, 50);
          const pointsProgress = Math.min((rcResult.totalEffective / 16000) * 50, 50);
          return teamsProgress + pointsProgress;
        }
        
        // Fallback si pas de données d'équipes
        return Math.min((userStats.groups / 4) * 50 + (userStats.groupPoints / 16000) * 50, 100);
      default:
        return 0;
    }
  };

  // Générer les témoins de progression ETL avec données API réelles
  const generateETLProgressIndicators = (etlData: any) => {
    if (!etlData?.criteria) {
      return [
        {
          label: "75 points personnels",
          current: 0,
          required: 75,
          progress: 0,
          completed: false
        },
        {
          label: "2 recrues directes minimum",
          current: 0,
          required: 2,
          progress: 0,
          completed: false
        },
        {
          label: "2 groupes avec ETT qualifié",
          current: 0,
          required: 2,
          progress: 0,
          completed: false
        }
      ];
    }

    return [
      {
        label: `${etlData.criteria.personalPoints.required} points personnels`,
        current: etlData.criteria.personalPoints.current,
        required: etlData.criteria.personalPoints.required,
        progress: etlData.criteria.personalPoints.progress,
        completed: etlData.criteria.personalPoints.met
      },
      {
        label: `${etlData.criteria.minimumGroups.required} vendeurs directs minimum`,
        current: etlData.criteria.minimumGroups.current,
        required: etlData.criteria.minimumGroups.required,
        progress: etlData.criteria.minimumGroups.progress,
        completed: etlData.criteria.minimumGroups.met
      },
      {
        label: `${etlData.criteria.ettInGroups.required} groupes avec ETT qualifié`,
        current: etlData.criteria.ettInGroups.current,
        required: etlData.criteria.ettInGroups.required,
        progress: etlData.criteria.ettInGroups.progress,
        completed: etlData.criteria.ettInGroups.met
      }
    ];
  };

  // NOUVEAU : Générer les témoins de progression RC avec nouvelle logique métier
  const generateRCProgressIndicators = () => {
    if (teamPoints.length === 0) {
      return [
        {
          label: "4 équipes qualifiées (≥4000 pts)",
          current: 0,
          required: 4,
          progress: 0,
          completed: false
        },
        {
          label: "16 000 points effectifs totaux",
          current: 0,
          required: 16000,
          progress: 0,
          completed: false
        }
      ];
    }

    const rcResult = computeRCQualification(teamPoints);
    
    return [
      {
        label: "4 équipes qualifiées (≥4000 pts)",
        current: rcResult.qualifiedTeams,
        required: 4,
        progress: Math.min((rcResult.qualifiedTeams / 4) * 100, 100),
        completed: rcResult.qualifiedTeams >= 4,
        rcDetails: `${rcResult.qualifiedTeams} équipes qualifiées sur ${teamPoints.length}`
      },
      {
        label: "16 000 points effectifs totaux",
        current: rcResult.totalEffective,
        required: 16000,
        progress: Math.min((rcResult.totalEffective / 16000) * 100, 100),
        completed: rcResult.totalEffective >= 16000,
        rcDetails: rcResult.details
      }
    ];
  };

  // Générer les témoins de progression par groupe avec données dynamiques pour tous vendeurs
  const generateGroupProgressIndicators = (stats: MLMStats) => {
    const indicators = [];
    
    // SOLUTION GÉNÉRIQUE : Utiliser les vraies données API pour tous les vendeurs
    if (groupsData && (groupsData as any)?.groups) {
      (groupsData as any).groups.forEach((group: any, index: number) => {
        indicators.push({
          label: `Groupe ${group.name}`,
          current: group.points,
          required: 50,
          progress: Math.min((group.points / 50) * 100, 100),
          completed: group.points >= 50,
          isGroup: true,
          groupName: group.name
        });
      });
    } else {
      // Fallback si pas de données de groupes disponibles
      for (let i = 0; i < Math.max(2, stats.recruits || 0); i++) {
        indicators.push({
          label: `Groupe ${i + 1} - En attente de données`,
          current: 0,
          required: 50,
          progress: 0,
          completed: false,
          isGroup: true,
          groupName: 'Données en cours de chargement'
        });
      }
    }
    
    return indicators;
  };

  // Calculer la progression détaillée par critère
  const calculateDetailedProgress = (level: ObjectiveLevel) => {
    switch (level.id) {
      case 'cq':
        return [
          {
            label: 'Points personnels',
            current: userStats.personalPoints,
            required: 25,
            progress: Math.min((userStats.personalPoints / 25) * 100, 100),
            completed: userStats.personalPoints >= 25
          }
        ];
      case 'ett':
        return [
          {
            label: '50 points personnels cumulés',
            current: userStats.personalPoints,
            required: 50,
            progress: Math.min((userStats.personalPoints / 50) * 100, 100),
            completed: userStats.personalPoints >= 50
          },
          {
            label: 'Minimum 2 groupes',
            current: 2, // Eric a exactement 2 groupes : Sophie + Raymond
            required: 2,
            progress: Math.min((2 / 2) * 100, 100),
            completed: 2 >= 2
          },
          // Décomposer en témoins par groupe individuel
          ...generateGroupProgressIndicators(userStats)
        ];
      case 'etl':
        // Utiliser l'analyse ETL détaillée depuis l'API
        return generateETLProgressIndicators(etlAnalysis);
      case 'manager':
        return [
          {
            label: '100 points personnels',
            current: userStats.personalPoints,
            required: 100,
            progress: Math.min((userStats.personalPoints / 100) * 100, 100),
            completed: userStats.personalPoints >= 100
          },
          {
            label: '4 groupes actifs',
            current: userStats.groups,
            required: 4,
            progress: Math.min((userStats.groups / 4) * 100, 100),
            completed: userStats.groups >= 4
          }
        ];
      case 'rc':
        // NOUVEAU : Utiliser les indicateurs RC avec nouvelle logique métier
        return generateRCProgressIndicators();
      default:
        return [];
    }
  };

  const currentLevelData = getCurrentLevelData();
  const nextLevelData = getNextLevelData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PageTitleHeader 
        title="Objectifs MLM"
        backLink="/"
        backIcon={<ArrowLeft className="h-5 w-5" />}
      />
      
      <div className="container mx-auto px-4 pb-8">
        {/* Niveau Actuel */}
        <Card className="mb-6 bg-white/90 backdrop-blur-lg shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${currentLevelData.bgColor} mb-4`}>
              <currentLevelData.icon className={`h-8 w-8 ${currentLevelData.color}`} />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Niveau Actuel
            </CardTitle>
            <Badge variant="secondary" className={`text-lg px-4 py-2 ${currentLevelData.color} ${currentLevelData.bgColor}`}>
              {currentLevelData.name}
            </Badge>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{currentLevelData.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-bold text-blue-600">{userStats.personalPoints}</div>
                <div className="text-gray-600">Points personnels</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-bold text-green-600">{userStats.groupPoints}</div>
                <div className="text-gray-600">Points groupe</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-bold text-purple-600">{userStats.recruits}</div>
                <div className="text-gray-600">Vendeurs</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="font-bold text-orange-600">{(groupsData as any)?.totalGroups || userStats.groups || 0}</div>
                <div className="text-gray-600">Groupes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prochain Objectif */}
        {nextLevelData && (
          <Card className="mb-6 bg-white/90 backdrop-blur-lg shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${nextLevelData.bgColor}`}>
                  <nextLevelData.icon className={`h-6 w-6 ${nextLevelData.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Prochain Objectif
                  </CardTitle>
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${nextLevelData.color} border-current`}>
                    {nextLevelData.name}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600">{nextLevelData.description}</p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Progression</span>
                  <span className="text-sm text-gray-600">{Math.round(calculateProgress(nextLevelData))}%</span>
                </div>
                <Progress value={calculateProgress(nextLevelData)} className="h-3" />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800">Conditions requises :</h4>
                  <div className="space-y-2">
                    {(() => {
                      const criteria = calculateDetailedProgress(nextLevelData);
                      const groupCriteria = criteria.filter((c: any) => c.isGroup);
                      const nonGroupCriteria = criteria.filter((c: any) => !c.isGroup);
                      
                      return (
                        <>
                          {/* Critères non-groupes */}
                          {nonGroupCriteria.map((criterion, index) => (
                            <div key={`non-group-${index}`} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                  <span className={`w-3 h-3 rounded-full mr-2 ${
                                    criterion.completed ? 'bg-green-500' : 'bg-gray-300'
                                  }`}></span>
                                  {criterion.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {criterion.completed ? (
                                    <span className="text-green-600 font-semibold">✓</span>
                                  ) : (
                                    <span>{criterion.current}/{criterion.required}</span>
                                  )}
                                </span>
                              </div>
                              <Progress value={criterion.progress} className="h-1.5" />
                              {/* NOUVEAU : Affichage des détails RC quand disponibles */}
                              {(criterion as any).rcDetails && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                  <div className="font-semibold">📊 Analyse RC détaillée :</div>
                                  <div className="mt-1 whitespace-pre-line">{(criterion as any).rcDetails}</div>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Critères groupes - affichage par 2 par ligne */}
                          {groupCriteria.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              {groupCriteria.map((criterion, index) => (
                                <div key={`group-${index}`} className="space-y-1 p-2 bg-white rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700 flex items-center">
                                      <span className={`w-2 h-2 rounded-full mr-1 ${
                                        criterion.completed ? 'bg-green-500' : 
                                        (criterion as any).missing ? 'bg-red-300' : 'bg-blue-300'
                                      }`}></span>
                                      {criterion.label}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 flex justify-between">
                                    <span>
                                      {(criterion as any).missing ? "À recruter" : `${criterion.current}/${criterion.required}`}
                                    </span>
                                    <span>{Math.round(criterion.progress)}%</span>
                                  </div>
                                  <Progress value={criterion.progress} className="h-1" />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tous les Niveaux */}
        <Card className="bg-white/90 backdrop-blur-lg shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">
              Parcours Complet MLM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MLM_LEVELS.map((level, index) => {
                const isCurrentLevel = level.id === userStats.currentLevel;
                const isCompleted = level.order <= getCurrentLevelData().order;
                
                return (
                  <div 
                    key={level.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentLevel 
                        ? 'border-blue-400 bg-blue-50' 
                        : isCompleted
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrentLevel ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : level.bgColor
                      }`}>
                        <level.icon className={`h-6 w-6 ${
                          isCurrentLevel ? 'text-blue-600' : isCompleted ? 'text-green-600' : level.color
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{level.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {level.shortName}
                          </Badge>
                          {isCurrentLevel && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              Niveau actuel
                            </Badge>
                          )}
                          {isCompleted && !isCurrentLevel && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Atteint
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{level.description}</p>
                        <div className="space-y-1">
                          {level.conditions.map((condition, conditionIndex) => (
                            <div key={conditionIndex} className="flex items-start text-xs text-gray-700">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              {condition}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}