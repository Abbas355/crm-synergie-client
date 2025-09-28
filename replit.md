# Free Sales Management System

## Overview
This is a full-stack web application designed for managing Free (French ISP) sales operations. Its main purpose is to streamline client management, SIM card tracking, recruitment processes, commission calculations, and complete accounting management. Key capabilities include comprehensive client lifecycle management, real-time SIM inventory, a detailed commission system based on sales performance, and a professional accounting module fully compliant with French and European fiscal regulations. The system offers distinct interfaces for administrators and sales representatives, aiming to optimize sales efficiency, ensure data integrity, and provide precise financial management.

## User Preferences
Preferred communication style: Simple, everyday language.
Response language: French (all responses in French)
Documentation: Preference for comprehensive, structured specifications and requirements documentation

## MLM Network Configuration (3 Septembre 2025)
- Eric Rostand (ID 16, FR98445061): Username: ab@test.com, Password: password
- Sophie Martin (ID 78, FR98445062): Username: sophie@test.com, Password: password
- Raymond Bardon (ID 79, FR98445063): Username: raymond.bardon, Password: password
- Sébastien Tremoulin (ID 80, FR98445064): Username: sebastien.tremoulin, Password: password
- Date de démarrage Sophie: 27/08/2025 (fiche unique conservée après suppression doublon)
- Hiérarchie MLM: 
  * Sophie Martin est partenaire direct d'Eric Rostand
  * Raymond Bardon est rattaché à l'équipe d'Eric Rostand
  * Sébastien Tremoulin est rattaché à l'équipe de Sophie Martin
- NETTOYAGE EFFECTUÉ: Suppression fiche doublon Sophie Martin (ID 71) - 20 clients conservés sur fiche principale
- NOUVEAUX VENDEURS CRÉÉS: Raymond Bardon et Sébastien Tremoulin ajoutés au réseau MLM (3 Septembre 2025)
- **AUTOMATISATION MLM INTÉGRÉE**: Système d'automatisation complète avec règles générales implémenté (3 Septembre 2025)
- **ÉLIMINATION MAPPINGS COMPLÈTE**: Suppression définitive de tous les doublons de noms (userid→userId, forfaitType→produit) pour un code plus propre et maintenable (12 Septembre 2025)
- **PLAN D'ACTION MLM PERSONNALISÉ**: Système complet intégré avec logique RC validée, données réelles et interface utilisateur dynamique (12 Septembre 2025)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (with Radix UI primitives)
- **Styling**: TailwindCSS (custom design system)
- **State Management**: TanStack Query
- **Form Management**: React Hook Form with Zod validation
- **Design Principles**: Modern glassmorphism, gradient backgrounds, responsive layouts (mobile-first), animated elements, unified color schemes (blue-indigo, emerald-green, purple-violet, orange-red)
- **Form Architecture**: Unified prospect management system with single edit form (`/recruitment/prospects/edit`) to prevent conflicts and confusion.

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js (local strategy, session-based with PostgreSQL session store)
- **Database ORM**: Drizzle ORM
- **File Handling**: Multer for uploads

### Database
- **Type**: PostgreSQL
- **Schema Management**: Drizzle migrations
- **Design Patterns**: Soft delete for data integrity, optimized queries with indexing, "Single Source of Truth" principle for core data (e.g., SIM cards, client sources, dates).

### Deployment
- **Platform**: Replit Deployments
- **Build System**: Optimized development workflow with hot reload
- **Production Server**: Express.js with TypeScript, optimized for performance
- **Architecture**: Modular approach with unified routes and clean codebase
- **Status**: OPTIMISÉ - Code nettoyé et performances améliorées (14 Août 2025)
- **Performance**: Suppression de 84 fichiers obsolètes, logs debug réduits, routes unifiées
- **Health Checks**: Routes `/`, `/api/status`, `/health` fonctionnelles
- **Data Integrity**: Data Integrity Guardian implémenté pour protection systémique (15 Août 2025)
- **Production Domain**: crm.synergiemarketingroup.fr (single 'g' in marketing) - Configured 16 Août 2025

