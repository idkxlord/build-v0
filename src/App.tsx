import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { LeadDataProvider } from './contexts/LeadDataContext';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    if (currentPage === 'lead-detail' && selectedLeadId) {
      return (
        <LeadDetail 
          leadId={selectedLeadId} 
          onBack={() => setCurrentPage('leads')} 
        />
      );
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigateToLeads={() => setCurrentPage('leads')} />;
      case 'leads':
        return (
          <LeadList 
            onSelectLead={(leadId) => {
              setSelectedLeadId(leadId);
              setCurrentPage('lead-detail');
            }} 
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigateToLeads={() => setCurrentPage('leads')} />;
    }
  };

  return (
    <LeadDataProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </LeadDataProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;