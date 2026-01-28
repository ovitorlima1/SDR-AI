
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';
import { CampaignManager } from './components/CampaignManager';
import { LeadQualifier } from './components/LeadQualifier';
import { Client, ViewState } from './types';
import { MOCK_CLIENTS } from './constants';
import { analyzeSegments } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingQualification, setPendingQualification] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const segments = await analyzeSegments(clients);
      const updatedClients = [...clients];
      
      segments.forEach(seg => {
        seg.clientIds.forEach(clientId => {
          const clientIndex = updatedClients.findIndex(c => c.id === clientId);
          if (clientIndex !== -1) {
            updatedClients[clientIndex] = {
              ...updatedClients[clientIndex],
              segment: seg.segmentName,
              aiRationale: seg.description
            };
          }
        });
      });

      setClients(updatedClients);
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao tentar segmentar os clientes.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQualifyClient = (companyName: string) => {
    setPendingQualification(companyName);
    setCurrentView('qualifier');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            clients={clients} 
            onAnalyze={handleRunAnalysis} 
            isAnalyzing={isAnalyzing} 
          />
        );
      case 'clients':
        return (
          <ClientList 
            clients={clients} 
            setClients={setClients} 
            onQualify={handleQualifyClient} 
          />
        );
      case 'qualifier':
        return (
          <LeadQualifier 
            initialCompanyName={pendingQualification || undefined} 
            onClearInitial={() => setPendingQualification(null)}
          />
        );
      case 'campaigns':
        return <CampaignManager clients={clients} />;
      default:
        return <Dashboard clients={clients} onAnalyze={handleRunAnalysis} isAnalyzing={isAnalyzing} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
