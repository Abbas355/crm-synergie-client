import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { useEffect } from "react";
import { MobileRecovery } from "./lib/mobile-recovery";

import { ProtectedRoute } from "./lib/protected-route";
import { AdaptiveRoute } from "@/components/adaptive-route";
import NotFound from "./pages/not-found";
import AuthPageModern from "@/pages/auth-page-modern";
import DashboardPage from "@/pages/dashboard-page";
import ContactsPage from "@/pages/contacts-page";
import ClientsPage from "@/pages/clients-page";
import ClientsPageBasic from "@/pages/clients-page-basic";
import ClientsPageEnhanced from "@/pages/clients-page-enhanced";
import ClientsPageImproved from "@/pages/clients-page-improved";
import ClientsModern from "@/pages/clients-modern";
import ClientsMobileDashboard from "@/pages/clients-mobile-dashboard";
import ClientAddMobile from "@/pages/client-add-mobile";
import HubModerne from "@/pages/hub-moderne";
import ClientsListMobile from "@/pages/clients-list-mobile";
import ClientAddNew from "@/pages/client-add-new";
import ClientEditPageFixed from "@/pages/client-edit-page-fixed";
import ClientDetailPage from "@/pages/client-detail-page";
import TableauClients from "@/pages/tableau-clients";
import TableauSimple from "@/pages/tableau-simple";
import CampaignsPage from "@/pages/campaigns-page";
import TasksPage from "@/pages/tasks-page";
import TaskManagementPage from "@/pages/task-management-page";
import TaskManagementRedesigned from "@/pages/task-management-redesigned";
import TasksPageNew from "@/pages/tasks";
import TasksUnified from "@/pages/tasks-unified";
import TasksPageSimple from "@/pages/tasks-simple";
import TasksAdmin from "@/pages/tasks-admin";
import TaskDetail from "@/pages/task-detail";

