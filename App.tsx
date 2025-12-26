
import React, { useState, useEffect } from 'react';
import { Lock, X, Minus, Square } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MassProductUpdate from './components/MassProductUpdate';
import POS from './components/POS';
import Remitos from './components/Remitos';
import Presupuestos from './components/Presupuestos';
import Assistant from './components/Assistant';
import Treasury from './components/Treasury';
import Purchases from './components/Purchases';
import Clients from './components/Clients';
import ClientBalances from './components/ClientBalances';
import Accounting from './components/Accounting';
import Statistics from './components/Statistics';
import Backup from './components/Backup';
import Branches from './components/Branches';
import UsersComponent from './components/Users';
import PriceUpdates from './components/PriceUpdates';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';
import SalesOrders from './components/SalesOrders';
import PrintSettings from './components/PrintSettings';
import CompanySettings from './components/CompanySettings';
import OnlineSales from './components/OnlineSales';
import AfipConfig from './components/AfipConfig';
import Reports from './components/Reports';
import LabelPrinting from './components/LabelPrinting';
import DailyMovements from './components/DailyMovements';
import Employees from './components/Employees';
import Login from './components/Login';
import CustomerPortal from './components/CustomerPortal';
import StockTransfers from './components/StockTransfers';
import ConfigPanel from './components/ConfigPanel';
import Currencies from './components/Currencies';
import Marketing from './components/Marketing';
import PriceAudit from './components/PriceAudit';
import CreditNotes from './components/CreditNotes';
import PublicPortal from './components/PublicPortal';
import { ViewState, User, Role, Client, InvoiceItem } from './types';

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  
  const [isPublicMode, setIsPublicMode] = useState(() => {
      return window.location.search.includes('view=fidelidad');
  });

  const [openViews, setOpenViews] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  
  const [targetClientId, setTargetClientId] = useState<string | undefined>(undefined);
  const [portalPreviewClient, setPortalPreviewClient] = useState<Client | null>(null);
  
  // Estados de transferencia de datos entre módulos
  const [itemsToBill, setItemsToBill] = useState<InvoiceItem[] | null>(null);
  const [itemsToRemito, setItemsToRemito] = useState<InvoiceItem[] | null>(null);
  const [itemsToBudget, setItemsToBudget] = useState<InvoiceItem[] | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('ferrecloud_session');
    if (savedSession) {
        setLoggedInUser(JSON.parse(savedSession));
    }
  }, []);

  const handleNavigate = (view: ViewState) => {
    if (!openViews.includes(view)) {
      setOpenViews([...openViews, view]);
    }
    setActiveView(view);
  };

  const closeView = (view: ViewState, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (view === ViewState.DASHBOARD) return; 
    
    const newViews = openViews.filter(v => v !== view);
    setOpenViews(newViews);
    if (activeView === view) {
      setActiveView(newViews[newViews.length - 1]);
    }
  };

  const handleLogin = (user: User) => {
    setLoggedInUser(user);
    localStorage.setItem('ferrecloud_session', JSON.stringify(user));
    setActiveView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setPortalPreviewClient(null);
    localStorage.removeItem('ferrecloud_session');
    setOpenViews([ViewState.DASHBOARD]);
    setActiveView(ViewState.DASHBOARD);
  };

  const handleConvertToSale = (items: InvoiceItem[]) => {
      setItemsToBill(items);
      handleNavigate(ViewState.POS);
  };

  const handleConvertToRemito = (items: InvoiceItem[]) => {
      setItemsToRemito(items);
      handleNavigate(ViewState.REMITOS);
  };

  const handleConvertToBudget = (items: InvoiceItem[]) => {
      setItemsToBudget(items);
      handleNavigate(ViewState.PRESUPUESTOS);
  };

  const renderViewContent = (view: ViewState) => {
    switch (view) {
      case ViewState.DASHBOARD: return <Dashboard onNavigate={handleNavigate} />;
      case ViewState.INVENTORY: return <Inventory />;
      case ViewState.MASS_PRODUCT_UPDATE: return <MassProductUpdate />;
      case ViewState.STOCK_TRANSFERS: return <StockTransfers />;
      case ViewState.POS: return (
        <POS 
            initialCart={itemsToBill || undefined} 
            onCartUsed={() => setItemsToBill(null)} 
            onTransformToRemito={handleConvertToRemito}
            onTransformToBudget={handleConvertToBudget}
        />
      );
      case ViewState.SALES_ORDERS: return <SalesOrders />;
      case ViewState.ONLINE_SALES: return <OnlineSales />;
      case ViewState.REMITOS: return (
        <Remitos 
            initialItems={itemsToRemito || undefined}
            onItemsConsumed={() => setItemsToRemito(null)}
            onBillRemitos={handleConvertToSale} 
        />
      );
      case ViewState.PRESUPUESTOS: return (
        <Presupuestos 
            initialItems={itemsToBudget || undefined}
            onItemsConsumed={() => setItemsToBudget(null)}
            onConvertToSale={handleConvertToSale} 
            onConvertToRemito={handleConvertToRemito}
        />
      );
      case ViewState.TREASURY: return <Treasury />;
      case ViewState.PURCHASES: return <Purchases defaultTab="PURCHASES" onNavigateToPrices={() => handleNavigate(ViewState.PRICE_UPDATES)} />;
      case ViewState.PROVIDERS: return <Purchases defaultTab="PROVIDERS" onNavigateToPrices={() => handleNavigate(ViewState.PRICE_UPDATES)} />;
      case ViewState.PRICE_UPDATES: return <PriceUpdates />;
      case ViewState.PRICE_AUDIT: return <PriceAudit />;
      case ViewState.CREDIT_NOTES: return <CreditNotes />;
      case ViewState.CURRENCIES: return <Currencies />;
      case ViewState.MARKETING: return <Marketing />;
      case ViewState.CLIENTS: return (
        <Clients 
            initialClientId={targetClientId} 
            onOpenPortal={(client) => {
                setPortalPreviewClient(client);
                handleNavigate(ViewState.CUSTOMER_PORTAL);
            }}
        />
      );
      case ViewState.CLIENT_BALANCES: return (
        <ClientBalances 
            onNavigateToHistory={(client) => {
                setTargetClientId(client.id);
                handleNavigate(ViewState.CLIENTS);
            }} 
        />
      );
      case ViewState.ACCOUNTING: return <Accounting />;
      case ViewState.STATISTICS: return <Statistics />;
      case ViewState.REPORTS: return <Reports />;
      case ViewState.BACKUP: return <Backup />;
      case ViewState.BRANCHES: return <Branches />;
      case ViewState.USERS: return <UsersComponent />;
      case ViewState.AI_ASSISTANT: return <Assistant />;
      case ViewState.REPLENISHMENT: return <Replenishment />;
      case ViewState.SHORTAGES: return <Shortages onGenerateOrders={(items) => { /* handle */ }} />;
      case ViewState.PRINT_CONFIG: return <PrintSettings />;
      case ViewState.LABEL_PRINTING: return <LabelPrinting />;
      case ViewState.COMPANY_SETTINGS: return <CompanySettings />;
      case ViewState.AFIP_CONFIG: return <AfipConfig />;
      case ViewState.DAILY_MOVEMENTS: return <DailyMovements />;
      case ViewState.EMPLOYEES: return <Employees />;
      case ViewState.CONFIG_PANEL: return <ConfigPanel onNavigate={handleNavigate} />;
      case ViewState.CUSTOMER_PORTAL: return portalPreviewClient ? <CustomerPortal client={portalPreviewClient} onLogout={() => closeView(ViewState.CUSTOMER_PORTAL)} /> : null;
      case ViewState.PUBLIC_PORTAL: return <PublicPortal />;
      default: return null;
    }
  };

  if (isPublicMode) {
      return <PublicPortal />;
  }

  if (!loggedInUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans overflow-hidden">
      <Sidebar 
        currentView={activeView} 
        onNavigate={handleNavigate} 
        user={loggedInUser} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 relative bg-slate-100 overflow-hidden">
        {openViews.map((view) => (
          <div 
            key={view}
            className={`absolute inset-0 transition-opacity duration-300 ${activeView === view ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          >
            {renderViewContent(view)}
          </div>
        ))}
      </main>

      <footer className="h-14 bg-slate-900 border-t border-slate-800 flex items-center px-4 gap-2 z-50 overflow-x-auto shrink-0 no-scrollbar">
        {openViews.map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex items-center gap-3 px-4 h-10 rounded-xl transition-all border ${
              activeView === view 
                ? 'bg-ferre-orange text-white border-orange-400 shadow-lg shadow-orange-900/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {view === ViewState.DASHBOARD ? 'Escritorio' : view.replace(/_/g, ' ')}
            </span>
            {view !== ViewState.DASHBOARD && (
              <X 
                size={14} 
                className="hover:text-white" 
                onClick={(e) => closeView(view, e)} 
              />
            )}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default App;
