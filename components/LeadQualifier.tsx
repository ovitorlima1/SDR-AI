
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
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="text-yellow-500 fill-yellow-500" />
            LIA · Lead Intelligence Agent
          </h2>
          <p className="text-slate-500">Qualificação Profunda de Leads Agro & Indústria</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
           <Shield size={14} /> Análise 100% via Dados Públicos
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleQualify} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Nome da empresa ou Razão Social..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !companyName}
            className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" size={20} /> Analisando...</>
            ) : (
              'Gerar Relatório BILLI'
            )}
          </button>
        </form>
      </div>

      {/* Report Section - PDF Style */}
      {result && (
        <div className="bg-white border border-slate-200 shadow-2xl rounded-none p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900">BILLI · Lead Intelligence Agent (LIA)</h1>
                <p className="text-slate-600 font-medium">Alvo: {result.identification.razaoSocial}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-bold border border-green-200">
                  ✅ Análise Concluída
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <section>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                1. DADOS DE IDENTIFICAÇÃO (Públicos)
              </h3>
              <ul className="space-y-3 pl-2">
                <li className="flex gap-2"><span className="font-bold min-w-[150px]">Razão Social Provável:</span> {result.identification.razaoSocial}</li>
                <li className="flex gap-2"><span className="font-bold min-w-[150px]">CNPJ:</span> {result.identification.cnpj}</li>
                <li className="flex gap-2"><span className="font-bold min-w-[150px]">Atividade Principal:</span> {result.identification.cnae}</li>
                <li className="flex gap-2"><span className="font-bold min-w-[150px]">Localização:</span> {result.identification.localizacao}</li>
                <li className="flex gap-2"><span className="font-bold min-w-[150px]">Ecossistema:</span> {result.identification.ecossistema}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-4">
                2. ANÁLISE DOS EIXOS BILLI
              </h3>
              <div className="space-y-6 pl-2">
                <div>
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 mb-2">Eixo 1 — Relação com o Futuro (Antecipação vs. Realização)</h4>
                  <ul className="space-y-2 mb-2">
                    {result.eixos.eixo1.sinais.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-slate-900">•</span> 
                        <span className="font-bold text-slate-700">Sinal:</span> {s}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm"><span className="font-bold">Veredito:</span> {result.eixos.eixo1.veredito}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 mb-2">Eixo 2 — Estilo de Decisão (Ativo vs. Conservador)</h4>
                  <ul className="space-y-2 mb-2">
                    {result.eixos.eixo2.sinais.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-slate-900">•</span> 
                        <span className="font-bold text-slate-700">Sinal:</span> {s}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm"><span className="font-bold">Veredito:</span> {result.eixos.eixo2.veredito}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-4">
                3. SCORING TÉCNICO (0–12)
              </h3>
              <div className="border border-slate-900 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-900">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold border-r border-slate-900 w-1/3">Bloco de Análise</th>
                      <th className="px-4 py-2 text-left font-bold border-r border-slate-900 w-1/2">Evidência Encontrada</th>
                      <th className="px-4 py-2 text-left font-bold">Pontos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-900 font-bold bg-slate-50/50">A. Estrutura/Maturidade</td>
                      <td className="px-4 py-3 border-r border-slate-900">{result.scoring.maturity.evidence}</td>
                      <td className="px-4 py-3 font-bold text-center">+{result.scoring.maturity.points}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-900 font-bold bg-slate-50/50">B. Intensidade Energética</td>
                      <td className="px-4 py-3 border-r border-slate-900">{result.scoring.energy.evidence}</td>
                      <td className="px-4 py-3 font-bold text-center">+{result.scoring.energy.points}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-900 font-bold bg-slate-50/50">C. Relação com Capital</td>
                      <td className="px-4 py-3 border-r border-slate-900">{result.scoring.capital.evidence}</td>
                      <td className="px-4 py-3 font-bold text-center">+{result.scoring.capital.points}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-slate-900 font-bold bg-slate-50/50">D. Linguagem/Estratégia</td>
                      <td className="px-4 py-3 border-r border-slate-900">{result.scoring.language.evidence}</td>
                      <td className="px-4 py-3 font-bold text-center">+{result.scoring.language.points}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 font-bold text-right text-lg uppercase">
                👉 BILLI FIT SCORE FINAL: {result.scoring.total}/12
              </div>
            </section>

            <section className="bg-slate-50 p-6 border-l-4 border-slate-900">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                4. CLASSIFICAÇÃO DE PERFIL
              </h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-full text-2xl font-black shrink-0">
                  {result.profile.code}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">{result.profile.name} (Perfil Ideal)</h4>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold">Por que este perfil?</p>
                  <p className="text-slate-700">{result.profile.reason}</p>
                </div>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="text-slate-900">•</span> 
                    <span><span className="font-bold">A dor dele:</span> {result.profile.pain}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-slate-900">•</span> 
                    <span><span className="font-bold">A oportunidade:</span> {result.profile.opportunity}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-4">
                5. PRÓXIMOS PASSOS (Ação Recomendada)
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-red-700 mb-3">
                    ⛔ O que NÃO fazer (Abordagem de "Guardião"):
                  </h4>
                  <ul className="space-y-2 pl-6">
                    {result.nextSteps.donts.map((d, i) => (
                      <li key={i} className="text-sm list-disc">{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-green-700 mb-3">
                    ✅ O que FAZER (Abordagem de "Arquiteto"):
                  </h4>
                  <div className="pl-6 space-y-3">
                    <p className="text-sm italic border-l-2 border-green-200 pl-4 py-1">
                      <span className="font-bold not-italic block mb-1">Narrativa:</span>
                      "{result.nextSteps.do.narrative}"
                    </p>
                    <p className="text-sm font-bold flex items-center gap-2">
                      <Zap size={14} className="text-yellow-500" /> Gatilho Mental: {result.nextSteps.do.trigger}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {result.sources && result.sources.length > 0 && (
              <footer className="pt-8 border-t border-slate-100 flex flex-wrap gap-4 justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase w-full text-center">Fontes de Pesquisa LIA</span>
                {result.sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline">
                    <ExternalLink size={10} /> {s.title}
                  </a>
                ))}
              </footer>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
           <FileText size={64} className="mb-4 opacity-20" />
           <p className="text-lg font-medium">Aguardando solicitação de análise</p>
           <p className="text-sm">Digite o nome da empresa acima para iniciar o rastreamento LIA.</p>
        </div>
      )}
    </div>
  );
};