import TasksOverviewPage from "@/pages/tasks-overview";
import TaskDetailPage from "@/pages/task-detail-page";
import TaskDetailSimple from "@/pages/task-detail-simple";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import SimCardsPage from "@/pages/sim-cards-page";
import VendorsPage from "@/pages/recruitment/vendors-page-simple";
// ProspectsPageOptimized supprimé - Seul ProspectsHub existe maintenant
import ProspectsSimple from "@/pages/prospects-simple";
import ProspectsHub from "@/pages/prospects-hub";
import ProspectsTrash from "@/pages/prospects-trash";
import ProspectionPage from "@/pages/prospection-page";
import ProspectionTerrainPage from "@/pages/prospection-terrain-page";
import ProspectionGroupeePage from "@/pages/prospection-groupee-page";
import AnalyseVillePage from "@/pages/analyse-ville-page";
import RecruitmentsPage from "@/pages/recruitment/recruitments-page";
import AnalyticsDashboardPage from "@/pages/recruitment/analytics-dashboard";
import RecruitmentTunnel from "@/pages/recruitment/recruitment-tunnel";
import PublicRecruitmentTunnel from "@/pages/recruitment/public-recruitment-tunnel";
import RecruitOnboarding from "@/pages/recruitment/recruit-onboarding";
import RecruitmentRedirect from "@/pages/recruitment/index";
import Step1Registration from "@/pages/recruitment/step1-registration";
import SimpleRecruitmentForm from "@/pages/recruitment/simple-form";
import TestStep1 from "@/pages/recruitment/test-step1";
import Step2Congratulations from "@/pages/recruitment/step2-congratulations";
import Step3Regulations from "@/pages/recruitment/step3-regulations";
import Step3PostFormation from "@/pages/recruitment/step3-post-formation";
import Step4CompleteForm from "@/pages/recruitment/step4-complete-form";
import Step4ValidationFormation from "@/pages/recruitment/step4-validation-formation";
import Step4Attestation from "@/pages/recruitment/step4-attestation";
import Step5Completion from "@/pages/recruitment/step5-completion";
import Step5ReglementInterieur from "@/pages/recruitment/step5-reglement-interieur";
import Step5Contrat from "@/pages/recruitment/step5-contrat";
import Step6Finalisation from "@/pages/recruitment/step6-finalisation";
import Step6CompleteForm from "@/pages/recruitment/step6-complete-form";
import RecruitmentComplete from "@/pages/recruitment/recruitment-complete";
import DocumentDemoPage from "@/pages/document-demo";
import TestContractPage from "@/pages/test-contract-page";
import StatusFieldTestPage from "@/pages/test/status-field-page";
import ContractManagementPage from "@/pages/contract-management-page";
import ComptabiliteDashboard from "@/pages/comptabilite-dashboard";
import ComptabiliteAIAssistant from "@/pages/comptabilite-ai-assistant";
import RapprochementBancaire from "@/pages/rapprochement-bancaire";
import MLMDashboardPage from "@/pages/mlm-dashboard-simple";
import MLMDashboardCorrected from "@/pages/mlm-dashboard-corrected";
import MLMAnalyticsPage from "@/pages/mlm-analytics-page";
import MLMNetworkPage from "@/pages/mlm-network-page";
import MLMNetworkHierarchy from "@/pages/mlm-network";
import InboxPage from "@/pages/inbox-page";
import InboxMobileOptimized from "@/pages/inbox-mobile-optimized";
import ProfilePage from "@/pages/profile-page";
import ProfileVendeurModerne from "@/pages/profile-vendeur-moderne";
import TestSuccessModal from "@/pages/test-success-modal";
import TrashPage from "@/pages/trash-page";
import DeploymentSync from "@/pages/deployment-sync";
import VentesPage from "@/pages/ventes";
import VentesNewPage from "@/pages/ventes-new";
import VentesMobileModern from "@/pages/ventes-mobile-modern";
import DuplicateManagement from "@/pages/duplicate-management";
import SalesPage from "@/pages/sales-page";
import CommissionsPage from "@/pages/commissions-page";
import CommissionsMLMPage from "@/pages/commissions-mlm-page";
import FastStartBonusPage from "@/pages/fast-start-bonus-page";
import FastStartBonusModernPage from "@/pages/fast-start-bonus-modern";
import ObjectivesPage from "@/pages/objectives-page";
import CCACommissionPage from "@/pages/cca-commission-page";
import CAECommissionPage from "@/pages/cae-commission-page";
import MaFacturationPage from "@/pages/ma-facturation-page";
import AdminFacturationPage from "@/pages/admin-facturation-page";
import FacturesPage from "@/pages/factures-page";
import ParrainageClientsPage from "@/pages/parrainage-clients";
import ProjectionsObjectifsPage from "@/pages/projections-objectifs-mobile";
import ProjectionsFinMoisPage from "@/pages/projections-fin-mois-page";
import DashboardMain from "@/pages/dashboard-main";
import CorbeillePage from "@/pages/corbeille";
import TestMissingFields from "@/pages/test-missing-fields";

import EditProspect from "@/pages/recruitment/edit-prospect";
import ValidationVendeursPage from "@/pages/validation-vendeurs";

import { MobileNavbar } from "@/components/layout/mobile-navbar";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { useAuth } from "@/hooks/use-auth";
import { ConnectionStatus } from "@/components/connection-status";

