import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ContractValidationSuccess } from "./contract-validation-success";

interface ClientFormEditProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onSuccess: () => void;
}

export function ClientFormEdit({ isOpen, onClose, client, onSuccess }: ClientFormEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCongratulations, setShowCongratulations] = useState(false);

  const [formData, setFormData] = useState({
    civilite: client?.civilite || "",
    prenom: client?.prenom || "",
    nom: client?.nom || "",
    email: client?.email || "",
    telephone: client?.telephone || "", // Architecture unifiée
    dateNaissance: client?.dateNaissance?.split('T')[0] || "", // Architecture unifiée
    adresse: client?.adresse || "",
    codePostal: client?.codePostal || "", // Architecture unifiée
    ville: client?.ville || "",
    status: client?.status || "enregistre",
    produit: client?.produit || "", // Architecture unifiée
    identifiantContrat: client?.identifiantContrat || "", // Architecture unifiée
    dateSignature: client?.dateSignature?.split('T')[0] || "", // Architecture unifiée
    dateRendezVous: client?.dateRendezVous?.split('T')[0] || "", // Architecture unifiée
    dateInstallation: client?.dateInstallation?.split('T')[0] || "", // Architecture unifiée
    commentaire: client?.commentaire || "",
    codeVendeur: client?.codeVendeur || "", // Architecture unifiée
    source: client?.source || "prospection",
    // Champs pour le forfait 5G
    portabilite: client?.portabilite || "",
    carteSim: client?.carteSim || "", // Architecture unifiée
    numeroPorter: client?.numeroPorter || "", // Architecture unifiée
    // Champs pour les documents
    contratSigne: client?.contratSigne || false,
    identiteValidee: client?.identiteValidee || false,
    ribValide: client?.ribValide || false,
    justificatif_domicile: client?.justificatif_domicile || false,
    mandat_sepa: client?.mandat_sepa || false,
  });

  const [suggestions, setSuggestions] = useState<Array<{code: string, nom: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-complétion des villes basée sur le code postal
  useEffect(() => {
    if (formData.codePostal && formData.codePostal.length >= 2) {
      fetch(`https://geo.api.gouv.fr/communes?codePostal=${formData.codePostal}&fields=nom,code,codesPostaux`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            const communes = data.map(commune => ({
              code: commune.code,
              nom: commune.nom
            }));
            setSuggestions(communes);
            setShowSuggestions(communes.length > 0);
          }
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des communes:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.codePostal]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Architecture unifiée - Pas de mapping ! Les noms sont identiques à PostgreSQL
      const updatePayload = {
        civilite: data.civilite,
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone, // Architecture unifiée
        dateNaissance: data.dateNaissance, // Architecture unifiée
        adresse: data.adresse,
        codePostal: data.codePostal, // Architecture unifiée
        ville: data.ville,
        status: data.status,
        produit: data.produit, // Architecture unifiée
        identifiantContrat: data.identifiantContrat || "", // Architecture unifiée
        commentaire: data.commentaire,
        source: data.source,
        // Champs pour le forfait 5G
        portabilite: data.portabilite,
        carteSim: data.carteSim, // Architecture unifiée
        numeroPorter: data.numeroPorter, // Architecture unifiée
      };

      
      const response = await apiRequest("PUT", `/api/clients/${client.id}`, updatePayload);
      return response.json();
    },
    onSuccess: () => {
      // Invalider tous les caches clients
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/my-clients'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/cards-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/detailed'] });
      
      // Afficher le message de félicitations si le contrat est validé
      if (formData.status === "valide") {
        setShowCongratulations(true);
      } else {
        toast({
          title: "Succès",
          description: "Client modifié avec succès",
        });
      }
      
      onSuccess();
      if (onClose && formData.status !== "valide") {
        onClose();
      }
      
      // Recharger la page pour forcer la synchronisation (uniquement si pas de félicitations)
      if (formData.status !== "valide") {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du client",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informations personnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informations personnelles</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Civilité</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={formData.civilite}
              onChange={(e) => handleChange("civilite", e.target.value)}
            >
              <option value="">Sélectionner une civilité</option>
              <option value="mr">M.</option>
              <option value="mme">Mme</option>
              <option value="mlle">Mlle</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-lg"
                value={formData.prenom}
                onChange={(e) => handleChange("prenom", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-lg"
                value={formData.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <input 
              type="date"
              className="w-full p-2 border rounded-lg"
              value={formData.dateNaissance}
              onChange={(e) => handleChange("dateNaissance", e.target.value)}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              className="w-full p-2 border rounded-lg"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input 
              type="tel"
              className="w-full p-2 border rounded-lg"
              value={formData.telephone}
              onChange={(e) => handleChange("telephone", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input 
              type="text"
              className="w-full p-2 border rounded-lg"
              value={formData.adresse}
              onChange={(e) => handleChange("adresse", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-lg"
                value={formData.codePostal}
                onChange={(e) => handleChange("codePostal", e.target.value)}
                placeholder="75001"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-lg"
                value={formData.ville}
                onChange={(e) => handleChange("ville", e.target.value)}
                placeholder="Paris"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleChange("ville", suggestion.nom);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion.nom}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Forfait et statut */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Forfait</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              required
            >
              <option value="enregistre">Enregistré</option>
              <option value="validation">Validation</option>
              <option value="rendezvous">Rendez-vous</option>
              <option value="installation">Installation</option>
              <option value="complete">Terminé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={formData.produit}
              onChange={(e) => handleChange("produit", e.target.value)}
            >
              <option value="">Sélectionner un forfait</option>
              <option value="ultra">Freebox Ultra</option>
              <option value="essentiel">Freebox Essentiel</option>
              <option value="pop">Freebox Pop</option>
              <option value="5g">Forfait 5G</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={formData.source}
              onChange={(e) => handleChange("source", e.target.value)}
            >
              <option value="prospection">Prospection</option>
              <option value="recommandation">Recommandation</option>
              <option value="porte_a_porte">Porte à porte</option>
              <option value="stand">Stand</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date signature</label>
            <input 
              type="date"
              className="w-full p-2 border rounded-lg"
              value={formData.dateSignature}
              onChange={(e) => handleChange("dateSignature", e.target.value)}
            />
          </div>

          {formData.status === "rendezvous" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date rendez-vous</label>
              <input 
                type="date"
                className="w-full p-2 border rounded-lg"
                value={formData.dateRendezVous}
                onChange={(e) => handleChange("dateRendezVous", e.target.value)}
              />
            </div>
          )}

          {formData.status === "installation" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date installation</label>
              <input 
                type="date"
                className="w-full p-2 border rounded-lg"
                value={formData.dateInstallation}
                onChange={(e) => handleChange("dateInstallation", e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code vendeur</label>
            <input 
              type="text"
              className="w-full p-2 border rounded-lg"
              value={formData.codeVendeur}
              onChange={(e) => handleChange("codeVendeur", e.target.value)}
            />
          </div>

          {/* Champs spécifiques au forfait 5G */}
          {formData.produit === "Forfait 5G" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portabilité</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={formData.portabilite}
                  onChange={(e) => handleChange("portabilite", e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carte SIM</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={formData.carteSim}
                  onChange={(e) => handleChange("carteSim", e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="nouvelle">Nouvelle carte SIM</option>
                  <option value="esim">eSIM</option>
                </select>
              </div>

              {formData.portabilite === "oui" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro à porter</label>
                  <input 
                    type="tel"
                    className="w-full p-2 border rounded-lg"
                    value={formData.numeroPorter}
                    onChange={(e) => handleChange("numeroPorter", e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea 
              className="w-full p-2 border rounded-lg"
              rows={3}
              value={formData.commentaire}
              onChange={(e) => handleChange("commentaire", e.target.value)}
            />
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Documents</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="contratSigne"
                className="rounded"
                checked={formData.contratSigne}
                onChange={(e) => handleChange("contratSigne", e.target.checked.toString())}
              />
              <label htmlFor="contratSigne" className="text-sm font-medium text-gray-700">
                Contrat signé
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="identiteValidee"
                className="rounded"
                checked={formData.identiteValidee}
                onChange={(e) => handleChange("identiteValidee", e.target.checked.toString())}
              />
              <label htmlFor="identiteValidee" className="text-sm font-medium text-gray-700">
                Identité validée
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ribValide"
                className="rounded"
                checked={formData.ribValide}
                onChange={(e) => handleChange("ribValide", e.target.checked.toString())}
              />
              <label htmlFor="ribValide" className="text-sm font-medium text-gray-700">
                RIB validé
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="justificatifDomicile"
                className="rounded"
                checked={formData.justificatifDomicile}
                onChange={(e) => handleChange("justificatifDomicile", e.target.checked.toString())}
              />
              <label htmlFor="justificatifDomicile" className="text-sm font-medium text-gray-700">
                Justificatif de domicile
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mandatSepa"
                className="rounded"
                checked={formData.mandatSepa}
                onChange={(e) => handleChange("mandatSepa", e.target.checked.toString())}
              />
              <label htmlFor="mandatSepa" className="text-sm font-medium text-gray-700">
                Mandat SEPA
              </label>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </button>
          <button
            type="button"
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </form>
      
      {/* Message de félicitations personnalisé */}
      {showCongratulations && (
        <ContractValidationSuccess
          clientFirstName={formData.prenom}
          onClose={() => {
            setShowCongratulations(false);
            if (onClose) {
              onClose();
            }
            // Recharger la page après fermeture du message
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
          onBackToClientList={() => {
            setShowCongratulations(false);
            if (onClose) {
              onClose();
            }
            // Naviguer vers la liste des clients
            setTimeout(() => {
              window.location.href = "/clients";
            }, 500);
          }}
        />
      )}
    </div>
  );
}