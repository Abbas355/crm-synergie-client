import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Package, 
  Smartphone, 
  Euro, 
  Star,
  TrendingUp,
  Calendar
} from "lucide-react";

interface TrancheCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tranche: number;
  pointsActuels?: number;
}

export default function TrancheCommissionModal({ 
  isOpen, 
  onClose, 
  tranche,
  pointsActuels = 0 
}: TrancheCommissionModalProps) {
  
  // Configuration des tranches avec détails complets
  const tranchesConfig = {
    1: {
      nom: "Tranche débutant",
      pointsRange: "0-25 points",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      commissions: {
        freeboxPop: 50,
        freeboxEssentiel: 50,
        freeboxUltra: 50,
        forfait5G: 10
      }
    },
    2: {
      nom: "Tranche confirmé", 
      pointsRange: "26-50 points",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      commissions: {
        freeboxPop: 60,
        freeboxEssentiel: 70,
        freeboxUltra: 80,
        forfait5G: 10
      }
    },
    3: {
      nom: "Tranche expert",
      pointsRange: "51-100 points",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      commissions: {
        freeboxPop: 70,
        freeboxEssentiel: 90,
        freeboxUltra: 100,
        forfait5G: 10
      }
    },
    4: {
      nom: "Tranche excellence",
      pointsRange: "101+ points",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      commissions: {
        freeboxPop: 90, // CORRIGÉ: était 120
        freeboxEssentiel: 100, // CORRIGÉ: était 120
        freeboxUltra: 120,
        forfait5G: 10
      }
    }
  };

  const trancheData = tranchesConfig[tranche as keyof typeof tranchesConfig];
  
  if (!trancheData) return null;

  // Calcul du reset automatique (dernier jour du mois actuel à minuit)
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const resetDate = lastDayOfMonth.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-800">
              Détails Commissions
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Header de la tranche */}
          <div className={`p-4 ${trancheData.bgColor} rounded-xl border border-gray-200`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`px-3 py-1 bg-gradient-to-r ${trancheData.color} rounded-full`}>
                <span className="text-white text-sm font-bold">T{tranche}</span>
              </div>
              <div>
                <h3 className={`font-semibold ${trancheData.textColor}`}>
                  {trancheData.nom}
                </h3>
                <p className="text-xs text-gray-600">{trancheData.pointsRange}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Star className="h-3 w-3 mr-1" />
                Tranche actuelle
              </Badge>
              <div className="text-sm font-medium text-gray-700">
                {pointsActuels} points
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Section Freebox */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-indigo-600" />
              <h4 className="font-semibold text-gray-800">Offres Freebox</h4>
            </div>
            
            <div className="space-y-2">
              <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Freebox Pop</p>
                      <p className="text-xs text-gray-600">4 points CVD</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">
                        {trancheData.commissions.freeboxPop}€
                      </div>
                      <div className="text-xs text-gray-500">par vente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Freebox Essentiel</p>
                      <p className="text-xs text-gray-600">5 points CVD</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">
                        {trancheData.commissions.freeboxEssentiel}€
                      </div>
                      <div className="text-xs text-gray-500">par vente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Freebox Ultra</p>
                      <p className="text-xs text-gray-600">6 points CVD</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">
                        {trancheData.commissions.freeboxUltra}€
                      </div>
                      <div className="text-xs text-gray-500">par vente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section Forfait 5G */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-gray-800">Forfait Mobile</h4>
            </div>
            
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Forfait 5G</p>
                    <p className="text-xs text-gray-600">1 point CVD</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {trancheData.commissions.forfait5G}€
                    </div>
                    <div className="text-xs text-gray-500">par vente</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Reset automatique */}
          <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <h4 className="font-medium text-amber-800">Reset automatique</h4>
            </div>
            <p className="text-sm text-amber-700">
              La tranche revient automatiquement à T1 le {resetDate} à minuit.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Votre progression redémarre chaque mois.
            </p>
          </div>

          {/* Évolution possible */}
          {tranche < 2 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-800">Évolution possible</h4>
              </div>
              <p className="text-sm text-green-700">
                Atteignez {tranche === 1 ? '25' : '51'} points pour passer en Tranche {tranche + 1}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Commissions majorées à {tranche === 1 ? '80€' : '100€'} par Freebox !
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}