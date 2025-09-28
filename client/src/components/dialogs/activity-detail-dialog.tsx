import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Package,
  ArrowRight,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Type pour les activités
type Activity = {
  id: number;
  title: string;
  description?: string;
  type: string;
  createdAt: string;
  user: string;
  clientName?: string;
  campaignName?: string;
  clientId?: number;
  taskId?: number;
  timestamp?: string;
};

interface ActivityDetailDialogProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityDetailDialog({ activity, isOpen, onClose }: ActivityDetailDialogProps) {
  if (!activity) return null;

  // Format date using date-fns
  const date = new Date(activity.createdAt || activity.timestamp || new Date());
  const timeAgo = isNaN(date.getTime()) 
    ? "Date invalide" 
    : formatDistanceToNow(date, { addSuffix: true, locale: fr });
  
  const formattedDate = isNaN(date.getTime()) 
    ? "Date invalide" 
    : date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  // Icône basée sur le type d'activité
  const getActivityIcon = () => {
    switch(activity.type) {
      case "client":
        return <User className="h-5 w-5 text-blue-600" />;
      case "contrat":
        return <FileText className="h-5 w-5 text-green-600" />;
      case "rendez-vous":
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case "installation":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "campagne":
        return <Mail className="h-5 w-5 text-purple-600" />;
      case "tache":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  // Couleur du badge basée sur le type
  const getTypeBadge = () => {
    switch(activity.type) {
      case "client":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Nouveau Client</Badge>;
      case "contrat":
        return <Badge className="bg-green-500 hover:bg-green-600">Contrat</Badge>;
      case "rendez-vous":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Rendez-vous</Badge>;
      case "installation":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Installation</Badge>;
      case "campagne":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Campagne</Badge>;
      case "tache":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Tâche</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Activité</Badge>;
    }
  };

  // Détails supplémentaires basés sur le type
  const getAdditionalDetails = () => {
    switch(activity.type) {
      case "client":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Client: {activity.clientName || "Non spécifié"}</span>
            </div>
            {activity.clientId && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>ID Client: #{activity.clientId}</span>
              </div>
            )}
          </div>
        );
      case "contrat":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Client: {activity.clientName || "Non spécifié"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Statut: Contrat signé</span>
            </div>
          </div>
        );
      case "rendez-vous":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Client: {activity.clientName || "Non spécifié"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Type: Rendez-vous planifié</span>
            </div>
          </div>
        );
      case "installation":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Client: {activity.clientName || "Non spécifié"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>Statut: Installation réalisée</span>
            </div>
          </div>
        );
      case "tache":
        return (
          <div className="space-y-3">
            {activity.taskId && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>ID Tâche: #{activity.taskId}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Type: Tâche assignée</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            Activité générale du système
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header avec gradient */}
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 p-6 -m-6 mb-4">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    {getActivityIcon()}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-white">
                      Détails de l'activité
                    </DialogTitle>
                    <DialogDescription className="text-white/80 text-sm">
                      Informations complètes sur cette activité
                    </DialogDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="space-y-6">
          {/* Badge et titre */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {getTypeBadge()}
              <div className="text-xs text-gray-500">
                ID: #{activity.id}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activity.title}
            </h3>
            {activity.description && (
              <p className="text-sm text-gray-600">
                {activity.description}
              </p>
            )}
          </div>

          <Separator />

          {/* Informations temporelles */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Informations temporelles
            </h4>
            <div className="grid grid-cols-1 gap-3 pl-6">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Date complète:</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Il y a:</span>
                <span className="font-medium">{timeAgo}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Utilisateur responsable */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Utilisateur responsable
            </h4>
            <div className="pl-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{activity.user}</div>
                  <div className="text-xs text-gray-500">Vendeur/Administrateur</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Détails spécifiques au type */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Détails spécifiques
            </h4>
            <div className="pl-6">
              {getAdditionalDetails()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Fermer
            </Button>
            {(activity.type === "client" && activity.clientId) && (
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => {
                  window.location.href = `/clients?scrollTo=table`;
                  onClose();
                }}
              >
                Voir le client
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {(activity.type === "tache" && activity.taskId) && (
              <Button 
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                onClick={() => {
                  window.location.href = `/tasks/${activity.taskId}`;
                  onClose();
                }}
              >
                Voir la tâche
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}