import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  AlertCircle,
  Save,
  Globe,
  Clock,
  User,
  Settings,
  Palette,
  ArrowLeft,
  Plus,
  Edit,
  Copy,
  Trash2,
  TestTube
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SmgLogo } from "@/components/ui/smg-logo";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  siret: string;
  website: string;
  ibanDebiteur: string;
  ibanCrediteur: string;
}

interface UserSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newClientNotifications: boolean;
  taskReminders: boolean;
  commissionAlerts: boolean;
  systemUpdates: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  signature: string;
  isActive: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  isActive: boolean;
  variables: string[];
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // États pour les paramètres
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
    email: "",
    siret: "",
    website: "",
    ibanDebiteur: "",
    ibanCrediteur: ""
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    language: "",
    timezone: "",
    dateFormat: "",
    theme: ""
  });

  // Charger les paramètres existants depuis l'API
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings/general'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: false,
    pushNotifications: false,
    smsNotifications: false,
    newClientNotifications: false,
    taskReminders: false,
    commissionAlerts: false,
    systemUpdates: false
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
    replyTo: "",
    signature: "",
    isActive: false
  });

  // Mettre à jour les états locaux quand les données arrivent
  useEffect(() => {
    if (settingsData && typeof settingsData === 'object') {
      const data = settingsData as any;
      if (data.company) {
        setCompanySettings(data.company);
      }
      if (data.user) {
        setUserSettings(data.user);
      }
      if (data.notifications) {
        setNotificationSettings(data.notifications);
      }
      if (data.email) {
        setEmailSettings(data.email);
      }
    }
  }, [settingsData]);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Confirmation de signature',
      subject: 'Confirmation de votre signature - {CLIENT_NAME}',
      body: 'Bonjour {CLIENT_NAME},\n\nNous avons bien reçu votre signature pour le contrat {CONTRACT_ID}.\n\nVotre dossier est maintenant en cours de traitement.\n\nCordialement,\n{SENDER_NAME}',
      category: 'Confirmations',
      isActive: true,
      variables: ['CLIENT_NAME', 'CONTRACT_ID', 'SENDER_NAME']
    },
    {
      id: '2',
      name: 'Rappel de rendez-vous',
      subject: 'Rappel : Rendez-vous prévu le {DATE}',
      body: 'Bonjour {CLIENT_NAME},\n\nNous vous rappelons votre rendez-vous prévu le {DATE} à {TIME}.\n\nAdresse : {ADDRESS}\n\nEn cas d\'empêchement, merci de nous contacter.\n\nCordialement,\n{SENDER_NAME}',
      category: 'Rappels',
      isActive: true,
      variables: ['CLIENT_NAME', 'DATE', 'TIME', 'ADDRESS', 'SENDER_NAME']
    },
    {
      id: '3',
      name: 'Installation programmée',
      subject: 'Installation programmée - {CLIENT_NAME}',
      body: 'Bonjour {CLIENT_NAME},\n\nVotre installation est programmée le {DATE} à {TIME}.\n\nUn technicien se rendra à votre domicile à l\'adresse suivante :\n{ADDRESS}\n\nMerci d\'être présent.\n\nCordialement,\n{SENDER_NAME}',
      category: 'Installations',
      isActive: true,
      variables: ['CLIENT_NAME', 'DATE', 'TIME', 'ADDRESS', 'SENDER_NAME']
    },
    {
      id: '4',
      name: 'Suivi post-installation',
      subject: 'Suivi de votre installation - {CLIENT_NAME}',
      body: 'Bonjour {CLIENT_NAME},\n\nVotre installation a été réalisée avec succès.\n\nNous espérons que tout fonctionne correctement.\n\nPour toute question, n\'hésitez pas à nous contacter.\n\nCordialement,\n{SENDER_NAME}',
      category: 'Suivi',
      isActive: true,
      variables: ['CLIENT_NAME', 'SENDER_NAME']
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Fonction pour faire défiler vers l'éditeur
  const scrollToEditor = () => {
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };



  // Récupérer le logo actuel
  const { data: logoData, isLoading: isLoadingLogo } = useQuery<string>({
    queryKey: ["/api/settings/logo"],
    queryFn: async () => {
      console.log("Récupération du logo...");
      const response = await fetch("/api/settings/logo", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du logo");
      }
      const data = await response.json();
      console.log("Logo récupéré:", data);
      // L'endpoint renvoie {logoUrl: "..."} donc on récupère logoUrl
      return data.logoUrl || null;
    }
  });



  // Fonction pour télécharger le logo (fetch direct)
  const uploadLogo = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Erreur serveur: ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Logo mis à jour",
        description: "Le logo a été téléchargé avec succès.",
      });
      
      // Actualiser le logo affiché
      queryClient.invalidateQueries({ queryKey: ["/api/settings/logo"] });
      setLogoFile(null);
      setPreviewUrl(null);
      
      // Forcer le rechargement du logo
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings/logo"] });
      }, 500);
      
      return data;
    } catch (error) {
      console.error("Erreur upload logo:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du téléchargement du logo.",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Supprimer la mutation React Query - utiliser fetch direct

  // Gérer la sélection du fichier logo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setLogoFile(null);
      setPreviewUrl(null);
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner une image JPEG, PNG ou SVG.",
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille ne doit pas dépasser 2 MB.",
      });
      return;
    }
    
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (logoFile) {
      try {
        await uploadLogo(logoFile);
      } catch (error) {
        // Erreur déjà gérée dans uploadLogo
      }
    }
  };

  // Mutations pour la sauvegarde avec TanStack Query
  const saveSettingsMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      const response = await apiRequest('POST', '/api/settings/general', { type, data });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const typeNames: { [key: string]: string } = {
        company: "d'entreprise",
        user: "utilisateur", 
        notifications: "de notification",
        email: "email"
      };
      
      toast({
        title: `Paramètres ${typeNames[variables.type] || variables.type} sauvegardés`,
        description: "La configuration a été mise à jour avec succès.",
      });
      
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['/api/settings/general'] });
    },
    onError: (error, variables) => {
      const typeNames: { [key: string]: string } = {
        company: "d'entreprise",
        user: "utilisateur",
        notifications: "de notification", 
        email: "email"
      };
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de sauvegarder les paramètres ${typeNames[variables.type] || variables.type}.`,
      });
    }
  });

  // Fonctions de sauvegarde simplifiées
  const handleSaveCompanySettings = () => {
    saveSettingsMutation.mutate({ type: 'company', data: companySettings });
  };

  const handleSaveUserSettings = () => {
    saveSettingsMutation.mutate({ type: 'user', data: userSettings });
  };

  const handleSaveNotificationSettings = () => {
    saveSettingsMutation.mutate({ type: 'notifications', data: notificationSettings });
  };

  const handleSaveEmailSettings = () => {
    saveSettingsMutation.mutate({ type: 'email', data: emailSettings });
  };

  const handleTestEmailConnection = async () => {
    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Test de connexion réussi",
          description: "La configuration email fonctionne correctement.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de test');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Échec du test",
        description: error instanceof Error ? error.message : "Impossible de tester la connexion email.",
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 pb-24">
        <div className="container mx-auto max-w-6xl">
          {/* Header avec bouton retour et titre optimisé mobile */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-4 sm:p-8 mb-8">
            {/* Bouton retour mobile en haut */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="p-3 rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Bouton retour desktop */}
              <div className="hidden sm:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="px-4 py-2 mr-2 rounded-xl hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 font-semibold"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </Button>
              </div>

              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Paramètres
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Configurez les paramètres généraux de l'application</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 h-auto p-1 sm:p-2 bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl">
              <TabsTrigger 
                value="general" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 rounded-lg bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-gray-700 hover:bg-white/80 transition-all"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Général</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 rounded-lg bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-gray-700 hover:bg-white/80 transition-all"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Email</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email-templates" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 rounded-lg bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-gray-700 hover:bg-white/80 transition-all"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Types</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 rounded-lg bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-gray-700 hover:bg-white/80 transition-all"
              >
                <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Style</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 rounded-lg bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-gray-700 hover:bg-white/80 transition-all"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Notifs</span>
              </TabsTrigger>
            </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-6">
            {/* Informations de l'entreprise */}
            <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Informations de l'entreprise</CardTitle>
                    <CardDescription className="text-sm">
                      Configurez les informations de votre entreprise pour les documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Nom de l'entreprise
                    </Label>
                    <Input
                      id="company-name"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                      placeholder="Nom de votre entreprise"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siret" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="w-4 h-4 text-blue-600" />
                      SIRET
                    </Label>
                    <Input
                      id="siret"
                      value={companySettings.siret}
                      onChange={(e) => setCompanySettings({...companySettings, siret: e.target.value})}
                      placeholder="Numéro SIRET"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                    placeholder="Adresse complète"
                    className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Ville
                    </Label>
                    <Input
                      id="city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({...companySettings, city: e.target.value})}
                      placeholder="Ville"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal-code" className="text-sm font-medium">Code postal</Label>
                    <Input
                      id="postal-code"
                      value={companySettings.postalCode}
                      onChange={(e) => setCompanySettings({...companySettings, postalCode: e.target.value})}
                      placeholder="Code postal"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Pays
                    </Label>
                    <Input
                      id="country"
                      value={companySettings.country}
                      onChange={(e) => setCompanySettings({...companySettings, country: e.target.value})}
                      placeholder="Pays"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                      placeholder="Numéro de téléphone"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                      placeholder="Email de contact"
                      className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Site web
                  </Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                    placeholder="www.votresite.fr"
                  />
                </div>

                {/* Section IBAN pour les transactions bancaires */}
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informations Bancaires SEPA</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="iban-debiteur" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        IBAN Débiteur
                      </Label>
                      <Input
                        id="iban-debiteur"
                        value={companySettings.ibanDebiteur}
                        onChange={(e) => setCompanySettings({...companySettings, ibanDebiteur: e.target.value})}
                        placeholder="FR76 3000 4000 0100 0012 3400"
                        className="font-mono"
                      />
                      <p className="text-sm text-gray-500">
                        IBAN du compte débiteur pour les virements SEPA
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="iban-crediteur" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        IBAN Créditeur
                      </Label>
                      <Input
                        id="iban-crediteur"
                        value={companySettings.ibanCrediteur}
                        onChange={(e) => setCompanySettings({...companySettings, ibanCrediteur: e.target.value})}
                        placeholder="FR76 1000 2000 0300 0004 5600"
                        className="font-mono"
                      />
                      <p className="text-sm text-gray-500">
                        IBAN du compte créditeur pour les virements SEPA
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveCompanySettings}
                    disabled={saveSettingsMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Préférences utilisateur */}
            <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle>Préférences utilisateur</CardTitle>
                    <CardDescription>
                      Personnalisez votre expérience utilisateur
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Select value={userSettings.language} onValueChange={(value) => setUserSettings({...userSettings, language: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fuseau horaire
                    </Label>
                    <Select value={userSettings.timezone} onValueChange={(value) => setUserSettings({...userSettings, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fuseau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Format de date</Label>
                    <Select value={userSettings.dateFormat} onValueChange={(value) => setUserSettings({...userSettings, dateFormat: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Format de date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Thème</Label>
                    <Select value={userSettings.theme} onValueChange={(value) => setUserSettings({...userSettings, theme: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="system">Système</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveUserSettings}
                    disabled={saveSettingsMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Email */}
          <TabsContent value="email" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Configuration Email</CardTitle>
                    <CardDescription className="text-sm">
                      Configurez les paramètres SMTP pour l'envoi d'emails depuis l'application
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Configuration SMTP</AlertTitle>
                  <AlertDescription>
                    Ces paramètres sont nécessaires pour envoyer des emails depuis l'application (notifications, documents, etc.)
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {/* Configuration serveur SMTP */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Serveur SMTP</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host" className="text-sm font-medium">Serveur SMTP</Label>
                        <Input
                          id="smtp-host"
                          value={emailSettings.smtpHost}
                          onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                          placeholder="smtp.gmail.com"
                          className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port" className="text-sm font-medium">Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value) || 587})}
                          placeholder="587"
                          className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtp-secure"
                        checked={emailSettings.smtpSecure}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, smtpSecure: checked})}
                      />
                      <Label htmlFor="smtp-secure">Connexion sécurisée (SSL/TLS)</Label>
                    </div>
                  </div>

                  {/* Authentification */}
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Authentification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-user">Nom d'utilisateur</Label>
                        <Input
                          id="smtp-user"
                          value={emailSettings.smtpUser}
                          onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                          placeholder="votre-email@domaine.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">Mot de passe</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          value={emailSettings.smtpPassword}
                          onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Paramètres émetteur */}
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Paramètres émetteur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-email">Adresse email émettrice</Label>
                        <Input
                          id="from-email"
                          value={emailSettings.fromEmail}
                          onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                          placeholder="noreply@votre-domaine.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="from-name">Nom émetteur</Label>
                        <Input
                          id="from-name"
                          value={emailSettings.fromName}
                          onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                          placeholder="Synergie Marketing Group"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reply-to">Adresse de réponse</Label>
                      <Input
                        id="reply-to"
                        value={emailSettings.replyTo}
                        onChange={(e) => setEmailSettings({...emailSettings, replyTo: e.target.value})}
                        placeholder="contact@votre-domaine.com"
                      />
                    </div>
                  </div>

                  {/* Signature */}
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Signature email</h3>
                    <div className="space-y-2">
                      <Label htmlFor="signature">Signature par défaut</Label>
                      <Textarea
                        id="signature"
                        value={emailSettings.signature}
                        onChange={(e) => setEmailSettings({...emailSettings, signature: e.target.value})}
                        placeholder="Cordialement,&#10;L'équipe Synergie Marketing Group&#10;&#10;📧 contact@synergiemarketingroup.fr&#10;📱 +33 1 23 45 67 89"
                        rows={6}
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-active"
                      checked={emailSettings.isActive}
                      onCheckedChange={(checked) => setEmailSettings({...emailSettings, isActive: checked})}
                    />
                    <Label htmlFor="email-active">Activer l'envoi d'emails</Label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button 
                    onClick={handleTestEmailConnection}
                    variant="outline"
                    className="border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 text-blue-600 h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold order-2 sm:order-1"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Tester la connexion
                  </Button>
                  <Button 
                    onClick={handleSaveEmailSettings}
                    disabled={saveSettingsMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold order-1 sm:order-2"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Emails types */}
          <TabsContent value="email-templates" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg text-gray-800">Modèles d'emails</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-600">
                      Configurez vos modèles d'emails pour automatiser vos communications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Bouton créer nouveau modèle */}
                  <div className="flex justify-center sm:justify-end">
                    <Button 
                      onClick={() => {
                        setSelectedTemplate({
                          id: '',
                          name: '',
                          subject: '',
                          body: '',
                          category: 'Général',
                          isActive: true,
                          variables: []
                        });
                        setIsEditingTemplate(true);
                        scrollToEditor();
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-10 sm:h-12 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Nouveau modèle</span>
                    </Button>
                  </div>

                  {/* Liste des modèles */}
                  <div className="space-y-3">
                    {emailTemplates.map((template) => (
                      <Card key={template.id} className="bg-white/80 backdrop-blur-sm border-white/40 shadow-lg">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{template.name}</h3>
                                <div className="flex gap-2 flex-wrap">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                                    {template.category}
                                  </span>
                                  {template.isActive && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                                      Actif
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{template.subject}</p>
                              <div className="text-xs text-gray-500 line-clamp-1">
                                Variables: {template.variables.join(', ')}
                              </div>
                            </div>
                            <div className="flex gap-1 sm:gap-2 flex-shrink-0 self-start">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setIsEditingTemplate(true);
                                  scrollToEditor();
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newTemplate = {...template, id: Date.now().toString()};
                                  setEmailTemplates([...emailTemplates, newTemplate]);
                                  setSelectedTemplate(newTemplate);
                                  setIsEditingTemplate(true);
                                  scrollToEditor();
                                  toast({
                                    title: "Modèle dupliqué",
                                    description: "Le modèle a été copié avec succès",
                                  });
                                }}
                                className="h-8 w-8 p-0 hover:bg-gray-50"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEmailTemplates(emailTemplates.filter(t => t.id !== template.id));
                                  toast({
                                    title: "Modèle supprimé",
                                    description: "Le modèle a été supprimé définitivement",
                                  });
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Éditeur de modèle */}
                  {isEditingTemplate && selectedTemplate && (
                    <Card ref={editorRef} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-blue-800 text-lg sm:text-xl">
                          {selectedTemplate.id ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                        <div className="space-y-3 sm:space-y-4 email-template-editor">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="template-name" className="text-sm font-medium">Nom du modèle</Label>
                              <Input
                                id="template-name"
                                value={selectedTemplate.name}
                                onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                                placeholder="Ex: Confirmation de signature"
                                className="h-10 sm:h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="template-category" className="text-sm font-medium">Catégorie</Label>
                              <Select 
                                value={selectedTemplate.category} 
                                onValueChange={(value) => setSelectedTemplate({...selectedTemplate, category: value})}
                              >
                                <SelectTrigger className="h-10 sm:h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue placeholder="Sélectionnez une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Confirmations">Confirmations</SelectItem>
                                  <SelectItem value="Rappels">Rappels</SelectItem>
                                  <SelectItem value="Installations">Installations</SelectItem>
                                  <SelectItem value="Suivi">Suivi</SelectItem>
                                  <SelectItem value="Général">Général</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="template-subject" className="text-sm font-medium">Sujet de l'email</Label>
                            <Input
                              id="template-subject"
                              value={selectedTemplate.subject}
                              onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                              placeholder="Ex: Confirmation de votre signature - {CLIENT_NAME}"
                              className="h-10 sm:h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="template-body" className="text-sm font-medium">Corps de l'email</Label>
                            <Textarea
                              id="template-body"
                              value={selectedTemplate.body}
                              onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                              placeholder="Tapez votre message ici...&#10;&#10;Utilisez {CLIENT_NAME}, {CONTRACT_ID}, etc. pour les variables"
                              rows={6}
                              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Variables disponibles</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              {['CLIENT_NAME', 'CONTRACT_ID', 'DATE', 'TIME', 'ADDRESS', 'SENDER_NAME', 'PRODUCT', 'PHONE'].map((variable) => (
                                <Button
                                  key={variable}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newBody = selectedTemplate.body + `{${variable}}`;
                                    setSelectedTemplate({...selectedTemplate, body: newBody});
                                  }}
                                  className="h-8 px-2 text-xs border-blue-200 hover:bg-blue-50 hover:border-blue-300 justify-center"
                                >
                                  {variable}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="template-active"
                              checked={selectedTemplate.isActive}
                              onCheckedChange={(checked) => setSelectedTemplate({...selectedTemplate, isActive: checked})}
                            />
                            <Label htmlFor="template-active" className="text-sm font-medium">Modèle actif</Label>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditingTemplate(false);
                                setSelectedTemplate(null);
                              }}
                              className="h-10 sm:h-12 px-6 sm:px-8 rounded-xl border-gray-300 hover:bg-gray-50 order-2 sm:order-1"
                            >
                              Annuler
                            </Button>
                            <Button
                              onClick={() => {
                                if (selectedTemplate.id) {
                                  // Modification d'un modèle existant
                                  setEmailTemplates(emailTemplates.map(t => 
                                    t.id === selectedTemplate.id ? selectedTemplate : t
                                  ));
                                } else {
                                  // Création d'un nouveau modèle
                                  const newTemplate = {
                                    ...selectedTemplate,
                                    id: Date.now().toString(),
                                    variables: Array.from(new Set([
                                      ...selectedTemplate.subject.match(/\{[^}]+\}/g) || [],
                                      ...selectedTemplate.body.match(/\{[^}]+\}/g) || []
                                    ])).map(v => v.replace(/[{}]/g, ''))
                                  };
                                  setEmailTemplates([...emailTemplates, newTemplate]);
                                }
                                setIsEditingTemplate(false);
                                setSelectedTemplate(null);
                                toast({
                                  title: "Modèle sauvegardé",
                                  description: "Le modèle d'email a été enregistré avec succès",
                                });
                              }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-10 sm:h-12 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold order-1 sm:order-2"
                            >
                              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              Sauvegarder
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Aide et guide */}
                  <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-yellow-800">Guide des variables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Variables clients :</strong>
                          <ul className="list-disc list-inside mt-2 text-gray-700">
                            <li><code>{'{CLIENT_NAME}'}</code> - Nom complet du client</li>
                            <li><code>{'{CONTRACT_ID}'}</code> - Identifiant du contrat</li>
                            <li><code>{'{PHONE}'}</code> - Téléphone du client</li>
                            <li><code>{'{ADDRESS}'}</code> - Adresse du client</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Variables système :</strong>
                          <ul className="list-disc list-inside mt-2 text-gray-700">
                            <li><code>{'{DATE}'}</code> - Date actuelle</li>
                            <li><code>{'{TIME}'}</code> - Heure actuelle</li>
                            <li><code>{'{SENDER_NAME}'}</code> - Nom de l'expéditeur</li>
                            <li><code>{'{PRODUCT}'}</code> - Produit souscrit</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Apparence */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle>Logo de l'entreprise</CardTitle>
                    <CardDescription>
                      Personnalisez le logo affiché dans l'application et sur les documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="logo-upload">Télécharger un nouveau logo</Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="h-12 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all duration-200 cursor-pointer file:cursor-pointer file:border-0 file:bg-blue-50 file:text-blue-700 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:hover:bg-blue-100"
                      />
                      <Button 
                        onClick={handleUpload} 
                        disabled={!logoFile || isUploading}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isUploading ? "Téléchargement..." : "Télécharger le logo"}
                        <Upload className="ml-2 h-5 w-5" />
                      </Button>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Recommandations</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Format PNG ou SVG avec fond transparent</li>
                          <li>Dimensions recommandées: 500x200 pixels</li>
                          <li>Taille maximale: 2 MB</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="block mb-3">Aperçu du logo</Label>
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Aperçu du nouveau logo"
                            className="max-h-20 max-w-full object-contain mx-auto"
                          />
                        ) : logoData ? (
                          <img
                            src={`${logoData}?v=${Date.now()}`}
                            alt="Logo actuel"
                            className="max-h-20 max-w-full object-contain mx-auto"
                            key={logoData} // Force re-render quand le logo change
                          />
                        ) : (
                          <SmgLogo variant="small" />
                        )}
                        <p className="text-sm text-gray-600 mt-3">
                          {previewUrl ? "Nouveau logo" : logoData ? "Logo actuel" : "Logo par défaut"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="block mb-3">Aperçu sur document</Label>
                      <div className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <SmgLogo variant="small" />
                          <div className="text-right text-sm">
                            <div className="font-semibold">FACTURE</div>
                            <div>N° FC-2025-0001-06</div>
                          </div>
                        </div>
                        <div className="h-12 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle>Préférences de notifications</CardTitle>
                    <CardDescription>
                      Configurez comment vous souhaitez être informé des événements
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Canaux de notification */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Canaux de notification</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Notifications par email
                        </Label>
                        <p className="text-sm text-gray-600">Recevoir les notifications par email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, emailNotifications: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Notifications push
                        </Label>
                        <p className="text-sm text-gray-600">Notifications dans le navigateur</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, pushNotifications: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Notifications SMS
                        </Label>
                        <p className="text-sm text-gray-600">Recevoir les alertes critiques par SMS</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, smsNotifications: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Types de notifications */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Types de notifications</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Nouveaux clients</Label>
                        <p className="text-sm text-gray-600">Notification lors de l'ajout d'un nouveau client</p>
                      </div>
                      <Switch
                        checked={notificationSettings.newClientNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, newClientNotifications: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Rappels de tâches</Label>
                        <p className="text-sm text-gray-600">Rappels pour les tâches en retard ou à échéance</p>
                      </div>
                      <Switch
                        checked={notificationSettings.taskReminders}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, taskReminders: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertes de commission</Label>
                        <p className="text-sm text-gray-600">Notifications lors du calcul des commissions</p>
                      </div>
                      <Switch
                        checked={notificationSettings.commissionAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, commissionAlerts: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mises à jour système</Label>
                        <p className="text-sm text-gray-600">Notifications des mises à jour et maintenances</p>
                      </div>
                      <Switch
                        checked={notificationSettings.systemUpdates}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, systemUpdates: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotificationSettings}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;