import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Inbox, 
  Mail, 
  MailOpen, 
  Send, 
  Star, 
  StarOff, 
  Reply, 
  Forward, 
  Archive, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Settings
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Email {
  id: number;
  subject: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  toName?: string;
  htmlContent?: string;
  textContent?: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  direction: 'inbound' | 'outbound';
  status: string;
  clientId?: number;
  dateReceived?: string;
  dateSent?: string;
  dateRead?: string;
  createdAt: string;
  client?: {
    id: number;
    prenom?: string;
    nom?: string;
    email?: string;
  };
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  category?: string;
}

export default function InboxPage() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    content: "",
    templateId: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des emails de la boîte de réception
  const { data: inboxEmails = [], isLoading: loadingInbox } = useQuery({
    queryKey: ['/api/emails/inbox'],
    enabled: activeTab === 'inbox'
  });

  // Récupération des emails envoyés
  const { data: sentEmails = [], isLoading: loadingSent } = useQuery({
    queryKey: ['/api/emails/sent'],
    enabled: activeTab === 'sent'
  });

  // Récupération des templates
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates']
  });

  // Mutation pour marquer comme lu
  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const response = await fetch(`/api/emails/${emailId}/read`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Erreur lors du marquage comme lu');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    }
  });

  // Mutation pour basculer l'étoile
  const toggleStarMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const response = await fetch(`/api/emails/${emailId}/star`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Erreur lors du marquage étoile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    }
  });

  // Mutation pour envoyer un email
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Réponse serveur invalide');
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi');
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Votre message a été envoyé avec succès"
      });
      setIsComposing(false);
      setComposeData({ to: "", subject: "", content: "", templateId: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead && email.direction === 'inbound') {
      markAsReadMutation.mutate(email.id);
    }
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir au moins le destinataire et le sujet",
        variant: "destructive"
      });
      return;
    }

    const emailData = {
      to: composeData.to,
      subject: composeData.subject,
      htmlContent: composeData.content,
      textContent: composeData.content,
      ...(composeData.templateId && { templateId: parseInt(composeData.templateId) })
    };

    sendEmailMutation.mutate(emailData);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setComposeData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.textContent || template.htmlContent || "",
        templateId
      }));
    }
  };

  const getCurrentEmails = () => {
    const emails = activeTab === 'inbox' ? inboxEmails : sentEmails;
    return emails.filter((email: Email) => {
      const matchesSearch = !searchQuery || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (email.fromName && email.fromName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unread' && !email.isRead) ||
        (statusFilter === 'starred' && email.isStarred) ||
        (statusFilter === 'important' && email.isImportant);

      return matchesSearch && matchesStatus;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Messagerie</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              fetch('/api/emails/test-connection')
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    toast({
                      title: "Connexion réussie",
                      description: "Le serveur email Hostinger est opérationnel"
                    });
                  } else {
                    toast({
                      title: "Erreur de connexion",
                      description: "Impossible de se connecter au serveur email",
                      variant: "destructive"
                    });
                  }
                })
                .catch(() => {
                  toast({
                    title: "Erreur de test",
                    description: "Erreur lors du test de connexion",
                    variant: "destructive"
                  });
                });
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Tester connexion
          </Button>
          <Dialog open={isComposing} onOpenChange={setIsComposing}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Destinataire</label>
                    <Input
                      value={composeData.to}
                      onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Template</label>
                    <Select value={composeData.templateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Sujet</label>
                  <Input
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Sujet du message"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={composeData.content}
                    onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Votre message..."
                    rows={8}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsComposing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                    {sendEmailMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les emails</SelectItem>
            <SelectItem value="unread">Non lus</SelectItem>
            <SelectItem value="starred">Favoris</SelectItem>
            <SelectItem value="important">Importants</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interface principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des emails */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">
                <Inbox className="h-4 w-4 mr-2" />
                Reçus
              </TabsTrigger>
              <TabsTrigger value="sent">
                <Send className="h-4 w-4 mr-2" />
                Envoyés
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inbox" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Boîte de réception</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingInbox ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Chargement des emails...
                    </div>
                  ) : getCurrentEmails().length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Aucun email</p>
                      <p className="text-sm">Votre boîte de réception est vide.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getCurrentEmails().map((email: Email) => (
                        <div
                          key={email.id}
                          className={`p-4 hover:bg-muted cursor-pointer transition-colors ${
                            selectedEmail?.id === email.id ? 'bg-muted' : ''
                          } ${!email.isRead ? 'bg-blue-50' : ''}`}
                          onClick={() => handleEmailClick(email)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {!email.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                                <span className={`text-sm font-medium truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                                  {email.fromName || email.fromEmail}
                                </span>
                                {email.isStarred && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <p className={`text-sm truncate mb-1 ${!email.isRead ? 'font-semibold' : ''}`}>
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {email.textContent?.substring(0, 100)}...
                              </p>
                              {email.client && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {email.client.prenom} {email.client.nom}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground ml-2">
                              {formatDate(email.dateReceived || email.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sent" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Messages envoyés</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingSent ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Chargement des emails...
                    </div>
                  ) : getCurrentEmails().length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Aucun email envoyé</p>
                      <p className="text-sm">Vous n'avez encore envoyé aucun message.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getCurrentEmails().map((email: Email) => (
                        <div
                          key={email.id}
                          className={`p-4 hover:bg-muted cursor-pointer transition-colors ${
                            selectedEmail?.id === email.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleEmailClick(email)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium truncate">
                                  À: {email.toName || email.toEmail}
                                </span>
                                {email.isStarred && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                )}
                                <Badge variant={email.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                                  {email.status === 'delivered' ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Livré
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      {email.status}
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium truncate mb-1">
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {email.textContent?.substring(0, 100)}...
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground ml-2">
                              {formatDate(email.dateSent || email.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Contenu de l'email sélectionné */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                      {selectedEmail.isImportant && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Important
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>De:</strong> {selectedEmail.fromName || selectedEmail.fromEmail}
                      </p>
                      <p>
                        <strong>À:</strong> {selectedEmail.toName || selectedEmail.toEmail}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(selectedEmail.dateReceived || selectedEmail.dateSent || selectedEmail.createdAt).toLocaleString('fr-FR')}
                      </p>
                      {selectedEmail.client && (
                        <p>
                          <strong>Client:</strong> {selectedEmail.client.prenom} {selectedEmail.client.nom}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStarMutation.mutate(selectedEmail.id)}
                    >
                      {selectedEmail.isStarred ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {selectedEmail.htmlContent ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{selectedEmail.textContent}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un email</h3>
                <p>Choisissez un email dans la liste pour le lire ici.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}