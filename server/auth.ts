import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        // Si l'utilisateur n'existe plus, renvoyer false pour déconnecter la session
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Erreur lors de la désérialisation de l'utilisateur:", error);
      done(null, false);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Cet utilisateur existe déjà" });
      }

      // Hacher le mot de passe et créer l'utilisateur
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
      });

      // Récupérer un recruteur par défaut
      const recruteurId = await storage.getDefaultRecruiter();

      // Préparer les données du prospect
      const prospectData = {
        prenom: req.body.prenom,
        nom: req.body.nom,
        email: req.body.email,
        telephone: req.body.telephone,
        adresse: req.body.adresse,
        codePostal: req.body.codePostal,
        ville: req.body.ville,
        nomSociete: req.body.nomSociete,
        siret: req.body.siret,
        codeVendeur: req.body.codeVendeur,
        source: req.body.source || 'site_web',
        motivation: req.body.motivation,
        experiencePrecedente: req.body.experiencePrecedente,
        disponibilite: req.body.disponibilite,
        stade: 'nouveau',
        recruteurId, // Assigné au recruteur par défaut
      };

      try {
        // Créer le prospect associé
        await storage.createProspect(prospectData);
      } catch (prospectError) {
        console.error("Erreur lors de la création du prospect:", prospectError);
        // On continue même si la création du prospect échoue
        // L'utilisateur est déjà créé, on ne veut pas bloquer l'inscription
      }

      // Connecter l'utilisateur
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // In a real app, this would fetch from the database
    // For now, we're returning mock data that matches the UI
    res.json({
      stats: {
        totalClients: 125,
        activeCampaigns: 12,
        openTasks: 42,
        newContacts: 18,
      },
      recentActivities: [
        {
          id: "1",
          title: "Nouveau client ajouté : Société ABC",
          type: "Client",
          userName: "Sophie Martin",
          date: "Aujourd'hui à 10:30",
        },
        {
          id: "2",
          title: 'Campagne email "Printemps 2023" lancée',
          type: "Campagne",
          userName: "Thomas Durand",
          date: "Hier à 14:45",
        },
        {
          id: "3",
          title: "Réunion planifiée avec Entreprise XYZ",
          type: "Tâche",
          userName: "Marie Dubois",
          date: "Il y a 2 jours",
        },
      ],
      upcomingTasks: [
        {
          id: "1",
          title: "Appeler le client Société DEF pour suivi de proposition",
          priority: "Urgent",
          dueDate: "Aujourd'hui",
          assignedTo: "Sophie Martin",
        },
        {
          id: "2",
          title: "Préparer proposition commerciale pour Entreprise GHI",
          priority: "Moyen",
          dueDate: "Demain",
          assignedTo: "Thomas Durand",
        },
        {
          id: "3",
          title: "Finaliser la campagne réseaux sociaux pour le produit X",
          priority: "Faible",
          dueDate: "Dans 3 jours",
          assignedTo: "Marie Dubois",
        },
      ],
    });
  });
}
