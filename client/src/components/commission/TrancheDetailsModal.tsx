import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, 
  Euro, 
  Target, 
  Star,
  TrendingUp,
  Award,
  Zap,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrancheDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trancheNumber: number;
}

interface TrancheDetails {
  numero: number;
  nom: string;
  pointsRequis: string;
  description: string;
  baremeCommissions: {
    [key: string]: number;
  };
  avantages: string[];
}

export default function TrancheDetailsModal({ 
  isOpen, 
  onClose, 
  trancheNumber 
}: TrancheDetailsModalProps) {
  
  const queryClient = useQueryClient();
  
  // Force invalidation of all tranche cache when modal opens
  useEffect(() => {
    if (isOpen && trancheNumber > 0) {
      console.log(`🔍 MODAL OPENED: Tranche ${trancheNumber} - Invalidating cache`);
      queryClient.invalidateQueries({ queryKey: [`/api/ventes/tranche/${trancheNumber}`] });
    }
  }, [isOpen, trancheNumber, queryClient]);
  
  const { data: trancheDetails, isLoading, error } = useQuery<TrancheDetails>({
    queryKey: [`/api/ventes/tranche/${trancheNumber}`, Date.now(), 'v4-force'],
    enabled: isOpen && trancheNumber > 0,
    retry: 1,
    staleTime: 0, // Force reload
    gcTime: 0, // TanStack Query v5 - Force garbage collection
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  
  // Debug logging
  useEffect(() => {
    console.log(`🔍 MODAL STATE: isOpen=${isOpen}, trancheNumber=${trancheNumber}, isLoading=${isLoading}, hasData=${!!trancheDetails}, error=${error}`);
    if (trancheDetails) {
      console.log(`✅ TRANCHE ${trancheNumber} DATA LOADED:`, trancheDetails);
    }
    if (error) {
      console.error(`❌ TRANCHE ${trancheNumber} ERROR:`, error);
    }
  }, [isOpen, trancheNumber, isLoading, trancheDetails, error]);

  // Couleurs par tranche
  const trancheColors = {
    1: "from-blue-500 to-blue-600",
    2: "from-green-500 to-green-600", 
    3: "from-purple-500 to-purple-600",
    4: "from-orange-500 to-orange-600"
  };

  const trancheIcons = {
    1: <Star className="h-6 w-6" />,
    2: <Target className="h-6 w-6" />,
    3: <TrendingUp className="h-6 w-6" />,
    4: <Trophy className="h-6 w-6" />
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trancheDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center p-8">
            <p className="text-gray-500">Impossible de charger les détails de la tranche</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${trancheColors[trancheNumber as keyof typeof trancheColors]} text-white`}>
                {trancheIcons[trancheNumber as keyof typeof trancheIcons]}
              </div>
              <div>
                <span className="text-2xl font-bold">Tranche {(trancheDetails as TrancheDetails).numero}</span>
                <div className="text-sm text-gray-600 font-normal">{(trancheDetails as TrancheDetails).nom}</div>
              </div>
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vue d'ensemble */}
          <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Vue d'ensemble
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Points requis</p>
                  <p className="text-lg font-semibold text-blue-800">{(trancheDetails as TrancheDetails).pointsRequis}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Niveau</p>
                  <Badge 
                    variant="secondary" 
                    className={`bg-gradient-to-r ${trancheColors[trancheNumber as keyof typeof trancheColors]} text-white text-sm px-3 py-1`}
                  >
                    {(trancheDetails as TrancheDetails).nom}
                  </Badge>
                </div>
              </div>
              <p className="text-gray-700 bg-white/60 p-3 rounded-lg border">
                {(trancheDetails as TrancheDetails).description}
              </p>
            </CardContent>
          </Card>

          {/* Barème de commissions */}
          <Card className="border-2 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Barème de commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries((trancheDetails as TrancheDetails).baremeCommissions).map(([produit, commission]: [string, number]) => (
                  <div 
                    key={produit}
                    className="bg-white/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-4 hover:bg-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">{produit}</div>
                      <div className="text-2xl font-bold text-green-700">
                        {commission}€
                      </div>
                      <div className="text-xs text-gray-500 mt-1">par installation</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Avantages */}
          <Card className="border-2 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Avantages de cette tranche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(trancheDetails as TrancheDetails).avantages.map((avantage: string, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-purple-200/50"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{avantage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progression vers tranche suivante */}
          {trancheNumber < 4 && (
            <Card className="border-2 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Prochaine tranche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-gray-700 mb-2">
                    Pour atteindre la <strong>Tranche {trancheNumber + 1}</strong>, vous devez franchir 
                    <strong className="text-orange-600"> {trancheNumber === 1 ? '26' : trancheNumber === 2 ? '51' : '101'} points</strong>
                  </p>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    🎯 Objectif suivant : Tranche {trancheNumber + 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}