function Router() {
  const { user, isLoading } = useAuth();
  const currentPath = window.location.pathname;

  // Initialisation du système de récupération mobile
  useEffect(() => {
    MobileRecovery.getInstance();
  }, []);

  // Éviter le double affichage pendant le chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
          </div>
          <p className="text-white text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si c'est une route publique du tunnel de recrutement
  const isPublicRecruitmentRoute = currentPath.startsWith('/recruitment/step') || 
                                  currentPath === '/recruitment/complete' ||
                                  currentPath === '/recruitment/public-tunnel' ||
                                  currentPath === '/recruitment/simple-form' ||
                                  currentPath === '/attestation-demo';

  // Affichage direct de la page d'authentification si non connecté ET pas sur une route publique
  if (!user && !isPublicRecruitmentRoute) {
    return <AuthPageModern />;
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPageModern} />
      <Route path="/recruitment/public-tunnel" component={PublicRecruitmentTunnel} />
      {/* Routes publiques du tunnel de recrutement (sans authentification) */}
      <Route path="/recruitment/simple-form" component={SimpleRecruitmentForm} />
      <Route path="/recruitment/step1" component={Step1Registration} />
      <Route path="/recruitment/step2" component={Step2Congratulations} />
      <Route path="/recruitment/step3" component={Step3Regulations} />
      <Route path="/recruitment/step3-post-formation" component={Step3PostFormation} />
      <Route path="/recruitment/step4" component={Step4CompleteForm} />
      <Route path="/recruitment/step4-validation-formation" component={Step4ValidationFormation} />
      <Route path="/recruitment/step4-attestation" component={Step4Attestation} />
      <Route path="/recruitment/step5-completion" component={Step5Completion} />
      <Route path="/recruitment/step5-reglement-interieur" component={Step5ReglementInterieur} />
      <Route path="/recruitment/step5-contrat" component={Step5Contrat} />
      <Route path="/recruitment/step6-complete-form" component={Step6CompleteForm} />
      <Route path="/recruitment/step6-finalisation" component={Step6Finalisation} />
      <Route path="/attestation-demo" component={Step4ValidationFormation} />
      <Route path="/recruitment/complete" component={RecruitmentComplete} />
      
      <ProtectedRoute path="/recruitment/onboarding" component={RecruitOnboarding} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/dashboard-main" component={DashboardMain} />
      <ProtectedRoute path="/hub" component={HubModerne} />
      <ProtectedRoute path="/contacts" component={ContactsPage} />
      <ProtectedRoute path="/clients" component={ClientsModern} />
      <ProtectedRoute path="/clients-basic" component={ClientsPageBasic} />
      <ProtectedRoute path="/clients-enhanced" component={ClientsPageEnhanced} />
      <ProtectedRoute path="/clients-improved" component={ClientsPageImproved} />
      <ProtectedRoute path="/clients-mobile" component={ClientsModern} />
      <ProtectedRoute path="/clients-dashboard" component={ClientsMobileDashboard} />
      <ProtectedRoute path="/clients/add-mobile" component={ClientAddMobile} />
      <ProtectedRoute path="/clients-list" component={ClientsListMobile} />
      <ProtectedRoute path="/clients/add-new" component={ClientAddNew} />
      <ProtectedRoute path="/clients/new" component={ClientAddNew} />

      <ProtectedRoute path="/clients/:id/edit" component={ClientEditPageFixed} />
      <ProtectedRoute path="/clients/edit/:id" component={ClientEditPageFixed} />
      <ProtectedRoute path="/clients/:id" component={ClientDetailPage} />
      <ProtectedRoute path="/tableau-clients" component={TableauClients} />
      <ProtectedRoute path="/tableau-simple" component={TableauSimple} />
      <ProtectedRoute path="/sim-cards" component={SimCardsPage} />
      <ProtectedRoute path="/sim" component={SimCardsPage} />
      <ProtectedRoute path="/recruitment" component={RecruitmentRedirect} />
      <ProtectedRoute path="/recruitment/vendors" component={VendorsPage} />
      <ProtectedRoute path="/recruitment/prospects" component={ProspectsSimple} />
      <ProtectedRoute path="/recruitment/prospects/edit" component={EditProspect} />
      <ProtectedRoute path="/prospects" component={ProspectsHub} />
      <ProtectedRoute path="/prospects-hub" component={ProspectsHub} />
      <ProtectedRoute path="/prospects/trash" component={ProspectsTrash} />
      <ProtectedRoute path="/prospects-simple" component={ProspectsSimple} />
      <ProtectedRoute path="/prospection" component={ProspectionGroupeePage} />
      <ProtectedRoute path="/prospection-terrain" component={ProspectionTerrainPage} />
      <ProtectedRoute path="/prospection-legacy" component={ProspectionPage} />
      <ProtectedRoute path="/analyse-ville" component={AnalyseVillePage} />
      <ProtectedRoute path="/recruitment/analytics" component={MLMAnalyticsPage} />
      <ProtectedRoute path="/recrutement/analytics" component={MLMAnalyticsPage} />
      <ProtectedRoute path="/recruitment/tunnel" component={RecruitmentTunnel} />
      

      
      <ProtectedRoute path="/documents" component={DocumentDemoPage} />
      <ProtectedRoute path="/campaigns" component={CampaignsPage} />
      <ProtectedRoute path="/tasks" component={TasksUnified} />
      <ProtectedRoute path="/tasks/:id" component={TaskDetailSimple} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/settings" component={() => <SettingsPage />} requireAdmin />
      <ProtectedRoute path="/test-contract" component={TestContractPage} />
      <ProtectedRoute path="/test/status-field" component={StatusFieldTestPage} />
      <ProtectedRoute path="/test/success-modal" component={TestSuccessModal} />
      <ProtectedRoute path="/mlm" component={MLMDashboardCorrected} />
      <ProtectedRoute path="/mlm-admin" component={MLMDashboardCorrected} />
      <ProtectedRoute path="/mlm/analytics" component={MLMAnalyticsPage} />
      <ProtectedRoute path="/mlm/network" component={MLMNetworkHierarchy} />
      <ProtectedRoute path="/mlm/commissions" component={CommissionsMLMPage} />
      <ProtectedRoute path="/mlm/fast-start-bonus" component={FastStartBonusModernPage} />
      <ProtectedRoute path="/mlm/cca-commission" component={CCACommissionPage} />
      <ProtectedRoute path="/mlm/cae-commission" component={CAECommissionPage} />
      <ProtectedRoute path="/mlm/ma-facturation" component={MaFacturationPage} />
      <ProtectedRoute path="/contracts" component={ContractManagementPage} />

      <ProtectedRoute path="/mlm/ventes-directes" component={MaFacturationPage} />
      <ProtectedRoute path="/mlm/objectifs" component={ObjectivesPage} />
      <ProtectedRoute path="/objectifs" component={ObjectivesPage} />
      <ProtectedRoute path="/mlm/performance" component={MLMDashboardCorrected} />
      <ProtectedRoute path="/commissions" component={CommissionsPage} />
      <ProtectedRoute path="/commissions-mlm" component={CommissionsMLMPage} />
      <ProtectedRoute path="/inbox" component={InboxMobileOptimized} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile-vendeur" component={ProfileVendeurModerne} />
      <ProtectedRoute path="/trash" component={TrashPage} />
      <ProtectedRoute path="/deployment-sync" component={DeploymentSync} />
      <ProtectedRoute path="/duplicate-management" component={DuplicateManagement} />
      <ProtectedRoute path="/sales" component={SalesPage} />
      <ProtectedRoute path="/ventes" component={VentesMobileModern} />
      <ProtectedRoute path="/ventes-analytics" component={VentesPage} />
      <ProtectedRoute path="/factures" component={FacturesPage} />
      <ProtectedRoute path="/parrainage" component={ParrainageClientsPage} />
      <ProtectedRoute path="/parrainage-clients" component={ParrainageClientsPage} />
      <ProtectedRoute path="/recruitment/prospects" component={ProspectsHub} />
      <ProtectedRoute path="/recruitment/recrues" component={RecruitmentsPage} />
      <ProtectedRoute path="/recruitment/recrutements" component={RecruitmentsPage} />
      <ProtectedRoute path="/projections-objectifs" component={ProjectionsObjectifsPage} />
      <ProtectedRoute path="/projections" component={ProjectionsObjectifsPage} />
      <ProtectedRoute path="/projections-fin-mois" component={ProjectionsFinMoisPage} />
      <ProtectedRoute path="/admin/facturation" component={AdminFacturationPage} />
      <ProtectedRoute path="/admin/contract-management" component={ContractManagementPage} />
      <ProtectedRoute path="/admin/validation-vendeurs" component={ValidationVendeursPage} />
      <ProtectedRoute path="/validation-vendeurs" component={ValidationVendeursPage} />
      <ProtectedRoute path="/comptabilite" component={ComptabiliteDashboard} />
      <ProtectedRoute path="/comptabilite/assistant-ia" component={ComptabiliteAIAssistant} />
      <ProtectedRoute path="/rapprochement-bancaire" component={RapprochementBancaire} />
      <ProtectedRoute path="/corbeille" component={CorbeillePage} />
      <ProtectedRoute path="/test-missing-fields" component={TestMissingFields} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  // Utilisez window.location.pathname au lieu de useLocation() et useAuth()
  const pathname = window.location.pathname;
  
  // Vérifier si nous sommes sur la page d'onboarding
  const isOnboardingPage = pathname === "/recruitment/onboarding";
  
  return (
    <>
      <ScrollToTop />
      <ConnectionStatus />
      <Router />
      {/* Ne pas afficher la barre de navigation mobile sur la page d'onboarding */}
      {!isOnboardingPage && <MobileNavbar />}
      {/* <Toaster /> */}
    </>
  );
}

export default App;
