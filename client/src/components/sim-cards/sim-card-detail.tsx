import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Phone, MapPin } from "lucide-react";

interface SimCardDetailProps {
  simCard: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SimCardDetail({ simCard, onEdit, onDelete }: SimCardDetailProps) {
  if (!simCard) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Carte SIM {simCard.numero}</span>
          <Badge variant={simCard.statut === 'disponible' ? 'default' : 'secondary'}>
            {simCard.statut}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {simCard.client && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{simCard.client.prenom} {simCard.client.nom}</span>
          </div>
        )}
        
        {simCard.dateAttribution && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Attribuée le {new Date(simCard.dateAttribution).toLocaleDateString()}</span>
          </div>
        )}

        {simCard.note && (
          <div className="text-sm text-muted-foreground">
            <strong>Note:</strong> {simCard.note}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}