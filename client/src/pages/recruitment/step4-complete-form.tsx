import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, MapPin, Car, Home, FileText, Camera, Phone, CreditCard, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Schema de validation pour le formulaire complet
const completeFormSchema = z.object({
  dateNaissance: z.string().min(1, "Date de naissance requise").refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, "Vous devez avoir au moins 18 ans"),
  lieuNaissance: z.string().min(1, "Lieu de naissance requis"),
  villeNaissance: z.string().min(1, "Ville de naissance requise"),
  numeroSecuriteSociale: z.string().regex(/^\d{15}$/, "Le numéro de sécurité sociale doit contenir exactement 15 chiffres"),
  vehiculePermis: z.string().min(1, "Sélectionnez une option"),
  typeHebergement: z.string().min(1, "Type d'hébergement requis"),
  photo: z.any().refine((file) => file && file.length > 0, "Photo obligatoire"),
  pieceIdentite: z.any().refine((file) => file && file.length > 0, "Pièce d'identité requise"),
  rib: z.any().refine((file) => file && file.length > 0, "RIB requis"),
  carteVitale: z.any().refine((file) => file && file.length > 0, "Carte vitale requise"),
  identiteHebergeant: z.any().optional(),
  attestationHebergement: z.any().optional(),
  documentJustificatif: z.any().optional()
});

type CompleteFormData = z.infer<typeof completeFormSchema>;

// Interface pour les villes mondiales
interface WorldCity {
  name: string;
  country: string;
  region?: string;
}

// Interface pour les villes françaises
interface FrenchCity {
  nom: string;
  code: string;
  codePostal: string;
  region: string;
}

