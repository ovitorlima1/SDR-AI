
import React, { useState, useRef } from 'react';
import { Search, Filter, Building, Plus, FileSpreadsheet, Info } from 'lucide-react';
import { Client } from '../types';
import * as XLSX from 'xlsx';

interface ClientListProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  onQualify?: (companyName: string) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, setClients, onQualify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const segments = Array.from(new Set(clients.map(c => c.segment)));

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.cnpj && client.cnpj.includes(searchTerm));
    const matchesSegment = selectedSegment === 'all' || client.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const getSegmentColor = (segment: string) => {
    switch(segment) {
      case 'Não Segmentado': return 'bg-gray-100 text-gray-600';
      default: return 'bg-amber-50 text-amber-700 border border-amber-100';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (rows.length === 0) return;
      
      const firstRow = rows[0];
      const knownHeaders = ['NOME', 'EMPRESA', 'CNPJ', 'RAZAO', 'CARGO', 'EMAIL', 'INDUSTRIA', 'TARIFA', 'TIPO_TARIFA'];
      const hasHeader = firstRow.some(cell => typeof cell === 'string' && knownHeaders.some(h => String(cell).toUpperCase().includes(h)));
      
      let dataToProcess = hasHeader ? rows.slice(1) : rows;
      let headerMap: Record<string, number> = {};
      
      if (hasHeader) {
        firstRow.forEach((cell, idx) => { 
          if (cell) headerMap[String(cell).toUpperCase().trim()] = idx; 
        });
      }

      const importedClients: Client[] = dataToProcess.map((row): Client => {
        let name = 'Sem Nome';
        let company = 'Sem Empresa';
        let cnpj = '';
        let industry = 'Geral';
        let email = '';
        let role = 'Lead';
        let tariffType = '';

        if (hasHeader) {
          const cnpjIdx = headerMap['CNPJ'];
          const nameIdx = headerMap['NOME'] || headerMap['NAME'] || headerMap['CONTATO'];
          const companyIdx = headerMap['EMPRESA'] || headerMap['COMPANY'] || headerMap['RAZÃO SOCIAL'] || headerMap['RAZAO SOCIAL'];
          const emailIdx = headerMap['EMAIL'];
          const roleIdx = headerMap['CARGO'] || headerMap['ROLE'];
          const indIdx = headerMap['INDÚSTRIA'] || headerMap['INDUSTRIA'] || headerMap['SETOR'];
          const tariffIdx = headerMap['TIPO_TARIFA'] || headerMap['TIPO TARIFA'] || headerMap['TARIFA'] || headerMap['TIPO_DE_TARIFA'];

          cnpj = cnpjIdx !== undefined ? String(row[cnpjIdx] || '') : '';
          company = String(row[companyIdx] || cnpj || 'Sem Empresa');
          name = String(row[nameIdx] || (cnpj ? `Lead CNPJ: ${cnpj}` : 'Sem Nome'));
          email = String(row[emailIdx] || '');
          role = String(row[roleIdx] || 'Lead');
          industry = String(row[indIdx] || 'Geral');
          tariffType = tariffIdx !== undefined ? String(row[tariffIdx] || '') : '';
        } else {
          company = String(row[0] || 'Sem Empresa');
          name = `Importado: ${company}`;
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name, 
          company, 
          cnpj, 
          industry, 
          email, 
          role, 
          employees: 0, 
          segment: 'Não Segmentado', 
          category: 'Não Definido', 
          state: '',
          tariffType
        };
      }).filter(c => c.company !== 'undefined' && c.company !== 'null' && c.company !== '');

      if (importedClients.length > 0) setClients(importedClients);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Carteira de Clientes</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
            <Info size={14} className="text-primary" />
            <span>Colunas aceitas: Empresa, CNPJ, Tipo_Tarifa, Email, Nome.</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"><FileSpreadsheet size={18} className="mr-2 text-green-600" />Importar Excel</button>
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
           <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-primary text-slate-900 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-bold"><Plus size={18} className="mr-2" />Novo Cliente</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, empresa, CNPJ ou tarifa..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
          >
            <option value="all">Todos os Segmentos</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead / Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Segmento IA</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa / CNPJ / Tarifa</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold mr-3">{client.name.charAt(0)}</div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{client.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{client.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSegmentColor(client.segment)}`}>{client.segment}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <Building size={14} className="mr-2 text-slate-300" />
                        {client.company}
                      </div>
                      {client.cnpj && (
                        <div className="text-[10px] text-slate-400 font-mono">CNPJ: {client.cnpj}</div>
                      )}
                      {client.tariffType && (
                        <div className="flex items-center text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mt-1 uppercase tracking-tighter">⚡ {client.tariffType}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onQualify && onQualify(client.company)} className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-primary text-slate-900 hover:bg-primary/90 transition-all shadow-md font-black text-xs uppercase">QUALIFICAR</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
