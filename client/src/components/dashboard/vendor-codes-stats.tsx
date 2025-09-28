import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Package, Smartphone, Users } from "lucide-react";

interface VendorCodeStats {
  codeVendeur: string;
  clientCount: number;
}

interface TopVendorStats {
  codeVendeur: string;
  userId: number;
  username: string;
  prenom: string;
  nom: string;
  clientCount: number;
  partnersCount: number;
}

export function VendorCodesStats() {
  const { data: topVendors, isLoading: isLoadingTop, error: errorTop } = useQuery<TopVendorStats[]>({
    queryKey: ["/api/top-vendors"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoadingTop) {
    return (
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle>Classement Top 10</CardTitle>
          <CardDescription>
            Meilleurs vendeurs par performance
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (errorTop) {
    return (
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle>Classement Top 10</CardTitle>
          <CardDescription>
            Meilleurs vendeurs par performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Erreur lors du chargement du classement
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Classement Top 10</span>
        </CardTitle>
        <CardDescription>
          Meilleurs vendeurs par performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topVendors && topVendors.length > 0 ? (
          <>
            {/* Version desktop - Tableau */}
            <div className="hidden md:block">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Rang</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead className="text-center">Nb Clients</TableHead>
                      <TableHead className="text-center">Nb Partenaires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topVendors.map((vendor, index) => (
                      <TableRow 
                        key={vendor.userId} 
                        className={`
                          ${index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500" : ""}
                          ${index === 1 ? "bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-400" : ""}
                          ${index === 2 ? "bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-700" : ""}
                        `}
                      >
                      <TableCell className="font-bold text-center">
                        {index === 0 ? (
                          <span className="inline-flex justify-center items-center w-7 h-7 rounded-full bg-yellow-500 text-white">1</span>
                        ) : index === 1 ? (
                          <span className="inline-flex justify-center items-center w-7 h-7 rounded-full bg-gray-400 text-white">2</span>
                        ) : index === 2 ? (
                          <span className="inline-flex justify-center items-center w-7 h-7 rounded-full bg-amber-700 text-white">3</span>
                        ) : (
                          <span className="inline-flex justify-center items-center w-7 h-7 rounded-full bg-gray-100 text-gray-700">
                            {index + 1}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`font-medium ${index < 3 ? "font-semibold" : ""}`}>
                        {vendor.prenom} {vendor.nom}
                        {vendor.codeVendeur && <div className="text-xs text-muted-foreground">Code: {vendor.codeVendeur}</div>}
                      </TableCell>
                      <TableCell className={`text-center ${index < 3 ? "font-bold" : "font-semibold"}`}>
                        {vendor.clientCount}
                      </TableCell>
                      <TableCell className={`text-center ${index < 3 ? "font-semibold" : ""}`}>
                        {vendor.partnersCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>

            {/* Version mobile - Cartes */}
            <div className="block md:hidden space-y-2 max-h-64 overflow-y-auto">
              {topVendors.map((vendor, index) => (
                <div 
                  key={vendor.userId}
                  className={`
                    p-3 rounded-lg border-l-4 
                    ${index === 0 ? "bg-yellow-50 border-yellow-500" : ""}
                    ${index === 1 ? "bg-gray-50 border-gray-400" : ""}
                    ${index === 2 ? "bg-amber-50 border-amber-700" : ""}
                    ${index >= 3 ? "bg-gray-50 border-gray-300" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {index === 0 ? (
                        <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-yellow-500 text-white font-bold text-sm">1</span>
                      ) : index === 1 ? (
                        <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-gray-400 text-white font-bold text-sm">2</span>
                      ) : index === 2 ? (
                        <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-sm">3</span>
                      ) : (
                        <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
                          {index + 1}
                        </span>
                      )}
                      <div>
                        <div className={`font-semibold ${index < 3 ? "text-base" : "text-sm"} flex items-center gap-2`}>
                          <span>{vendor.prenom} {vendor.nom}</span>
                          {vendor.codeVendeur && (
                            <span className="text-xs text-muted-foreground">
                              Code: {vendor.codeVendeur}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Nb client</span>
                            <span className={`font-bold ${index < 3 ? "text-base" : "text-sm"}`}>
                              {vendor.clientCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Nb partenaires</span>
                            <span className={`font-semibold ${index < 3 ? "text-base" : "text-sm"}`}>
                              {vendor.partnersCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucun vendeur trouvé
          </p>
        )}
      </CardContent>
    </Card>
  );
}