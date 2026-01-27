import React, { useState, useRef } from 'react';
import { Search, Filter, Briefcase, Users, Building, Plus, Upload, X, Download } from 'lucide-react';
import { Client } from '../types';
import * as XLSX from 'xlsx';

interface ClientListProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, setClients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Client State
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    company: '',
    role: '',
    industry: '',
    employees: 0,
    segment: 'Não Segmentado'
  });

  const segments = Array.from(new Set(clients.map(c => c.segment)));

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === 'all' || client.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const getSegmentColor = (segment: string) => {
    switch(segment) {
      case 'Não Segmentado': return 'bg-gray-100 text-gray-600';
      default: return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.company) return;

    const clientToAdd: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClient.name!,
      email: newClient.email || '',
      company: newClient.company!,
      role: newClient.role || '',
      industry: newClient.industry || 'Outros',
      employees: Number(newClient.employees) || 1,
      segment: 'Não Segmentado',
      ...newClient as any
    };

    setClients([clientToAdd, ...clients]);
    setIsModalOpen(false);
    setNewClient({
      name: '', email: '', company: '', role: '', industry: '', employees: 0, segment: 'Não Segmentado'
    });
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
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      // Map Excel columns to our structure based on user request:
      // Col AV: NOME
      // Col B: EMPRESA
      // Col P: TIPO_TARIFA (mapped to Industry/Sector context)
      const importedClients: Client[] = data.map((row: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: row['NOME'] || row['Nome'] || 'Sem Nome',
        company: row['EMPRESA'] || row['Empresa'] || 'Sem Empresa',
        // Using TIPO_TARIFA as Industry/Sector proxy
        industry: row['TIPO_TARIFA'] || row['Tipo Tarifa'] || 'Energia',
        email: row['EMAIL'] || row['Email'] || '',
        role: row['CARGO'] || row['Cargo'] || 'Contato',
        employees: Number(row['Funcionarios'] || row['Employees']) || 1,
        segment: 'Não Segmentado'
      }));

      if (importedClients.length > 0) {
        setClients([...importedClients, ...clients]);
        alert(`${importedClients.length} clientes importados com sucesso!`);
      } else {
        alert("Nenhum dado válido encontrado no Excel. Verifique se as colunas NOME, EMPRESA e TIPO_TARIFA existem.");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Carteira de Clientes</h2>
          <p className="text-slate-500">Gerencie e visualize seus leads detalhadamente.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
           >
            <Upload size={18} className="mr-2" />
            Importar Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou empresa..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white"
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
          >
            <option value="all">Todos os Segmentos</option>
            {segments.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Segmento & Racional</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{client.name}</div>
                        <div className="text-sm text-slate-500">{client.role}</div>
                        <div className="text-xs text-slate-400">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(client.segment)}`}>
                      {client.segment}
                    </span>
                    {client.aiRationale && (
                      <p className="mt-2 text-xs text-slate-500 italic max-w-xs">
                        "{client.aiRationale}"
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Building size={14} className="mr-2 text-slate-400" />
                        {client.company}
                      </div>
                      <div className="flex items-center">
                        <Briefcase size={14} className="mr-2 text-slate-400" />
                        {client.industry}
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2 text-slate-400" />
                        {client.employees} funcionários
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    {clients.length === 0 ? "Nenhum cliente cadastrado. Importe um Excel ou adicione manualmente." : "Nenhum cliente encontrado com os filtros atuais."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Novo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                  <input
                    required
                    name="company"
                    value={newClient.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Ex: Acme Corp"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Indústria</label>
                   <input
                    name="industry"
                    value={newClient.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Ex: Tecnologia"
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
                <input
                  type="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  placeholder="joao@acme.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                   <input
                    name="role"
                    value={newClient.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Ex: CEO"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Funcionários</label>
                   <input
                    type="number"
                    name="employees"
                    value={newClient.employees}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="100"
                   />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit" 
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                 >
                   Salvar Cliente
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};