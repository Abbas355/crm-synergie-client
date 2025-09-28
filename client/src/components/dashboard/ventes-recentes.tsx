import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface VenteRecente {
  nom: string;
  produit: string;
  points: number;
  date: string;
  status: string;
}

export function VentesRecentes() {
  const { data: ventesRecentes = [], isLoading } = useQuery<VenteRecente[]>({
    queryKey: ['/api/ventes/recentes'],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Ventes récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Ventes récentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ventesRecentes.length > 0 ? (
          ventesRecentes.map((vente, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-900">{vente.nom}</span>
                <span className="text-green-600 font-semibold">{vente.points} pts</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{vente.produit}</span>
                <span className="text-gray-500">{vente.date}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            Aucune vente récente
          </div>
        )}
      </CardContent>
    </Card>
  );
}