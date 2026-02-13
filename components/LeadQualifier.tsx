
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Zap, ExternalLink, Shield, FileText, CheckCircle, AlertCircle, MapPin, Building2, TrendingUp, HelpCircle } from 'lucide-react';
import { BilliAnalysis } from '../types';
import { qualifyCompany } from '../services/geminiService';

interface LeadQualifierProps {
  initialCompanyName?: string;
  onClearInitial?: () => void;
}

export const LeadQualifier: React.FC<LeadQualifierProps> = ({ initialCompanyName, onClearInitial }) => {
  const [companyName, setCompanyName] = useState(initialCompanyName || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BilliAnalysis | null>(null);

  const performQualification = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await qualifyCompany(name);
      setResult(data);
    } catch (error) {
      alert("Erro ao qualificar empresa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCompanyName) {
      setCompanyName(initialCompanyName);
      performQualification(initialCompanyName);
      if (onClearInitial) onClearInitial();
    }
  }, [initialCompanyName]);

  const handleQualify = (e: React.FormEvent) => {
    e.preventDefault();
    performQualification(companyName);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary p-2">
                <Shield className="text-black" size={24} />
            </div>
            <h2 className="text-3xl font-black text-black tracking-tighter">Qualificador Severino</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
           Análise via Dados Públicos
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-8 border border-gray-200 shadow-sm">
        <form onSubmit={handleQualify} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Digite a Razão Social ou CNPJ para análise profunda..."
              className="w-full pl-14 pr-6 py-5 bg-gray-50 text-black placeholder-gray-400 border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold text-lg transition-all"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !companyName}
            className="px-10 py-5 bg-black text-white font-black hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] shadow-lg uppercase tracking-wider text-sm"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" size={20} /> Rastreando...</>
            ) : (
              'Gerar Relatório'
            )}
          </button>
        </form>
      </div>

      {/* Report Section - PDF Style */}
      {result && (
        <div className="bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(30,30,30,1)] p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="border-b-4 border-black pb-8 mb-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-black tracking-tighter uppercase">Relatório de Inteligência</h1>
                <p className="text-black font-bold uppercase text-xs tracking-[0.2em] mt-2 bg-primary inline-block px-2 py-1">Alvo: {result.identification.razaoSocial}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest">
                  ✅ Concluído
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <h3 className="text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">1</div> DADOS DE IDENTIFICAÇÃO
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-gray-50 p-6 border-l-4 border-primary">
                <li className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Razão Social</span> <span className="font-bold text-black text-lg">{result.identification.razaoSocial}</span></li>
                <li className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">CNPJ</span> <span className="font-bold text-black text-lg">{result.identification.cnpj}</span></li>
                <li className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Atividade (CNAE)</span> <span className="font-bold text-black">{result.identification.cnae}</span></li>
                <li className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Localização</span> <span className="font-bold text-black">{result.identification.localizacao}</span></li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">2</div> ANÁLISE DOS EIXOS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white border-2 border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                  <h4 className="font-black text-black text-sm uppercase mb-4 pb-2 border-b border-gray-100">Eixo 1 — Futuro</h4>
                  <ul className="space-y-3 mb-6">
                    {result.eixos.eixo1.sinais.map((s, i) => (
                      <li key={i} className="text-xs flex gap-3 text-gray-600 font-medium">
                        <span className="text-primary font-bold">■</span> {s}
                      </li>
                    ))}
                  </ul>
                  <div className="p-3 bg-secondary text-white text-xs font-medium border-l-4 border-primary">
                    <span className="font-black text-primary block text-[10px] uppercase tracking-widest mb-1">VEREDITO</span> {result.eixos.eixo1.veredito}
                  </div>
                </div>

                <div className="p-6 bg-white border-2 border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                  <h4 className="font-black text-black text-sm uppercase mb-4 pb-2 border-b border-gray-100">Eixo 2 — Decisão</h4>
                  <ul className="space-y-3 mb-6">
                    {result.eixos.eixo2.sinais.map((s, i) => (
                      <li key={i} className="text-xs flex gap-3 text-gray-600 font-medium">
                        <span className="text-primary font-bold">■</span> {s}
                      </li>
                    ))}
                  </ul>
                  <div className="p-3 bg-secondary text-white text-xs font-medium border-l-4 border-primary">
                    <span className="font-black text-primary block text-[10px] uppercase tracking-widest mb-1">VEREDITO</span> {result.eixos.eixo2.veredito}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                 <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">3</div> SCORING TÉCNICO
              </h3>
              <div className="border-2 border-black">
                <table className="w-full text-xs">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-black uppercase tracking-widest w-1/3">Bloco de Análise</th>
                      <th className="px-6 py-4 text-left font-black uppercase tracking-widest w-1/2">Evidência</th>
                      <th className="px-6 py-4 text-center font-black uppercase tracking-widest text-primary">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-5 font-bold bg-gray-50 text-black uppercase text-[10px] tracking-wide">Estrutura e Maturidade</td>
                      <td className="px-6 py-5 text-gray-700 font-medium">{result.scoring.maturity.evidence}</td>
                      <td className="px-6 py-5 font-black text-center text-lg">+{result.scoring.maturity.points}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-5 font-bold bg-gray-50 text-black uppercase text-[10px] tracking-wide">Intensidade Energética</td>
                      <td className="px-6 py-5 text-gray-700 font-medium">{result.scoring.energy.evidence}</td>
                      <td className="px-6 py-5 font-black text-center text-lg">+{result.scoring.energy.points}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-5 font-bold bg-gray-50 text-black uppercase text-[10px] tracking-wide">Relação com Capital</td>
                      <td className="px-6 py-5 text-gray-700 font-medium">{result.scoring.capital.evidence}</td>
                      <td className="px-6 py-5 font-black text-center text-lg">+{result.scoring.capital.points}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end items-center gap-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score Final Calculado</span>
                <div className="text-3xl font-black text-black bg-primary px-4 py-1">
                  {result.scoring.total}<span className="text-base align-top opacity-50">/12</span>
                </div>
              </div>
            </section>

            <section className="bg-secondary p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-8 relative z-10">
                4. PERFIL COMPORTAMENTAL
              </h3>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                <div className="w-24 h-24 bg-primary text-black flex items-center justify-center text-4xl font-black shrink-0 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                  {result.profile.code}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-4xl font-black text-white tracking-tighter mb-2">{result.profile.name}</h4>
                  <p className="text-gray-400 text-sm font-medium italic leading-relaxed max-w-2xl">"{result.profile.reason}"</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 relative z-10 border-t border-white/10 pt-8">
                <div className="space-y-2">
                  <p className="font-black text-red-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span> A Dor Latente
                  </p>
                  <p className="text-gray-300 font-medium">{result.profile.pain}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-black text-primary text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span> A Oportunidade
                  </p>
                  <p className="text-white font-bold">{result.profile.opportunity}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">5</div> PRÓXIMOS PASSOS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-white border-2 border-red-100">
                  <h4 className="flex items-center gap-2 font-black text-red-600 text-xs uppercase mb-6 tracking-widest">
                    ⛔ O Que Não Fazer
                  </h4>
                  <ul className="space-y-4">
                    {result.nextSteps.donts.map((d, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-3">
                        <span className="text-red-400 font-bold">✕</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 bg-gray-50 border-2 border-green-200">
                  <h4 className="flex items-center gap-2 font-black text-green-700 text-xs uppercase mb-6 tracking-widest">
                    ✅ Narrativa Vencedora
                  </h4>
                  <div className="space-y-6">
                    <div className="p-5 bg-white shadow-sm border-l-4 border-green-500">
                      <p className="text-sm text-gray-800 font-medium italic leading-relaxed">
                         "{result.nextSteps.do.narrative}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-black text-primary">
                         <Zap size={18} fill="currentColor" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Gatilho de Ação</span>
                        <span className="text-sm font-bold text-black">{result.nextSteps.do.trigger}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {result.sources && result.sources.length > 0 && (
              <footer className="pt-10 border-t-2 border-gray-100 flex flex-col items-center gap-4">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Fontes Verificadas</span>
                <div className="flex flex-wrap justify-center gap-6">
                  {result.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black hover:underline transition-colors">
                      <ExternalLink size={12} /> {s.title}
                    </a>
                  ))}
                </div>
              </footer>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-gray-50 border-2 border-dashed border-gray-200">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
             <FileText size={48} className="opacity-20 text-black" />
           </div>
           <p className="text-2xl font-black text-gray-400 uppercase tracking-tighter">Aguardando Comando</p>
           <p className="text-sm font-medium mt-2 text-gray-500">Busque uma empresa acima para iniciar a qualificação.</p>
        </div>
      )}
    </div>
  );
};
