
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
  fetchTotalClientsCount,
  fetchPendingClients,
  fetchTotalPendingCount
} from './services/persistenceService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pendingQualification, setPendingQualification] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carrega os clientes para exibição (limite de 20k)
      const dbClients = await fetchClientsFromDB();
      // Conta o total real do banco (ex: 57k)
      const actualTotal = await fetchTotalClientsCount();
      // Conta quantos faltam segmentar no total
      const pendingTotal = await fetchTotalPendingCount();
      
      setClients(dbClients);
      setTotalLeads(actualTotal);
      setTotalPending(pendingTotal);
    } catch (e) {
      console.error("Falha na conexão inicial:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAnalysis = async (limit: number) => {
    setIsAnalyzing(true);
    // Define o total esperado visualmente (pode ser menor se o banco tiver menos que o limite)
    setProgress({ current: 0, total: limit });

    const BATCH_SIZE = 3; 

    try {
      // 1. Busca leads pendentes diretamente do banco (novos, que podem não estar na tela)
      const clientsToAnalyze = await fetchPendingClients(limit);

      if (clientsToAnalyze.length === 0) {
        alert("Não há mais leads pendentes de segmentação no banco!");
        setIsAnalyzing(false);
        return;
      }

      // Atualiza o total real para a barra de progresso
      const totalToProcess = clientsToAnalyze.length;
      setProgress({ current: 0, total: totalToProcess });

      // 2. Processa em lotes pequenos
      for (let i = 0; i < clientsToAnalyze.length; i += BATCH_SIZE) {
        const batch = clientsToAnalyze.slice(i, i + BATCH_SIZE);
        
        // Chama a IA (Gemini)
        const aiResults = await analyzeSegments(batch);
        
        // Salva os resultados no banco
        for (const res of aiResults) {
          await updateClientAIResult(res.clientId, res);
        }
        
        // Atualiza barra de progresso
        setProgress(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, totalToProcess) }));
        
        // Pequeno delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 3. Recarrega os dados para mostrar os novos mapeamentos na tela
      await loadData();

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
            totalPendingOverride={totalPending}
            onAnalyze={handleRunAnalysis} 
            isAnalyzing={isAnalyzing}
            progress={progress}
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
            onAnalyze={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            totalPending={totalPending}
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
