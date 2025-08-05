import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { UserProvider } from './contexts/UserContext';
import { LeadDataProvider } from './contexts/LeadDataContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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
    <UserProvider>
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
    </UserProvider>
  );
}

export default App;