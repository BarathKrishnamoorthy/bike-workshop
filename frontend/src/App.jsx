import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import CustomerDossierModal from './components/CustomerDossierModal';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cross-module states
  const [serviceInitialOpen, setServiceInitialOpen] = useState(false);
  const [selectedServiceForPayment, setSelectedServiceForPayment] = useState(null);

  // Universal Phone-based Customer Identification & Dossier Modal
  const [dossierMobile, setDossierMobile] = useState(null);
  const [reportPhone, setReportPhone] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfe] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-purple-900">Initializing SpeedyWheels Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleQuickAction = (action) => {
    if (action === 'new-job-card') {
      setServiceInitialOpen(true);
      setCurrentTab('services');
    } else if (action === 'new-customer') {
      setCurrentTab('customers');
    } else if (action === 'new-payment') {
      setSelectedServiceForPayment(null);
      setCurrentTab('payments');
    }
  };

  const handleOpenPaymentForService = (service) => {
    setSelectedServiceForPayment(service);
    setCurrentTab('payments');
  };

  const handleOpenDossier = (mobile) => {
    if (mobile) {
      setDossierMobile(mobile);
    }
  };

  const handleDossierCreateJobCard = (customer, bikes) => {
    setDossierMobile(null);
    setServiceInitialOpen(true);
    setCurrentTab('services');
  };

  const handleDossierRecordPayment = (customer) => {
    setDossierMobile(null);
    setSelectedServiceForPayment(null);
    setCurrentTab('payments');
  };

  const handleDossierOpenReport = (mobile) => {
    setDossierMobile(null);
    setReportPhone(mobile);
    setCurrentTab('reports');
  };

  return (
    <div className="min-h-screen bg-[#fbfbfe] flex">
      {/* Purple Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* White Top Navbar with Global Phone Lookup */}
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onQuickAction={handleQuickAction}
          onLookupPhone={handleOpenDossier}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewJobCard={() => {
                setServiceInitialOpen(true);
                setCurrentTab('services');
              }}
              onLookupCustomer={handleOpenDossier}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersPage
              onBookServiceForBike={(customerId, bikeId) => {
                setServiceInitialOpen(true);
                setCurrentTab('services');
              }}
              onLookupPhone={handleOpenDossier}
            />
          )}

          {currentTab === 'services' && (
            <ServicesPage
              initialOpenNew={serviceInitialOpen}
              onOpenPaymentForService={handleOpenPaymentForService}
              onLookupPhone={handleOpenDossier}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsPage
              initialServiceForPayment={selectedServiceForPayment}
              onLookupPhone={handleOpenDossier}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              initialPhone={reportPhone}
            />
          )}
        </main>
      </div>

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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
