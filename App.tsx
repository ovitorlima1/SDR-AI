
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';
import { CampaignManager } from './components/CampaignManager';
import { LeadQualifier } from './components/LeadQualifier';
import { Client, ViewState } from './types';
import { analyzeSegments } from './services/geminiService';
import { 
  fetchClientsFromDB, 
  saveClientsToDB, 
  updateClientAIResult, 
  saveToIntelligenceRegistry, 
  findExistingIntelligence,
  getDBStats,
  fetchTotalClientsCount
} from './services/persistenceService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pendingQualification, setPendingQualification] = useState<string | null>(null);
  const [registryCount, setRegistryCount] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dbClients = await fetchClientsFromDB();
      const stats = await getDBStats();
      const actualTotal = await fetchTotalClientsCount();
      
      setClients(dbClients);
      setTotalLeads(actualTotal);
      setRegistryCount(stats);
    } catch (e) {
      console.error("Falha na conexão inicial:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAnalysis = async () => {
    const clientsToAnalyze = clients.filter(c => c.segment === 'Não Segmentado');
    if (clientsToAnalyze.length === 0) {
      alert("Nenhum lead pendente de segmentação na amostra atual.");
      return;
    }

    setIsAnalyzing(true);
    const totalToProcess = clientsToAnalyze.length;
    setProgress({ current: 0, total: totalToProcess });

    const BATCH_SIZE = 3; 

    try {
      for (let i = 0; i < clientsToAnalyze.length; i += BATCH_SIZE) {
        const batch = clientsToAnalyze.slice(i, i + BATCH_SIZE);
        
        for (const client of batch) {
          const cached = await findExistingIntelligence(client.company);
          
          if (cached) {
            const result = {
              clientId: client.id,
              segmentName: cached.segment,
              category: cached.category,
              state: cached.state,
              cnae: cached.cnae,
              profile: cached.profile,
              description: cached.ai_rationale
            };
            await updateClientAIResult(client.id, result as any);
          } else {
            const aiResults = await analyzeSegments([client]);
            if (aiResults.length > 0) {
              const res = aiResults[0];
              await saveToIntelligenceRegistry(res, client.company);
              await updateClientAIResult(client.id, res);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Recarrega apenas dados necessários
        const updatedFromDB = await fetchClientsFromDB();
        setClients(updatedFromDB);
        setRegistryCount(await getDBStats());
        
        setProgress(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, totalToProcess) }));
      }
    } catch (error) {
      console.error(error);
      alert("Erro durante o processamento de inteligência.");
    } finally {
      setIsAnalyzing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleSetClients = async (newClients: Client[]) => {
    setIsLoading(true);
    try {
      await saveClientsToDB(newClients);
      await loadData(); // Recarrega tudo para atualizar contadores e lista
    } catch (e) {
      console.error(e);
      alert("Erro ao sincronizar planilha com Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="font-bold uppercase text-[10px] tracking-widest">Sincronizando com Supabase...</p>
      </div>
    );

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            clients={clients} 
            totalLeadsOverride={totalLeads}
            onAnalyze={handleRunAnalysis} 
            isAnalyzing={isAnalyzing}
            progress={progress}
            registryCount={registryCount}
          />
        );
      case 'clients':
        return (
          <ClientList 
            clients={clients} 
            setClients={handleSetClients} 
            onQualify={(name) => {
              setPendingQualification(name);
              setCurrentView('qualifier');
            }} 
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
