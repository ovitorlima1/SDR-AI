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

  const handleRunAnalysis = async () => {
    if (!process.env.API_KEY) {
      alert("API Key do Gemini não encontrada. Por favor configure a variável de ambiente.");
      // For demo purposes, we might not block, but in production we should.
      // return; 
    }

    setIsAnalyzing(true);
    try {
      const segments = await analyzeSegments(clients);
      
      // Update clients with their new segments based on the AI response
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
      alert("Houve um erro ao tentar segmentar os clientes. Verifique o console ou a API Key.");
    } finally {
      setIsAnalyzing(false);
    }
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
        return <ClientList clients={clients} setClients={setClients} />;
      case 'qualifier':
        return <LeadQualifier />;
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