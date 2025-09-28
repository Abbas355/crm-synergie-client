import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Users, Calendar, ChevronDown, ChevronRight, Eye, BarChart3, Clock, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types pour les données de prospection groupées basés sur l'API existante
interface ProspectionContact {
  id: number;
  etage: string;
  numeroPorte: string;
  numeroBat?: string;
  nom?: string;
  resultatMatin?: string;
  resultatMidi?: string;
  resultatApresMidi?: string;
  resultatSoir?: string;
  rdvSignatureType?: string;
  produitSignature?: string;
  observations?: string;
  mobile?: string;
  operateurActuel?: string;
}

interface ProspectionSession {
  id: number;
  ville: string;
  adresse: string;
  codePostal: string;
  zone?: string;
  date: string;
  commercial: string;
  totalContacts: number;
  totalVisites: number;
  totalSignatures: number;
  totalRDV: number;
  totalAbsents: number;
  totalRefus: number;
  contacts?: ProspectionContact[];
  sessionTerrain?: {
    id: number;
    commercial: string;
    adresse: string;
    codeAcces?: string;
    createdAt: string;
  };
}

interface VilleGroupee {
  ville: string;
  codePostal: string;
  sessions: ProspectionSession[];
  totalContacts: number;
  totalVisites: number;
  totalSignatures: number;
  totalRdv: number;
  totalAbsents: number;
  totalRefus: number;
}

