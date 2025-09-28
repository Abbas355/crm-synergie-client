import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VendorDocumentUploader } from "@/components/VendorDocumentUploader";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Camera, 
  Edit,
  Save,
  X,
  Key,
  Activity,
  Clock,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface pour les données de profil
interface ProfileData {
  id: number;
  username: string;
  email: string;
  prenom?: string;
  nom?: string;
  phone?: string;
  codeVendeur?: string;
  active?: boolean;
  isAdmin?: boolean;
  createdAt?: string;
  lastLogin?: string;
  avatar?: string;
  // Documents vendeurs
  photoProfile?: string | null;
  attestationHonneur?: string | null;
  pieceIdentite?: string | null;
  rib?: string | null;
  carteVitale?: string | null;
  justificatifDomicile?: string | null;
  documentsComplets?: boolean | null;
  derniereMajDocuments?: string | null;
  recruiterInfo?: {
    id: number;
    telephone?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    dateNaissance?: string;
    statut?: string;
  };
}

interface LoginHistoryItem {
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  current: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    phone: "",
  });

  // Récupérer les informations détaillées du profil
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Récupérer l'historique des connexions
  const { data: loginHistory } = useQuery<LoginHistoryItem[]>({
    queryKey: ["/api/profile/login-history"],
    enabled: !!user,
  });

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PUT", "/api/profile/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour l'upload d'avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de la photo');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès.",
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsUploadingAvatar(false);
      // Rafraîchir les données du profil
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setIsUploadingAvatar(false);
    },
  });

  const handleEditSubmit = () => {
    updateProfileMutation.mutate(editForm);
  };

  const startEditing = () => {
    const userData = profileData || user || {};
    setEditForm({
      prenom: (userData as any)?.prenom || "",
      nom: (userData as any)?.nom || "",
      email: (userData as any)?.email || (userData as any)?.username || "",
      phone: (userData as any)?.phone || "",
    });
    setIsEditing(true);
  };

  // Gestionnaire pour la sélection de fichier avatar
  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner une image (JPG, PNG ou GIF).",
      });
      return;
    }

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 2 MB.",
      });
      return;
    }

    setAvatarFile(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gestionnaire pour l'upload d'avatar
  const handleAvatarUpload = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const userInfo = profileData || user;
  const userData = userInfo as any;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        {/* En-tête du profil */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            {!isEditing ? (
              <Button onClick={startEditing} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleEditSubmit}
                  disabled={updateProfileMutation.isPending}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="informations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="securite">Sécurité</TabsTrigger>
            <TabsTrigger value="activite">Activité</TabsTrigger>
          </TabsList>

          {/* Onglet Informations personnelles */}
          <TabsContent value="informations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo de profil */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview || (userData?.avatar ? `/uploads/${userData.avatar}` : undefined)} />
                    <AvatarFallback className="text-lg">
                      {userData?.prenom?.[0] || userData?.username?.[0] || 'U'}{userData?.nom?.[0] || userData?.username?.[1] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <label htmlFor="avatar-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Camera className="h-4 w-4 mr-2" />
                            Changer la photo
                          </span>
                        </Button>
                      </label>
                    </div>
                    {avatarFile && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAvatarUpload}
                          disabled={isUploadingAvatar}
                          size="sm"
                        >
                          {isUploadingAvatar ? "Uploading..." : "Sauvegarder"}
                        </Button>
                        <Button 
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      JPG, PNG ou GIF (max. 2MB)
                    </p>
                  </div>
                </div>

                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    {isEditing ? (
                      <Input
                        id="prenom"
                        value={editForm.prenom}
                        onChange={(e) => setEditForm({...editForm, prenom: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{userData?.prenom || "Non renseigné"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    {isEditing ? (
                      <Input
                        id="nom"
                        value={editForm.nom}
                        onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{userData?.nom || "Non renseigné"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {userData?.email || userData?.username || "Non renseigné"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {userData?.phone || "Non renseigné"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Informations non modifiables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Code vendeur</Label>
                    <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded">
                      {userInfo?.codeVendeur || "Non attribué"}
                    </p>
                  </div>

                  <div>
                    <Label>Statut du compte</Label>
                    <div className="mt-1">
                      <Badge variant={userInfo?.active ? "default" : "secondary"}>
                        {userInfo?.active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Date de création</Label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {userInfo?.createdAt ? format(new Date(userInfo.createdAt), "dd MMMM yyyy", { locale: fr }) : "Non disponible"}
                    </p>
                  </div>

                  <div>
                    <Label>Dernière connexion</Label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {userInfo?.lastLogin ? format(new Date(userInfo.lastLogin), "dd/MM/yyyy à HH:mm", { locale: fr }) : "Non disponible"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gestion des documents vendeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData && (
                  <VendorDocumentUploader userProfile={profileData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Sécurité */}
          <TabsContent value="securite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Mot de passe</Label>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">••••••••••••</p>
                      <ChangePasswordDialog 
                        onSubmit={(data) => changePasswordMutation.mutate(data)}
                        isLoading={changePasswordMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Historique des connexions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loginHistory && loginHistory.length > 0 ? (
                  <div className="space-y-3">
                    {loginHistory.map((login: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(login.timestamp), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                          <p className="text-xs text-gray-600">
                            IP: {login.ipAddress} • {login.userAgent}
                          </p>
                        </div>
                        <Badge variant={login.current ? "default" : "secondary"}>
                          {login.current ? "Session actuelle" : "Terminée"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Aucun historique de connexion disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Composant pour le changement de mot de passe
function ChangePasswordDialog({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return;
    }
    onSubmit({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
    setIsOpen(false);
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4 mr-2" />
          Changer le mot de passe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current">Mot de passe actuel</Label>
            <Input
              id="current"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="new">Nouveau mot de passe</Label>
            <Input
              id="new"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || passwords.newPassword !== passwords.confirmPassword}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}