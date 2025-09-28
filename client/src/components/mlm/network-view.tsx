import { Users } from "lucide-react";

interface Member {
  id: number;
  prenom: string;
  nom: string;
  codeVendeur: string;
  niveau: number;
  date_recrutement: string;
  actif: boolean;
  parent_id?: number | null;
  depth?: number;
}

interface NetworkViewProps {
  network: Member[];
  distributeurId: number;
  distributeurCode: string;
  distributeurNiveau: number;
}

export function NetworkView({ network, distributeurId, distributeurCode, distributeurNiveau }: NetworkViewProps) {
  // Vérifier si network est un tableau
  if (!Array.isArray(network)) {
    return (
      <div className="text-center py-6">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">Erreur de chargement des données</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Impossible de charger les données du réseau. Veuillez réessayer.
        </p>
      </div>
    );
  }

  // Filtrer pour obtenir les membres directs (premier niveau)
  const directMembers = network.filter(m => m.id !== distributeurId && m.parent_id === distributeurId);
  // Calculer les stats de base
  const totalMembers = network.filter(m => m.id !== distributeurId).length;
  const activeMembers = network.filter(m => m.id !== distributeurId && m.actif).length;
  
  if (network.length <= 1) {
    return (
      <div className="text-center py-6">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">Aucun distributeur dans votre réseau</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Commencez à développer votre réseau en recrutant des vendeurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques - version optimisée pour mobile */}
      <div className="grid grid-cols-3 gap-2 bg-muted/50 p-3 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Réseau total</div>
          <div className="text-lg font-bold">{totalMembers}</div>
          <div className="text-xs text-muted-foreground">membres</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Actifs</div>
          <div className="text-lg font-bold">{activeMembers}</div>
          <div className="text-xs text-muted-foreground">vendeurs</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Directs</div>
          <div className="text-lg font-bold">{directMembers.length}</div>
          <div className="text-xs text-muted-foreground">distributeurs</div>
        </div>
      </div>

      {/* Structure visuelle du réseau - optimisée pour mobile */}
      <div className="mb-4">
        {/* Version mobile (simplifiée) */}
        <div className="md:hidden">
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 border border-primary/20 rounded-md p-2 mb-3 w-full max-w-[250px] text-center">
              <div className="font-medium">Vous</div>
              <div className="text-xs text-muted-foreground">Niveau {distributeurNiveau}</div>
              <div className="text-xs font-mono mt-1">{distributeurCode}</div>
            </div>
            
            {directMembers.length > 0 ? (
              <>
                <div className="w-px h-6 bg-border"></div>
                <div className="grid grid-cols-1 gap-3 w-full mt-3">
                  {directMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="bg-accent/50 border border-border rounded-md p-2 w-full max-w-[250px] text-center mx-auto">
                      <div className="font-medium text-sm">{member.prenom} {member.nom}</div>
                      <div className="text-xs font-mono">{member.codeVendeur}</div>
                      <div className="text-xs mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          member.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {directMembers.length > 4 && (
                    <div className="bg-muted border border-border rounded-md p-2 w-full max-w-[250px] text-center mx-auto">
                      <div className="text-sm font-medium">+{directMembers.length - 4} autres distributeurs</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground mt-3">
                Vous n'avez pas encore de distributeurs directs
              </div>
            )}
          </div>
        </div>
        
        {/* Version desktop (graphique complet) */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[600px] py-4">
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-6 w-56 text-center">
                <div className="font-medium">Vous</div>
                <div className="text-xs text-muted-foreground">Niveau {distributeurNiveau}</div>
                <div className="text-xs font-mono mt-1">{distributeurCode}</div>
              </div>
              
              {directMembers.length > 0 && (
                <>
                  <div className="w-px h-8 bg-border"></div>
                  <div className="relative w-full">
                    <div className="absolute left-1/2 top-0 w-full h-px bg-border -translate-x-1/2"></div>
                    <div className="flex justify-center gap-6 pt-8 flex-wrap">
                      {directMembers.slice(0, 4).map((member) => (
                        <div key={member.id} className="flex flex-col items-center mb-6">
                          <div className="bg-accent/50 border border-border rounded-md p-2 mb-2 w-44 text-center">
                            <div className="font-medium">{member.prenom} {member.nom}</div>
                            <div className="text-xs font-mono">{member.codeVendeur}</div>
                            <div className="text-xs text-muted-foreground">Niveau {member.niveau}</div>
                            <div className="mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                member.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {member.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Sous-réseau (niveau 2) */}
                          {(() => {
                            const subMembers = network.filter(m => m.parent_id === member.id);
                            if (subMembers.length > 0) {
                              return (
                                <>
                                  <div className="w-px h-6 bg-border"></div>
                                  <div className="relative w-full">
                                    <div className="absolute left-1/2 top-0 w-full h-px bg-border -translate-x-1/2"></div>
                                    <div className="flex justify-center gap-2 pt-6 flex-wrap">
                                      {subMembers.slice(0, 3).map((subMember) => (
                                        <div key={subMember.id} className="bg-accent/30 border border-border rounded-md p-1 w-32 text-center mb-2">
                                          <div className="text-sm font-medium">{subMember.prenom} {subMember.nom}</div>
                                          <div className="text-xs text-muted-foreground">Niveau {subMember.niveau}</div>
                                        </div>
                                      ))}
                                      {subMembers.length > 3 && (
                                        <div className="bg-muted border border-border rounded-md p-1 w-24 text-center">
                                          <div className="text-sm">+{subMembers.length - 3} autres</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ))}
                      
                      {directMembers.length > 4 && (
                        <div className="bg-muted border border-border rounded-md p-2 w-36 text-center self-start mt-8">
                          <div className="text-sm font-medium">+{directMembers.length - 4} autres</div>
                          <div className="text-xs text-muted-foreground">distributeurs</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau détaillé des membres */}
      <div className="overflow-x-auto">
        <div className="text-sm font-medium mb-2">Liste détaillée de votre réseau</div>
        
        {/* Version desktop */}
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 text-sm font-medium">Distributeur</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Code vendeur</th>
                <th className="text-center py-2 px-4 text-sm font-medium">Niveau</th>
                <th className="text-center py-2 px-4 text-sm font-medium">Relation</th>
                <th className="text-center py-2 px-4 text-sm font-medium">Équipe</th>
                <th className="text-left py-2 px-4 text-sm font-medium">Date inscription</th>
                <th className="text-center py-2 px-4 text-sm font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {network.filter(m => m.id !== distributeurId).map((member) => {
                const subTeamCount = network.filter(m => m.parent_id === member.id).length;
                return (
                  <tr key={member.id} className="border-b border-border hover:bg-accent/10">
                    <td className="py-2 px-4 text-sm">
                      {member.prenom} {member.nom}
                    </td>
                    <td className="py-2 px-4 text-sm font-mono">
                      {member.codeVendeur}
                    </td>
                    <td className="py-2 px-4 text-sm text-center">
                      {member.niveau}
                    </td>
                    <td className="py-2 px-4 text-sm text-center">
                      {member.parent_id === distributeurId ? (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">Direct</span>
                      ) : (
                        <span className="bg-accent/30 px-2 py-0.5 rounded text-xs">Indirect</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm text-center">
                      {subTeamCount}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {new Date(member.date_recrutement).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Version mobile */}
        <div className="md:hidden">
          <div className="grid gap-3">
            {network.filter(m => m.id !== distributeurId).map((member) => {
              const subTeamCount = network.filter(m => m.parent_id === member.id).length;
              return (
                <div key={member.id} className="border rounded-md p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{member.prenom} {member.nom}</div>
                      <div className="text-xs text-muted-foreground">{member.codeVendeur}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.actif ? 'Actif' : 'Inactif'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${member.parent_id === distributeurId ? 'bg-primary/10 text-primary' : 'bg-accent/30'}`}>
                        {member.parent_id === distributeurId ? 'Direct' : 'Indirect'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <div>Niveau {member.niveau}</div>
                    <div>Équipe: {subTeamCount}</div>
                    <div>{new Date(member.date_recrutement).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}