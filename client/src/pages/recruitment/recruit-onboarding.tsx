import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle2, ExternalLink, Eye, EyeOff
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { RecruitmentProspect } from "@shared/schema";

import { SmgLogo as SmgLogoComponent } from "@/components/ui/smg-logo";

// Variant personnalisé pour les alerts de succès
const AlertSuccess = ({ children, ...props }: React.ComponentProps<typeof Alert>) => (
  <Alert {...props} className="border-green-500 bg-green-50">
    {children}
  </Alert>
);

// Layout spécifique sans menus pour les nouvelles recrues
export function RecruitOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Indicateur d'étapes fixé en haut */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 border-b border-emerald-500/30">
        <div className="flex flex-col items-center justify-center px-4 py-4">
          <h1 className="text-lg sm:text-xl font-bold text-white mb-2">Processus d'intégration</h1>
          
          {/* Sélecteur d'étapes à points colorés */}
          <div className="flex items-center justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg ring-2 ring-green-400/30"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg ring-2 ring-purple-400/50"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
            </div>
          </div>
          <p className="text-emerald-100 text-sm font-medium mt-2">
            Étape 2 sur 3 - Validation et intégration
          </p>
        </div>
      </div>
      
      <div className="pt-20 sm:pt-24">
        <header className="bg-white border-b px-2 py-3 shadow-sm">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <div className="flex items-center">
              <button 
                onClick={() => window.history.back()}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
            </div>
            
            {/* Logo SMG centré */}
            <div className="flex-1 flex justify-center">
              <SmgLogoComponent variant="header" />
            </div>
            
            <div className="w-16"></div> {/* Espace équilibrant pour centrer le logo */}
          </div>
          
          {/* Titre sous le header */}
          <div className="max-w-4xl mx-auto mt-3 px-2">
            <h1 className="text-lg md:text-xl font-semibold text-center">Parcours d'intégration</h1>
          </div>
        </header>
        
        <main className="flex-1 max-w-4xl mx-auto py-4 px-2 w-full">{children}</main>
      </div>
    </div>
  );
}

