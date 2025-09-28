import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, FileText, Trophy, ArrowRight, AlertCircle } from 'lucide-react';

interface RecrueData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  codeVendeur: string;
  etapeActuelle: number;
}

export default function Step3PostFormation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer l'ID de la recrue depuis l'URL
  const recrueId = new URLSearchParams(window.location.search).get('recrueId');
  
  // État local pour le formulaire
  const [formData, setFormData] = useState({
    scoreFormation: '',
    attestationFormation: false,
    documentFormation: null as File | null,
    commentaires: ''
  });

  // Récupérer les données de la recrue
  const { data: recrueData, isLoading } = useQuery<RecrueData>({
    queryKey: [`/api/recruitment/recrue/${recrueId}`],
    enabled: !!recrueId,
  });

  // Mutation pour valider l'étape 3
  const validateStep3Mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/recruitment/step3-validation/${recrueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Formation validée !",
        description: "Félicitations ! Votre formation a été validée avec succès.",
      });
      
      // Redirection vers l'étape suivante
      setTimeout(() => {
        setLocation(`/recruitment/step4?recrueId=${recrueId}`);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du score
    const score = parseInt(formData.scoreFormation);
    if (!score || score < 80) {
      toast({
        title: "Score insuffisant",
        description: "Vous devez obtenir un score d'au moins 80% pour valider la formation",
        variant: "destructive",
      });
      return;
    }

    // Validation de l'attestation
    if (!formData.attestationFormation) {
      toast({
        title: "Attestation requise",
        description: "Veuillez confirmer que vous avez terminé la formation",
        variant: "destructive",
      });
      return;
    }

    // Créer les données pour l'envoi
    const submitData = {
      score: formData.scoreFormation,
      attestation: formData.attestationFormation,
      commentaires: formData.commentaires
    };

    validateStep3Mutation.mutate(submitData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, documentFormation: file }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="animate-spin text-white text-2xl">⏳</div>
      </div>
    );
  }

  if (!recrueData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-gray-600">Impossible de charger les données de votre candidature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Validation de Formation
          </h1>
          <p className="text-blue-200">
            Félicitations {recrueData.prenom} ! Validez votre réussite à la formation
          </p>
        </div>

        {/* Formulaire principal */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2" />
              Résultats de Formation
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Score de formation */}
              <div className="space-y-2">
                <Label htmlFor="score" className="text-lg font-semibold">
                  Score obtenu au quiz (%)
                </Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.scoreFormation}
                  onChange={(e) => setFormData(prev => ({ ...prev, scoreFormation: e.target.value }))}
                  placeholder="Entrez votre score (ex: 85)"
                  className="text-lg h-12"
                  required
                />
                <p className="text-sm text-gray-600">
                  Un score minimum de 80% est requis pour valider la formation
                </p>
              </div>

              {/* Upload document */}
              <div className="space-y-2">
                <Label htmlFor="document" className="text-lg font-semibold">
                  Justificatif de formation (optionnel)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="document" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.documentFormation ? formData.documentFormation.name : 'Cliquez pour ajouter un fichier'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Formats acceptés: PDF, JPG, PNG
                    </span>
                  </label>
                </div>
              </div>

              {/* Commentaires */}
              <div className="space-y-2">
                <Label htmlFor="commentaires" className="text-lg font-semibold">
                  Commentaires (optionnel)
                </Label>
                <Textarea
                  id="commentaires"
                  value={formData.commentaires}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                  placeholder="Partagez votre expérience de formation..."
                  rows={4}
                />
              </div>

              {/* Attestation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.attestationFormation}
                    onChange={(e) => setFormData(prev => ({ ...prev, attestationFormation: e.target.checked }))}
                    className="mt-1"
                    required
                  />
                  <div>
                    <span className="font-semibold text-blue-900">
                      J'atteste sur l'honneur avoir terminé la formation avec succès
                    </span>
                    <p className="text-sm text-blue-700 mt-1">
                      Je confirme avoir obtenu un score supérieur à 80% au quiz de validation
                    </p>
                  </div>
                </label>
              </div>

              {/* Bouton de validation */}
              <Button
                type="submit"
                disabled={validateStep3Mutation.isPending}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all duration-300"
              >
                {validateStep3Mutation.isPending ? (
                  "Validation en cours..."
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Valider ma formation
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informations importantes */}
        <Card className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Informations importantes
            </h3>
            <ul className="space-y-2 text-amber-700 text-sm">
              <li>• Votre code vendeur : <strong>{recrueData.codeVendeur}</strong></li>
              <li>• Score minimum requis : 80%</li>
              <li>• Une fois validée, vous pourrez accéder à l'étape suivante</li>
              <li>• En cas de score insuffisant, vous devrez repasser la formation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}