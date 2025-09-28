import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";

interface VendorDetailModalProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function VendorDetailModal({ vendor, isOpen, onClose, onEdit }: VendorDetailModalProps) {
  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {vendor.prenom} {vendor.nom}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {vendor.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.email}</span>
            </div>
          )}
          
          {vendor.telephone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.telephone}</span>
            </div>
          )}
          
          {vendor.ville && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.ville}</span>
            </div>
          )}
          
          {vendor.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Inscrit le {new Date(vendor.createdAt).toLocaleDateString()}</span>
            </div>
          )}

          {vendor.motivation && (
            <div>
              <h4 className="font-medium mb-2">Motivation</h4>
              <p className="text-sm text-muted-foreground">{vendor.motivation}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {onEdit && (
              <Button onClick={onEdit}>
                Modifier
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}