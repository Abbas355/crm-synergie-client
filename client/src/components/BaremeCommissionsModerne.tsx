import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Star } from "lucide-react";

interface CommissionTier {
  id: number;
  min: number;
  max: number;
  freebox_pop: number;
  freebox_essentiel: number;
  freebox_ultra: number;
  forfait_5g: number;
}

interface BaremeCommissionsModerneProps {
  commissionTiers: CommissionTier[];
  currentTranche: number;
  onTrancheClick?: (tranche: number) => void;
}

export default function BaremeCommissionsModerne({ 
  commissionTiers, 
  currentTranche, 
  onTrancheClick 
}: BaremeCommissionsModerneProps) {
  
  // Couleurs harmonieuses et modernes pour chaque tranche
  const getTrancheStyle = (tierId: number) => {
    const styles = {
      1: {
        gradient: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
        border: "border-emerald-200/60",
        accent: "bg-gradient-to-r from-emerald-500 to-teal-500",
        text: "text-emerald-800"
      },
      2: {
        gradient: "bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50",
        border: "border-blue-200/60",
        accent: "bg-gradient-to-r from-blue-500 to-indigo-500",
        text: "text-blue-800"
      },
      3: {
        gradient: "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
        border: "border-violet-200/60",
        accent: "bg-gradient-to-r from-violet-500 to-purple-500",
        text: "text-violet-800"
      },
      4: {
        gradient: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
        border: "border-amber-200/60",
        accent: "bg-gradient-to-r from-amber-500 to-orange-500",
        text: "text-amber-800"
      }
    };
    return styles[tierId as keyof typeof styles] || styles[1];
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-2xl overflow-hidden">
      {/* Header avec dégradé élégant */}
      <CardHeader className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
        <CardTitle className="relative flex items-center gap-3 text-white">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Barème de Commission CVD</h2>
            <p className="text-sm text-slate-200 font-normal mt-1">Commission Variable Progressive par tranche</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {/* Affichage horizontal ultra-compact des 4 tranches */}
        <div className="grid grid-cols-4 gap-2">
          {commissionTiers?.map((tier: CommissionTier) => {
            const style = getTrancheStyle(tier.id);
            const isCurrentTranche = currentTranche === tier.id;
            
            return (
              <div 
                key={tier.id} 
                className={`
                  relative rounded-lg border-2 shadow-sm transition-all duration-300
                  ${style.gradient} ${style.border}
                  ${isCurrentTranche ? 'ring-2 ring-blue-300/50 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02]' : 'opacity-70'}
                `}
                onClick={isCurrentTranche && onTrancheClick ? () => onTrancheClick(tier.id) : undefined}
              >
                {/* Badge "actuelle" pour la tranche courante */}
                {isCurrentTranche && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 text-xs font-semibold shadow-sm border border-white">
                      <Star className="h-2 w-2 mr-0.5" />
                      Actuelle
                    </Badge>
                  </div>
                )}
                
                <div className="p-2 text-center">
                  {/* Numéro de tranche */}
                  <div className={`w-6 h-6 rounded-lg ${style.accent} flex items-center justify-center shadow-sm mx-auto mb-1`}>
                    <span className="text-sm font-bold text-white">{tier.id}</span>
                  </div>
                  
                  {/* Nom de la tranche */}
                  <h3 className={`text-xs font-bold ${style.text} mb-0.5`}>Tranche {tier.id}</h3>
                  
                  {/* Plage de points */}
                  <p className="text-xs text-slate-600 font-medium leading-tight">
                    {tier.max === 999 ? `${tier.min}+` : `${tier.min}-${tier.max}`}<br/>
                    <span className="text-xs">pts</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}