import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, User, MapPin, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { SmgLogo } from "@/components/ui/smg-logo";
import { useToast } from "@/hooks/use-toast";

export default function Step6CompleteForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // États du formulaire
  const [photoIdentite, setPhotoIdentite] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [villeNaissance, setVilleNaissance] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Récupérer les paramètres depuis l'URL et sessionStorage
  const [urlParams, setUrlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const data = {
      recrueId: params.get('recrueId'),
      prenom: params.get('prenom'),
      codeVendeur: params.get('codeVendeur')
    };
    
    // Récupérer depuis sessionStorage si vide
    if (!data.recrueId) {
      const cached = sessionStorage.getItem('recruitment_params');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Erreur parsing cached params:', e);
        }
      }
    }
    
    return data;
  });

  const { recrueId, prenom, codeVendeur } = urlParams;

  // Gérer la sélection de photo
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide",
          variant: "destructive"
        });
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La photo ne doit pas dépasser 5 MB",
          variant: "destructive"
        });
        return;
      }

      setPhotoIdentite(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: "Photo sélectionnée",
        description: "Photo d'identité ajoutée avec succès"
      });
    }
  };

  // Vérifier si le formulaire est valide
  const isFormValid = photoIdentite && dateNaissance && villeNaissance;

  // Gérer la soumission
  const handleSubmit = async () => {
    if (!isFormValid) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('photoIdentite', photoIdentite);
      formData.append('dateNaissance', dateNaissance);
      formData.append('villeNaissance', villeNaissance);
      formData.append('recrueId', recrueId || '');
      formData.append('prenom', prenom || '');
      formData.append('codeVendeur', codeVendeur || '');

      // Envoyer les données
      const response = await fetch('/api/recruitment/complete-profile', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      
      toast({
        title: "Profil complété",
        description: "Vos informations ont été sauvegardées avec succès"
      });

      // Rediriger vers la finalisation
      setLocation(`/recruitment/step6-finalisation?recrueId=${recrueId}&prenom=${prenom}&codeVendeur=${codeVendeur}`);

    } catch (error) {
      console.error('Erreur soumission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos informations",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      {/* Effets de fond animés */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header moderne harmonisé */}
        <div className="py-4 px-4">
          <div className="max-w-2xl mx-auto">
            {/* En-tête avec logo */}
            <div className="text-center mb-6">
              <div className="mx-auto p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl shadow-lg w-fit border border-white/20 backdrop-blur-xl">
                <SmgLogo variant="auth" className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
              </div>
            </div>
            
            {/* Header principal avec dégradé bleu moderne */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-center text-white shadow-xl">
              <h1 className="text-xl sm:text-3xl font-bold mb-2">
                Finalisation de votre dossier
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Complétez vos informations pour générer votre contrat
              </p>
              
              {/* Sélecteur d'étapes modernisé */}
              <div className="flex items-center justify-center mt-4 space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-white text-blue-600 rounded-full text-sm font-bold">1</div>
                <div className="flex items-center justify-center w-8 h-8 bg-white text-blue-600 rounded-full text-sm font-bold">2</div>
                <div className="flex items-center justify-center w-8 h-8 bg-white text-blue-600 rounded-full text-sm font-bold">3</div>
                <div className="flex items-center justify-center w-8 h-8 bg-white text-blue-600 rounded-full text-sm font-bold">4</div>
                <div className="flex items-center justify-center w-8 h-8 bg-white text-purple-600 rounded-full text-sm font-bold ring-2 ring-white">5</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteneur principal */}
        <div className="flex-1 flex items-start justify-center px-3 pb-4 sm:px-4 sm:pb-8">
          <div className="w-full max-w-2xl">
            <Card className="backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/90 border border-white/30 shadow-2xl">
              <CardContent className="p-4 sm:p-6 space-y-6">
                
                {/* Section Photo d'identité */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center mb-3">
                    <Camera className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Photo d'identité</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Photo récente et de bonne qualité</p>
                  
                  <div className="space-y-4">
                    <Label htmlFor="photo-identite" className="text-sm font-medium text-gray-700">
                      Photo d'identité <span className="text-red-500">*</span>
                    </Label>
                    
                    {photoPreview ? (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Aperçu photo d'identité" 
                          className="w-32 h-40 object-cover rounded-lg border-2 border-blue-200 shadow-md"
                        />
                        <Button
                          onClick={() => {
                            setPhotoIdentite(null);
                            setPhotoPreview("");
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Changer la photo
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          id="photo-identite"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <label 
                          htmlFor="photo-identite" 
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Choisir un fichier</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG (max 5MB)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Informations personnelles */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-purple-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="date-naissance" className="text-sm font-medium text-gray-700">
                        Date de naissance <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="date-naissance"
                        type="date"
                        value={dateNaissance}
                        onChange={(e) => setDateNaissance(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ville-naissance" className="text-sm font-medium text-gray-700">
                        Ville de naissance <span className="text-red-500">*</span>
                      </Label>
                      <Select value={villeNaissance} onValueChange={setVilleNaissance}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionnez votre ville de..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paris">Paris</SelectItem>
                          <SelectItem value="marseille">Marseille</SelectItem>
                          <SelectItem value="lyon">Lyon</SelectItem>
                          <SelectItem value="toulouse">Toulouse</SelectItem>
                          <SelectItem value="nice">Nice</SelectItem>
                          <SelectItem value="nantes">Nantes</SelectItem>
                          <SelectItem value="strasbourg">Strasbourg</SelectItem>
                          <SelectItem value="montpellier">Montpellier</SelectItem>
                          <SelectItem value="bordeaux">Bordeaux</SelectItem>
                          <SelectItem value="lille">Lille</SelectItem>
                          <SelectItem value="autre">Autre ville</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between space-x-3 pt-4">
                  <Button
                    onClick={() => setLocation(`/recruitment/step4?recrueId=${recrueId}&prenom=${prenom}&codeVendeur=${codeVendeur}`)}
                    variant="outline"
                    className="flex-1 py-2 text-xs sm:text-sm"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Retour
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isUploading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full mr-1 sm:mr-2"></div>
                        Envoi...
                      </>
                    ) : (
                      <>
                        Finaliser
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
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