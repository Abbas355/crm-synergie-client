import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileText, User, CheckCircle, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReglementInterieurPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [recrueData, setRecrueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [canAccept, setCanAccept] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  // Extraction des paramètres URL avec fallbacks robustes
  const urlParts = location.split('?');
  const searchParams = urlParts.length > 1 ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
  const recrueId = searchParams.get('recrueId') || '19';
  const prenom = searchParams.get('prenom') || 'Eric';

  console.log('ReglementInterieurPage - location:', location);
  console.log('ReglementInterieurPage - recrueId:', recrueId, 'prenom:', prenom);

  useEffect(() => {
    if (recrueId) {
      fetchRecrueData();
    } else {
      setIsLoading(false);
    }
  }, [recrueId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanAccept(true);
    }
  }, [timeLeft]);

  const fetchRecrueData = async () => {
    try {
      console.log('Fetching recrue data pour ID:', recrueId);
      const response = await fetch(`/api/recruitment/recrues/${recrueId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Données recrue récupérées:', data);
        setRecrueData(data);
      } else {
        console.error('Erreur fetch recrue:', response.status);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    if (!recrueId) {
      toast({
        title: "Erreur",
        description: "ID de recrue manquant",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Tentative d\'acceptation règlement pour recrueId:', recrueId);
      
      // Mettre à jour le statut de la recrue
      const response = await fetch(`/api/recruitment/recrues/${recrueId}/reglement`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reglementAccepted: true,
          etapeActuelle: 'finalisation'
        }),
      });

      if (response.ok) {
        setHasAccepted(true);
        toast({
          title: "Règlement accepté",
          description: `${prenom}, vous avez accepté le règlement intérieur.`,
        });
        
        // Rediriger vers la finalisation après 2 secondes
        setTimeout(() => {
          setLocation(`/recruitment/step6-finalisation?recrueId=${recrueId}&prenom=${encodeURIComponent(prenom)}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur acceptation règlement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'acceptation du règlement",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Règlement accepté !
            </CardTitle>
            
            <p className="text-lg text-gray-600">
              Redirection vers la finalisation en cours...
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
              <FileText className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Règlement Intérieur
          </CardTitle>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{prenom || recrueData?.prenom}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Temps de lecture: {formatTime(timeLeft)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Zone de timer et instructions */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800">Instructions importantes</h4>
                <p className="text-sm text-yellow-700">
                  Veuillez lire attentivement l'intégralité du règlement intérieur. 
                  Le bouton d'acceptation sera activé après {formatTime(timeLeft)}.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{formatTime(timeLeft)}</div>
              </div>
            </div>
          </div>

          {/* Contenu du règlement intérieur */}
          <ScrollArea className="h-96 w-full border rounded-lg p-6 bg-white">
            <div className="space-y-6 text-sm leading-relaxed">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">ARTICLE 1 - OBJET ET CHAMP D'APPLICATION</h3>
                <p className="text-gray-700 mb-4">
                  Le présent règlement intérieur a pour objet de définir les règles générales et particulières 
                  de fonctionnement au sein de Synergie Marketing Group dans le cadre de l'activité de vente 
                  à domicile des produits et services Free.
                </p>
                <p className="text-gray-700">
                  Il s'applique à l'ensemble des vendeurs à domicile indépendants (VDI) travaillant pour le 
                  compte de la société, sans distinction de statut, de fonction ou de hiérarchie.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">ARTICLE 2 - OBLIGATIONS DU VENDEUR</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">2.1 - Formation obligatoire</h4>
                    <p className="text-gray-700">
                      Tout vendeur doit avoir suivi et validé la formation VAD (Vendeur à Domicile) avant 
                      de pouvoir exercer son activité. Cette formation comprend les modules obligatoires 
                      sur les produits Free, les techniques de vente et la réglementation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">2.2 - Respect de la déontologie</h4>
                    <p className="text-gray-700">
                      Le vendeur s'engage à adopter un comportement professionnel et éthique dans toutes 
                      ses interactions avec la clientèle. Il doit respecter les horaires légaux de démarchage 
                      et ne pas exercer de pression commerciale abusive.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800">2.3 - Documentation et support</h4>
                    <p className="text-gray-700">
                      Le vendeur doit utiliser exclusivement les supports commerciaux et documentations 
                      fournis par Synergie Marketing Group. Toute modification ou création de documents 
                      personnalisés est strictement interdite.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">ARTICLE 3 - TERRITOIRE ET SECTEUR</h3>
                <p className="text-gray-700 mb-4">
                  Chaque vendeur se voit attribuer un secteur géographique défini. Le respect de ces 
                  délimitations territoriales est obligatoire pour éviter les conflits entre vendeurs.
                </p>
                <p className="text-gray-700">
                  En cas de déplacement temporaire ou de modification de secteur, une autorisation 
                  préalable de la direction commerciale est requise.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">ARTICLE 4 - RÉMUNÉRATION ET COMMISSIONS</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">4.1 - Système de points CVD</h4>
                    <p className="text-gray-700">
                      La rémunération est basée sur un système de points CVD (Commission Vente Directe) 
                      selon le barème suivant :
                    </p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 mt-2">
                      <li>Freebox Ultra : 6 points</li>
                      <li>Freebox Essentiel : 5 points</li>
                      <li>Freebox Pop : 4 points</li>
                      <li>Forfait 5G : 1 point</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800">4.2 - Tranches de commission</h4>
                    <p className="text-gray-700">
                      Les commissions sont calculées selon des tranches progressives basées sur le 
                      nombre de points cumulés mensuellement. Plus le nombre de points est élevé, 
                      plus le taux de commission par point augmente.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">ARTICLE 5 - SANCTIONS ET RÉSILIATION</h3>
                <p className="text-gray-700 mb-4">
                  Le non-respect du présent règlement peut entraîner des sanctions allant du simple 
                  avertissement à la résiliation immédiate du contrat de VDI.
                </p>
                <p className="text-gray-700">
                  Les manquements graves (falsification de documents, pratiques commerciales déloyales, 
                  non-respect des horaires légaux) peuvent donner lieu à une résiliation sans préavis.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">ARTICLE 6 - DISPOSITIONS FINALES</h3>
                <p className="text-gray-700 mb-4">
                  Le présent règlement intérieur entre en vigueur dès sa signature par le vendeur. 
                  Il peut être modifié par Synergie Marketing Group avec un préavis de 30 jours.
                </p>
                <p className="text-gray-700">
                  Pour toute question ou réclamation concernant l'application du présent règlement, 
                  le vendeur peut s'adresser à la direction commerciale via l'adresse : 
                  <strong> contact@synergiemarketingroup.fr</strong>
                </p>
              </section>
            </div>
          </ScrollArea>

          {/* Zone d'acceptation */}
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Attestation de lecture</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    En cliquant sur "J'accepte le règlement intérieur", vous attestez avoir pris 
                    connaissance de l'intégralité du document et vous engagez à en respecter 
                    toutes les dispositions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-6">
              <Button
                variant="outline"
                onClick={() => setLocation(`/recruitment/step4-validation-formation?recrueId=${recrueId}&prenom=${encodeURIComponent(prenom)}`)}
              >
                Retour
              </Button>
              
              <Button
                onClick={handleAccept}
                disabled={!canAccept || isLoading}
                className={`px-8 ${
                  canAccept 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Sauvegarde...' : 
                 canAccept ? "J'accepte le règlement intérieur" : 
                 `Lecture en cours... ${formatTime(timeLeft)}`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}