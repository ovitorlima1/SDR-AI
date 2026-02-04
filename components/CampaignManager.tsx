
import React, { useState } from 'react';
import { Send, Wand2, CheckCircle, AlertCircle, Copy, Filter, MapPin, Building2 } from 'lucide-react';
import { Client, MessageTemplate } from '../types';
import { generateCampaignMessage } from '../services/geminiService';

interface CampaignManagerProps {
  clients: Client[];
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ clients }) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<MessageTemplate | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const profiles = Array.from(new Set(clients.map(c => c.profile))).filter(Boolean);
  const states = Array.from(new Set(clients.map(c => c.state))).filter(Boolean).sort();
  const categories = ['Indústria', 'Serviços', 'Comércio'];

  const filteredClients = clients.filter(c => {
    const matchesProfile = !selectedProfile || c.profile === selectedProfile;
    const matchesState = filterState === 'all' || c.state === filterState;
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    return matchesProfile && matchesState && matchesCategory;
  });

  const handleGenerate = async () => {
    if (!selectedProfile) return;
    setIsGenerating(true);
    setGeneratedMessage(null);
    setSendStatus('idle');

    try {
      const filterDesc = `Estado: ${filterState}, Categoria: ${filterCategory}`;
      const message = await generateCampaignMessage(selectedProfile, filterDesc, filteredClients);
      setGeneratedMessage(message);
    } catch (e) {
      alert("Erro ao gerar copy.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    setSendStatus('sending');
    setTimeout(() => setSendStatus('sent'), 1500);
  };

  const selectClassName = "w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campanhas Regionais</h2>
          <p className="text-slate-500">Combine Perfil, Região e Categoria para disparos ultra-personalizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
              <Filter size={14} /> Filtros de Segmento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">Mindset / Perfil</label>
                <select 
                  className={selectClassName}
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  <option value="" className="text-slate-400">Selecione um Perfil...</option>
                  {profiles.map(p => <option key={p} value={p} className="text-slate-900">{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" /> Estado (Região)
                </label>
                <select 
                  className={selectClassName}
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                >
                  <option value="all" className="text-slate-900">Todos os Estados</option>
                  {states.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" /> Categoria CNAE
                </label>
                <select 
                  className={selectClassName}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all" className="text-slate-900">Todas as Categorias</option>
                  {categories.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <div className="p-3 bg-indigo-50 rounded-xl text-center">
                <span className="text-2xl font-black text-indigo-600">{filteredClients.length}</span>
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Leads Filtrados</p>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedProfile || isGenerating || filteredClients.length === 0}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
            >
              {isGenerating ? <><Wand2 className="animate-spin" size={16} /> Criando Copy...</> : <><Wand2 size={16} /> Gerar com IA</>}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          {generatedMessage ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Preview da Campanha</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Segmento: {selectedProfile}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Filtros Ativos</p>
                  <p className="text-xs font-bold text-slate-700">{filterState} · {filterCategory}</p>
                </div>
              </div>
              
              <div className="p-8 flex-1 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Assunto do Email</label>
                  <input readOnly value={generatedMessage.subject} className="w-full bg-slate-50 p-3 border border-slate-100 rounded-xl font-bold text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Mensagem Estratégica</label>
                  <textarea readOnly value={generatedMessage.body} className="w-full h-80 bg-slate-50 p-4 border border-slate-100 rounded-xl text-slate-700 leading-relaxed resize-none" />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <button className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-bold">
                  <Copy size={16} /> Copiar Copy
                </button>
                <button 
                  onClick={handleSend}
                  disabled={sendStatus !== 'idle'}
                  className={`px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg
                    ${sendStatus === 'sent' ? 'bg-green-600 text-white' : 'bg-primary text-slate-900 hover:bg-primary/90'}
                  `}
                >
                  {sendStatus === 'sending' ? 'Processando Disparo...' : sendStatus === 'sent' ? <><CheckCircle size={18} /> Campanhas Iniciadas</> : <><Send size={18} /> Enviar para {filteredClients.length} leads</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <div className="p-5 bg-white rounded-full shadow-sm mb-4"><Wand2 size={48} className="text-slate-200" /></div>
              <h3 className="text-xl font-bold text-slate-600 mb-2">Aguardando Configuração</h3>
              <p className="max-w-md">Selecione os filtros de Perfil, Região e Categoria ao lado e clique em Gerar para ver a mágica da IA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
