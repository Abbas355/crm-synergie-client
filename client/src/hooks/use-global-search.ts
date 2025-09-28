import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  id: number;
  name: string;
  prenom: string;
  nom: string;
  civilite: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  produit: string;
  identifiantContrat: string;
  carteSim: string;
  portabilite: string;
  numeroPorter: string;
  source: string;
  commentaire: string;
  status: string;
  dateSignature: string;
  dateRendezVous: string;
  dateInstallation: string;
  codeVendeur: string;
  userid: number;
  createdAt: string;
}

export function useGlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Débouncer la recherche pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query pour la recherche globale
  const { data: searchResults, isLoading: isSearching, error } = useQuery<SearchResult[]>({
    queryKey: ['/api/clients/search-global', debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache pendant 30 secondes
  });

  // Résultats enrichis avec mise en évidence
  const enrichedResults = useMemo(() => {
    if (!searchResults || !debouncedQuery) return [];

    return searchResults.map(result => ({
      ...result,
      // Marquer les champs qui correspondent à la recherche
      matchedFields: getMatchedFields(result, debouncedQuery),
    }));
  }, [searchResults, debouncedQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults: enrichedResults,
    isSearching,
    hasQuery: debouncedQuery.length >= 2,
    clearSearch,
    error,
  };
}

// Fonction pour identifier les champs qui correspondent à la recherche
function getMatchedFields(result: SearchResult, query: string): string[] {
  const fields = [];
  const lowerQuery = query.toLowerCase();

  if (result.prenom?.toLowerCase().includes(lowerQuery)) fields.push('prenom');
  if (result.nom?.toLowerCase().includes(lowerQuery)) fields.push('nom');
  if (result.email?.toLowerCase().includes(lowerQuery)) fields.push('email');
  if (result.telephone?.includes(query)) fields.push('telephone');
  if (result.ville?.toLowerCase().includes(lowerQuery)) fields.push('ville');
  if (result.codePostal?.includes(query)) fields.push('codePostal');
  if (result.produit?.toLowerCase().includes(lowerQuery)) fields.push('produit');
  if (result.identifiantContrat?.toLowerCase().includes(lowerQuery)) fields.push('identifiantContrat');
  if (result.carteSim?.includes(query)) fields.push('carteSim');
  if (result.adresse?.toLowerCase().includes(lowerQuery)) fields.push('adresse');
  if (result.commentaire?.toLowerCase().includes(lowerQuery)) fields.push('commentaire');
  if (result.source?.toLowerCase().includes(lowerQuery)) fields.push('source');
  if (result.status?.toLowerCase().includes(lowerQuery)) fields.push('status');
  if (result.codeVendeur?.toLowerCase().includes(lowerQuery)) fields.push('codeVendeur');
  if (result.numeroPorter?.includes(query)) fields.push('numeroPorter');

  return fields;
}