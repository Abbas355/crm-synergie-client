import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, Check, Smartphone } from "lucide-react";

interface SimCard {
  id: number;
  numero: string;
  statut: string;
  codeVendeur: string;
  clientId: number | null;
  clientNom?: string;
  dateAttribution?: string;
}

interface SimCardPickerModalProps {
  selectedSimCard?: string | null;
  onSelect: (simCardNumber: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function SimCardPickerModal({ selectedSimCard, onSelect, onClose, isOpen }: SimCardPickerModalProps) {
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSimCards();
    }
  }, [isOpen]);

  const fetchAvailableSimCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sim-cards", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des cartes SIM");
      }
      
      const allSimCards = await response.json();
      
      // Filtrer seulement les cartes disponibles + celle actuellement sélectionnée
      const availableCards = allSimCards.filter((card: SimCard) => 
        card.statut === 'disponible' || card.numero === selectedSimCard
      );
      
      console.log(`🔍 Cartes SIM disponibles trouvées: ${availableCards.length} sur ${allSimCards.length} total`);
      setSimCards(availableCards);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des cartes SIM:", err);
      setError("Impossible de charger les cartes SIM disponibles");
    } finally {
      setLoading(false);
    }
  };

  const filteredSimCards = simCards.filter(card =>
    card.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (simCardNumber: string) => {
    console.log(`✅ Carte SIM sélectionnée: ${simCardNumber}`);
    onSelect(simCardNumber);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Smartphone className="h-6 w-6" />
            Sélectionner une carte SIM
          </CardTitle>
          <CardDescription className="text-blue-100">
            Choisissez une carte SIM disponible parmi {simCards.length} carte(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro de carte SIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-2 focus:border-blue-500 rounded-xl"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-6 rounded-xl border-2 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des cartes SIM disponibles...</p>
              </div>
            ) : filteredSimCards.length === 0 ? (
              <div className="text-center py-12">
                <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune carte SIM disponible</p>
                <p className="text-gray-400 text-sm">Toutes les cartes sont déjà assignées</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredSimCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      selectedSimCard === card.numero 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                    onClick={() => handleSelect(card.numero)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <code className="text-lg font-mono font-semibold text-gray-800">
                            {card.numero}
                          </code>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={card.statut === 'disponible' ? 'default' : 'secondary'}
                              className={card.statut === 'disponible' ? 'bg-green-500' : ''}
                            >
                              {card.statut === 'disponible' ? 'Disponible' : 'Sélectionnée'}
                            </Badge>
                            {card.codeVendeur && (
                              <span className="text-xs text-gray-500">
                                Code: {card.codeVendeur}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedSimCard === card.numero && (
                        <div className="p-2 rounded-full bg-blue-500 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {card.clientNom && (
                      <div className="text-sm text-gray-600 mt-3 pl-14">
                        <span className="font-medium">Assignée à:</span> {card.clientNom}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredSimCards.length}</span> carte(s) disponible(s)
              {searchTerm && ` pour "${searchTerm}"`}
            </div>
            {selectedSimCard && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleSelect("")}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Retirer la carte SIM
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}