
import React from 'react';
import { LayoutDashboard, Users, Send, Menu, Target, LogOut } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 text-sm font-bold transition-all rounded-xl mb-2
        ${currentView === view 
          ? 'bg-primary text-black shadow-lg shadow-primary/20 translate-x-1' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <Icon size={20} className={`mr-3 ${currentView === view ? 'text-black' : 'text-gray-500'}`} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-secondary border-r border-black relative">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-black text-white flex items-center tracking-tighter">
            <span className="w-10 h-10 bg-primary rounded-xl mr-3 flex items-center justify-center text-black text-xl shadow-lg shadow-primary/20">S</span>
            Severino
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 pl-1">Intelligence System</p>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <p className="px-4 text-[10px] font-black text-gray-600 uppercase mb-4 tracking-widest">Menu Principal</p>
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="clients" icon={Users} label="Carteira de Clientes" />
          <NavItem view="qualifier" icon={Target} label="Qualificador Severino" />
          <NavItem view="campaigns" icon={Send} label="Campanhas" />
        </nav>

        <div className="p-4 m-4 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-black font-black text-xs border-2 border-secondary shadow-lg">
              SV
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Severino</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Assistente Geral</p>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent z-50"></div>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-secondary text-white border-b border-black">
          <h1 className="font-bold text-lg flex items-center gap-2">
             <span className="w-6 h-6 bg-primary rounded flex items-center justify-center text-black text-xs font-black">S</span>
             Severino
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-secondary p-4">
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white">
                ✕
              </button>
            </div>
            <nav className="space-y-2">
              <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem view="clients" icon={Users} label="Clientes" />
              <NavItem view="qualifier" icon={Target} label="Qualificador Severino" />
              <NavItem view="campaigns" icon={Send} label="Campanhas" />
            </nav>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
