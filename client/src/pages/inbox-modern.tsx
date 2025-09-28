import { useState, useEffect } from "react";
import { 
  Mail, MailOpen, Send, Star, StarOff, Reply, Forward, Archive, Trash2, Plus,
  Search, Filter, Clock, User, AlertCircle, CheckCircle, Settings, Inbox,
  RefreshCw, Phone, Calendar, ArrowLeft, MoreVertical, Paperclip
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/page-container";
import { CompactStatCard } from "@/components/ui/compact-stat-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

export default function InboxModern() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isComposing, setIsComposing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  // Requêtes pour récupérer les données emails réelles
  const { data: emailsResponse, isLoading: emailsLoading, error: emailsError } = useQuery({
    queryKey: ['/api/emails', { direction: activeTab === 'sent' ? 'outbound' : activeTab === 'inbox' ? 'inbound' : undefined, search, status: statusFilter !== 'all' ? statusFilter : undefined }],
    staleTime: 30000
  });

  const { data: emailStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/emails/stats'],
    staleTime: 30000
  });

  const { data: emailTemplates } = useQuery({
    queryKey: ['/api/email-templates'],
    staleTime: 300000 // 5 minutes pour les templates
  });

  const emails = emailsResponse?.emails || [];
  const stats = emailStats || { total: 0, nonLus: 0, favoris: 0, important: 0, recus: 0, envoyes: 0 };

  // Données de fallback temporaires uniquement si l'API échoue
  const fallbackEmails: Email[] = [
    {
      id: 1,
      subject: "Demande d'information produit Freebox",
      fromEmail: "client@example.com",
      fromName: "Jean Martin",
      toEmail: "contact@synergie.com",
      toName: "Équipe Synergie",
      textContent: "Bonjour, je souhaiterais avoir des informations sur les offres Freebox disponibles. Pouvez-vous me rappeler?",
      isRead: false,
      isStarred: true,
      isImportant: true,
      direction: 'inbound',
      status: 'nouveau',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      dateReceived: new Date(Date.now() - 3600000).toISOString(),
      client: { id: 1, prenom: "Jean", nom: "Martin", email: "jean.martin@example.com" }
    },
    {
      id: 2,
      subject: "Confirmation de rendez-vous",
      fromEmail: "marie.dupont@gmail.com",
      fromName: "Marie Dupont",
      toEmail: "contact@synergie.com",
      textContent: "Merci pour notre échange. Je confirme notre rendez-vous de demain à 14h pour la signature du contrat.",
      isRead: true,
      isStarred: false,
      isImportant: false,
      direction: 'inbound',
      status: 'lu',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      dateReceived: new Date(Date.now() - 7200000).toISOString(),
      client: { id: 2, prenom: "Marie", nom: "Dupont", email: "marie.dupont@gmail.com" }
    },
    {
      id: 3,
      subject: "Proposition commerciale envoyée",
      fromEmail: "contact@synergie.com",
      fromName: "Équipe Synergie",
      toEmail: "pierre.durand@yahoo.fr",
      toName: "Pierre Durand",
      textContent: "Bonjour Pierre, Suite à notre conversation, veuillez trouver ci-joint notre proposition commerciale.",
      isRead: true,
      isStarred: false,
      isImportant: false,
      direction: 'outbound',
      status: 'envoyé',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      dateSent: new Date(Date.now() - 86400000).toISOString(),
      client: { id: 3, prenom: "Pierre", nom: "Durand", email: "pierre.durand@yahoo.fr" }
    },
    {
      id: 4,
      subject: "Réclamation service client",
      fromEmail: "service.client@free.fr",
      fromName: "Service Client Free",
      toEmail: "contact@synergie.com",
      textContent: "Problème technique signalé par un client. Intervention nécessaire.",
      isRead: false,
      isStarred: false,
      isImportant: true,
      direction: 'inbound',
      status: 'urgent',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      dateReceived: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  // Filtrer les emails
  const filteredEmails = mockEmails.filter(email => {
    const matchesTab = activeTab === "inbox" ? email.direction === 'inbound' : email.direction === 'outbound';
    const matchesSearch = search === "" || 
      email.subject.toLowerCase().includes(search.toLowerCase()) ||
      email.fromName?.toLowerCase().includes(search.toLowerCase()) ||
      email.fromEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "unread" && !email.isRead) ||
      (statusFilter === "starred" && email.isStarred) ||
      (statusFilter === "important" && email.isImportant);
    
    return matchesTab && matchesSearch && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: mockEmails.length,
    unread: mockEmails.filter(e => !e.isRead).length,
    starred: mockEmails.filter(e => e.isStarred).length,
    important: mockEmails.filter(e => e.isImportant).length,
    inbox: mockEmails.filter(e => e.direction === 'inbound').length,
    sent: mockEmails.filter(e => e.direction === 'outbound').length
  };

  const getStatusColor = (email: Email) => {
    if (email.isImportant) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (!email.isRead) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getStatusLabel = (email: Email) => {
    if (email.isImportant) return "Important";
    if (!email.isRead) return "Non lu";
    return "Lu";
  };

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${Math.floor(diffHours)}h`;
    if (diffHours < 48) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedEmail(null);
  };

  const handleTestConnection = () => {
    toast({
      title: "Test de connexion",
      description: "Fonctionnalité en cours de développement"
    });
  };

  const handleCompose = () => {
    setIsComposing(true);
    toast({
      title: "Nouveau message",
      description: "Fonctionnalité en cours de développement"
    });
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-safe-area-inset-bottom">
        
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                {viewMode === "detail" ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToList}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : null}
                <Mail className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Messagerie
                </h1>
                <Badge variant="outline" className="hidden sm:flex">
                  {filteredEmails.length} emails
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestConnection}
                  className="hidden sm:flex"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Tester connexion
                </Button>
                <Button 
                  onClick={handleCompose}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Nouveau message</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 pb-24 sm:pb-20">
          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            <CompactStatCard
              title="Total"
              value={stats.total}
              icon={Mail}
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Non lus"
              value={stats.unread}
              icon={MailOpen}
              color="bg-gradient-to-r from-orange-500 to-orange-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Favoris"
              value={stats.starred}
              icon={Star}
              color="bg-gradient-to-r from-yellow-500 to-yellow-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Important"
              value={stats.important}
              icon={AlertCircle}
              color="bg-gradient-to-r from-red-500 to-red-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Reçus"
              value={stats.inbox}
              icon={Inbox}
              color="bg-gradient-to-r from-green-500 to-green-600"
              textColor="text-white"
            />
            <CompactStatCard
              title="Envoyés"
              value={stats.sent}
              icon={Send}
              color="bg-gradient-to-r from-purple-500 to-purple-600"
              textColor="text-white"
            />
          </div>

          {viewMode === "list" ? (
            <>
              {/* Onglets et filtres */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <CardHeader className="pb-3">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                      <TabsTrigger value="inbox" className="flex items-center gap-2">
                        <Inbox className="w-4 h-4" />
                        <span className="hidden sm:inline">Boîte de réception</span>
                        <span className="sm:hidden">Reçus</span>
                      </TabsTrigger>
                      <TabsTrigger value="sent" className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Messages envoyés</span>
                        <span className="sm:hidden">Envoyés</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher dans les emails..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="flex-1 h-12 text-base">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filtrer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les emails</SelectItem>
                          <SelectItem value="unread">Non lus</SelectItem>
                          <SelectItem value="starred">Favoris</SelectItem>
                          <SelectItem value="important">Importants</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({ title: "Actualisation", description: "Fonctionnalité en cours de développement" })}
                        className="h-12 px-4"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des emails */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    {activeTab === "inbox" ? "Boîte de réception" : "Messages envoyés"} ({filteredEmails.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-12">
                      <MailOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Aucun email trouvé
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 mb-4">
                        {search || statusFilter !== "all" 
                          ? "Essayez de modifier vos critères de recherche." 
                          : "Votre boîte de réception est vide."}
                      </p>
                      <Button 
                        onClick={handleCompose}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau message
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => handleEmailClick(email)}
                          className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg">
                                {email.fromName ? email.fromName[0] : email.fromEmail[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-medium text-gray-900 dark:text-gray-100 truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                                    {email.fromName || email.fromEmail}
                                  </span>
                                  {email.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                                  {email.isImportant && <AlertCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-sm truncate ${!email.isRead ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {email.subject}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                                  {email.textContent}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(email)} variant="secondary">
                                    {getStatusLabel(email)}
                                  </Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {formatEmailDate(email.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast({ title: "Actions", description: "Fonctionnalité en cours de développement" });
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            /* Vue détail email */
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {selectedEmail?.fromName ? selectedEmail.fromName[0] : selectedEmail?.fromEmail[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {selectedEmail?.fromName || selectedEmail?.fromEmail}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {selectedEmail?.fromEmail}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={selectedEmail ? getStatusColor(selectedEmail) : ""}>
                          {selectedEmail ? getStatusLabel(selectedEmail) : ""}
                        </Badge>
                        {selectedEmail?.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {selectedEmail?.isImportant && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {selectedEmail?.subject}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedEmail ? formatEmailDate(selectedEmail.createdAt) : ""}
                    </span>
                    {selectedEmail?.client && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Client: {selectedEmail.client.prenom} {selectedEmail.client.nom}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-blue-200/50 dark:border-gray-600/50">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {selectedEmail?.textContent || selectedEmail?.htmlContent}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button 
                      onClick={() => toast({ title: "Répondre", description: "Fonctionnalité en cours de développement" })}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white h-12"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Répondre
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => toast({ title: "Transférer", description: "Fonctionnalité en cours de développement" })}
                      className="h-12 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Forward className="w-4 h-4 mr-2" />
                      Transférer
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => toast({ title: "Archiver", description: "Fonctionnalité en cours de développement" })}
                      className="h-12 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 inbox-action-buttons">
                    <Button 
                      variant="outline" 
                      onClick={() => toast({ title: "Marquer comme favori", description: "Fonctionnalité en cours de développement" })}
                      className="h-12 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Favori
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => toast({ title: "Supprimer", description: "Fonctionnalité en cours de développement" })}
                      className="h-12 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bouton flottant pour mobile */}
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button 
            onClick={handleCompose}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 rounded-full"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}