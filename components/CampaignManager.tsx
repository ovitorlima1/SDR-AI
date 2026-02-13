
import React, { useState, useEffect } from 'react';
import { Send, Wand2, CheckCircle, Copy, Filter, MapPin, Building2, Users, Loader2, Database } from 'lucide-react';
import { Client, MessageTemplate } from '../types';
import { generateCampaignMessage } from '../services/geminiService';
import { fetchCampaignAudienceCount, fetchCampaignSampleClients, createCampaign } from '../services/persistenceService';

interface CampaignManagerProps {
  clients: Client[];
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ clients }) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [dbCount, setDbCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [sendLimit, setSendLimit] = useState<number>(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<MessageTemplate | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const profiles = Array.from(new Set(clients.map(c => c.profile))).filter(Boolean);
  const states = Array.from(new Set(clients.map(c => c.state))).filter(Boolean).sort();
  const categories = ['Indústria', 'Serviços', 'Comércio'];

  useEffect(() => {
    let isActive = true;

    const loadCount = async () => {
      setIsLoadingCount(true);
      try {
        const count = await fetchCampaignAudienceCount({
          profile: selectedProfile || undefined,
          state: filterState === 'all' ? undefined : filterState,
          category: filterCategory === 'all' ? undefined : filterCategory
        });
        
        if (isActive) {
          setDbCount(count);
          setSendLimit(count);
        }
      } catch (error) {
        console.error("Erro ao buscar contagem:", error);
      } finally {
        if (isActive) setIsLoadingCount(false);
      }
    };

    loadCount();
    return () => { isActive = false; };
  }, [selectedProfile, filterState, filterCategory]);

  const handleGenerate = async () => {
    if (!selectedProfile) return;
    setIsGenerating(true);
    setGeneratedMessage(null);
    setSendStatus('idle');

    try {
      const sampleClients = await fetchCampaignSampleClients({
        profile: selectedProfile,
        state: filterState === 'all' ? undefined : filterState,
        category: filterCategory === 'all' ? undefined : filterCategory
      }, 5);

      const filterDesc = `Estado: ${filterState}, Categoria: ${filterCategory}`;
      const message = await generateCampaignMessage(selectedProfile, filterDesc, sampleClients);
      setGeneratedMessage(message);
    } catch (e) {
      alert("Erro ao gerar copy. Verifique sua conexão.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!generatedMessage) return;

    setSendStatus('sending');
    
    try {
      // Salva a campanha no Supabase
      await createCampaign({
        name: `Campanha ${selectedProfile} - ${new Date().toLocaleDateString()}`,
        segmentProfile: selectedProfile,
        segmentRegion: filterState,
        segmentCategory: filterCategory,
        totalLeads: sendLimit,
        subject: generatedMessage.subject,
        body: generatedMessage.body,
        status: 'Enviada'
      });

      // Simula delay de envio ou integra com API de email futura
      setTimeout(() => setSendStatus('sent'), 1500);
    } catch (error) {
      console.error(error);
      alert("Erro ao registrar campanha.");
      setSendStatus('idle');
    }
  };

  const selectClassName = "w-full p-3 bg-gray-50 text-black border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Campanhas Regionais</h2>
          <p className="text-gray-500 font-medium mt-1">Disparos de alta conversão baseados no perfil comportamental.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-black uppercase flex items-center gap-2 tracking-widest border-b border-gray-100 pb-4">
              <Filter size={14} className="text-primary" /> Filtros de Segmento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Mindset / Perfil</label>
                <select 
                  className={selectClassName}
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  <option value="" className="text-gray-400">Selecione um Perfil...</option>
                  {profiles.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block flex items-center gap-1">
                  <MapPin size={10} /> Estado (Região)
                </label>
                <select 
                  className={selectClassName}
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                >
                  <option value="all" className="text-black">Todos os Estados</option>
                  {states.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block flex items-center gap-1">
                  <Building2 size={10} /> Categoria CNAE
                </label>
                <select 
                  className={selectClassName}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all" className="text-black">Todas as Categorias</option>
                  {categories.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block flex items-center gap-1">
                  <Users size={10} /> Qtd. de Disparos
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    max={dbCount}
                    value={sendLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setSendLimit(Math.min(Math.max(0, val), dbCount));
                    }}
                    disabled={isLoadingCount || dbCount === 0}
                    className="w-full p-3 bg-gray-50 text-black border border-gray-200 font-black text-xl text-center outline-none focus:border-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-300 uppercase whitespace-nowrap">
                      DE TOTAL
                    </span>
                    {isLoadingCount ? (
                      <Loader2 size={12} className="animate-spin text-primary" />
                    ) : (
                      <span className="text-xs font-black text-black">{dbCount}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <div className="p-4 bg-secondary/5 border border-secondary/10 text-center relative overflow-hidden">
                {isLoadingCount ? (
                   <div className="flex flex-col items-center justify-center py-2">
                      <Loader2 className="animate-spin text-primary mb-1" />
                      <span className="text-[10px] font-bold text-gray-500">Calculando Base...</span>
                   </div>
                ) : (
                  <>
                    <span className="text-3xl font-black text-secondary">{sendLimit}</span>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Leads Selecionados (DB)</p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedProfile || isGenerating || dbCount === 0}
              className="w-full py-4 bg-black text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-secondary disabled:opacity-50 transition-all shadow-lg"
            >
              {isGenerating ? <><Wand2 className="animate-spin" size={16} /> Criando Copy...</> : <><Wand2 size={16} /> Gerar com IA</>}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          {generatedMessage ? (
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full transition-all">
              <div className="p-6 bg-black text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-black flex items-center justify-center font-black text-xl">L</div>
                  <div>
                    <h4 className="font-black text-lg uppercase tracking-tight">Preview da Campanha</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Segmento: {selectedProfile}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Filtros Ativos</p>
                  <p className="text-xs font-bold text-primary">{filterState} · {filterCategory}</p>
                </div>
              </div>
              
              <div className="p-10 flex-1 space-y-8 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">Assunto do Email</label>
                  <input readOnly value={generatedMessage.subject} className="w-full bg-gray-50 p-4 border-l-4 border-primary font-bold text-black text-lg focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">Mensagem Estratégica</label>
                  <textarea readOnly value={generatedMessage.body} className="w-full h-96 bg-gray-50 p-6 border border-gray-100 text-gray-800 leading-relaxed resize-none focus:outline-none font-medium text-base" />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <button className="text-gray-500 hover:text-black flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                  <Copy size={14} /> Copiar Copy
                </button>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                     <p className="text-[10px] font-bold text-gray-400 uppercase">Estimativa de Impacto</p>
                     <p className="text-xs font-black text-black">{sendLimit} empresas selecionadas</p>
                  </div>
                  <button 
                    onClick={handleSend}
                    disabled={sendStatus !== 'idle'}
                    className={`px-10 py-4 font-black uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-lg
                      ${sendStatus === 'sent' ? 'bg-green-600 text-white' : 'bg-primary text-black hover:bg-accent'}
                    `}
                  >
                    {sendStatus === 'sending' ? 'Registrando...' : sendStatus === 'sent' ? <><CheckCircle size={16} /> Enviado</> : <><Send size={16} /> Enviar Campanha</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <div className="p-6 bg-white rounded-full shadow-sm mb-6"><Database size={48} className="text-gray-300" /></div>
              <h3 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">Aguardando Configuração</h3>
              <p className="max-w-md mb-6 font-medium">Selecione os filtros de Perfil, Região e Categoria ao lado. O sistema irá consultar a base de dados para encontrar o público ideal.</p>
              {isLoadingCount && (
                 <div className="flex items-center gap-2 text-black font-bold text-xs bg-primary px-6 py-3 uppercase tracking-wider">
                    <Loader2 className="animate-spin" size={14} /> Verificando disponibilidade no banco...
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
