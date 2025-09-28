import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SimCard } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface SimCardSelectorProps {
  clientId: number;
  currentSimCard?: string | null;
  vendorCode?: string;
  onSimCardChanged?: (simCardNumber: string | null) => void;
}

export function SimCardSelector({ 
  clientId, 
  currentSimCard, 
  vendorCode,
  onSimCardChanged 
}: SimCardSelectorProps) {
  const { toast } = useToast();
  const [selectedSimCard, setSelectedSimCard] = useState<string>("");
  const [isChanging, setIsChanging] = useState(false);

  // Récupérer les cartes SIM disponibles pour ce vendeur
  const { data: allAvailableSimCards = [], isLoading, refetch } = useQuery<SimCard[]>({
    queryKey: ["/api/sim-cards/available"],
    staleTime: 0,
    gcTime: 0,
  });

  // Filtrer les cartes SIM par vendeur ou afficher toutes si pas de vendeur spécifique
  const availableSimCards = allAvailableSimCards.filter(sim => 
    !vendorCode || sim.codeVendeur === vendorCode || sim.codeVendeur === "" || sim.codeVendeur === null
  );

  // Mutation pour changer la carte SIM du client
  const changeSimCardMutation = useMutation({
    mutationFn: async (newSimCardNumber: string) => {
      console.log(`🔄 Frontend: Changement carte SIM client ${clientId} vers ${newSimCardNumber}`);
      return await apiRequest("POST", `/api/clients/${clientId}/change-sim-card`, {
        newSimCardNumber
      });
    },
    onSuccess: (data, variables) => {
      console.log(`✅ Frontend: Carte SIM changée avec succès vers ${variables}`);
      toast({
        title: "Carte SIM modifiée",
        description: "La carte SIM du client a été mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards/available"] });
      setSelectedSimCard("");
      setIsChanging(false);
      if (onSimCardChanged) {
        onSimCardChanged(variables); // Utiliser la variable de la mutation au lieu de selectedSimCard
      }
      // Force refresh des données
      window.location.reload();
    },
    onError: (error: any) => {
      console.error(`❌ Frontend: Erreur changement carte SIM:`, error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du changement de carte SIM",
        variant: "destructive",
      });
      setIsChanging(false);
    }
  });

  // Mutation pour libérer la carte SIM actuelle
  const releaseSimCardMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/clients/${clientId}/change-sim-card`, {
        newSimCardNumber: null
      });
    },
    onSuccess: () => {
      toast({
        title: "Carte SIM libérée",
        description: "La carte SIM a été libérée du client avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sim-cards"] });
      if (onSimCardChanged) {
        onSimCardChanged(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la libération de la carte SIM",
        variant: "destructive",
      });
    }
  });

  const handleChangeSimCard = async () => {
    if (!selectedSimCard) return;
    setIsChanging(true);
    changeSimCardMutation.mutate(selectedSimCard);
  };

  const handleReleaseSimCard = async () => {
    releaseSimCardMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <CardTitle className="text-sm">Carte SIM</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Gestion de l'attribution de carte SIM pour ce client
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Carte SIM actuelle */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Carte SIM actuelle
          </label>
          <div className="flex items-center gap-2">
            {currentSimCard ? (
              <>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                  {currentSimCard}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReleaseSimCard}
                  disabled={releaseSimCardMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Libérer
                </Button>
              </>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1 text-orange-500" />
                Aucune carte SIM
              </Badge>
            )}
          </div>
        </div>

        {/* Sélection nouvelle carte SIM */}
        {vendorCode && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Changer la carte SIM
            </label>
            <div className="flex gap-2">
              <Select 
                value={selectedSimCard} 
                onValueChange={setSelectedSimCard}
                disabled={isLoading || changeSimCardMutation.isPending}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner une carte SIM disponible" />
                </SelectTrigger>
                <SelectContent>
                  {availableSimCards
                    .filter(sim => sim.numero !== currentSimCard)
                    .map((sim) => (
                    <SelectItem key={sim.id} value={sim.numero}>
                      <div className="flex items-center gap-2">
                        <span>{sim.numero}</span>
                        <Badge variant="outline" className="text-xs">
                          {sim.statut}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  {availableSimCards.filter(sim => sim.numero !== currentSimCard).length === 0 && (
                    <SelectItem value="no-cards" disabled>
                      Aucune carte SIM disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleChangeSimCard}
                disabled={!selectedSimCard || changeSimCardMutation.isPending || isChanging}
                size="sm"
                className="whitespace-nowrap"
              >
                {changeSimCardMutation.isPending ? "Modification..." : "Changer"}
              </Button>
            </div>
          </div>
        )}

        {!vendorCode && (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            Veuillez sélectionner un code vendeur pour voir les cartes SIM disponibles
          </div>
        )}

        {/* Informations sur les cartes disponibles */}
        {vendorCode && !isLoading && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {availableSimCards.length} carte(s) SIM disponible(s) pour {vendorCode}
          </div>
        )}
      </CardContent>
    </Card>
  );
}