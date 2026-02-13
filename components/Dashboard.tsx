
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { PieChart as PieChartIcon, Target, Loader2, Search, BrainCircuit, X, Database, Briefcase, Send, CheckCircle } from 'lucide-react';
import { Client, Campaign } from '../types';
import { fetchLatestCampaign } from '../services/persistenceService';

interface DashboardProps {
  clients: Client[];
  totalLeadsOverride?: number;
  totalPendingOverride?: number;
  onAnalyze: (limit: number) => void;
  isAnalyzing: boolean;
  progress?: { current: number; total: number };
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  clients, 
  totalLeadsOverride, 
  totalPendingOverride,
  onAnalyze, 
  isAnalyzing, 
  progress 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limitInput, setLimitInput] = useState<number>(100);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  const totalLeads = totalLeadsOverride !== undefined ? totalLeadsOverride : clients.length;
  const pendingCount = totalPendingOverride !== undefined 
    ? totalPendingOverride 
    : clients.filter(c => c.segment === 'Não Segmentado').length;

  const enrichedClients = totalLeads - pendingCount;
  const clientsWithTariff = clients.filter(c => c.tariffType && c.tariffType.trim() !== '').length;
  
  useEffect(() => {
    if (isModalOpen) {
      setLimitInput(100); 
    }
  }, [isModalOpen]);

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const campaign = await fetchLatestCampaign();
        setActiveCampaign(campaign);
      } catch (e) {
        console.error("Falha ao carregar campanha recente");
      }
    };
    loadCampaign();
  }, []);

  const handleStartAnalysis = () => {
    onAnalyze(limitInput);
    setIsModalOpen(false);
  };

  // Cores da paleta: Amarelo, Ouro, Cinza Escuro, Preto, Cinza Claro, Branco
  const COLORS = ['#F5BE01', '#E7BB0D', '#1E1E1E', '#000000', '#9CA3AF', '#D1D5DB'];

  const profileData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const analyzed = clients.filter(c => c.profile);
    analyzed.forEach(c => {
      if (c.profile) counts[c.profile] = (counts[c.profile] || 0) + 1;
    });
    
    const total = analyzed.length;
    return Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
    }));
  }, [clients]);

  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const analyzed = clients.filter(c => c.category && c.category !== 'Não Definido');
    analyzed.forEach(c => {
      if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const tariffData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const withTariff = clients.filter(c => c.tariffType && c.tariffType.trim() !== '');
    withTariff.forEach(c => {
      if (c.tariffType) counts[c.tariffType] = (counts[c.tariffType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [clients]);

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, name, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#1E1E1E" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] font-black uppercase tracking-tight"
      >
        {`${name}: ${value} (${percentage}%)`}
      </text>
    );
  };

  const percentProgress = progress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="space-y-8 relative">
      {/* Modal de Configuração de Análise */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-none border-2 border-primary shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-black flex items-center gap-2 uppercase tracking-tighter">
                <BrainCircuit className="text-primary" /> Mapear Base
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 border border-gray-100">
                <p className="text-sm text-gray-600 font-medium">
                  Existem <span className="font-black text-black">{pendingCount.toLocaleString()}</span> leads pendentes no banco.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-3">Quantos leads processar?</label>
                <div className="flex items-center border-b-2 border-black pb-2">
                    <input 
                      type="number" 
                      min="1"
                      max={Math.min(pendingCount, 1000)}
                      value={limitInput}
                      onChange={(e) => setLimitInput(Number(e.target.value))}
                      className="w-full text-center text-4xl font-black text-black outline-none bg-transparent"
                    />
                </div>
                
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-4 px-2">
                  <button className="hover:text-primary transition-colors uppercase" onClick={() => setLimitInput(10)}>10 leads</button>
                  <button className="hover:text-primary transition-colors uppercase" onClick={() => setLimitInput(50)}>50 leads</button>
                  <button className="hover:text-primary transition-colors uppercase" onClick={() => setLimitInput(100)}>100 leads</button>
                  <button className="hover:text-primary transition-colors uppercase" onClick={() => setLimitInput(200)}>200 leads</button>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors uppercase text-xs tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleStartAnalysis}
                  disabled={limitInput < 1}
                  className="flex-1 py-4 bg-primary text-black font-black hover:bg-accent transition-colors shadow-lg disabled:opacity-50 uppercase text-xs tracking-wider"
                >
                  Iniciar Mapeamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Inteligência de Base</h2>
          <p className="text-gray-500 font-medium mt-1">
            Segmentação e enriquecimento de dados via IA.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isAnalyzing || pendingCount === 0}
            className={`w-full sm:w-auto flex items-center justify-center px-8 py-4 transition-all shadow-lg disabled:opacity-50 font-black uppercase tracking-wider text-xs ${isAnalyzing ? 'bg-secondary text-white' : 'bg-black text-primary hover:bg-secondary'}`}
          >
            {isAnalyzing ? (
              <><Loader2 className="animate-spin mr-2" /> Processando...</>
            ) : (
              <><Search className="mr-2" size={16} /> Mapear Base</>
            )}
          </button>
          
          {isAnalyzing && progress && (
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Progresso</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 border-l-4 border-black shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Database size={12}/> Total Leads</p>
          <h3 className="text-4xl font-black text-black mt-2 tracking-tighter">{totalLeads.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 border-l-4 border-primary shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Leads Mapeados</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-4xl font-black text-secondary tracking-tighter">{enrichedClients.toLocaleString()}</h3>
            <span className="text-xs font-bold text-gray-400 mb-1 bg-gray-100 px-2 py-1 rounded">
              {totalLeads > 0 ? Math.round((enrichedClients/totalLeads)*100) : 0}%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-gray-300 shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fila de Espera</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-4xl font-black text-gray-400 tracking-tighter">{pendingCount.toLocaleString()}</h3>
             <span className="text-xs font-bold text-gray-300 mb-1">
              {totalLeads > 0 ? Math.round((pendingCount/totalLeads)*100) : 0}%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-accent shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-accent uppercase tracking-widest">Tarifas Identificadas</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-4xl font-black text-secondary tracking-tighter">{clientsWithTariff.toLocaleString()}</h3>
            <span className="text-xs font-bold text-gray-400 mb-1">Empresas</span>
          </div>
        </div>
      </div>

      {/* Widget de Campanha Ativa */}
      {activeCampaign && (
        <div className="bg-secondary text-white p-8 border border-black shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Campanha em Andamento</p>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-1">{activeCampaign.name}</h3>
              <p className="text-xs text-gray-400 font-bold flex gap-4">
                 <span>PERFIL: {activeCampaign.segmentProfile}</span>
                 <span className="text-gray-600">|</span>
                 <span>ID: #{activeCampaign.id.slice(0, 8)}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-8 bg-black/30 p-4 rounded-lg border border-white/5">
              <div className="text-center">
                 <p className="text-[10px] font-bold text-gray-500 uppercase">Impacto</p>
                 <p className="text-xl font-black text-white">{activeCampaign.totalLeads.toLocaleString()}</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-bold text-gray-500 uppercase">Status</p>
                 <p className="text-xl font-black text-primary">{activeCampaign.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white p-8 border border-gray-200 shadow-sm h-[480px] flex flex-col">
          <h3 className="text-sm font-black text-black uppercase mb-1 flex items-center gap-2 tracking-wide">
            <Target size={16} className="text-primary" /> Perfis (Mindset)
          </h3>
          <p className="text-[10px] text-gray-400 mb-6 font-bold uppercase tracking-wider">Distribuição da Carteira</p>
          <div className="flex-1 overflow-visible">
            {profileData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                  <Pie 
                    data={profileData} 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={4} 
                    dataKey="value"
                    label={renderCustomizedLabel}
                    stroke="none"
                  >
                    {profileData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E1E', color: '#fff', borderRadius: '0px', border: 'none' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="square"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <BrainCircuit size={40} className="mb-2 opacity-20" />
                <span className="text-xs font-bold uppercase">Sem dados</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 border border-gray-200 shadow-sm h-[480px] flex flex-col">
          <h3 className="text-sm font-black text-black uppercase mb-1 flex items-center gap-2 tracking-wide">
            <Briefcase size={16} className="text-accent" /> Setores (CNAE)
          </h3>
          <p className="text-[10px] text-gray-400 mb-6 font-bold uppercase tracking-wider">Segmentação de Mercado</p>
          <div className="flex-1">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10, fontWeight: '900', fill: '#1E1E1E', textTransform: 'uppercase'}} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#1E1E1E', color: '#fff', borderRadius: '0px', border: 'none' }}
                  />
                  <Bar dataKey="value" fill="#1E1E1E" barSize={30}>
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      offset={10}
                      style={{ fill: '#F5BE01', fontSize: '12px', fontWeight: '900' }} 
                      formatter={(val: number) => `${val}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                 <span className="text-xs font-bold uppercase">Sem dados</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 border border-gray-200 shadow-sm h-[480px] flex flex-col">
          <h3 className="text-sm font-black text-black uppercase mb-1 flex items-center gap-2 tracking-wide">
            <Database size={16} className="text-primary" /> Tarifas
          </h3>
          <p className="text-[10px] text-gray-400 mb-6 font-bold uppercase tracking-wider">Identificadas nos Documentos</p>
          <div className="flex-1 overflow-visible">
            {tariffData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tariffData} layout="vertical" margin={{ left: 0, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10, fontWeight: '900', fill: '#1E1E1E', textTransform: 'uppercase'}} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#1E1E1E', color: '#fff', borderRadius: '0px', border: 'none' }}
                  />
                  <Bar dataKey="value" fill="#F5BE01" barSize={30}>
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      offset={10}
                      style={{ fill: '#000', fontSize: '12px', fontWeight: '900' }} 
                      formatter={(val: number) => `${val}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <span className="text-xs font-bold uppercase">Sem dados</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
