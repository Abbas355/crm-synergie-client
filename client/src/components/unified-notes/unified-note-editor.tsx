/**
 * ÉDITEUR DE NOTES UNIFIÉES
 * 
 * Composant central pour éditer les notes/commentaires clients
 * utilisable dans toutes les sections de l'application.
 * 
 * Principe "Single Source of Truth" :
 * ✅ Une seule interface pour toutes les notes
 * ✅ Synchronisation automatique temps réel
 * ✅ Indicateurs visuels de synchronisation
 * ✅ Utilisable dans : clients, tâches, cartes SIM
 */

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RefreshCw, MessageSquare, Zap, CheckCircle2 } from "lucide-react";
import { useUnifiedNotes } from "@/hooks/useUnifiedNotes";
import { cn } from "@/lib/utils";

interface UnifiedNoteEditorProps {
  clientId: number | null | undefined;
  title?: string;
  placeholder?: string;
  className?: string;
  showMetadata?: boolean;
  autoHeight?: boolean;
  compactMode?: boolean;
}

export function UnifiedNoteEditor({
  clientId,
  title = "Note/Commentaire Client",
  placeholder = "Ajoutez une note ou commentaire pour ce client...",
  className,
  showMetadata = true,
  autoHeight = false,
  compactMode = false,
}: UnifiedNoteEditorProps) {
  const [localContent, setLocalContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  
  const {
    content,
    isLoading,
    isError,
    updateNote,
    isUpdating,
    sources,
    lastUpdated,
    updatedBy,
    clientName,
  } = useUnifiedNotes(clientId);

  // Synchroniser le contenu local avec le contenu distant
  useEffect(() => {
    if (content !== undefined) {
      setLocalContent(content);
      setHasChanges(false);
    }
  }, [content]);

  // Détecter les changements
  useEffect(() => {
    setHasChanges(localContent !== (content || ""));
  }, [localContent, content]);

  const handleSave = async () => {
    if (!clientId || !hasChanges) return;
    
    try {
      await updateNote(localContent);
      setHasChanges(false);
    } catch (error) {
      console.error("Erreur sauvegarde note:", error);
    }
  };

  const handleDiscard = () => {
    setLocalContent(content || "");
    setHasChanges(false);
  };

  if (!clientId) {
    return (
      <Card className={cn("border-dashed border-gray-300", className)}>
        <CardContent className="p-6 text-center text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p>Sélectionnez un client pour afficher ses notes</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardContent className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-3" />
          <p className="text-gray-600">Récupération de la note client...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-6 text-center text-red-700">
          <p>Erreur lors du chargement de la note</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-200", {
      "border-blue-200 shadow-md": hasChanges,
      "border-green-200 bg-green-50/30": !hasChanges && content,
    }, className)}>
      {!compactMode && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>{title}</span>
              {clientName && (
                <Badge variant="outline" className="text-xs">
                  {clientName}
                </Badge>
              )}
            </div>
            
            {/* Indicateurs de synchronisation */}
            <div className="flex items-center gap-2">
              {sources?.hasClientComment && (
                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Synchronisé
                </Badge>
              )}
              
              {hasChanges && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                  Non sauvegardé
                </Badge>
              )}
              
              {!hasChanges && content && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sauvegardé
                </Badge>
              )}
            </div>
          </CardTitle>
          
          {/* Métadonnées */}
          {showMetadata && sources && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span>Sources actives:</span>
              {sources.hasClientComment && <Badge variant="outline">Client</Badge>}
              {sources.hasTaskDescription && <Badge variant="outline">{sources.taskIds.length} Tâches</Badge>}
              {sources.hasSimCardNote && <Badge variant="outline">{sources.simCardIds.length} Cartes SIM</Badge>}
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className={compactMode ? "p-3" : "space-y-4"}>
        {/* Zone d'édition */}
        <div className="space-y-3">
          <Textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "resize-none transition-all duration-200",
              autoHeight ? "min-h-[60px]" : "min-h-[120px]",
              hasChanges ? "border-blue-300 focus:border-blue-500" : "border-gray-200"
            )}
            disabled={isUpdating}
          />
          
          {/* Indicateur de changements non sauvegardés */}
          {hasChanges && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
              ⚠️ Vous avez des modifications non sauvegardées
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        {hasChanges && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={isUpdating}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isUpdating || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Sauvegarder
            </Button>
          </div>
        )}
        
        {/* Métadonnées de dernière mise à jour */}
        {showMetadata && lastUpdated && !compactMode && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Dernière modification: {new Date(lastUpdated).toLocaleString('fr-FR')}
            {updatedBy && ` par ${updatedBy}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Version compacte pour utilisation dans les modales ou espaces restreints
 */
export function CompactUnifiedNoteEditor(props: Omit<UnifiedNoteEditorProps, 'compactMode'>) {
  return <UnifiedNoteEditor {...props} compactMode={true} showMetadata={false} autoHeight={true} />;
}