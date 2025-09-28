import { db } from "./index";
import { sql } from "drizzle-orm";
import { simCards, recruiters, recruitmentProspects, recruitmentStages, recruitmentActivities, recruitmentNetworkStructure } from "../shared/schema";

async function applySchema() {
  try {
    // Mise a jour de la table clients
    console.log("Mise a jour de la table clients...");
    
    // Verifier et ajouter les colonnes manquantes dans la table clients
    const requiredColumns = ['civilite', 'prenom', 'nom'];
    
    for (const column of requiredColumns) {
      const checkColumnExists = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = ${column}
      `);
      
      // Si la colonne n\u2019existe pas, l\u2019ajouter
      if ((checkColumnExists as any).rows.length === 0) {
        await db.execute(sql`
          ALTER TABLE clients 
          ADD COLUMN IF NOT EXISTS ${sql.identifier(column)} TEXT
        `);
        console.log(`Colonne ${column} ajoutee a la table clients`);
      }
    }

    // Verifier et mettre a jour la table sim_cards
    console.log("Mise a jour de la table sim_cards...");
    
    // Creation ou mise a jour de la table sim_cards
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sim_cards (
        id SERIAL PRIMARY KEY,
        code_vendeur TEXT NOT NULL,
        numero TEXT NOT NULL UNIQUE,
        statut TEXT NOT NULL DEFAULT 'disponible',
        client_id INTEGER REFERENCES clients(id),
        date_attribution TIMESTAMP,
        date_activation TIMESTAMP,
        note TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Verifier si la colonne date_activation existe deja 
    const checkDateActivationColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sim_cards' AND column_name = 'date_activation'
    `);
    
    // Si la colonne n\u2019existe pas, l\u2019ajouter
    if ((checkDateActivationColumn as any).rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE sim_cards 
        ADD COLUMN IF NOT EXISTS date_activation TIMESTAMP
      `);
    }

    // Tables du module de recrutement
    console.log("Creation des tables du module de recrutement...");

    // Table des recruteurs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recruiters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        code_vendeur TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        telephone TEXT NOT NULL,
        date_naissance TEXT,
        adresse TEXT,
        code_postal TEXT,
        ville TEXT,
        niveau_experience TEXT,
        statut TEXT NOT NULL DEFAULT 'actif',
        niveau INTEGER DEFAULT 1,
        commission_base DECIMAL(10, 2) DEFAULT 0,
        date_activation TIMESTAMP DEFAULT NOW(),
        avatar TEXT,
        description TEXT,
        competences JSONB DEFAULT '[]',
        recruteur_id INTEGER REFERENCES recruiters(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Table des prospects de recrutement
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recruitment_prospects (
        id SERIAL PRIMARY KEY,
        prenom TEXT NOT NULL,
        nom TEXT NOT NULL,
        email TEXT NOT NULL,
        telephone TEXT NOT NULL,
        code_postal TEXT,
        ville TEXT,
        source TEXT NOT NULL,
        motivation TEXT,
        experience_precedente TEXT,
        disponibilite TEXT,
        stade TEXT NOT NULL DEFAULT 'nouveau',
        notes TEXT,
        recruteur_id INTEGER NOT NULL REFERENCES recruiters(id),
        assigne_a INTEGER REFERENCES recruiters(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Table des etapes de recrutement
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recruitment_stages (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,
        description TEXT,
        ordre INTEGER NOT NULL,
        duree_estimee INTEGER,
        actif BOOLEAN DEFAULT true,
        couleur TEXT DEFAULT '#3b82f6',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Table des activites de recrutement
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recruitment_activities (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        titre TEXT NOT NULL,
        description TEXT,
        date_activite TIMESTAMP NOT NULL,
        duree INTEGER,
        resultat TEXT,
        notes TEXT,
        prospect_id INTEGER NOT NULL REFERENCES recruitment_prospects(id),
        stade_id INTEGER REFERENCES recruitment_stages(id),
        recruteur_id INTEGER NOT NULL REFERENCES recruiters(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Table de la structure du reseau de recrutement
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recruitment_network_structure (
        id SERIAL PRIMARY KEY,
        recruteur_id INTEGER NOT NULL REFERENCES recruiters(id),
        recrute_par_id INTEGER NOT NULL REFERENCES recruiters(id),
        niveau_hierarchique INTEGER NOT NULL,
        date_recrutement TIMESTAMP NOT NULL,
        taux_commission DECIMAL(5, 2) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Initialisation des etapes de recrutement par defaut si la table est vide
    const stagesCount = await db.execute(sql`SELECT COUNT(*) FROM recruitment_stages`);
    if ((stagesCount as any).rows[0].count === '0') {
      console.log("Initialisation des etapes de recrutement par defaut...");
      const defaultStages = [
        { nom: 'Contact initial', description: 'Premier contact avec le prospect', ordre: 1, couleur: '#3b82f6' },
        { nom: 'Entretien', description: 'Entretien de qualification', ordre: 2, couleur: '#8b5cf6' },
        { nom: 'Formation', description: 'Phase de formation initiale', ordre: 3, couleur: '#ec4899' },
        { nom: 'Integration', description: 'Integration dans l equipe', ordre: 4, couleur: '#f59e0b' },
        { nom: 'Actif', description: 'Vendeur actif', ordre: 5, couleur: '#10b981' }
      ];
      
      for (const stage of defaultStages) {
        await db.execute(sql`
          INSERT INTO recruitment_stages (nom, description, ordre, couleur)
          VALUES (${stage.nom}, ${stage.description}, ${stage.ordre}, ${stage.couleur})
        `);
      }
    }

    console.log("Mise a jour des tables reussie.");
  } catch (error) {
    console.error("Erreur lors de la mise a jour du schema:", error);
  } finally {
    process.exit(0);
  }
}

applySchema();