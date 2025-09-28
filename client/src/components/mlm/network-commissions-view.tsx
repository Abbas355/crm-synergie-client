import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Award, 
  Target, 
  Crown,
  Calendar,
  DollarSign,
  Network,
  Star,
  Zap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NetworkCommission {
  id: number;
  distributeurId: number;
  distributeurSourceId: number;
  typeCommission: string;
  montant: number;
  taux: number;
  niveau: number;
  description: string;
  moisCalcul: string;
  statut: string;
  dateValidation?: string;
  dateVersement?: string;
  createdAt: string;
  distributeurSource?: {
    nom: string;
    prenom: string;
    codeVendeur: string;
  };
}

interface NetworkCommissionsViewProps {
  commissions: NetworkCommission[] | null;
  isLoading: boolean;
}

export function NetworkCommissionsView({ commissions, isLoading }: NetworkCommissionsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-06");
  const [selectedType, setSelectedType] = useState("all_types");

  // Types de commissions avec leurs icônes et couleurs
  const commissionTypes = {
    recrutement: { 
      label: "Recrutement", 
      icon: Users, 
      color: "bg-blue-500", 
      description: "Bonus pour chaque nouveau membre recruté" 
    },
    activation: { 
      label: "Activation", 
      icon: Zap, 
      color: "bg-green-500", 
      description: "Commission d'activation des nouveaux distributeurs" 
    },
    performance: { 
      label: "Performance", 
      icon: Target, 
      color: "bg-purple-500", 
      description: "Bonus basé sur les performances de l'équipe" 
    },
    bonus_equipe: { 
      label: "Bonus Équipe", 
      icon: Award, 
      color: "bg-orange-500", 
      description: "Bonus collectif de performance d'équipe" 
    },
    prime_leadership: { 
      label: "Prime Leadership", 
      icon: Crown, 
      color: "bg-yellow-500", 
      description: "Prime pour les leaders de haut niveau" 
    }
  };

  // Filtrer les commissions
  const filteredCommissions = commissions?.filter(commission => {
    const matchesPeriod = selectedPeriod === "all_periods" || commission.moisCalcul === selectedPeriod;
    const matchesType = selectedType === "all_types" || commission.typeCommission === selectedType;
    return matchesPeriod && matchesType;
  }) || [];

  // Calculer les statistiques
  const totalCommissions = filteredCommissions.reduce((sum, c) => sum + Number(c.montant), 0);
  const commissionsValidees = filteredCommissions.filter(c => c.statut === "validee").length;
  const commissionsPayees = filteredCommissions.filter(c => c.statut === "payee").length;

  // Grouper par type
  const commissionsByType = filteredCommissions.reduce((acc, commission) => {
    const type = commission.typeCommission;
    if (!acc[type]) acc[type] = [];
    acc[type].push(commission);
    return acc;
  }, {} as Record<string, NetworkCommission[]>);

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "calculee":
        return <Badge variant="secondary">Calculée</Badge>;
      case "validee":
        return <Badge variant="default" className="bg-blue-500">Validée</Badge>;
      case "payee":
        return <Badge variant="default" className="bg-green-500">Payée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Network className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Commissions</p>
                <p className="text-2xl font-bold">{filteredCommissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Validées</p>
                <p className="text-2xl font-bold">{commissionsValidees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Payées</p>
                <p className="text-2xl font-bold">{commissionsPayees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sélectionner une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_periods">Toutes les périodes</SelectItem>
            <SelectItem value="2025-06">Juin 2025</SelectItem>
            <SelectItem value="2025-05">Mai 2025</SelectItem>
            <SelectItem value="2025-04">Avril 2025</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type de commission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">Tous les types</SelectItem>
            <SelectItem value="recrutement">Recrutement</SelectItem>
            <SelectItem value="activation">Activation</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="bonus_equipe">Bonus Équipe</SelectItem>
            <SelectItem value="prime_leadership">Prime Leadership</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Types de commissions */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="recrutement">Recrutement</TabsTrigger>
          <TabsTrigger value="activation">Activation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="bonus_equipe">Bonus Équipe</TabsTrigger>
          <TabsTrigger value="prime_leadership">Leadership</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(commissionTypes).map(([type, config]) => {
              const typeCommissions = commissionsByType[type] || [];
              const typeTotal = typeCommissions.reduce((sum, c) => sum + Number(c.montant), 0);
              const IconComponent = config.icon;

              return (
                <Card key={type} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <div className={`p-2 rounded-full ${config.color}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span>{config.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="font-bold">{formatCurrency(typeTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Commissions:</span>
                        <span>{typeCommissions.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {Object.entries(commissionTypes).map(([type, config]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <config.icon className="h-5 w-5" />
                  <span>Commissions {config.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commissionsByType[type]?.length > 0 ? (
                  <div className="space-y-4">
                    {commissionsByType[type].map((commission) => (
                      <div key={commission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">
                                {commission.distributeurSource?.prenom} {commission.distributeurSource?.nom}
                              </h4>
                              <Badge variant="outline">
                                Niveau {commission.niveau}
                              </Badge>
                              {getStatusBadge(commission.statut)}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {commission.description || "Aucune description"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Période: {commission.moisCalcul} • Taux: {commission.taux}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(Number(commission.montant))}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(commission.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <config.icon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune commission {config.label.toLowerCase()} pour cette période</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {filteredCommissions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Network className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune commission réseau
            </h3>
            <p className="text-gray-500 mb-4">
              Les commissions réseau sont générées automatiquement en fonction des activités de votre équipe.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2">Comment gagner des commissions réseau ?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Recrutement:</strong> Invitez de nouveaux distributeurs</li>
                <li>• <strong>Activation:</strong> Aidez votre équipe à démarrer</li>
                <li>• <strong>Performance:</strong> Atteignez vos objectifs d'équipe</li>
                <li>• <strong>Leadership:</strong> Développez votre réseau</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}