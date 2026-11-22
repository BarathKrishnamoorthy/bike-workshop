import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDossierModal from './components/CustomerDossierModal';
import WorkshopSettingsModal from './components/WorkshopSettingsModal';
import CustomerChatWidget from './components/CustomerChatWidget';

// Super Admin Pages
import SuperAdminLoginPage from './pages/super-admin/SuperAdminLoginPage';
import SuperAdminLayout from './pages/super-admin/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import WorkshopManagementPage from './pages/super-admin/WorkshopManagementPage';
import UserManagementPage from './pages/super-admin/UserManagementPage';
import SuperAdminChatPage from './pages/super-admin/SuperAdminChatPage';
import CompanyBrandingPage from './pages/super-admin/CompanyBrandingPage';
import PlatformSettingsPage from './pages/super-admin/PlatformSettingsPage';
import PlatformReportsPage from './pages/super-admin/PlatformReportsPage';
import ActivityLogsPage from './pages/super-admin/ActivityLogsPage';

// Protected App Layout containing Sidebar, Navbar, floating Live Support widget, and routed page Content
function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Global Customer 360° Dossier modal state
  const [dossierMobile, setDossierMobile] = useState(null);

  useEffect(() => {
    const onDossierEvent = (e) => {
      if (e.detail?.mobile) {
        setDossierMobile(e.detail.mobile);
      }
    };
    window.addEventListener('open-customer-dossier', onDossierEvent);
    return () => window.removeEventListener('open-customer-dossier', onDossierEvent);
  }, []);

  const handleQuickAction = (action) => {
    if (action === 'new-job-card') {
      navigate('/services', { state: { openNew: true } });
    } else if (action === 'new-customer') {
      navigate('/customers');
    } else if (action === 'new-payment') {
      navigate('/payments');
    }
  };

  const handleOpenDossier = (mobile) => {
    if (mobile) {
      setDossierMobile(mobile);
    }
  };

  const handleDossierCreateJobCard = (customer, bikes) => {
    setDossierMobile(null);
    navigate('/services', { state: { openNew: true, customerId: customer?._id } });
  };

  const handleDossierRecordPayment = (customer) => {
    setDossierMobile(null);
    navigate('/payments', { state: { customerId: customer?._id } });
  };

  const handleDossierOpenReport = (mobile) => {
    setDossierMobile(null);
    navigate('/reports', { state: { mobile } });
  };

  return (
    <div className="min-h-screen bg-[#fbfbfe] flex">
      {/* Purple Sidebar with Route-based Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Top Navbar */}
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onQuickAction={handleQuickAction}
          onLookupPhone={handleOpenDossier}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ handleOpenDossier }} />
        </main>

        {/* Global Platform Footer */}
        <footer className="py-3.5 px-6 border-t border-purple-100/80 bg-white/70 backdrop-blur-xs text-center text-xs text-slate-500 font-medium no-print">
          <span>© {new Date().getFullYear()} SpeedyWheels Multi-Tenant SaaS • </span>
          <span className="font-bold text-purple-700 tracking-wide">Powered by RB Nextwave</span>
        </footer>
      </div>

      {/* Floating Live Support & Chat Widget */}
      <CustomerChatWidget />

      {/* Universal 360° Customer Dossier Modal */}
      {dossierMobile && (
        <CustomerDossierModal
          mobile={dossierMobile}
          onClose={() => setDossierMobile(null)}
          onCreateJobCard={handleDossierCreateJobCard}
          onRecordPayment={handleDossierRecordPayment}
          onOpenReport={handleDossierOpenReport}
        />
      )}

      {/* Workshop Settings Modal */}
      <WorkshopSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

// Protected Route Guard for Workshop SaaS Portal
function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfe] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-purple-900">Initializing SaaS Workshop Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in user is super_admin, send to super-admin dashboard
  if (user?.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return <AppLayout />;
}

// Protected Route Guard for Super Admin Console
function SuperAdminProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Authenticating Super Admin Security...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <SuperAdminLayout />;
}

// Public Route Guard for Workshop Users
function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfe] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'super_admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Public Route Guard for Super Admin Login
function SuperAdminPublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return children;
}

// Route wrappers providing navigation callbacks
function DashboardRoute() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const handleOpenDossier = outletCtx?.handleOpenDossier;

  return (
    <DashboardPage
      onNavigate={(tab) => navigate(tab === 'dashboard' ? '/dashboard' : `/${tab}`)}
      onOpenNewJobCard={() => navigate('/services', { state: { openNew: true } })}
      onLookupCustomer={handleOpenDossier}
    />
  );
}

function CustomersRoute() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const handleOpenDossier = outletCtx?.handleOpenDossier;

  return (
    <CustomersPage
      onBookServiceForBike={(customerId, bikeId) =>
        navigate('/services', { state: { openNew: true, customerId, bikeId } })
      }
      onLookupPhone={handleOpenDossier}
    />
  );
}

function ServicesRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const outletCtx = useOutletContext();
  const handleOpenDossier = outletCtx?.handleOpenDossier;
  const initialOpen = location.state?.openNew || false;

  return (
    <ServicesPage
      initialOpenNew={initialOpen}
      onOpenPaymentForService={(service) =>
        navigate('/payments', { state: { selectedService: service } })
      }
      onLookupPhone={handleOpenDossier}
    />
  );
}

function PaymentsRoute() {
  const location = useLocation();
  const outletCtx = useOutletContext();
  const handleOpenDossier = outletCtx?.handleOpenDossier;
  const initialService = location.state?.selectedService || null;

  return (
    <PaymentsPage
      initialServiceForPayment={initialService}
      onLookupPhone={handleOpenDossier}
    />
  );
}

function ReportsRoute() {
  const location = useLocation();
  const initialPhone = location.state?.mobile || null;

  return <ReportsPage initialPhone={initialPhone} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Workshop Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Super Admin Public Authentication Route */}
          <Route
            path="/super-admin/login"
            element={
              <SuperAdminPublicRoute>
                <SuperAdminLoginPage />
              </SuperAdminPublicRoute>
            }
          />

          {/* Protected Super Admin Platform Routes */}
          <Route path="/super-admin" element={<SuperAdminProtectedRoute />}>
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="workshops" element={<WorkshopManagementPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="chat" element={<SuperAdminChatPage />} />
            <Route path="reports" element={<PlatformReportsPage />} />
            <Route path="branding" element={<CompanyBrandingPage />} />
            <Route path="settings" element={<PlatformSettingsPage />} />
            <Route path="logs" element={<ActivityLogsPage />} />
          </Route>

          {/* Protected Workshop SaaS Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/customers" element={<CustomersRoute />} />
            <Route path="/services" element={<ServicesRoute />} />
            <Route path="/payments" element={<PaymentsRoute />} />
            <Route path="/reports" element={<ReportsRoute />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
