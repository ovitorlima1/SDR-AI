import React from 'react';
import { LayoutDashboard, Users, Send, Menu, Target } from 'lucide-react';
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
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1
        ${currentView === view 
          ? 'bg-primary/10 text-primary' 
          : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
      <Icon size={20} className="mr-3" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-800 flex items-center">
            <span className="w-8 h-8 bg-primary rounded-lg mr-2 flex items-center justify-center text-white text-lg">S</span>
            SDR Agent
          </h1>
        </div>
        
        <nav className="flex-1 p-4">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="clients" icon={Users} label="Clientes" />
          <NavItem view="qualifier" icon={Target} label="Qualificador BILLI" />
          <NavItem view="campaigns" icon={Send} label="Campanhas" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
              JD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700">João Doe</p>
              <p className="text-xs text-slate-500">SDR Senior</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <h1 className="font-bold text-lg text-slate-800">SDR Agent</h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-white md:hidden p-4">
            <div className="flex justify-end mb-4">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600">
                ✕
              </button>
            </div>
            <nav>
              <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem view="clients" icon={Users} label="Clientes" />
              <NavItem view="qualifier" icon={Target} label="Qualificador BILLI" />
              <NavItem view="campaigns" icon={Send} label="Campanhas" />
            </nav>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};