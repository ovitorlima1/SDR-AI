
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="text-primary fill-primary" size={28} />
            <h2 className="text-3xl font-black text-[#0f172a]">Qualificador Billi</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <Shield size={14} className="text-primary" /> Análise via Dados Públicos
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleQualify} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Digite a Razão Social ou CNPJ para análise profunda..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg shadow-inner transition-all"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !companyName}
            className="px-8 py-4 bg-primary text-slate-900 font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] shadow-lg shadow-primary/30 uppercase tracking-tighter"
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
        <div className="bg-white border border-slate-200 shadow-2xl rounded-none p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="border-b-2 border-[#0f172a] pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-[#0f172a]">Qualificador Billi</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Alvo Identificado: {result.identification.razaoSocial}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black border border-green-200 uppercase tracking-tighter">
                  ✅ Inteligência Concluída
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <section>
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary"></div> 1. DADOS DE IDENTIFICAÇÃO (Públicos)
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pl-2 text-sm">
                <li className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase">Razão Social:</span> <span className="font-bold text-slate-700">{result.identification.razaoSocial}</span></li>
                <li className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase">CNPJ:</span> <span className="font-bold text-slate-700">{result.identification.cnpj}</span></li>
                <li className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase">Atividade:</span> <span className="font-bold text-slate-700">{result.identification.cnae}</span></li>
                <li className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase">Estado:</span> <span className="font-bold text-slate-700">{result.identification.localizacao}</span></li>
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary"></div> 2. ANÁLISE DOS EIXOS BILLI
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-[#0f172a] text-xs uppercase mb-3 border-b border-slate-200 pb-2">Eixo 1 — Futuro</h4>
                  <ul className="space-y-2 mb-4">
                    {result.eixos.eixo1.sinais.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2">
                        <span className="text-primary font-bold">•</span> 
                        <span className="text-slate-600">{s}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-2 bg-white rounded border border-slate-100 text-[11px] font-medium text-slate-700">
                    <span className="font-black text-[#0f172a]">VEREDITO:</span> {result.eixos.eixo1.veredito}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-[#0f172a] text-xs uppercase mb-3 border-b border-slate-200 pb-2">Eixo 2 — Decisão</h4>
                  <ul className="space-y-2 mb-4">
                    {result.eixos.eixo2.sinais.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2">
                        <span className="text-primary font-bold">•</span> 
                        <span className="text-slate-600">{s}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-2 bg-white rounded border border-slate-100 text-[11px] font-medium text-slate-700">
                    <span className="font-black text-[#0f172a]">VEREDITO:</span> {result.eixos.eixo2.veredito}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider mb-4 flex items-center gap-2">
                 <div className="w-1.5 h-4 bg-primary"></div> 3. SCORING TÉCNICO
              </h3>
              <div className="border-2 border-[#0f172a] overflow-hidden rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-[#0f172a] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-black uppercase tracking-tighter w-1/3">Bloco de Análise</th>
                      <th className="px-4 py-3 text-left font-black uppercase tracking-tighter w-1/2">Evidência Identificada</th>
                      <th className="px-4 py-3 text-center font-black uppercase tracking-tighter">Pontos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-4 font-bold bg-slate-50/50">Estrutura e Maturidade</td>
                      <td className="px-4 py-4 text-slate-600">{result.scoring.maturity.evidence}</td>
                      <td className="px-4 py-4 font-black text-center text-primary">+{result.scoring.maturity.points}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 font-bold bg-slate-50/50">Intensidade Energética</td>
                      <td className="px-4 py-4 text-slate-600">{result.scoring.energy.evidence}</td>
                      <td className="px-4 py-4 font-black text-center text-primary">+{result.scoring.energy.points}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 font-bold bg-slate-50/50">Relação com Capital</td>
                      <td className="px-4 py-4 text-slate-600">{result.scoring.capital.evidence}</td>
                      <td className="px-4 py-4 font-black text-center text-primary">+{result.scoring.capital.points}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 font-bold bg-slate-50/50">Linguagem Estratégica</td>
                      <td className="px-4 py-4 text-slate-600">{result.scoring.language.evidence}</td>
                      <td className="px-4 py-4 font-black text-center text-primary">+{result.scoring.language.points}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 font-black text-right text-xl uppercase tracking-tighter text-[#0f172a]">
                👉 BILLI FIT SCORE: <span className="text-primary">{result.scoring.total}/12</span>
              </div>
            </section>

            <section className="bg-[#0f172a] p-8 border-l-8 border-primary rounded-r-xl text-white">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                4. CLASSIFICAÇÃO DE PERFIL IDEAL
              </h3>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-primary text-slate-900 flex items-center justify-center rounded-full text-3xl font-black shrink-0 shadow-lg shadow-primary/20">
                  {result.profile.code}
                </div>
                <div>
                  <h4 className="text-3xl font-black">{result.profile.name}</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase mt-1">SDR Recomendado: SDR Billi</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div className="space-y-2">
                  <p className="font-black text-primary text-[10px] uppercase tracking-widest">Racional da IA</p>
                  <p className="text-slate-300 leading-relaxed italic">"{result.profile.reason}"</p>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1 h-10 bg-red-500 shrink-0 mt-1"></div>
                    <div>
                      <p className="font-black text-red-400 text-[10px] uppercase tracking-widest">A Dor do Lead</p>
                      <p className="text-slate-100">{result.profile.pain}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 h-10 bg-green-500 shrink-0 mt-1"></div>
                    <div>
                      <p className="font-black text-green-400 text-[10px] uppercase tracking-widest">A Oportunidade Billi</p>
                      <p className="text-slate-100">{result.profile.opportunity}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary"></div> 5. ESTRATÉGIA DE ABORDAGEM (Next Steps)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border-2 border-red-50 rounded-xl">
                  <h4 className="flex items-center gap-2 font-black text-red-700 text-xs uppercase mb-4">
                    ⛔ BLOQUEIOS (Não fazer):
                  </h4>
                  <ul className="space-y-3">
                    {result.nextSteps.donts.map((d, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-red-300 font-bold">✕</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 border-2 border-green-50 rounded-xl bg-green-50/20">
                  <h4 className="flex items-center gap-2 font-black text-green-700 text-xs uppercase mb-4">
                    ✅ NARRATIVA VENCEDORA:
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-green-100 relative">
                      <p className="text-sm text-slate-700 italic leading-relaxed">
                         "{result.nextSteps.do.narrative}"
                      </p>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                      <Zap size={16} className="text-primary fill-primary" />
                      <span className="text-[10px] font-black text-primary uppercase">Gatilho: {result.nextSteps.do.trigger}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {result.sources && result.sources.length > 0 && (
              <footer className="pt-8 border-t border-slate-100 flex flex-wrap gap-4 justify-center">
                <span className="text-[10px] font-black text-slate-300 uppercase w-full text-center tracking-[0.2em] mb-2">Fontes Verificadas via Billi Intelligence</span>
                {result.sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">
                    <ExternalLink size={10} /> {s.title}
                  </a>
                ))}
              </footer>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
             <FileText size={40} className="opacity-20 text-slate-900" />
           </div>
           <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">Aguardando Comando</p>
           <p className="text-sm font-medium mt-1">Busque uma empresa acima para iniciar a qualificação profunda.</p>
        </div>
      )}
    </div>
  );
};
