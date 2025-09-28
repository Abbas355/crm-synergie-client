import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorDocumentUploader } from "@/components/VendorDocumentUploader";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserProfile {
  id: number;
  username: string;
  email?: string | null;
  prenom?: string | null;
  nom?: string | null;
  phone?: string | null;
  codeVendeur?: string | null;
  niveau?: string | null;
  active?: boolean | null;
  isAdmin?: boolean | null;
  avatar?: string | null;
  lastLogin?: string | null;
  createdAt?: string | null;
  // Documents
  photoProfile?: string | null;
  attestationHonneur?: string | null;
  pieceIdentite?: string | null;
  rib?: string | null;
  carteVitale?: string | null;
  justificatifDomicile?: string | null;
  documentsComplets?: boolean | null;
  derniereMajDocuments?: string | null;
}

export default function ProfileVendeurModerne() {
  const [activeTab, setActiveTab] = useState("profil");

  // Récupérer les informations détaillées du profil
  const { data: profileData, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-white/50 rounded-xl"></div>
              <div className="h-96 bg-white/50 rounded-xl"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p>Impossible de charger les informations du profil.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  const fullName = [profileData.prenom, profileData.nom].filter(Boolean).join(' ') || profileData.username;
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header du profil */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={profileData.photoProfile || profileData.avatar || undefined} 
                      alt={fullName}
                    />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {profileData.documentsComplets && (
                    <div className="absolute -bottom-2 -right-2">
                      <Badge className="bg-green-600 hover:bg-green-700 rounded-full p-1">
                        <CheckCircle className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Informations principales */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {fullName}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                    {profileData.codeVendeur && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <User className="h-3 w-3 mr-1" />
                        {profileData.codeVendeur}
                      </Badge>
                    )}
                    
                    {profileData.niveau && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Shield className="h-3 w-3 mr-1" />
                        {profileData.niveau}
                      </Badge>
                    )}
                    
                    {profileData.active && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    )}
                    
                    {profileData.isAdmin && (
                      <Badge className="bg-[#FF6B6B]">
                        <Settings className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  {/* Informations de contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    {profileData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{profileData.email}</span>
                      </div>
                    )}
                    
                    {profileData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                    
                    {profileData.lastLogin && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Dernière connexion : {format(new Date(profileData.lastLogin), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </span>
                      </div>
                    )}
                    
                    {profileData.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Membre depuis : {format(new Date(profileData.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="profil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
                {!profileData.documentsComplets && (
                  <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    !
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            <TabsContent value="profil" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Prénom</label>
                      <p className="mt-1 text-gray-900">{profileData.prenom || "Non renseigné"}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nom</label>
                      <p className="mt-1 text-gray-900">{profileData.nom || "Non renseigné"}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{profileData.email || "Non renseigné"}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Téléphone</label>
                      <p className="mt-1 text-gray-900">{profileData.phone || "Non renseigné"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Gestion des documents
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Téléchargez vos documents pour compléter votre dossier vendeur. 
                    Votre photo de profil sera automatiquement mise à jour.
                  </p>
                </CardHeader>
                <CardContent>
                  <VendorDocumentUploader userProfile={profileData} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}