### Core Features
- **Client Management**: Multi-status tracking (signature, validation, installation), automatic vendor code assignment, duplicate prevention, client data validation.
- **SIM Card Management**: Real-time inventory, automatic assignment for 5G products, bidirectional synchronization with client records.
- **Data Integrity Guardian**: Système de protection systémique qui élimine définitivement les problèmes de codes vendeurs et cartes SIM manquants via validation automatique avant insertion en base (Août 2025).
- **Automatisation MLM Complète**: Système d'automatisation totale avec rattachement automatique des clients/vendeurs, validation des codes, génération automatique des codes vendeurs, et synchronisation de la hiérarchie MLM (Septembre 2025). Endpoints: `/api/mlm/validate-code`, `/api/mlm/sync-structure`, `/api/mlm/validate-integrity`, `/api/mlm/automation-status`.
- **Commission sur Ventes Directes (CVD)**: Point-based commission system (Freebox Ultra: 6 pts, Essentiel: 5 pts, Pop: 4 pts, Forfait 5G: 1 pt) with progressive tiers, detailed breakdown. CVD calculations are based on monthly installations and adhere to official French regulations, with a fixed legal framework for commission calculations.
- **Système de Positions MLM**: Les calculs des différentes positions MLM (Conseiller, Conseiller Qualifié, ETT, ETL, Manager, etc.) se basent sur les données cumulées depuis le démarrage de l'activité de chaque vendeur, pas seulement sur les performances du mois en cours. Points totaux utilisés pour déterminer les niveaux de qualification.
- **Points System Separation (23 Août 2025)**: Complete separation between Dashboard "Total de points" (lifetime total) and Clients page "Pts générés" (current month only). Dedicated endpoints `/api/dashboard/total-points-lifetime` and `/api/clients/points-mois-courant` ensure accurate calculations based on installation dates.
- **Points Groupe MLM Correction (3 Septembre 2025)**: Correction du calcul des "Points groupe" pour refléter uniquement les vraies recrues directes et leurs points cumulés totaux. Eric (ab@test.com) affiche maintenant correctement 6 points groupe correspondant aux 6 forfaits 5G installés de Sophie Martin (sa seule recrue directe réelle).
- **User Management**: Role-based access control (admin/vendor), secure session management, user profile management.
- **Data Integrity**: Automatic duplicate prevention, data synchronization rules, cleanup automation.
- **Task Automation**: Automatic task generation from client comments (e.g., "Recontact client"), intelligent keyword detection for task categorization and due date extraction. Includes MLM group info with hierarchical permissions.
- **Recruitment Management**: Dedicated fields and workflow for tracking sales representative candidates, including profile, skills, and recruitment process stages.
- **Invoice Generation**: Professional, legally compliant invoices for auto-entrepreneurs adhering to French regulations (chronological numbering, detailed service nature, payment terms, late penalties, VAT exemption notice). Features client-side generation for mobile compatibility and includes interactive details.
- **Prospect Management**: Complete CRUD functionality (Create, Read, Update, Delete), client and vendor prospect types, enhanced economic simulation with detailed savings reports, protection against duplicate simulations, mobile-optimized interface, automatic task creation for follow-ups, comprehensive simulation summaries stored in comments. Unified editing system with single form architecture to prevent conflicts (redundant forms removed: prospects-form.tsx, prospects-form-mobile.tsx, prospects-form-simple.tsx).
- **Prospection Terrain Management**: Advanced prospection system with city-grouped display (/prospection), detailed terrain interface (/prospection-terrain), accordion-based navigation for mobile optimization, automated statistics calculation per session, and integrated task creation for follow-ups. Legacy interface maintained at /prospection-legacy.
- **Messaging/Email**: Integrated inbox with IMAP/SMTP configuration for professional email communication, optimized for mobile viewing.
- **Google Calendar Integration**: OAuth2 authentication for creating and syncing events directly from tasks.
- **Contract Management System**: Complete contract lifecycle management with French localized tags (CODE_POSTAL, VILLE, PRENOM_VENDEUR, etc.), real-time template editing with persistent modifications, and advanced preview system with formatting, page breaks, and visual validation before final generation. Features 24-page contract generation with dynamic tag replacement and legal compliance tracking.
- **Accounting Module** (August 2025): Professional accounting system compliant with French PCG and European standards. Features include complete chart of accounts (Plan Comptable Général), double-entry bookkeeping, VAT management (CA3/CA12 declarations), asset depreciation, bank reconciliation, financial reporting (balance sheet, P&L, general ledger), FEC export for tax compliance, and audit trail. Separated schema architecture (schema-comptabilite.ts) for modular organization. Dashboard at /comptabilite with comprehensive financial indicators and real-time alerts.

## External Dependencies

### Database Hosting
- **Neon Database**: PostgreSQL hosting with connection pooling for performance and scalability.

### Email Services
- **SendGrid**: Transactional email sending.
- **Nodemailer**: Backup email service.
- **Hostinger SMTP**: For recruitment-related emails.

### UI/UX Libraries
- **Radix UI**: Primitives for accessibility and UI foundation.
- **shadcn/ui**: Component library built on Radix UI.
- **Lucide React**: Icon library.
- **Recharts**: For data visualization (charts and graphs).

### Data Services
- **Zippopotam.us API**: For postcode-to-city auto-completion.