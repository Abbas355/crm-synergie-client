import fs from 'fs';
import path from 'path';
import { log } from './vite';

// Stockage local temporaire des données clients
// C'est une solution temporaire en attendant que les problèmes de base de données soient résolus

// Chemin vers le fichier de stockage JSON
const CLIENTS_FILE_PATH = path.join(process.cwd(), 'clients.json');
const AUTH_FILE_PATH = path.join(process.cwd(), 'users.json');

// Interface pour un client
interface Client {
  id: number;
  civilite: string;
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  status: string;
  forfaitType: string;
  identifiantContrat: string;
  dateSignature: string;
  dateRendezVous: string;
  dateInstallation: string;
  commentaire: string;
  codeVendeur: string;
  source: string;
  [key: string]: any; // Pour permettre d'autres propriétés
}

// Interface pour un utilisateur
interface User {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
  role: string;
}

// Fonction pour lire les clients depuis le fichier
function readClients(): Client[] {
  try {
    if (!fs.existsSync(CLIENTS_FILE_PATH)) {
      // Si le fichier n'existe pas, retourner un tableau vide
      return [];
    }
    const data = fs.readFileSync(CLIENTS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture des clients:', error);
    return [];
  }
}

// Fonction pour écrire les clients dans le fichier
function writeClients(clients: Client[]): void {
  try {
    fs.writeFileSync(CLIENTS_FILE_PATH, JSON.stringify(clients, null, 2));
  } catch (error) {
    console.error('Erreur lors de l\'écriture des clients:', error);
  }
}

// Fonction pour lire les utilisateurs depuis le fichier
function readUsers(): User[] {
  try {
    if (!fs.existsSync(AUTH_FILE_PATH)) {
      // Si le fichier n'existe pas, créer un utilisateur admin par défaut
      const defaultUsers = [
        {
          id: 1,
          username: 'admin@synergie.com',
          password: '$2b$10$FNpWJEPmGBke2t6AKzCFaO6HhvSh0GDw0TfKw4XhK8KyTAYwUy9ZG', // 'admin' hashé
          isAdmin: true,
          role: 'admin'
        }
      ];
      fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(defaultUsers, null, 2));
      return defaultUsers;
    }
    const data = fs.readFileSync(AUTH_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture des utilisateurs:', error);
    // Retourner un utilisateur admin par défaut en cas d'erreur
    return [
      {
        id: 1,
        username: 'admin@synergie.com',
        password: '$2b$10$FNpWJEPmGBke2t6AKzCFaO6HhvSh0GDw0TfKw4XhK8KyTAYwUy9ZG', // 'admin' hashé
        isAdmin: true,
        role: 'admin'
      }
    ];
  }
}

// Fonction pour initialiser les données de test si elles n'existent pas
function initializeTestData(): void {
  // Vérifier si les clients existent déjà
  const clients = readClients();
  if (clients.length === 0) {
    // Créer quelques clients de test
    const testClients: Client[] = [
      {
        id: 1,
        civilite: 'M.',
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@example.com',
        phone: '+33612345678',
        dateNaissance: '1980-01-01',
        adresse: '1 rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        status: 'valide',
        forfaitType: 'freebox_ultra',
        identifiantContrat: 'FO12345678',
        dateSignature: '2024-01-15',
        dateRendezVous: '',
        dateInstallation: '',
        commentaire: 'Client VIP',
        codeVendeur: 'FR00123456',
        source: 'prospection_direct'
      },
      {
        id: 2,
        civilite: 'Mme',
        prenom: 'Marie',
        nom: 'Martin',
        email: 'marie.martin@example.com',
        phone: '+33687654321',
        dateNaissance: '1990-05-15',
        adresse: '25 avenue des Champs-Élysées',
        codePostal: '75008',
        ville: 'Paris',
        status: 'installation',
        forfaitType: 'freebox_pop',
        identifiantContrat: 'FO87654321',
        dateSignature: '2024-02-20',
        dateRendezVous: '2024-03-05',
        dateInstallation: '2024-03-10',
        commentaire: 'Installation terminée',
        codeVendeur: 'FR00123456',
        source: 'recommandation'
      }
    ];
    writeClients(testClients);
    log('Données de test initialisées avec succès');
  }

  // Vérifier si les utilisateurs existent déjà (ce n'est pas nécessaire car readUsers crée l'utilisateur admin par défaut)
  readUsers();
}

// API pour la gestion des clients
export const clientsAPI = {
  // Obtenir tous les clients
  getAllClients: (): Client[] => {
    return readClients();
  },

  // Obtenir un client par son ID
  getClientById: (id: number): Client | undefined => {
    const clients = readClients();
    return clients.find(client => client.id === id);
  },

  // Créer un nouveau client
  createClient: (clientData: Omit<Client, 'id'>): Client => {
    const clients = readClients();
    const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    const newClient = { id: newId, ...clientData };
    clients.push(newClient);
    writeClients(clients);
    return newClient;
  },

  // Mettre à jour un client
  updateClient: (id: number, clientData: Partial<Client>): Client | null => {
    const clients = readClients();
    const clientIndex = clients.findIndex(client => client.id === id);
    
    if (clientIndex === -1) {
      return null;
    }
    
    // Mettre à jour les données du client
    clients[clientIndex] = { ...clients[clientIndex], ...clientData };
    writeClients(clients);
    
    return clients[clientIndex];
  },

  // Supprimer un client
  deleteClient: (id: number): boolean => {
    const clients = readClients();
    const newClients = clients.filter(client => client.id !== id);
    
    if (newClients.length === clients.length) {
      return false;
    }
    
    writeClients(newClients);
    return true;
  }
};

// API pour la gestion des utilisateurs
export const usersAPI = {
  // Authentifier un utilisateur
  authenticateUser: (username: string, password: string): User | null => {
    // Dans un environnement de production, on comparerait les mots de passe hashés
    // Pour cette solution temporaire, on accepte 'admin' comme mot de passe pour tous les utilisateurs
    if (password !== 'admin') {
      return null;
    }
    
    const users = readUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return null;
    }
    
    // Ne pas retourner le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },

  // Obtenir un utilisateur par son ID
  getUserById: (id: number): Omit<User, 'password'> | null => {
    const users = readUsers();
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return null;
    }
    
    // Ne pas retourner le mot de passe
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

// Initialiser les données de test au démarrage
initializeTestData();

export default {
  clients: clientsAPI,
  users: usersAPI
};