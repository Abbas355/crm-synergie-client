import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Script de normalisation des noms de colonnes dans la table clients
 * pour éliminer les confusions entre forfait_type/forfaitType, code_vendeur/codeVendeur, etc.
 */

async function normalizeColumnNames() {
  console.log("🔄 Début de la normalisation des noms de colonnes...");

  try {
    // 1. Standardiser forfait_type vers forfaitType
    console.log("📝 Standardisation forfait_type → forfaitType");
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Vérifier si la colonne forfait_type existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'forfait_type') THEN
          -- Si forfaitType n'existe pas, renommer forfait_type
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'forfaitType') THEN
            ALTER TABLE clients RENAME COLUMN forfait_type TO "forfaitType";
            RAISE NOTICE 'Colonne forfait_type renommée en forfaitType';
          ELSE
            -- Si les deux existent, copier les données de forfait_type vers forfaitType puis supprimer forfait_type
            UPDATE clients SET "forfaitType" = forfait_type WHERE forfait_type IS NOT NULL AND "forfaitType" IS NULL;
            ALTER TABLE clients DROP COLUMN forfait_type;
            RAISE NOTICE 'Données migrées de forfait_type vers forfaitType, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 2. Standardiser code_vendeur vers codeVendeur
    console.log("📝 Standardisation code_vendeur → codeVendeur");
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Vérifier si la colonne code_vendeur existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'code_vendeur') THEN
          -- Si codeVendeur n'existe pas, renommer code_vendeur
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'codeVendeur') THEN
            ALTER TABLE clients RENAME COLUMN code_vendeur TO "codeVendeur";
            RAISE NOTICE 'Colonne code_vendeur renommée en codeVendeur';
          ELSE
            -- Si les deux existent, copier les données de code_vendeur vers codeVendeur puis supprimer code_vendeur
            UPDATE clients SET "codeVendeur" = code_vendeur WHERE code_vendeur IS NOT NULL AND "codeVendeur" IS NULL;
            ALTER TABLE clients DROP COLUMN code_vendeur;
            RAISE NOTICE 'Données migrées de code_vendeur vers codeVendeur, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 3. Standardiser identifiant_contrat vers identifiantContrat
    console.log("📝 Standardisation identifiant_contrat → identifiantContrat");
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Vérifier si la colonne identifiant_contrat existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'identifiant_contrat') THEN
          -- Si identifiantContrat n'existe pas, renommer identifiant_contrat
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'identifiantContrat') THEN
            ALTER TABLE clients RENAME COLUMN identifiant_contrat TO "identifiantContrat";
            RAISE NOTICE 'Colonne identifiant_contrat renommée en identifiantContrat';
          ELSE
            -- Si les deux existent, copier les données de identifiant_contrat vers identifiantContrat puis supprimer identifiant_contrat
            UPDATE clients SET "identifiantContrat" = identifiant_contrat WHERE identifiant_contrat IS NOT NULL AND "identifiantContrat" IS NULL;
            ALTER TABLE clients DROP COLUMN identifiant_contrat;
            RAISE NOTICE 'Données migrées de identifiant_contrat vers identifiantContrat, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 4. Standardiser date_signature vers dateSignature
    console.log("📝 Standardisation date_signature → dateSignature");
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'date_signature') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'dateSignature') THEN
            ALTER TABLE clients RENAME COLUMN date_signature TO "dateSignature";
            RAISE NOTICE 'Colonne date_signature renommée en dateSignature';
          ELSE
            UPDATE clients SET "dateSignature" = date_signature WHERE date_signature IS NOT NULL AND "dateSignature" IS NULL;
            ALTER TABLE clients DROP COLUMN date_signature;
            RAISE NOTICE 'Données migrées de date_signature vers dateSignature, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 5. Standardiser date_rendez_vous vers dateRendezVous
    console.log("📝 Standardisation date_rendez_vous → dateRendezVous");
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'date_rendez_vous') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'dateRendezVous') THEN
            ALTER TABLE clients RENAME COLUMN date_rendez_vous TO "dateRendezVous";
            RAISE NOTICE 'Colonne date_rendez_vous renommée en dateRendezVous';
          ELSE
            UPDATE clients SET "dateRendezVous" = date_rendez_vous WHERE date_rendez_vous IS NOT NULL AND "dateRendezVous" IS NULL;
            ALTER TABLE clients DROP COLUMN date_rendez_vous;
            RAISE NOTICE 'Données migrées de date_rendez_vous vers dateRendezVous, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 6. Standardiser date_installation vers dateInstallation
    console.log("📝 Standardisation date_installation → dateInstallation");
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'date_installation') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'dateInstallation') THEN
            ALTER TABLE clients RENAME COLUMN date_installation TO "dateInstallation";
            RAISE NOTICE 'Colonne date_installation renommée en dateInstallation';
          ELSE
            UPDATE clients SET "dateInstallation" = date_installation WHERE date_installation IS NOT NULL AND "dateInstallation" IS NULL;
            ALTER TABLE clients DROP COLUMN date_installation;
            RAISE NOTICE 'Données migrées de date_installation vers dateInstallation, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 7. Standardiser mobile vers phone (si mobile existe)
    console.log("📝 Standardisation mobile → phone");
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'mobile') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
            ALTER TABLE clients RENAME COLUMN mobile TO phone;
            RAISE NOTICE 'Colonne mobile renommée en phone';
          ELSE
            UPDATE clients SET phone = mobile WHERE mobile IS NOT NULL AND phone IS NULL;
            ALTER TABLE clients DROP COLUMN mobile;
            RAISE NOTICE 'Données migrées de mobile vers phone, ancienne colonne supprimée';
          END IF;
        END IF;
      END $$;
    `);

    // 8. Recréer les index si nécessaires
    console.log("📝 Recréation des index...");
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Index pour codeVendeur
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'codeVendeur') THEN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_codeVendeur') THEN
            CREATE INDEX IF NOT EXISTS idx_clients_codeVendeur ON clients ("codeVendeur");
            RAISE NOTICE 'Index idx_clients_codeVendeur créé';
          END IF;
        END IF;
        
        -- Supprimer l'ancien index s'il existe
        DROP INDEX IF EXISTS idx_clients_code_vendeur;
      END $$;
    `);

    console.log("✅ Normalisation des noms de colonnes terminée avec succès !");
    
    // Afficher la structure finale
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY column_name;
    `);
    
    console.log("📋 Structure finale de la table clients:");
    columns.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error("❌ Erreur lors de la normalisation:", error);
    throw error;
  }
}

// Exécuter la normalisation si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  normalizeColumnNames()
    .then(() => {
      console.log("🎉 Normalisation terminée !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec de la normalisation:", error);
      process.exit(1);
    });
}

export { normalizeColumnNames };