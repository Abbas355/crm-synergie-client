import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  BarChart3, 
  PieChart, 
  Users,
  Package,
  Award,
  Clock,
  History,
  FileText,
  Download,
  Eye,
  X,
  Printer
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, Legend } from 'recharts';
// Imports PDF supprimés - Système HTML utilisé

interface HistoriqueVentes {
  historiqueParMois: {
    mois: string;
    nombreVentes: number;
    totalPoints: number;
    commissionTotale: number;
    ventesDetails: any[];
    repartitionProduits: {
      freeboxUltra: number;
      freeboxEssentiel: number;
      freeboxPop: number;
      forfait5G: number;
    };
  }[];
  tendances: {
    ventesEnProgression: boolean;
    commissionEnProgression: boolean;
    meilleurePerformance: any;
    totalVentesCumule: number;
    totalCommissionCumule: number;
  };
  statsGlobales: {
    totalVentes: number;
    totalPointsCumules: number;
    totalCommissions: number;
    moyenneVentesParMois: number;
    produitLePlusVendu: string;
  };
  ventesRecentes: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function HistoriqueCommissions() {
  // State pdfViewer supprimé - Système HTML utilisé
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  const { data: historiqueData, isLoading, error: queryError } = useQuery({
    queryKey: ["/api/historique/ventes-simple"],
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Debug logs
  console.log("🎯 HISTORIQUE DEBUG:", { 
    isLoading, 
    hasData: !!historiqueData, 
    dataStructure: historiqueData ? Object.keys(historiqueData) : null,
    queryError 
  });

  const handleViewFacture = async (mois: any) => {
    console.log('🧪 BOUTON VOIR FACTURE - Retour méthode client fonctionnelle', mois);
    
    const periodeString = mois.mois || mois;
    setGeneratingInvoice(periodeString);
    
    try {
      // Import dynamique du générateur professionnel (méthode qui fonctionnait)
      const { openProfessionalInvoice } = await import('@/lib/invoice-generator-professional');
      
      // Récupérer les informations utilisateur
      const userResponse = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include'
      });
      
      const userData = await userResponse.json();
      
      // Récupérer les vraies données CVD avec détails des installations
      console.log('📊 Récupération des détails CVD pour la facture...');
      let installationsDetails = [];
      
      try {
        // Extraire mois et année de la période (ex: "août 2025" → month=8, year=2025)
        const [monthName, year] = periodeString.split(' ');
        const monthMap: { [key: string]: number } = {
          'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
          'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
        };
        const monthNumber = monthMap[monthName.toLowerCase()];
        
        console.log(`🎯 Demande CVD pour période: ${periodeString} → mois=${monthNumber}, année=${year}`);
        
        const cvdResponse = await fetch(`/api/cvd/realtime?month=${monthNumber}&year=${year}`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (cvdResponse.ok) {
          const cvdData = await cvdResponse.json();
          // Convertir detailedSales (vraies ventes) vers le format attendu par le générateur de factures
          installationsDetails = (cvdData.detailedSales || []).map((sale: any) => ({
            nom: sale.nom || 'Nom',
            prenom: sale.prenom || 'Prénom', 
            produit: sale.produit || 'Produit',
            points: sale.points || 0,
            dateInstallation: sale.dateInstallation || new Date().toISOString()
          }));
          
          // CORRECTION CRITIQUE : Utiliser les vraies commissions CVD au lieu de celles de l'historique
          mois.commission = cvdData.totalCommission || 0;
          mois.points = cvdData.totalPoints || 0;
          
          console.log('🎯 CVD DÉTAILS POUR FACTURE:', {
            totalCommission: cvdData.totalCommission,
            totalPoints: cvdData.totalPoints,
            nombreVentes: cvdData.detailedSales?.length,
            detailsSlice: cvdData.detailedSales?.slice(0, 2)
          });
          
          console.log('✅ Détails CVD récupérés:', installationsDetails.length, 'installations vraies', installationsDetails.slice(0, 3));
          console.log('✅ COMMISSION CORRIGÉE:', mois.commission, '€ (remplace historique erroné)');
        } else {
          console.warn('API CVD non disponible, utilisation des totaux uniquement');
        }
      } catch (error) {
        console.warn('Erreur récupération détails CVD:', error);
      }

      // Utiliser les vraies données CVD de l'historique avec détails
      const invoiceData = {
        periode: periodeString,
        total: installationsDetails.length || mois.total || 0, // Utiliser le nombre d'installations réelles
        commission: mois.commission || 0,
        points: mois.points || 0,
        vendeurPrenom: userData.prenom || 'Prénom',
        vendeurNom: userData.nom || 'Nom',
        vendeurEmail: userData.email || 'email@domain.com',
        installationsReelles: installationsDetails // Vraies données CVD avec détails
      };
      
      console.log('🧾 DONNÉES FACTURE FINALE:', {
        periode: invoiceData.periode,
        total: invoiceData.total,
        commission: invoiceData.commission,
        points: invoiceData.points,
        nbInstallations: installationsDetails.length
      });
      
      console.log('🎯 GÉNÉRATION FACTURE CVD avec vraies données historique:', {
        periode: invoiceData.periode,
        commission: invoiceData.commission,
        points: invoiceData.points,
        vendeur: `${invoiceData.vendeurPrenom} ${invoiceData.vendeurNom}`
      });
      
      // Petit délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Générer et ouvrir la facture avec la méthode qui fonctionnait
      await openProfessionalInvoice(invoiceData);
      
      console.log('✅ FACTURE CVD GÉNÉRÉE avec méthode fonctionnelle pour période:', periodeString);
      
    } catch (error) {
      console.error('❌ ERREUR GÉNÉRATION FACTURE CVD:', error);
      alert('Impossible de générer la facture CVD. Veuillez réessayer.');
    } finally {
      setGeneratingInvoice(null);
    }
  };



  // Ancienne FactureModal HTML supprimée - Utilisation exclusive du PDFViewer mobile-optimisé

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Historique CVD (Commission sur Ventes Directes)</h3>
        </div>
        
        <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de l'historique...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!historiqueData || !(historiqueData as any)?.historiqueParMois) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Historique CVD (Commission sur Ventes Directes)</h3>
        </div>
        
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-700 mb-2">Aucun historique disponible</h4>
            <p className="text-sm text-gray-600">
              Les données d'historique seront disponibles dès que des ventes seront enregistrées.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trier les données par ordre chronologique croissant (plus ancien en premier)
  const ventesRaw = (historiqueData as any)?.historiqueParMois || [];
  
  // Fonction pour convertir un nom de mois en numéro (pour tri chronologique)
  const getMonthNumber = (moisStr: string) => {
    const [monthName, year] = moisStr.split(' ');
    const monthMap: { [key: string]: number } = {
      'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
      'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
    };
    const monthNum = monthMap[monthName.toLowerCase()] || 0;
    const yearNum = parseInt(year) || 2025;
    // Retourner une valeur numérique pour le tri (année * 100 + mois)
    return yearNum * 100 + monthNum;
  };
  
  // Trier par ordre chronologique croissant
  const ventes = ventesRaw.sort((a: any, b: any) => {
    return getMonthNumber(a.mois) - getMonthNumber(b.mois);
  });
  
  const totalCommission = (historiqueData as any)?.statsGlobales?.totalCommissions || 0;
  const totalVentes = (historiqueData as any)?.statsGlobales?.totalVentes || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Historique des Commissions</h3>
      </div>
      
      {/* Résumé global */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalVentes}</div>
            <div className="text-sm text-blue-700">Ventes totales</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalCommission}€</div>
            <div className="text-sm text-green-700">Commission totale</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution temporelle */}
      <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Évolution des Ventes et Commissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="mois" 
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'ventes') return [`${value} ventes`, 'Ventes'];
                    if (name === 'commission') return [`${value}€`, 'Commission'];
                    if (name === 'points') return [`${value} pts`, 'Points'];
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Détail chronologique avec tendances */}
      <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historique Détaillé par Mois
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {ventes.map((vente: any, index: number) => {
              const previousVente = index > 0 ? ventes[index - 1] : null;
              const venteTrend = previousVente ? vente.ventes - previousVente.ventes : 0;
              const commissionTrend = previousVente ? vente.commission - previousVente.commission : 0;
              
              return (
                <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                     onClick={() => handleViewFacture(vente)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-lg">{vente.mois}</div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">{vente.ventes} ventes</span>
                          {venteTrend !== 0 && (
                            <span className={`text-xs ml-1 ${venteTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {venteTrend > 0 ? '+' : ''}{venteTrend}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-600">{vente.points} pts</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={generatingInvoice === vente.mois}
                          className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 disabled:opacity-75"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFacture(vente);
                          }}
                        >
                          {generatingInvoice === vente.mois ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span className="text-blue-700">Génération...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span className="text-blue-700">Voir facture</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-xl">{vente.commission}€</div>
                      {commissionTrend !== 0 && (
                        <div className={`text-sm flex items-center justify-end gap-1 ${commissionTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {commissionTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {commissionTrend > 0 ? '+' : ''}{commissionTrend}€
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {ventes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune donnée d'historique disponible</p>
              <p className="text-sm">Les données apparaîtront au fil des mois</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ancienne modal PDFViewer supprimée - Système HTML direct utilisé */}
    </div>
  );
}