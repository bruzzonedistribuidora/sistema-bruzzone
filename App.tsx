import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Database, 
    Receipt, Truck, Wallet, Bot, Settings, Layers,
    DollarSign, Activity, Cloud, Laptop2, Globe2, BarChart3,
    AlertTriangle, PackagePlus, Tags, X, ClipboardList, 
    FileSpreadsheet, Users, UserSearch, Calculator, Network,
    LayoutGrid, Search, Tag, Smartphone, Box, Package
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Inventory from './components/Inventory';
import StockAdjustment from './components/StockAdjustment';
import POS from './components/POS';
import Purchases from './components/Purchases';
import Clients from './components/Clients';
import ClientBalances from './components/ClientBalances';
import ProviderBalances from './components/ProviderBalances';
import Providers from './components/Providers';
import Treasury from './components/Treasury';
import Accounting from './components/Accounting';
import Statistics from './components/Statistics';
import Reports from './components/Reports';
import Backup from './components/Backup';
import Branches from './components/Branches';
import UsersComponent from './components/Users';
import PriceUpdates from './components/PriceUpdates';
import PriceLists from './components/PriceLists';
import Assistant from './components/Assistant';
import CompanySettings from './components/CompanySettings';
import AfipConfig from './components/AfipConfig';
import DailyMovements from './components/DailyMovements';
import Employees from './components/Employees';
import ConfigPanel from './components/ConfigPanel';
import Marketing from './components/Marketing';
import OnlineSales from './components/OnlineSales';
import EcommerceAdmin from './components/EcommerceAdmin';
import Shop from './components/Shop';
import InitialImport from './components/InitialImport';
import CustomerPortal from './components/CustomerPortal';
import Remitos from './components/Remitos';
import Presupuestos from './components/Presupuestos';
import MassProductUpdate from './components/MassProductUpdate';
import MassStockUpdate from './components/MassStockUpdate';
import StockTransfers from './components/StockTransfers';
import CloudHub from './components/CloudHub';
import Login from './components/Login';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';
import PrintSettings from './components/PrintSettings';
import { ViewState, User, Client, InvoiceItem, SystemLicense, ReplenishmentItem } from './types';

