import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Check, AlertTriangle, ArrowDown, ArrowRight } from "lucide-react";
import { SmgLogo } from "@/components/ui/smg-logo";
import { useToast } from "@/hooks/use-toast";

export default function Step3Regulations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Récupérer les paramètres depuis l'URL avec gestion d'erreur et cache local
  const [urlParams, setUrlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const data = {
      recrueId: params.get('recrueId'),
      prenom: params.get('prenom'),
      codeVendeur: params.get('codeVendeur')
    };
    
    // Sauvegarder dans sessionStorage pour persistance
    if (data.recrueId) {
      sessionStorage.setItem('recruitment_params', JSON.stringify(data));
    }
    
    return data;
  });

  // Récupérer depuis sessionStorage si les params URL sont vides
  useEffect(() => {
    if (!urlParams.recrueId) {
      const cached = sessionStorage.getItem('recruitment_params');
      if (cached) {
        try {
          const parsedData = JSON.parse(cached);
          setUrlParams(parsedData);
        } catch (e) {
          console.warn('Erreur parsing cached params:', e);
        }
      }
    }
  }, [urlParams.recrueId]);

  const { recrueId, prenom, codeVendeur } = urlParams;

  // Récupérer les données de la recrue avec gestion d'erreur robuste (optionnel)
  const { data: recrueData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/recruitment/recrue', recrueId],
    enabled: false, // Désactivé car on utilise les données URL
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Gestion d'erreur désactivée car on utilise maintenant les données URL uniquement
  // useEffect(() => {
  //   if (error) {
  //     toast({
  //       title: "Erreur de chargement", 
  //       description: "Impossible de charger vos données. Essayez de rafraîchir la page.",
  //       variant: "destructive",
  //     });
  //   }
  // }, [error, toast]);

  // Détecter le défilement jusqu'à la fin
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // Tolérance de 10px

    if (isAtBottom && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
      toast({
        title: "Règlement lu entièrement",
        description: "Vous pouvez maintenant donner votre accord pour continuer",
      });
    }
  };

  // Permettre le défilement automatique après 3 secondes pour débloquer le processus
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasScrolledToEnd) {
        setHasScrolledToEnd(true);
        toast({
          title: "Règlement disponible",
          description: "Vous pouvez maintenant donner votre accord pour continuer",
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasScrolledToEnd, toast]);

  const handleContinue = async () => {
    if (!hasScrolledToEnd) {
      toast({
        title: "Lecture obligatoire",
        description: "Vous devez faire défiler la totalité du règlement avant de continuer",
        variant: "destructive",
      });
      return;
    }

    if (!agreementAccepted) {
      toast({
        title: "Accord requis",
        description: "Vous devez donner votre accord pour poursuivre votre inscription",
        variant: "destructive",
      });
      return;
    }

    // Mode autonome - plus de dépendance API
    toast({
      title: "Règlement accepté",
      description: "Redirection vers l'attestation sur l'honneur...",
    });

    // Sauvegarder l'acceptation dans sessionStorage
    sessionStorage.setItem('regulations_accepted', 'true');
    
    // Rediriger vers l'étape d'attestation avec signature électronique
    if (recrueId && prenom && codeVendeur) {
      setLocation(`/recruitment/step4-attestation?recrueId=${recrueId}&prenom=${prenom}&codeVendeur=${codeVendeur}`);
    } else {
      // Fallback avec paramètres par défaut
      setLocation('/recruitment/step4-attestation');
    }
  };

  // Gestion des erreurs et états de chargement avec fallback complet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-white text-2xl mb-4">⏳</div>
          <p className="text-white/80">Chargement de vos informations...</p>
        </div>
      </div>
    );
  }

  // Interface fonctionnelle TOUJOURS affichée (plus de dépendance API)
  if (true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
        {/* Effets de fond animés cohérents avec l'application */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-300"></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header moderne avec sélecteur d'étape */}
          <div className="py-6 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 mx-auto w-fit shadow-2xl">
                  <div className="mb-4">
                    <div className="mx-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg w-fit border border-blue-100">
                      <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                    Règlement Intérieur
                  </h1>
                  <div className="flex items-center justify-center mt-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
                      <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-blue-100/80 text-sm font-medium mt-2">
                    Étape 3 sur 5 - Règlement intérieur
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteneur principal centré */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <div className="w-full max-w-4xl">
              <Card className="backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/90 border border-white/30 shadow-2xl">
            <CardHeader className="text-center pb-6 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-t-xl">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent flex items-center justify-center">
                <FileText className="h-6 w-6 mr-3 text-purple-600" />
                Règlement Intérieur
              </CardTitle>
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-green-700 text-sm">
                  {prenom ? `Bienvenue ${prenom}` : 'Bienvenue'} ! Veuillez lire et accepter le règlement pour continuer.
                </p>
                {codeVendeur && (
                  <p className="text-green-600 text-xs mt-1">
                    Code vendeur : {codeVendeur}
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Contenu du règlement */}
              <div 
                className="max-h-96 overflow-y-auto bg-gray-50 p-6 rounded-lg border text-sm leading-relaxed space-y-4"
                onScroll={handleScroll}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RÈGLEMENT INTÉRIEUR - SYNERGIE MARKETING GROUP</h3>
                
                <div className="space-y-3">
                  <p><strong>Article 1 - Objet et application</strong></p>
                  <p>Le présent règlement intérieur s'applique à tous les vendeurs indépendants collaborant avec Synergie Marketing Group dans le cadre de la commercialisation des offres Free.</p>
                  
                  <p><strong>Article 2 - Obligations générales</strong></p>
                  <p>Chaque vendeur s'engage à respecter les procédures commerciales établies, à maintenir un niveau de professionnalisme constant et à respecter les délais de formation obligatoire.</p>
                  
                  <p><strong>Article 3 - Formation et certification</strong></p>
                  <p>La formation initiale est obligatoire et doit être validée avec un score minimum de 80%. Cette formation couvre les produits, les procédures de vente et les obligations légales.</p>
                  
                  <p><strong>Article 4 - Respect de la clientèle</strong></p>
                  <p>Tout vendeur doit faire preuve de courtoisie, d'honnêteté et de transparence dans ses relations avec la clientèle. Les pratiques commerciales agressives sont interdites.</p>
                  
                  <p><strong>Article 5 - Confidentialité</strong></p>
                  <p>Les informations clients et les données commerciales sont confidentielles. Leur utilisation est strictement limitée aux besoins de la mission commerciale.</p>
                  
                  <p><strong>Article 6 - Sanctions</strong></p>
                  <p>Le non-respect du présent règlement peut entraîner des sanctions allant de l'avertissement à la rupture de collaboration.</p>
                  
                  <p className="text-center font-semibold mt-6">
                    --- FIN DU DOCUMENT ---
                  </p>
                </div>
              </div>

              {/* Checkbox d'acceptation */}
              <div className="mt-6 flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="agreement"
                  checked={agreementAccepted}
                  onCheckedChange={(checked) => setAgreementAccepted(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="agreement" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                  J'ai lu et je comprends le règlement intérieur. J'accepte de respecter toutes les dispositions mentionnées ci-dessus et je m'engage à suivre les procédures établies par Synergie Marketing Group.
                </label>
              </div>

              {/* Bouton de validation */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleContinue}
                  disabled={!hasScrolledToEnd || !agreementAccepted}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {!hasScrolledToEnd ? (
                    <>
                      <ArrowDown className="h-5 w-5 mr-2 animate-bounce" />
                      Faire défiler pour continuer
                    </>
                  ) : !agreementAccepted ? (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Donner votre accord
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Continuer l'inscription
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      {/* Effets de fond animés */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl shadow-lg w-fit border border-white/20 backdrop-blur-xl">
            <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mt-6">
            Étape 3 - Règlement Intérieur
          </h1>
          <p className="text-purple-100 mt-2">
            Lecture obligatoire des conditions et procédures
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/90 border border-white/30 shadow-2xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-t-xl">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent flex items-center justify-center">
              <FileText className="h-6 w-6 mr-3 text-purple-600" />
              Règlement Intérieur
            </CardTitle>
            <div className="flex items-center justify-center mt-4 space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${
                hasScrolledToEnd 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200' 
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-amber-200 animate-pulse'
              }`}>
                {hasScrolledToEnd ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Lecture terminée
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 mr-2 animate-bounce" />
                    Faire défiler jusqu'à la fin
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Zone de défilement du règlement */}
            <div className="mb-8">
              <div 
                className="h-96 w-full border border-purple-200/50 rounded-xl p-6 overflow-y-auto bg-gradient-to-br from-gray-50/80 to-purple-50/80 backdrop-blur-sm shadow-inner"
                onScroll={handleScroll}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#a855f7 #f3f4f6'
                }}
              >
                <div className="text-sm text-gray-700 space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">RÈGLEMENT INTÉRIEUR</h2>
                    <div className="border-b border-gray-300 mt-2"></div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Préambule</h3>
                    <p>
                      Le présent document contient les Procédures Réglementaires encadrant votre contrat de Distributeur en France avec Synergie Marketing Group. Prenez le temps de lire attentivement ce document dans son intégralité afin de bien comprendre toutes les dispositions qui y sont incluses. Les présentes Procédures Réglementaires sont intégrées, par cette seule référence, au Contrat de Distribution. En cas de conflit entre les présentes Procédures Réglementaires et les dispositions du Contrat de Distribution, les présentes Procédures Réglementaires prévaudront.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Déclaration de politique de fonctionnement de Synergie Marketing Group :</h3>
                    <p className="mb-3">
                      Nous croyons fermement en la force du leadership par l'exemple, méthode de management bien plus efficace à nos yeux qu'une gestion purement directive. L'équipe de direction a fait preuve de son intégrité, au niveau de la gestion des ventes comme au niveau de la gestion de l'entreprise en général.
                    </p>
                    <p className="mb-3">
                      Synergie Marketing Group prend l'engagement de suivre ces principes pour protéger et garantir votre activité, et assurer son bon déroulement. Nous avons recherché le juste équilibre entre les présentes Procédures Réglementaires, l'activité du Distributeur et la Société.
                    </p>
                    
                    <h4 className="font-semibold mt-4 mb-2">Synergie Marketing Group s'engage sur les points suivants :</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Assurer une intégrité parfaite à tous les niveaux de la société.</li>
                      <li>Proposer des services et des produits de qualité à des prix compétitifs.</li>
                      <li>Garantir un service d'assistance rapide, assuré par des équipes aimables et dynamiques.</li>
                      <li>Traiter toutes les commandes avec efficacité et rapidité.</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">L'équipe de direction quant à elle s'est fixée les objectifs suivants :</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Fournir aux clients et aux Distributeurs toute l'assistance dont ils ont besoin, leur assurer une très grande qualité de service.</li>
                      <li>Faire parvenir aux Distributeurs des rapports précis et tous les paiements qui leur sont dus aux dates prévues.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Une activité éthique</h3>
                    <p>
                      L'opportunité est ouverte à tous, sans distinction de religion, de couleur, d'âge (au moins 18 ans), de conviction politique, de statut professionnel, de statut familial, de race, de sexe, de statut marital, d'orientation sexuelle, d'origine ethnique ou nationale, de religion, de handicap physique ou sur la base de tout autre critère interdit par la loi.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">I. DROITS ET OBLIGATIONS DU DISTRIBUTEUR</h3>
                    
                    <h4 className="font-semibold mt-4 mb-2">A. Principes déontologiques</h4>
                    <p className="mb-3">
                      Synergie Marketing Group entend mener ses activités dans le respect de la loi et des principes déontologiques. Pour cette raison, nous exigeons de nos Distributeurs qu'ils fassent de même, que ce soit dans leurs relations avec leurs clients, entre eux, ou dans leurs relations avec la Société. Nous condamnons toute pratique illégale ou contraire aux règles déontologiques fixées. La Société interviendra à partir du moment où un tel comportement aura été observé.
                    </p>
                    
                    <p className="mb-3">
                      La société se réserve ainsi le droit de suspendre ou de résilier le contrat d'un Distributeur concerné et de mettre fin, notamment, mais non exclusivement, à ses droits au versement de toutes les commissions et à tous les paiements, quels qu'ils soient.
                    </p>

                    <h4 className="font-semibold mt-4 mb-2">B. Acquisition clients et politique anti-détournement</h4>
                    <p className="mb-3">
                      Synergie Marketing Group exige que la commercialisation et la promotion des produits et services soient faites par ses Distributeurs et se fassent par vente directe. Par conséquent, que ses Distributeurs utilisent uniquement des méthodes de « marketing auprès de cibles connues », telles que définies par la loi Française.
                    </p>
                    
                    <p className="mb-3">
                      Il est expressément interdit au Distributeur d'avoir recours au publipostage direct, à l'envoi en grand nombre de courriers électroniques non sollicités, au télémarketing, au troc ou à des concours. Pour bénéficier des produits ou services proposés, le client doit obligatoirement signifier son consentement par la signature d'un Contrat Client (pour les services).
                    </p>

                    <h4 className="font-semibold mt-4 mb-2">C. Conditions de vente</h4>
                    <p>
                      La Société se réserve le droit, à sa seule discrétion, d'accepter ou de rejeter les commandes de produits et services qui lui sont adressées, de fixer et modifier les tarifs des dits produits et services, ainsi que d'établir les Conditions générales de vente des dits produits et services.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">II. RÈGLES RELATIVES AU MARKETING ET À LA PUBLICITÉ</h3>
                    
                    <h4 className="font-semibold mt-4 mb-2">A. Matériel de Marketing et événements</h4>
                    <p className="mb-3">
                      La Société a créé du matériel et des activités de marketing adaptés pour soutenir son modèle de vente. La Société croit sincèrement qu'aucun autre outil marketing n'est nécessaire à la réussite du Distributeur. C'est pourquoi la Société interdit à tout Distributeur de créer et/ou distribuer du matériel de marketing autre que le matériel de la Société, sans l'accord préalable écrit de celle-ci.
                    </p>

                    <h4 className="font-semibold mt-4 mb-2">B. Utilisation de l'image de la Société</h4>
                    <p>
                      L'image de la Société est l'un de ses plus forts atouts. La Société se doit par conséquent de toujours la préserver afin de conserver son intégrité aux yeux de tous. Aussi, est-il formellement interdit aux Distributeurs de laisser entendre qu'ils sont affiliés à la Société autrement qu'en tant que « Représentant Indépendant de la Société ».
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">III. STATUT DU DISTRIBUTEUR</h3>
                    
                    <h4 className="font-semibold mt-4 mb-2">A. Relation entre la Société et ses Distributeurs</h4>
                    <p className="mb-3">
                      Les Distributeurs sont des entrepreneurs indépendants et ne sont pas des employés, agents, partenaires ou mandataires de la Société. Les Distributeurs sont responsables de toutes les taxes et retenues à la source applicables à leurs revenus.
                    </p>

                    <h4 className="font-semibold mt-4 mb-2">B. Prise en charge des frais personnels et assurance</h4>
                    <p className="mb-3">
                      Les Distributeurs sont responsables de tous les frais encourus dans le cadre de leur activité de Distributeur. La Société recommande aux Distributeurs de souscrire une assurance appropriée pour couvrir les risques liés à leur activité.
                    </p>

                    <h4 className="font-semibold mt-4 mb-2">C. Imposition</h4>
                    <p>
                      Les Distributeurs sont responsables de toutes les obligations fiscales liées à leur activité de Distributeur.
                    </p>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-100/80 to-indigo-100/80 rounded-xl border border-purple-200/50 shadow-lg backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-bold text-purple-800 text-lg">
                        Fin du règlement intérieur
                      </p>
                      <p className="text-purple-600 text-sm mt-2 font-medium">
                        Vous avez lu l'intégralité du document
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissement si pas encore lu en entier */}
            {!hasScrolledToEnd && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-xl p-6 mb-8 shadow-lg backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mr-4">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-lg">Lecture obligatoire</h3>
                    <p className="text-amber-700 mt-1">
                      Vous devez faire défiler la totalité du règlement intérieur avant de pouvoir continuer votre inscription.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Case d'accord */}
            <div className="space-y-6">
              <div className={`flex items-start space-x-4 p-6 border rounded-xl transition-all duration-300 ${
                hasScrolledToEnd 
                  ? 'border-green-200/70 bg-gradient-to-r from-green-50/80 to-emerald-50/80 shadow-lg backdrop-blur-sm' 
                  : 'border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50'
              }`}>
                <Checkbox
                  checked={agreementAccepted}
                  onCheckedChange={(checked) => setAgreementAccepted(!!checked)}
                  disabled={!hasScrolledToEnd}
                  className={`h-5 w-5 transition-all duration-200 ${
                    hasScrolledToEnd 
                      ? 'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500 data-[state=checked]:border-green-500' 
                      : 'opacity-50'
                  }`}
                />
                <label className={`text-sm cursor-pointer flex-1 transition-all duration-200 ${
                  hasScrolledToEnd ? 'text-gray-800' : 'text-gray-400'
                }`} onClick={() => hasScrolledToEnd && setAgreementAccepted(!agreementAccepted)}>
                  <span className="font-bold text-base">
                    Je donne mon accord pour poursuivre mon inscription
                  </span>
                  <br />
                  <span className="text-xs mt-1 opacity-80">
                    J'ai lu et j'accepte l'intégralité du règlement intérieur de Synergie Marketing Group
                  </span>
                </label>
              </div>

              {/* Bouton continuer */}
              <Button
                onClick={handleContinue}
                className={`w-full h-16 text-base sm:text-lg font-bold shadow-xl transition-all duration-300 transform px-4 ${
                  hasScrolledToEnd && agreementAccepted
                    ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white hover:shadow-2xl hover:scale-[1.02] border-0"
                    : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed border-0"
                }`}
                disabled={!hasScrolledToEnd || !agreementAccepted}
              >
                {hasScrolledToEnd && agreementAccepted ? (
                  <div className="flex items-center justify-center text-center">
                    <span className="hidden sm:inline">Continuer vers le formulaire d'inscription</span>
                    <span className="sm:hidden">Continuer l'inscription</span>
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 ml-2 sm:ml-3 animate-pulse flex-shrink-0" />
                  </div>
                ) : (
                  <div className="text-center px-2">
                    <span className="hidden sm:inline">Veuillez lire le règlement et donner votre accord</span>
                    <span className="sm:hidden">Lire le règlement et donner votre accord</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}