export default function Step4CompleteForm() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [worldCities, setWorldCities] = useState<WorldCity[]>([]);
  const [frenchCities, setFrenchCities] = useState<FrenchCity[]>([]);
  const [isLoadingWorldCities, setIsLoadingWorldCities] = useState(false);
  const [selectedHebergement, setSelectedHebergement] = useState('');
  
  // Récupérer l'ID de la recrue depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const recrueId = urlParams.get('recrueId');

  const form = useForm<CompleteFormData>({
    resolver: zodResolver(completeFormSchema),
    defaultValues: {
      dateNaissance: '',
      lieuNaissance: '',
      villeNaissance: '',
      numeroSecuriteSociale: '',
      vehiculePermis: '',
      typeHebergement: ''
    }
  });

  // Charger les villes du monde pour le lieu de naissance
  useEffect(() => {
    const loadWorldCities = async () => {
      setIsLoadingWorldCities(true);
      try {
        // API mondiale des villes (exemple avec REST Countries + Cities)
        const response = await fetch('https://countriesnow.space/api/v0.1/countries');
        const data = await response.json();
        
        if (data.data) {
          const cities: WorldCity[] = [];
          data.data.forEach((country: any) => {
            if (country.cities) {
              country.cities.forEach((city: string) => {
                cities.push({
                  name: city,
                  country: country.country,
                });
              });
            }
          });
          setWorldCities(cities.slice(0, 1000)); // Limiter pour les performances
        }
      } catch (error) {
        console.error('Erreur chargement villes mondiales:', error);
      } finally {
        setIsLoadingWorldCities(false);
      }
    };

    loadWorldCities();
  }, []);

  // Recherche de villes françaises par code postal
  const searchFrenchCities = async (codePostal: string) => {
    if (codePostal.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/fr/${codePostal}`);
        if (response.ok) {
          const data = await response.json();
          const cities: FrenchCity[] = data.places.map((place: any) => ({
            nom: place['place name'],
            code: place['place name'],
            codePostal: data['post code'],
            region: place.state
          }));
          setFrenchCities(cities);
        }
      } catch (error) {
        console.error('Erreur recherche villes:', error);
      }
    }
  };

  const onSubmit = async (data: CompleteFormData) => {
    if (!recrueId) {
      alert('ID de recrue manquant');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Créer un FormData pour l'upload des fichiers
      const formData = new FormData();
      
      // Ajouter les données texte
      formData.append('recrueId', recrueId);
      formData.append('dateNaissance', data.dateNaissance);
      formData.append('lieuNaissance', data.lieuNaissance);
      formData.append('villeNaissance', data.villeNaissance);
      formData.append('numeroSecuriteSociale', data.numeroSecuriteSociale);
      formData.append('vehiculePermis', data.vehiculePermis);
      formData.append('typeHebergement', data.typeHebergement);

      // Ajouter les fichiers
      if (data.photo?.[0]) formData.append('photo', data.photo[0]);
      if (data.pieceIdentite?.[0]) formData.append('pieceIdentite', data.pieceIdentite[0]);
      if (data.rib?.[0]) formData.append('rib', data.rib[0]);
      if (data.carteVitale?.[0]) formData.append('carteVitale', data.carteVitale[0]);
      
      // Fichiers conditionnels pour hébergement
      if (data.identiteHebergeant?.[0]) formData.append('identiteHebergeant', data.identiteHebergeant[0]);
      if (data.attestationHebergement?.[0]) formData.append('attestationHebergement', data.attestationHebergement[0]);
      if (data.documentJustificatif?.[0]) formData.append('documentJustificatif', data.documentJustificatif[0]);

      // Appel API avec FormData
      const response = await fetch('/api/recruitment/complete-inscription', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Rediriger vers la page de contrat avec les données générées
        setLocation(`/recruitment/step5-contrat?recrueId=${recrueId}&prenom=${result.prenom}&nom=${result.nom}&email=${result.email}&motDePasse=${result.motDePasse}&codeVendeur=${result.codeVendeur}`);
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
      alert('Erreur lors de la soumission du formulaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField = ({ name, label, icon: Icon, required = true }: { 
    name: keyof CompleteFormData; 
    label: string; 
    icon: any; 
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={name}
        type="file"
        accept="image/*,application/pdf"
        {...form.register(name)}
        className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
      />
      {form.formState.errors[name] && (
        <p className="text-sm text-red-600">
          {typeof form.formState.errors[name]?.message === 'string' 
            ? form.formState.errors[name]?.message 
            : 'Ce champ est requis'}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-t-2xl">
            <h1 className="text-3xl font-bold">Finalisation de votre dossier</h1>
            <p className="text-blue-100 mt-2">Complétez vos informations pour générer votre contrat</p>
            
            {/* Indicateur d'étapes */}
            <div className="flex justify-center mt-6 space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= 4 ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                }`}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border-white/20 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Section 1: Photo obligatoire */}
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-600" />
                    Photo d'identité
                  </h3>
                  <p className="text-sm text-gray-600">Photo récente et de bonne qualité</p>
                </div>
                <FileUploadField name="photo" label="Photo d'identité" icon={Camera} />
              </div>



              {/* Section 3: Informations personnelles */}
              <div className="space-y-6">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Informations personnelles
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Date de naissance *
                    </Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      {...form.register('dateNaissance')}
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {form.formState.errors.dateNaissance && (
                      <p className="text-sm text-red-600">{form.formState.errors.dateNaissance.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="villeNaissance" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      Ville de naissance *
                    </Label>
                    <Select value={form.watch('villeNaissance')} onValueChange={(value) => form.setValue('villeNaissance', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-purple-500">
                        <SelectValue placeholder={isLoadingWorldCities ? "Chargement..." : "Sélectionnez votre ville de naissance"} />
                      </SelectTrigger>
                      <SelectContent>
                        {worldCities.map((city, index) => (
                          <SelectItem key={index} value={`${city.name}, ${city.country}`}>
                            {city.name}, {city.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.villeNaissance && (
                      <p className="text-sm text-red-600">{form.formState.errors.villeNaissance.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroSecuriteSociale" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Numéro de sécurité sociale * (15 chiffres)
                    </Label>
                    <Input
                      id="numeroSecuriteSociale"
                      type="text"
                      maxLength={15}
                      placeholder="123456789012345"
                      {...form.register('numeroSecuriteSociale')}
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {form.formState.errors.numeroSecuriteSociale && (
                      <p className="text-sm text-red-600">{form.formState.errors.numeroSecuriteSociale.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehiculePermis" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Car className="h-4 w-4 text-purple-600" />
                      Véhicule et permis *
                    </Label>
                    <Select value={form.watch('vehiculePermis')} onValueChange={(value) => form.setValue('vehiculePermis', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-purple-500">
                        <SelectValue placeholder="Sélectionnez votre situation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vehicule_permis">Véhicule + Permis</SelectItem>
                        <SelectItem value="permis_seulement">Permis seulement</SelectItem>
                        <SelectItem value="aucun">Aucun des deux</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.vehiculePermis && (
                      <p className="text-sm text-red-600">{form.formState.errors.vehiculePermis.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Documents justificatifs */}
              <div className="space-y-6">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Documents justificatifs
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <FileUploadField name="pieceIdentite" label="Pièce d'identité" icon={User} />
                  <FileUploadField name="rib" label="RIB" icon={CreditCard} />
                  <FileUploadField name="carteVitale" label="Carte vitale" icon={Heart} />
                </div>
              </div>

              {/* Section 5: Hébergement */}
              <div className="space-y-6">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Home className="h-5 w-5 text-indigo-600" />
                    Situation d'hébergement
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="typeHebergement" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Type d'hébergement *
                    </Label>
                    <Select 
                      value={form.watch('typeHebergement')} 
                      onValueChange={(value) => {
                        form.setValue('typeHebergement', value);
                        setSelectedHebergement(value);
                      }}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-indigo-500">
                        <SelectValue placeholder="Sélectionnez votre situation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprietaire">Propriétaire</SelectItem>
                        <SelectItem value="locataire">Locataire</SelectItem>
                        <SelectItem value="heberge">Hébergé(e)</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.typeHebergement && (
                      <p className="text-sm text-red-600">{form.formState.errors.typeHebergement.message}</p>
                    )}
                  </div>

                  {/* Documents conditionnels pour hébergement */}
                  {selectedHebergement === 'heberge' && (
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-lg">
                      <FileUploadField name="identiteHebergeant" label="Pièce d'identité de l'hébergeant" icon={User} required={false} />
                      <FileUploadField name="attestationHebergement" label="Attestation d'hébergement" icon={Home} required={false} />
                    </div>
                  )}
                </div>
              </div>

              {/* Document justificatif optionnel */}
              <div className="space-y-4">
                <FileUploadField name="documentJustificatif" label="Document justificatif complémentaire (optionnel)" icon={FileText} required={false} />
              </div>

              {/* Bouton de soumission */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  {isSubmitting ? 'Génération en cours...' : 'Générer mon contrat'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}