export default function ProspectionGroupeePage() {
  const [villesExpanded, setVillesExpanded] = useState<Record<string, boolean>>({});
  const [sessionsExpanded, setSessionsExpanded] = useState<Record<number, boolean>>({});

  // Récupérer les données de prospection depuis l'API existante
  const { data: sessionsData = [], isLoading } = useQuery<ProspectionSession[]>({
    queryKey: ['/api/prospection'],
    staleTime: 5 * 60 * 1000,
  });

  // Fonction pour normaliser les noms de ville
  const normalizeVille = (ville: string): string => {
    return ville.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // Grouper les sessions par ville
  const villesGroupees: VilleGroupee[] = sessionsData.reduce((acc: VilleGroupee[], session) => {
    const villeNormalisee = normalizeVille(session.ville);
    const villeExistante = acc.find(v => 
      normalizeVille(v.ville) === villeNormalisee && v.codePostal === session.codePostal
    );
    
    if (villeExistante) {
      villeExistante.sessions.push(session);
      villeExistante.totalContacts += session.totalContacts || 0;
      villeExistante.totalVisites += session.totalVisites || 0;
      villeExistante.totalSignatures += session.totalSignatures || 0;
      villeExistante.totalRdv += session.totalRDV || 0;
      villeExistante.totalAbsents += session.totalAbsents || 0;
      villeExistante.totalRefus += session.totalRefus || 0;
    } else {
      acc.push({
        ville: session.ville,
        codePostal: session.codePostal,
        sessions: [session],
        totalContacts: session.totalContacts || 0,
        totalVisites: session.totalVisites || 0,
        totalSignatures: session.totalSignatures || 0,
        totalRdv: session.totalRDV || 0,
        totalAbsents: session.totalAbsents || 0,
        totalRefus: session.totalRefus || 0,
      });
    }
    
    return acc;
  }, []);

  // Trier les sessions par ordre alphabétique des noms de rue dans chaque ville
  villesGroupees.forEach(ville => {
    ville.sessions.sort((a, b) => {
      const adresseA = a.adresse || '';
      const adresseB = b.adresse || '';
      return adresseA.localeCompare(adresseB, 'fr', { sensitivity: 'accent' });
    });
  });

  // Trier les villes par nombre total de contacts (décroissant)
  villesGroupees.sort((a, b) => b.totalContacts - a.totalContacts);

  const toggleVille = (ville: string) => {
    setVillesExpanded(prev => ({
      ...prev,
      [ville]: !prev[ville]
    }));
  };

  const toggleSession = (sessionId: number) => {
    setSessionsExpanded(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Fonctions utilitaires pour les statuts - version unifiée

  const getStatutColor = (statut: string): string => {
    const colors: Record<string, string> = {
      'absent': 'bg-gray-100 text-gray-800',
      'personne_agee': 'bg-orange-100 text-orange-800',
      'pas_interesse': 'bg-red-100 text-red-800',
      'refus_ouvrir': 'bg-red-200 text-red-900',
      'va_demenager': 'bg-yellow-100 text-yellow-800',
      'a_revoir': 'bg-blue-100 text-blue-800',
      'argumentation': 'bg-purple-100 text-purple-800',
      'veux_reflechir': 'bg-indigo-100 text-indigo-800',
      'voir_mr': 'bg-cyan-100 text-cyan-800',
      'voir_mme': 'bg-pink-100 text-pink-800',
      'voir_parents': 'bg-emerald-100 text-emerald-800',
      'signature': 'bg-green-100 text-green-800',
      'rdv': 'bg-blue-100 text-blue-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut: string): string => {
    const labels: Record<string, string> = {
      'absent': 'Absent',
      'personne_agee': 'Personne Âgée',
      'pas_interesse': 'Pas intéressé',
      'refus_ouvrir': 'Refus d\'ouvrir',
      'va_demenager': 'Va déménager',
      'a_revoir': 'À revoir',
      'argumentation': 'Argumentation',
      'veux_reflechir': 'Veut réfléchir',
      'voir_mr': 'Voir Monsieur',
      'voir_mme': 'Voir Madame',
      'voir_parents': 'Voir les parents',
      'signature': 'Signature',
      'rdv': 'Rendez-vous'
    };
    return labels[statut] || statut;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des données de prospection...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-3 space-y-4">
        {/* En-tête moderne et compact pour mobile */}
        <div className="relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl"></div>
          
          <div className="relative p-4 md:p-6">
            {/* Section titre et actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="text-center md:text-left space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Prospection Terrain
                </h1>
                <p className="text-gray-600 text-sm md:text-lg">Sessions organisées par ville</p>
              </div>
              
              {/* Indicateur de sessions */}
              <div className="flex items-center justify-center md:justify-end">
                <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-full px-4 py-2 shadow-md">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {villesGroupees.reduce((total, ville) => total + ville.sessions.length, 0)} session{villesGroupees.reduce((total, ville) => total + ville.sessions.length, 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Icônes décoratives - masquées sur mobile très petit */}
            <div className="hidden sm:flex justify-center items-center gap-3 text-blue-500/30">
              <MapPin className="h-5 w-5" />
              <div className="w-8 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300"></div>
              <BarChart3 className="h-5 w-5" />
              <div className="w-8 h-0.5 bg-gradient-to-r from-purple-300 to-indigo-300"></div>
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Actions rapides - Version compacte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => window.location.href = '/prospection-terrain?mode=create'}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 group-hover:from-green-600 group-hover:to-emerald-700 transition-all duration-200"></div>
            <CardContent className="relative p-3 text-center text-white">
              <div className="flex items-center justify-center gap-2">
                <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <div className="font-semibold text-base">Créer une Session</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => window.location.href = '/prospection-terrain'}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-200"></div>
            <CardContent className="relative p-3 text-center text-white">
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <div className="font-semibold text-base">Gérer Sessions</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques globales compactes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
            <CardContent className="relative p-3 md:p-4 text-center text-white">
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {villesGroupees.length}
              </div>
              <div className="text-blue-100 text-xs md:text-sm font-medium">Villes prospectées</div>
              <MapPin className="absolute bottom-1 right-1 h-5 w-5 md:h-6 md:w-6 text-blue-200/30" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600"></div>
            <CardContent className="relative p-3 md:p-4 text-center text-white">
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {sessionsData.reduce((sum, session) => sum + (session.totalContacts || 0), 0)}
              </div>
              <div className="text-emerald-100 text-xs md:text-sm font-medium">Contacts totaux</div>
              <Users className="absolute bottom-1 right-1 h-5 w-5 md:h-6 md:w-6 text-emerald-200/30" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600"></div>
            <CardContent className="relative p-3 md:p-4 text-center text-white">
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {sessionsData.reduce((sum, session) => sum + (session.totalSignatures || 0), 0)}
              </div>
              <div className="text-purple-100 text-xs md:text-sm font-medium">Signatures</div>
              <Edit3 className="absolute bottom-1 right-1 h-5 w-5 md:h-6 md:w-6 text-purple-200/30" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600"></div>
            <CardContent className="relative p-3 md:p-4 text-center text-white">
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {sessionsData.reduce((sum, session) => sum + (session.totalRDV || 0), 0)}
              </div>
              <div className="text-orange-100 text-xs md:text-sm font-medium">Rendez-vous</div>
              <Calendar className="absolute bottom-1 right-1 h-5 w-5 md:h-6 md:w-6 text-orange-200/30" />
            </CardContent>
          </Card>
        </div>

        {/* Liste des villes groupées - Design compact */}
        <div className="space-y-3">
          {villesGroupees.map((ville) => (
            <Card key={`${ville.ville}-${ville.codePostal}`} className="overflow-hidden border-0 shadow-md bg-white/90 backdrop-blur-sm">
              <Collapsible 
                open={villesExpanded[`${ville.ville}-${ville.codePostal}`]} 
                onOpenChange={() => toggleVille(`${ville.ville}-${ville.codePostal}`)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 border-l-4 border-l-blue-500 p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            {villesExpanded[`${ville.ville}-${ville.codePostal}`] ? (
                              <ChevronDown className="h-4 w-4 text-blue-600 transition-transform duration-200" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-blue-600 transition-transform duration-200" />
                            )}
                          </div>
                          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            {ville.ville}
                          </CardTitle>
                          <CardDescription className="text-gray-600 font-medium text-sm">
                            {ville.codePostal} • {ville.sessions.length} session{ville.sessions.length > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 flex-wrap">
                        {ville.totalSignatures > 0 && (
                          <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm text-xs px-2 py-1">
                            {ville.totalSignatures} signature{ville.totalSignatures > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {ville.totalRdv > 0 && (
                          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm text-xs px-2 py-1">
                            {ville.totalRdv} RDV
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 shadow-sm text-xs px-2 py-1">
                          {ville.totalContacts} contact{ville.totalContacts > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 px-3 md:px-4 pb-3 md:pb-4">
                    <div className="space-y-3">
                      {ville.sessions.map((session) => {
                        const isSessionExpanded = sessionsExpanded[session.id];
                        
                        return (
                          <Card key={session.id} className="border-0 shadow-sm bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all duration-300">
                            <CardHeader className="pb-3 px-3 py-3">
                              {/* ADRESSE COMPLÈTE - Compact */}
                              <div className="flex items-start gap-2 mb-3">
                                <div className="p-1.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-sm">
                                  <MapPin className="h-3 w-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-800 text-sm leading-tight">{session.adresse}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {session.zone && (
                                      <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-medium">
                                        {session.zone}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-600 font-medium">
                                      {session.date ? format(new Date(session.date), 'dd/MM/yyyy', { locale: fr }) : 'Date non disponible'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* STATISTIQUES COMPACTES */}
                              <div className="grid grid-cols-4 gap-2 mb-3">
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2 text-center border border-emerald-100">
                                  <div className="text-emerald-600 font-bold text-base">{session.totalVisites || 0}</div>
                                  <div className="text-xs text-emerald-700 font-medium">Visites</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-2 text-center border border-purple-100">
                                  <div className="text-purple-600 font-bold text-base">{session.totalSignatures || 0}</div>
                                  <div className="text-xs text-purple-700 font-medium">Sign.</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2 text-center border border-orange-100">
                                  <div className="text-orange-600 font-bold text-base">{session.totalRDV || 0}</div>
                                  <div className="text-xs text-orange-700 font-medium">RDV</div>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-2 text-center border border-gray-200">
                                  <div className="text-gray-600 font-bold text-base">{session.totalAbsents || 0}</div>
                                  <div className="text-xs text-gray-700 font-medium">Abs.</div>
                                </div>
                              </div>

                              {/* BOUTONS D'ACTION - Compacts */}
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleSession(session.id)}
                                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 h-8 font-medium shadow-sm text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  <span>Détails</span>
                                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${isSessionExpanded ? 'rotate-180' : ''}`} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.href = `/prospection-terrain`}
                                  className="w-full sm:flex-1 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-emerald-200 text-emerald-700 h-8 font-medium shadow-sm text-xs"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  <span>Éditer</span>
                                </Button>
                              </div>
                            </CardHeader>

                            {/* DÉTAILS COMPLETS - CONDITIONNELS */}
                            <Collapsible open={isSessionExpanded}>
                              <CollapsibleContent>
                                <CardContent className="pt-0 px-3">
                                  <div className="space-y-4">
                                    {/* Informations commerciales */}
                                    <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                                      <Users className="h-3 w-3 inline mr-1" />
                                      <span className="font-medium">Commercial: </span>
                                      {session.commercial || 'Non renseigné'}
                                    </div>

                                    {/* Contacts prospectés - informations détaillées */}
                                    {session.contacts && session.contacts.length > 0 ? (
                                      <div className="space-y-3">
                                        <div className="text-sm font-medium text-gray-700 mb-3">
                                          Contacts prospectés ({session.contacts.length}) :
                                        </div>
                                        <div className="space-y-2">
                                          {session.contacts
                                            .slice() // Copie pour éviter de modifier l'original
                                            .sort((a, b) => {
                                              // ✅ TRI PRIORITAIRE: Par bâtiment (alphabétique/numérique croissant) si renseigné
                                              if (a.numeroBat && b.numeroBat) {
                                                // Tri alphanumérique intelligent (A < B, 1 < 2, A1 < A2, etc.)
                                                const batA = a.numeroBat.toString().toLowerCase();
                                                const batB = b.numeroBat.toString().toLowerCase();
                                                const comparison = batA.localeCompare(batB, 'fr', { numeric: true, sensitivity: 'base' });
                                                if (comparison !== 0) return comparison;
                                              }
                                              
                                              // Si un seul a un bâtiment, celui avec bâtiment vient en premier
                                              if (a.numeroBat && !b.numeroBat) return -1;
                                              if (!a.numeroBat && b.numeroBat) return 1;
                                              
                                              // ✅ TRI SECONDAIRE: Par étage (numérique croissant) si bâtiments identiques ou vides
                                              const etageA = parseInt(a.etage?.toString() || '0', 10);
                                              const etageB = parseInt(b.etage?.toString() || '0', 10);
                                              if (etageA !== etageB) return etageA - etageB;
                                              
                                              // ✅ TRI TERTIAIRE: Par numéro de porte si étages identiques
                                              const porteA = a.numeroPorte?.toString().toLowerCase() || '';
                                              const porteB = b.numeroPorte?.toString().toLowerCase() || '';
                                              return porteA.localeCompare(porteB, 'fr', { numeric: true, sensitivity: 'base' });
                                            })
                                            .map((contact) => (
                                            <div key={contact.id} className="p-3 bg-gray-50 rounded-lg border">
                                              <div className="flex flex-col space-y-2">
                                                {/* Adresse du contact */}
                                                <div className="flex items-center justify-between">
                                                  <div className="font-medium text-sm">
                                                    {contact.numeroBat && `Bât. ${contact.numeroBat}, `}
                                                    Étage {contact.etage}, Porte {contact.numeroPorte}
                                                  </div>
                                                  {contact.nom && (
                                                    <div className="text-sm text-gray-600 font-medium">{contact.nom}</div>
                                                  )}
                                                </div>
                                                
                                                {/* Résultats de prospection par période */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                  {contact.resultatMatin && contact.resultatMatin !== 'vide' && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Matin:</span>
                                                      <Badge className={getStatutColor(contact.resultatMatin)} variant="outline">
                                                        {getStatutLabel(contact.resultatMatin)}
                                                      </Badge>
                                                    </div>
                                                  )}
                                                  {contact.resultatMidi && contact.resultatMidi !== 'vide' && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Midi:</span>
                                                      <Badge className={getStatutColor(contact.resultatMidi)} variant="outline">
                                                        {getStatutLabel(contact.resultatMidi)}
                                                      </Badge>
                                                    </div>
                                                  )}
                                                  {contact.resultatApresMidi && contact.resultatApresMidi !== 'vide' && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Après-midi:</span>
                                                      <Badge className={getStatutColor(contact.resultatApresMidi)} variant="outline">
                                                        {getStatutLabel(contact.resultatApresMidi)}
                                                      </Badge>
                                                    </div>
                                                  )}
                                                  {contact.resultatSoir && contact.resultatSoir !== 'vide' && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-gray-500">Soir:</span>
                                                      <Badge className={getStatutColor(contact.resultatSoir)} variant="outline">
                                                        {getStatutLabel(contact.resultatSoir)}
                                                      </Badge>
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {/* RDV/Signature et produit */}
                                                {(contact.rdvSignatureType || contact.produitSignature) && (
                                                  <div className="flex flex-wrap gap-2 text-xs">
                                                    {contact.rdvSignatureType && (
                                                      <Badge className="bg-blue-100 text-blue-800">
                                                        {contact.rdvSignatureType}
                                                      </Badge>
                                                    )}
                                                    {contact.produitSignature && (
                                                      <Badge className="bg-green-100 text-green-800">
                                                        {contact.produitSignature}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                )}
                                                
                                                {/* Contact et opérateur */}
                                                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                                                  {contact.mobile && (
                                                    <span>📱 {contact.mobile}</span>
                                                  )}
                                                  {contact.operateurActuel && contact.operateurActuel !== 'none' && (
                                                    <span>📡 Opérateur: {contact.operateurActuel}</span>
                                                  )}
                                                </div>
                                                
                                                {/* Observations */}
                                                {contact.observations && (
                                                  <div className="text-xs text-gray-700 bg-white p-2 rounded border-l-2 border-blue-200">
                                                    <span className="font-medium">Observations:</span> {contact.observations}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-gray-500 text-sm">
                                        Aucun contact enregistré pour cette session
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {villesGroupees.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune session de prospection</h3>
              <p className="text-gray-600">Commencez par créer une session de prospection terrain.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}