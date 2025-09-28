import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Reply, 
  Forward, 
  Star, 
  Send, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Search,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { PageContainer } from "@/components/ui/page-container";

// Types
interface Email {
  id: number;
  subject: string;
  fromName?: string;
  fromEmail: string;
  toName?: string;
  toEmail: string;
  textContent?: string;
  htmlContent?: string;
  createdAt: string;
  isRead: boolean;
  isStarred: boolean;
  direction: 'inbound' | 'outbound';
  images?: string[]; // NOUVEAU : champ pour les images extraites
}

interface ComposeData {
  to: string;
  subject: string;
  content: string;
}

export default function InboxMobileOptimized() {
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState<ComposeData>({
    to: '',
    subject: '',
    content: ''
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: emailsResponse, isLoading: emailsLoading, error: emailsError } = useQuery({
    queryKey: ['/api/emails'],
    staleTime: 30000,
    gcTime: 60000,
  });

  // Extraire les emails du format de réponse
  const emails = (emailsResponse as any)?.emails || [];

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      apiRequest('PUT', `/api/emails/${id}`, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
  });

  const markStarredMutation = useMutation({
    mutationFn: ({ id, isStarred }: { id: number; isStarred: boolean }) =>
      apiRequest('PUT', `/api/emails/${id}`, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (emailData: ComposeData) =>
      apiRequest('POST', '/api/emails/send', emailData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      setIsComposing(false);
      setComposeData({ to: '', subject: '', content: '' });
    },
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const filteredEmails = (emails || []).filter((email: Email) =>
    email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.fromEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Email content display
  if (emailsLoading) {
    return (
      <div className="min-h-screen pb-20 sm:pb-6">
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Chargement des emails...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (emailsError) {
    return (
      <div className="min-h-screen pb-20 sm:pb-6">
        <PageContainer>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de connexion</h3>
            <p className="text-muted-foreground mb-4">
              Impossible de charger les emails. Vérifiez votre connexion.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Vue détaillée d'un email - SOLUTION ROBUSTE
  if (viewMode === "detail" && selectedEmail) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
        {/* HEADER TOUJOURS VISIBLE - POSITION FIXE EN HAUT */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 shadow-lg flex-shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setViewMode("list");
                setSelectedEmail(null);
              }}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base">
              {selectedEmail.fromName?.charAt(0)?.toUpperCase() || selectedEmail.fromEmail?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white mb-0.5 leading-tight">
                {selectedEmail.subject || "Sans sujet"}
              </h2>
              <p className="text-sm text-blue-100 font-medium">
                {selectedEmail.fromName || selectedEmail.fromEmail}
              </p>
              <p className="text-xs text-blue-200">
                {selectedEmail.fromEmail} • {formatDate(selectedEmail.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENU SCROLLABLE */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white mx-2 my-2 rounded-lg shadow-sm border flex-1 overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-y-auto" id="email-scroll-container" style={{ padding: 0 }}>
              <div 
                className="w-full"
                style={{ 
                  width: '100%',
                  maxWidth: '100%',
                  margin: 0,
                  padding: 0,
                  overflowX: 'hidden',
                  boxSizing: 'border-box'
                }}
                dangerouslySetInnerHTML={{
                  __html: selectedEmail.htmlContent || `<p style="text-align: center; padding: 20px;">${selectedEmail.textContent || 'Aucun contenu disponible'}</p>`
                }}
              />
              
              {/* Bouton de scroll vers le bas */}
              <div className="flex justify-center pt-4 pb-2">
                <button
                  onClick={() => {
                    const container = document.getElementById('email-scroll-container');
                    if (container) {
                      container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-all duration-300 shadow-sm border border-blue-200"
                >
                  ↓ Voir la fin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action - FIXES EN BAS */}
        <div className="bg-white border-t p-4 flex gap-2 flex-shrink-0">
          <Button 
            onClick={() => {
              setIsComposing(true);
              setComposeData({
                to: selectedEmail.direction === 'inbound' ? selectedEmail.fromEmail : selectedEmail.toEmail,
                subject: `Re: ${selectedEmail.subject}`,
                content: `\n\n--- Email original ---\nDe: ${selectedEmail.fromName || selectedEmail.fromEmail}\nDate: ${formatDate(selectedEmail.createdAt)}\nSujet: ${selectedEmail.subject}\n\n${selectedEmail.textContent || selectedEmail.htmlContent?.replace(/<[^>]*>/g, '') || ''}`
              });
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2"
            size="sm"
          >
            <Reply className="h-4 w-4 mr-2" />
            Répondre
          </Button>
          <Button 
            onClick={() => {
              setIsComposing(true);
              setComposeData({
                to: '',
                subject: `Fwd: ${selectedEmail.subject}`,
                content: `\n\n--- Message transféré ---\nDe: ${selectedEmail.fromName || selectedEmail.fromEmail}\nDate: ${formatDate(selectedEmail.createdAt)}\nSujet: ${selectedEmail.subject}\n\n${selectedEmail.textContent || selectedEmail.htmlContent?.replace(/<[^>]*>/g, '') || ''}`
              });
            }}
            variant="outline"
            className="flex-1 py-2"
            size="sm"
          >
            <Forward className="h-4 w-4 mr-2" />
            Transférer
          </Button>
        </div>
      </div>
    );
  }

  // Vue liste des emails
  return (
    <div className="min-h-screen pb-20 sm:pb-6">
      <PageContainer>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messagerie</h1>
          <Button 
            onClick={() => setIsComposing(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher dans les emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des emails */}
        <div className="space-y-2">
          {filteredEmails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun email trouvé</p>
            </div>
          ) : (
            filteredEmails.map((email: Email) => (
              <Card 
                key={email.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !email.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={async () => {
                  if (!email.isRead) {
                    await markReadMutation.mutateAsync({ id: email.id, isRead: true });
                  }
                  setSelectedEmail(email);
                  setViewMode("detail");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {email.fromName?.charAt(0)?.toUpperCase() || email.fromEmail?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${!email.isRead ? 'font-bold text-blue-900' : ''}`}>
                          {email.fromName || email.fromEmail}
                        </h3>
                        <div className="flex items-center gap-2">
                          {email.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          <span className="text-xs text-gray-500">{formatDate(email.createdAt)}</span>
                        </div>
                      </div>
                      <p className={`text-sm truncate mb-1 ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {email.subject || "Sans sujet"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {email.textContent?.substring(0, 100) || email.htmlContent?.replace(/<[^>]*>/g, '')?.substring(0, 100) || ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </PageContainer>

      {/* Dialog de composition d'email */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Nouveau message</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-2">À</label>
                <Input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  placeholder="destinataire@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <Input
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Objet du message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={composeData.content}
                  onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                  placeholder="Votre message..."
                  rows={6}
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button
                onClick={() => {
                  setIsComposing(false);
                  setComposeData({ to: '', subject: '', content: '' });
                }}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => sendEmailMutation.mutate(composeData)}
                disabled={sendEmailMutation.isPending || !composeData.to || !composeData.subject || !composeData.content}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}