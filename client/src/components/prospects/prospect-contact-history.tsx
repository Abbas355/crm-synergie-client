import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Phone, Mail, MessageSquare, Users, RotateCcw, Calendar, Target, CheckSquare } from "lucide-react";

interface ContactHistoryItem {
  date: string;
  type: "appel" | "email" | "sms" | "rencontre" | "relance";
  commentaire: string;
  resultat: "positif" | "neutre" | "negatif";
  prochainContact?: string;
  objectif?: string;
  actionsAPrev?: string;
}

interface ProspectContactHistoryProps {
  prospectId: number;
  historiqueContacts: ContactHistoryItem[];
  onAddContact: (contact: ContactHistoryItem) => void;
  readOnly?: boolean;
}

const contactTypeIcons = {
  appel: Phone,
  email: Mail,
  sms: MessageSquare,
  rencontre: Users,
  relance: RotateCcw,
};

const contactTypeLabels = {
  appel: "Appel téléphonique",
  email: "Email",
  sms: "SMS",
  rencontre: "Rencontre physique",
  relance: "Relance",
};

const resultatColors = {
  positif: "bg-green-100 text-green-800 border-green-200",
  neutre: "bg-yellow-100 text-yellow-800 border-yellow-200",
  negatif: "bg-red-100 text-red-800 border-red-200",
};

const resultatLabels = {
  positif: "✅ Positif",
  neutre: "⚪ Neutre",
  negatif: "❌ Négatif",
};

export function ProspectContactHistory({ 
  prospectId, 
  historiqueContacts, 
  onAddContact, 
  readOnly = false 
}: ProspectContactHistoryProps) {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<ContactHistoryItem>>({
    type: "appel",
    resultat: "neutre",
    date: new Date().toISOString(),
  });

  const handleAddContact = () => {
    if (newContact.notes) {
      onAddContact({
        date: new Date().toISOString(),
        type: newContact.type as ContactHistoryItem["type"],
        commentaire: newContact.commentaire,
        resultat: newContact.resultat as ContactHistoryItem["resultat"],
        prochainContact: newContact.prochainContact,
        objectif: newContact.objectif,
        actionsAPrev: newContact.actionsAPrev,
      });
      
      setNewContact({
        type: "appel",
        resultat: "neutre",
        date: new Date().toISOString(),
      });
      setIsAddingContact(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historique des contacts</h3>
        {!readOnly && (
          <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau contact</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de contact</Label>
                    <Select
                      value={newContact.type}
                      onValueChange={(value) => setNewContact({ ...newContact, type: value as ContactHistoryItem["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appel">📞 Appel téléphonique</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="sms">💬 SMS</SelectItem>
                        <SelectItem value="rencontre">🤝 Rencontre physique</SelectItem>
                        <SelectItem value="relance">🔄 Relance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Résultat du contact</Label>
                    <Select
                      value={newContact.resultat}
                      onValueChange={(value) => setNewContact({ ...newContact, resultat: value as ContactHistoryItem["resultat"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positif">✅ Positif - Intéressé</SelectItem>
                        <SelectItem value="neutre">⚪ Neutre - À recontacter</SelectItem>
                        <SelectItem value="negatif">❌ Négatif - Pas intéressé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes détaillées</Label>
                  <Textarea
                    value={newContact.notes || ""}
                    onChange={(e) => setNewContact({ ...newContact, commentaire: e.target.value })}
                    placeholder="Décrivez l'échange, les points abordés, les objections..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prochain contact prévu</Label>
                    <Input
                      type="datetime-local"
                      value={newContact.prochainContact || ""}
                      onChange={(e) => setNewContact({ ...newContact, prochainContact: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Objectif du prochain contact</Label>
                    <Input
                      value={newContact.objectif || ""}
                      onChange={(e) => setNewContact({ ...newContact, objectif: e.target.value })}
                      placeholder="Ex: Présenter l'offre..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Actions à prévoir</Label>
                  <Textarea
                    value={newContact.actionsAPrev || ""}
                    onChange={(e) => setNewContact({ ...newContact, actionsAPrev: e.target.value })}
                    placeholder="Ex: Envoyer documentation, programmer demo..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingContact(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddContact}
                    disabled={!newContact.notes}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    Ajouter le contact
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Affichage de l'historique */}
      <div className="space-y-3">
        {historiqueContacts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center p-8 text-gray-500">
              <div className="text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun contact enregistré</p>
                <p className="text-sm">Commencez par ajouter un premier contact</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          historiqueContacts
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((contact, index) => {
              const IconComponent = contactTypeIcons[contact.type];
              
              return (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{contactTypeLabels[contact.type]}</span>
                        <Badge variant="outline" className={resultatColors[contact.resultat]}>
                          {resultatLabels[contact.resultat]}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(contact.date).toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Notes du contact :</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{contact.notes}</p>
                    </div>

                    {contact.prochainContact && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span>Prochain contact :</span>
                        <span className="font-medium">
                          {new Date(contact.prochainContact).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {contact.objectif && (
                      <div className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <span>Objectif :</span>
                          <span className="ml-1 text-gray-700">{contact.objectif}</span>
                        </div>
                      </div>
                    )}

                    {contact.actionsAPrev && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <span>Actions à prévoir :</span>
                          <p className="text-gray-700 bg-orange-50 p-2 rounded mt-1">
                            {contact.actionsAPrev}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}