
import React, { useState, useEffect } from 'react';
import { X, Smartphone, ShoppingBag } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MassProductUpdate from './components/MassProductUpdate';
import SalesManagement from './components/SalesManagement';
import Assistant from './components/Assistant';
import Treasury from './components/Treasury';
import Purchases from './components/Purchases';
import Providers from './components/Providers';
import Clients from './components/Clients';
import ClientBalances from './components/ClientBalances';
import ProviderBalances from './components/ProviderBalances';
import Accounting from './components/Accounting';
import Statistics from './components/Statistics';
import Backup from './components/Backup';
import Branches from './components/Branches';
import UsersComponent from './components/Users';
import PriceUpdates from './components/PriceUpdates';
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
import Shop from './components/Shop';
import EcommerceAdmin from './components/EcommerceAdmin';
import CompanySettings from './components/CompanySettings';
import { ViewState, User, Client, InvoiceItem, Provider } from './types';

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [openViews, setOpenViews] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [portalPreviewClient, setPortalPreviewClient] = useState<Client | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('ferrecloud_session');
    if (savedSession) setLoggedInUser(JSON.parse(savedSession));
  }, []);

  const handleNavigate = (view: ViewState) => {
    if (!openViews.includes(view)) setOpenViews([...openViews, view]);
    setActiveView(view);
  };

  const closeView = (view: ViewState, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (view === ViewState.DASHBOARD) return; 
    const newViews = openViews.filter(v => v !== view);
    setOpenViews(newViews);
    if (activeView === view) setActiveView(newViews[newViews.length - 1]);
  };

  const renderViewContent = (view: ViewState) => {
    if ([ViewState.POS, ViewState.SALES_ORDERS, ViewState.CREDIT_NOTES, ViewState.REMITOS, ViewState.PRESUPUESTOS].includes(view)) {
        let tab: any = 'POS';
        if (view === ViewState.SALES_ORDERS) tab = 'ORDERS';
        if (view === ViewState.CREDIT_NOTES) tab = 'CREDIT_NOTES';
        if (view === ViewState.REMITOS) tab = 'REMITOS';
        if (view === ViewState.PRESUPUESTOS) tab = 'BUDGETS';
        return <SalesManagement initialTab={tab} onCartUsed={() => {}} />;
    }

    if ([ViewState.PURCHASES, ViewState.REPLENISHMENT, ViewState.SHORTAGES].includes(view)) {
        let tab: any = 'PURCHASES';
        if (view === ViewState.REPLENISHMENT) tab = 'REPLENISHMENT';
        if (view === ViewState.SHORTAGES) tab = 'SHORTAGES';
        return <Purchases defaultTab={tab} onNavigateToPrices={() => handleNavigate(ViewState.PRICE_UPDATES)} />;
    }

    switch (view) {
      case ViewState.DASHBOARD: return <Dashboard onNavigate={handleNavigate} />;
      case ViewState.INVENTORY: return <Inventory />;
      case ViewState.PROVIDERS: return <Providers />;
      case ViewState.MASS_PRODUCT_UPDATE: return <MassProductUpdate />;
      case ViewState.STOCK_TRANSFERS: return <StockTransfers />;
      case ViewState.TREASURY: return <Treasury />;
      case ViewState.CLIENTS: return <Clients onOpenPortal={(c) => { setPortalPreviewClient(c); handleNavigate(ViewState.CUSTOMER_PORTAL); }} />;
      case ViewState.ONLINE_SALES: return <OnlineSales />;
      case ViewState.ACCOUNTING: return <Accounting />;
      case ViewState.STATISTICS: return <Statistics />;
      case ViewState.REPORTS: return <Reports />;
      case ViewState.BACKUP: return <Backup />;
      case ViewState.BRANCHES: return <Branches />;
      case ViewState.USERS: return <UsersComponent />;
      case ViewState.AI_ASSISTANT: return <Assistant />;
      case ViewState.COMPANY_SETTINGS: return <CompanySettings />;
      case ViewState.AFIP_CONFIG: return <AfipConfig />;
      case ViewState.DAILY_MOVEMENTS: return <DailyMovements />;
      case ViewState.EMPLOYEES: return <Employees />;
      case ViewState.CONFIG_PANEL: return <ConfigPanel onNavigate={handleNavigate} />;
      case ViewState.MARKETING: return <Marketing />;
      case ViewState.PRICE_AUDIT: return <PriceAudit />;
      case ViewState.ECOMMERCE_ADMIN: return <EcommerceAdmin />;
      case ViewState.PUBLIC_PORTAL: return <PublicPortal />;
      case ViewState.SHOP: return <Shop />;
      case ViewState.CUSTOMER_PORTAL: return portalPreviewClient ? <CustomerPortal client={portalPreviewClient} onLogout={() => closeView(ViewState.CUSTOMER_PORTAL)} /> : null;
      default: return null;
    }
  };

  if (!loggedInUser) return <Login onLogin={(u) => { setLoggedInUser(u); localStorage.setItem('ferrecloud_session', JSON.stringify(u)); }} />;

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans overflow-hidden">
      <Sidebar currentView={activeView} onNavigate={handleNavigate} user={loggedInUser} onLogout={() => { setLoggedInUser(null); localStorage.removeItem('ferrecloud_session'); }} />
      <main className="flex-1 relative bg-slate-100 overflow-hidden">
        {openViews.map((view) => (
          <div key={view} className={`absolute inset-0 transition-opacity duration-300 ${activeView === view ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            {renderViewContent(view)}
          </div>
        ))}
        {/* BOTONES FLOTANTES DE ACCESO RAPIDO A CANALES PUBLICOS */}
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-[100] print:hidden">
            <button onClick={() => handleNavigate(ViewState.PUBLIC_PORTAL)} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group">
                <Smartphone size={24}/>
                <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-800 border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Ver Portal Fidelidad</div>
            </button>
            <button onClick={() => handleNavigate(ViewState.SHOP)} className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group">
                <ShoppingBag size={24}/>
                <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-800 border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Ver Tienda Online</div>
            </button>
        </div>
      </main>
      <footer className="h-14 bg-slate-900 border-t border-slate-800 flex items-center px-4 gap-2 z-50 overflow-x-auto no-scrollbar print:hidden">
        {openViews.map((view) => (
          <button key={view} onClick={() => setActiveView(view)} className={`flex items-center gap-3 px-4 h-10 rounded-xl transition-all border ${activeView === view ? 'bg-ferre-orange text-white border-orange-400 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{view.replace(/_/g, ' ')}</span>
            {view !== ViewState.DASHBOARD && <X size={14} className="hover:text-white" onClick={(e) => closeView(view, e)} />}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default App;