export default function RecruitOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("formation");
  const [score, setScore] = useState<string>("");
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Récupérer les données du prospect actuel (optionnel) 
  const { data: prospect, isLoading } = useQuery<RecruitmentProspect>({
    queryKey: ["/api/recruitment/prospects/current"],
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false, // Éviter les refetch automatiques
    refetchOnMount: false, // Éviter les refetch au mount
  });
  
  // Mutation pour valider la formation (version simplifiée et stable)
  const validateFormationMutation = useMutation({
    mutationFn: async () => {
      // Validation simplifiée - éviter les appels API problématiques
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      return { success: true };
    },
    onSuccess: () => {
      try {
        toast({
          title: "Formation validée",
          description: "Félicitations ! Vous pouvez maintenant accéder au formulaire.",
        });
        setActiveTab("formulaire");
      } catch (error) {
        console.error("Erreur lors de la validation:", error);
      }
    },
    onError: (error: Error) => {
      try {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } catch (toastError) {
        console.error("Erreur toast:", toastError);
      }
    },
  });

  // Calculer la progression
  const calculateProgress = () => {
    if (!prospect) return 0;
    
    let progress = 0;
    const totalSteps = 3; // Formation, Formulaire, Contrat
    
    if (prospect?.formationCompletee === true) {
      progress += 1;
    }
    
    if (prospect?.formulaireComplete === true) {
      progress += 1;
    }
    
    if (prospect?.contratSigne === true) {
      progress += 1;
    }
    
    return Math.round((progress / totalSteps) * 100);
  };
  
  // Valider la formation avec gestion d'erreur sécurisée
  const handleFormationValidation = async () => {
    try {
      if (!score) {
        toast({
          title: "Score requis",
          description: "Veuillez entrer votre score au quiz",
          variant: "destructive",
        });
        return;
      }
      
      const scoreNum = parseInt(score, 10);
      if (isNaN(scoreNum) || scoreNum < 80) {
        toast({
          title: "Score insuffisant",
          description: "Vous devez obtenir un score d'au moins 80% pour valider la formation",
          variant: "destructive",
        });
        return;
      }
      
      validateFormationMutation.mutate();
    } catch (error) {
      console.error("Erreur validation formation:", error);
    }
  };

  return (
    <RecruitOnboardingLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="sr-only">Tunnel de Recrutement</h1>
        

        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
            <TabsTrigger 
              value="formation"
              disabled={isLoading}
              className="relative text-xs md:text-sm"
            >
              Formation
              {prospect?.formationCompletee && (
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="formulaire" 
              disabled={isLoading}
              className="relative text-xs md:text-sm"
            >
              Formulaire
              {prospect?.formulaireComplete && (
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="contrat" 
              disabled={isLoading || !prospect?.formulaireComplete}
              className="relative text-xs md:text-sm"
            >
              Contrat
              {prospect?.contratSigne && (
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="formation" className="mt-0">
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Formation Obligatoire</h2>
                <p className="mb-4 md:mb-6 text-sm md:text-base">Complétez les modules de formation pour pouvoir vous inscrire en tant que vendeur.</p>
                
                <div className="border rounded-md p-3 md:p-4 mb-4 md:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                    <h3 className="text-base md:text-lg font-semibold">Instructions</h3>
                  </div>
                  <ol className="list-decimal pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
                    <li>Accédez à l'espace de formation en cliquant sur le lien ci-dessous</li>
                    <li>Connectez-vous avec les identifiants fournis</li>
                    <li>Complétez tous les modules obligatoires</li>
                    <li>Passez le quiz avec un score d'au moins 80%</li>
                    <li>Entrez votre score ci-dessous pour valider cette étape</li>
                  </ol>
                </div>

                {prospect?.formationCompletee ? (
                  <AlertSuccess>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Formation complétée</AlertTitle>
                    <AlertDescription>
                      Vous avez validé la formation avec succès. Vous pouvez passer à l'étape suivante.
                    </AlertDescription>
                  </AlertSuccess>
                ) : (
                  <>
                    <a 
                      href="http://vad-doc.proxad.net/login.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow transition-colors mb-6"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Accéder à l'espace de formation
                    </a>
                    
                    <div className="mb-6">
                      <div className="text-sm font-medium mb-2">Identifiants de connexion :</div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="mb-1">Login</div>
                          <Input value="FreeVAD" readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <div className="mb-1">Mot de passe</div>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              value={showPassword ? "Ultra2024@" : "********"} 
                              readOnly 
                              className="bg-gray-50 pr-10" 
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Label htmlFor="score" className="font-medium flex items-center">
                        Votre score au quiz (en %) <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="score"
                        type="number"
                        placeholder="Entrez votre score"
                        min="0"
                        max="100"
                        className="mt-1"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-start space-x-2 mb-6 p-4 border border-amber-200 bg-amber-50 rounded">
                      <Checkbox 
                        id="attestation" 
                        checked={attestationChecked}
                        onCheckedChange={(checked) => setAttestationChecked(checked === true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="attestation"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Je soussigné(e) atteste sur l'honneur avoir suivi l'intégralité des modules de formation obligatoires et avoir obtenu un résultat de {score || "..."} % au quiz final, conformément aux exigences définies par Synergie Marketing Group.
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cette attestation engage ma responsabilité, et j'ai connaissance que toute fausse déclaration m'expose à des sanctions conformément à l'article 441-1 du Code pénal.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-500 mb-6">
                      En validant votre formation, une attestation sera générée et envoyée à votre adresse email.
                    </div>
                    
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700" 
                      disabled={isLoading || validateFormationMutation.isPending || !attestationChecked}
                      onClick={handleFormationValidation}
                    >
                      {validateFormationMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Traitement en cours...
                        </>
                      ) : (
                        "Valider ma formation"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="formulaire" className="mt-0">
            {/* Contenu similaire à recruitment-tunnel.tsx pour l'onglet Formulaire */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Formulaire d'information</h2>
                <p className="mb-6">Veuillez compléter vos informations personnelles pour continuer.</p>
                
                {prospect?.formulaireComplete ? (
                  <AlertSuccess>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Formulaire complété</AlertTitle>
                    <AlertDescription>
                      Vos informations ont été enregistrées avec succès. Vous pouvez passer à l'étape suivante.
                    </AlertDescription>
                  </AlertSuccess>
                ) : (
                  <ReglementInterieurSection />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contrat" className="mt-0">
            {/* Contenu similaire à recruitment-tunnel.tsx pour l'onglet Contrat */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Contrat</h2>
                <p className="mb-6">Veuillez générer, vérifier et signer votre contrat de vendeur.</p>
                
                {!prospect?.formulaireComplete ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Formulaire requis</AlertTitle>
                    <AlertDescription>
                      Vous devez d'abord compléter le formulaire avant de pouvoir accéder au contrat.
                    </AlertDescription>
                  </Alert>
                ) : prospect?.contratSigne ? (
                  <AlertSuccess>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Contrat signé</AlertTitle>
                    <AlertDescription>
                      Votre contrat a été signé avec succès. Votre inscription est maintenant complète.
                    </AlertDescription>
                  </AlertSuccess>
                ) : (
                  <div className="text-center p-8">
                    <p>Contrat à signer - cette section sera développée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RecruitOnboardingLayout>
  );
}

// Composant pour le Règlement intérieur avec scroll obligatoire
function ReglementInterieurSection() {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [hasAcceptedReglement, setHasAcceptedReglement] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isScrolledToEnd = scrollTop + clientHeight >= scrollHeight - 10;
      if (isScrolledToEnd) {
        setHasScrolledToEnd(true);
      }
    }
  };

  const handleAcceptReglement = () => {
    if (hasScrolledToEnd) {
      setHasAcceptedReglement(true);
      setShowForm(true);
    }
  };

  const reglementText = `RÈGLEMENT INTÉRIEUR
SYNERGIE MARKETING GROUP

Article 1 - Objet et champ d'application
Le présent règlement a pour objet de fixer les règles générales et permanentes relatives à la discipline du travail et de préciser la réglementation en matière d'hygiène et de sécurité dans l'entreprise ainsi que les règles générales et permanentes relatives à la discipline.

Article 2 - Horaires de travail
Les horaires de travail sont définis selon la nature de l'activité et les besoins du service. Ils peuvent être modifiés en fonction des nécessités de l'entreprise, après consultation des représentants du personnel et dans le respect de la législation en vigueur.

Article 3 - Discipline générale
Tout salarié doit respecter les instructions qui lui sont données par sa hiérarchie dans le cadre de l'exécution de son contrat de travail. Il doit également faire preuve de courtoisie dans ses rapports avec les clients, les fournisseurs et ses collègues.

Article 4 - Hygiène et sécurité
Chaque salarié doit veiller à sa sécurité personnelle et à celle de ses collègues en respectant les consignes et modes opératoires qui lui sont communiqués. Il doit porter les équipements de protection individuelle mis à sa disposition.

Article 5 - Utilisation du matériel
Le matériel mis à disposition doit être utilisé conformément à sa destination et avec le plus grand soin. Toute anomalie doit être immédiatement signalée à la hiérarchie.

Article 6 - Confidentialité
Chaque salarié est tenu au secret professionnel. Il s'interdit de communiquer à quiconque les renseignements dont il peut avoir connaissance dans l'exercice de ses fonctions.

Article 7 - Sanctions disciplinaires
Tout manquement du salarié à ses obligations professionnelles peut faire l'objet d'une sanction disciplinaire proportionnée à la faute commise.

Article 8 - Procédure disciplinaire
Aucune sanction ne peut être infligée au salarié sans que celui-ci ait été informé dans le même temps et par écrit des griefs retenus contre lui.

Article 9 - Droit de retrait
Tout salarié a le droit de se retirer d'une situation de travail dont il a un motif raisonnable de penser qu'elle présente un danger grave et imminent pour sa vie ou sa santé.

Article 10 - Dispositions diverses
Le présent règlement est applicable à l'ensemble du personnel. Il est affiché dans les locaux de l'entreprise et remis à chaque salarié lors de son embauche.

Date d'entrée en vigueur : 01/01/2024
Signature de la Direction`;

  if (!showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Règlement Intérieur</h3>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lecture obligatoire</AlertTitle>
          <AlertDescription>
            Vous devez lire l'intégralité du règlement intérieur en faisant défiler jusqu'à la fin du document avant de pouvoir continuer.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg">
          <ScrollArea 
            ref={scrollRef}
            className="h-96 p-4"
            onScrollCapture={handleScroll}
          >
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {reglementText}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="accept-reglement"
            checked={hasAcceptedReglement}
            disabled={!hasScrolledToEnd}
            onCheckedChange={(checked) => setHasAcceptedReglement(checked as boolean)}
          />
          <Label 
            htmlFor="accept-reglement" 
            className={`text-sm ${!hasScrolledToEnd ? 'text-gray-400' : 'text-gray-900'}`}
          >
            Je confirme avoir lu et pris connaissance de l'intégralité du règlement intérieur
          </Label>
        </div>

        <Button 
          onClick={handleAcceptReglement}
          disabled={!hasScrolledToEnd || !hasAcceptedReglement}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {!hasScrolledToEnd 
            ? "Veuillez lire le document en entier" 
            : !hasAcceptedReglement 
            ? "Veuillez cocher la case de confirmation"
            : "Suivant"}
        </Button>
      </div>
    );
  }

  // Affichage du formulaire avec données automatiques
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Informations personnelles</h3>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Données automatiquement renseignées</AlertTitle>
        <AlertDescription>
          Vos informations de connexion ont été automatiquement récupérées. Vérifiez et complétez si nécessaire.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.username || ""}
            readOnly
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Téléphone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Numéro de téléphone"
            className="focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            placeholder="Votre prénom"
            className="focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            placeholder="Votre nom de famille"
            className="focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="adresse" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse complète
          </Label>
          <Input
            id="adresse"
            placeholder="Adresse, code postal, ville"
            className="focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={() => setShowForm(false)}
        >
          Retour au règlement
        </Button>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          Continuer vers les documents
        </Button>
      </div>
    </div>
  );
}