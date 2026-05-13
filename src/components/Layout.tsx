import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  ListOrdered, 
  Wallet,
  Menu,
  X,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../store/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { setPrintWarningCallback } from '../lib/printUtils';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPrintWarningCallback(() => {
      setShowPrintWarning(true);
      setTimeout(() => setShowPrintWarning(false), 5000);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={24} />, label: 'Dash' },
    { to: '/pdv', icon: <ShoppingCart size={24} />, label: 'Vendas' },
    { to: '/produtos', icon: <Package size={24} />, label: 'Estoque' },
    { to: '/inventario', icon: <ClipboardList size={24} />, label: 'Ajuste' },
    { to: '/vendas', icon: <ListOrdered size={24} />, label: 'Lista' },
    { to: '/vales', icon: <Wallet size={24} />, label: 'Vales' },
    { to: '/relatorios', icon: <ClipboardList size={24} />, label: 'Relatórios' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Global Header */}
      <header className="print:hidden bg-red-950 text-white p-4 flex justify-between items-center shadow-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Adega Master Logo" 
            className="h-12 w-auto object-contain rounded"
            onError={(e) => {
              // Fallback se a imagem não estiver presente
              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/7f1d1d/ffffff?text=AM';
            }}
          />
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">
            ADEGA MASTER <span className="text-red-300 text-sm font-normal">| Gestão e Vendas</span>
          </h1>
          <h1 className="text-xl font-bold md:hidden">ADEGA</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 text-sm uppercase font-semibold text-red-100 items-center">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Sistema Operacional
            </span>
            <span className="hidden lg:inline">{format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
            {currentUser && (
              <div className="flex items-center gap-4 ml-2 border-l border-red-800 pl-4 h-6">
                <span className="text-[10px] sm:text-xs text-red-200 lowercase tracking-normal">{currentUser.email}</span>
                <button 
                  onClick={handleLogout}
                  className="text-red-300 hover:text-white transition-colors"
                  title="Sair do sistema"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden relative print:overflow-visible">
        
        {/* Print Warning Overlay */}
        {showPrintWarning && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 max-w-md w-[calc(100%-2rem)] print:hidden transition-all animate-bounce">
            <AlertTriangle className="shrink-0 mt-0.5 text-amber-600" size={20} />
            <div className="flex flex-col gap-1 text-sm font-medium">
              <strong className="font-bold text-amber-700">Impressão Bloqueada</strong>
              <p>O modo de visualização limita a impressão. Para imprimir, abra o aplicativo em uma <strong>nova guia</strong> clicando no ícone com a seta na parte superior direita da tela.</p>
            </div>
            <button onClick={() => setShowPrintWarning(false)} className="text-amber-500 hover:text-amber-700 shrink-0">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`print:hidden fixed inset-y-0 left-0 w-20 bg-slate-900 flex flex-col items-center py-6 gap-8 text-white z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {isMobileMenuOpen && (
            <button className="md:hidden text-slate-400 hover:text-white absolute top-4 right-4" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-opacity ${
                  isActive ? 'text-red-400 opacity-100' : 'opacity-50 hover:opacity-100 text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 border-2 rounded ${isActive ? 'border-red-400 bg-red-400/20' : 'border-white'}`}>
                     {item.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Content Area */}
        <section className="flex-1 overflow-auto p-4 flex flex-col">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