const VIEW_ICONS: Record<string, any> = {
    [ViewState.DASHBOARD]: LayoutDashboard,
    [ViewState.POS]: Receipt,
    [ViewState.INVENTORY]: Package,
    [ViewState.REMITOS]: ClipboardList,
    [ViewState.PRESUPUESTOS]: FileSpreadsheet,
    [ViewState.CLIENTS]: Users,
    [ViewState.TREASURY]: Wallet,
    [ViewState.ANALYTICS]: BarChart3,
    [ViewState.PURCHASES]: Truck,
    [ViewState.CLOUD_HUB]: Network,
    [ViewState.CONFIG_PANEL]: Settings,
    [ViewState.MARKETING]: Tag,
    [ViewState.ECOMMERCE_ADMIN]: Laptop2,
    [ViewState.MASS_PRODUCT_UPDATE]: Layers,
    [ViewState.MASS_STOCK_UPDATE]: Box,
    [ViewState.ACCOUNTING]: Calculator,
    [ViewState.SHORTAGES]: AlertTriangle,
    [ViewState.REPLENISHMENT]: PackagePlus,
};

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [openModules, setOpenModules] = useState<ViewState[]>([ViewState.DASHBOARD]);
  
  const [itemsToBill, setItemsToBill] = useState<InvoiceItem[] | null>(null);
  const [itemsToReplenish, setItemsToReplenish] = useState<ReplenishmentItem[] | null>(null);
  const [selectedClientForPortal, setSelectedClientForPortal] = useState<Client | null>(null);
  
  const [isPublicShop] = useState(() => window.location.pathname.endsWith('/shop'));

  useEffect(() => {
    if (isPublicShop) return;
    const savedSession = sessionStorage.getItem('ferrecloud_session');
    if (savedSession) setLoggedInUser(JSON.parse(savedSession));
  }, [isPublicShop]);

  const handleNavigate = (view: ViewState) => {
    setActiveView(view);
    if (!openModules.includes(view)) {
        setOpenModules(prev => [...prev, view]);
    }
  };

  const closeModule = (e: React.MouseEvent, view: ViewState) => {
      e.stopPropagation();
      const nextOpen = openModules.filter(v => v !== view);
      setOpenModules(nextOpen.length > 0 ? nextOpen : [ViewState.DASHBOARD]);
      if (activeView === view) {
          setActiveView(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : ViewState.DASHBOARD);
      }
  };

  const renderViewContent = (view: ViewState) => {
    if (isPublicShop) return <Shop />;
    
    switch (view) {
      case ViewState.DASHBOARD: return <Dashboard onNavigate={handleNavigate} />;
      case ViewState.ANALYTICS: return <AnalyticsDashboard onNavigate={handleNavigate} />;
      case ViewState.INVENTORY: return <Inventory onNavigate={handleNavigate} />;
      case ViewState.PRICE_LISTS: return <PriceLists />;
      case ViewState.POS: 
        return (
            <POS 
                initialCart={itemsToBill || undefined} 
                onCartUsed={() => setItemsToBill(null)} 
                onTransformToRemito={(items) => { setItemsToBill(items); handleNavigate(ViewState.REMITOS); }}
                onTransformToBudget={(items) => { setItemsToBill(items); handleNavigate(ViewState.PRESUPUESTOS); }}
            />
        );
      case ViewState.PURCHASES: return <Purchases onNavigate={handleNavigate} />;
      case ViewState.PROVIDERS: return <Providers />;
      case ViewState.TREASURY: return <Treasury />;
      case ViewState.CLIENTS: 
        return (
            <Clients 
                onOpenBalances={() => handleNavigate(ViewState.CLIENT_BALANCES)} 
                onOpenPortal={(client) => { setSelectedClientForPortal(client); handleNavigate(ViewState.CUSTOMER_PORTAL); }}
            />
        );
      case ViewState.CUSTOMER_PORTAL: 
        if (!selectedClientForPortal) { handleNavigate(ViewState.CLIENTS); return null; }
        return <CustomerPortal client={selectedClientForPortal} onLogout={() => { setSelectedClientForPortal(null); handleNavigate(ViewState.CLIENTS); }} />;
      case ViewState.CLIENT_BALANCES: return <ClientBalances onNavigateToHistory={() => handleNavigate(ViewState.CLIENT_BALANCES)} />;
      case ViewState.PROVIDER_BALANCES: return <ProviderBalances />;
      case ViewState.REMITOS: return <Remitos initialItems={itemsToBill || undefined} onItemsConsumed={() => setItemsToBill(null)} />;
      case ViewState.PRESUPUESTOS: return <Presupuestos initialItems={itemsToBill || undefined} onItemsConsumed={() => setItemsToBill(null)} />;
      case ViewState.CLOUD_HUB: return <CloudHub />;
      case ViewState.CONFIG_PANEL: return <ConfigPanel onNavigate={handleNavigate} />;
      case ViewState.ACCOUNTING: return <Accounting />;
      case ViewState.REPORTS: return <Reports />;
      case ViewState.STATISTICS: return <Statistics />;
      case ViewState.REPLENISHMENT: return <Replenishment initialItems={itemsToReplenish || undefined} onItemsConsumed={() => setItemsToReplenish(null)} />;
      case ViewState.SHORTAGES: return <Shortages onGenerateOrders={(items) => { setItemsToReplenish(items); handleNavigate(ViewState.REPLENISHMENT); }} />;
      case ViewState.INITIAL_IMPORT: return <InitialImport onComplete={() => handleNavigate(ViewState.INVENTORY)} />;
      case ViewState.MARKETING: return <Marketing onNavigate={handleNavigate} />;
      case ViewState.ONLINE_SALES: return <OnlineSales />;
      case ViewState.ECOMMERCE_ADMIN: return <EcommerceAdmin onNavigate={handleNavigate} />;
      case ViewState.SHOP: return <Shop />;
      case ViewState.COMPANY_SETTINGS: return <CompanySettings />;
      case ViewState.AFIP_CONFIG: return <AfipConfig />;
      case ViewState.USERS: return <UsersComponent />;
      case ViewState.BRANCHES: return <Branches />;
      case ViewState.PRINT_CONFIG: return <PrintSettings />;
      case ViewState.BACKUP: return <Backup />;
      case ViewState.PRICE_UPDATES: return <PriceUpdates />;
      case ViewState.MASS_PRODUCT_UPDATE: return <MassProductUpdate />;
      case ViewState.MASS_STOCK_UPDATE: return <MassStockUpdate onComplete={() => handleNavigate(ViewState.INVENTORY)} />;
      case ViewState.STOCK_ADJUSTMENT: return <StockAdjustment />;
      case ViewState.DAILY_MOVEMENTS: return <DailyMovements />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (isPublicShop) return <Shop />;
  if (!loggedInUser) return <Login onLogin={(u) => { setLoggedInUser(u); sessionStorage.setItem('ferrecloud_session', JSON.stringify(u)); }} />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} user={loggedInUser} onLogout={() => { setLoggedInUser(null); sessionStorage.removeItem('ferrecloud_session'); }} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <main className="flex-1 relative bg-white overflow-hidden">
            {renderViewContent(activeView)}
        </main>

        {/* DOCK BAR: MODULOS MINIMIZADOS */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] transition-all hover:bg-slate-900">
            {openModules.map((view) => {
                const Icon = VIEW_ICONS[view] || LayoutGrid;
                const isActive = activeView === view;
                return (
                    <div key={view} className="relative group">
                        <button 
                            onClick={() => setActiveView(view)}
                            className={`p-3.5 rounded-2xl transition-all relative flex items-center justify-center ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title={view}
                        >
                            <Icon size={20} />
                            {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"></div>}
                        </button>
                        
                        {/* Botón cerrar minúsculo */}
                        <button 
                            onClick={(e) => closeModule(e, view)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                        >
                            <X size={10} strokeWidth={4}/>
                        </button>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default App;
