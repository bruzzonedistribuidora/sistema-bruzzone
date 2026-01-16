import React, { useState, useEffect } from 'react';
import { 
    X, Smartphone, ShoppingBag, LayoutDashboard, Database, 
    Receipt, Truck, Wallet, Bot, Settings, FileUp, Layers, Zap, 
    Package, ListOrdered, RotateCcw, FileSpreadsheet, Tag, Users,
    Calculator, TrendingUp, FileBarChart2, Cloud, Laptop,
    ShoppingCart as OrderIcon, AlertTriangle, PackagePlus, BarChart3,
    Settings2, DollarSign, Key, ShieldAlert, Wifi, WifiOff, RefreshCw, CheckCircle2,
    CloudIcon, Boxes as BoxesIcon, Network, Tags, Laptop2, Globe2, Globe, Activity
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
import PriceAudit from './components/PriceAudit';
import OnlineSales from './components/OnlineSales';
import EcommerceAdmin from './components/EcommerceAdmin';
import PublicPortal from './components/PublicPortal';
import Shop from './components/Shop';
import InitialImport from './components/InitialImport';
import CustomerPortal from './components/CustomerPortal';
import Remitos from './components/Remitos';
import Presupuestos from './components/Presupuestos';
import SalesOrders from './components/SalesOrders';
import CreditNotes from './components/CreditNotes';
import MassProductUpdate from './components/MassProductUpdate';
import MassStockUpdate from './components/MassStockUpdate';
import StockTransfers from './components/StockTransfers';
import CloudHub from './components/CloudHub';
import Login from './components/Login';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';
import MobileApp from './components/MobileApp';
import LicenseConsole from './components/LicenseConsole';
import LabelPrinting from './components/LabelPrinting';
import PrintSettings from './components/PrintSettings';
import { ViewState, User, Client, InvoiceItem, SystemLicense, Product, ReplenishmentItem } from './types';
import { syncService } from './services/syncService';

const VIEW_CONFIG: Record<string, { icon: any, label: string, color: string }> = {
    [ViewState.DASHBOARD]: { icon: LayoutDashboard, label: "Escritorio", color: "bg-slate-500" },
    [ViewState.ANALYTICS]: { icon: BarChart3, label: "Panel Control", color: "bg-indigo-600" },
    [ViewState.INVENTORY]: { icon: Database, label: "Inventario", color: "bg-indigo-500" },
    [ViewState.PRICE_LISTS]: { icon: Tags, label: "Listas Precios", color: "bg-emerald-600" },
    [ViewState.POS]: { icon: Receipt, label: "Venta", color: "bg-emerald-500" },
    [ViewState.PURCHASES]: { icon: Truck, label: "Compras", color: "bg-blue-500" },
    [ViewState.TREASURY]: { icon: Wallet, label: "Finanzas", color: "bg-orange-500" },
    [ViewState.DAILY_MOVEMENTS]: { icon: Activity, label: "Gastos Diarios", color: "bg-red-500" },
    [ViewState.CLIENT_BALANCES]: { icon: DollarSign, label: "Ctas Ctes", color: "bg-emerald-600" },
    [ViewState.PROVIDER_BALANCES]: { icon: DollarSign, label: "Deuda Prov", color: "bg-orange-600" },
    [ViewState.CLOUD_HUB]: { icon: Cloud, label: "Nube / Red", color: "bg-indigo-900" },
    [ViewState.ECOMMERCE_ADMIN]: { icon: Laptop2, label: "Web Admin", color: "bg-pink-600" },
    [ViewState.ONLINE_SALES]: { icon: Globe2, label: "Hub Online", color: "bg-indigo-600" },
    [ViewState.REPORTS]: { icon: FileBarChart2, label: "Reportes", color: "bg-indigo-800" },
    [ViewState.SHORTAGES]: { icon: AlertTriangle, label: "Faltantes", color: "bg-orange-600" },
    [ViewState.REPLENISHMENT]: { icon: PackagePlus, label: "Reposición", color: "bg-emerald-600" },
    [ViewState.MASS_PRODUCT_UPDATE]: { icon: Layers, label: "Cambios Masivos", color: "bg-slate-700" },
};

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [openViews, setOpenViews] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [itemsToBill, setItemsToBill] = useState<InvoiceItem[] | null>(null);
  const [itemsToReplenish, setItemsToReplenish] = useState<ReplenishmentItem[] | null>(null);
  const [selectedClientForPortal, setSelectedClientForPortal] = useState<Client | null>(null);
  const [systemLicense, setSystemLicense] = useState<SystemLicense | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'IDLE' | 'SYNCING' | 'UP_TO_DATE' | 'OFFLINE'>('IDLE');
  
  // Detección inmediata de ruta pública para evitar flash de Login
  const [isPublicShop, setIsPublicShop] = useState(() => window.location.pathname.includes('/shop'));
  
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (isPublicShop) return;

    const savedSession = sessionStorage.getItem('ferrecloud_session');
    if (savedSession) setLoggedInUser(JSON.parse(savedSession));

    const loadLicense = () => {
        const saved = localStorage.getItem('ferrecloud_license');
        if (saved) setSystemLicense(JSON.parse(saved));
    };
    loadLicense();

    const handleSyncPulse = () => {
        setCloudStatus('SYNCING');
        setRenderKey(prev => prev + 1); 
        setTimeout(() => setCloudStatus('UP_TO_DATE'), 1000);
    };
    window.addEventListener('ferrecloud_sync_pulse', handleSyncPulse);

    return () => {
        window.removeEventListener('ferrecloud_sync_pulse', handleSyncPulse);
    };
  }, [isPublicShop]);

  const handleNavigate = (view: ViewState) => {
    if (!openViews.includes(view)) {
        setOpenViews(prev => [...prev, view]);
    }
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
    switch (view) {
      case ViewState.DASHBOARD: return <Dashboard key={renderKey} onNavigate={handleNavigate} />;
      case ViewState.ANALYTICS: return <AnalyticsDashboard key={renderKey} onNavigate={handleNavigate} />;
      case ViewState.INVENTORY: return <Inventory key={renderKey} />;
      case ViewState.PRICE_LISTS: return <PriceLists key={renderKey} />;
      case ViewState.POS: 
        return (
            <POS 
                key={renderKey} 
                initialCart={itemsToBill || undefined} 
                onCartUsed={() => setItemsToBill(null)} 
                onTransformToRemito={(items) => {
                    setItemsToBill(items);
                    handleNavigate(ViewState.REMITOS);
                }}
                onTransformToBudget={(items) => {
                    setItemsToBill(items);
                    handleNavigate(ViewState.PRESUPUESTOS);
                }}
            />
        );
      case ViewState.PURCHASES: return <Purchases key={renderKey} />;
      case ViewState.TREASURY: return <Treasury key={renderKey} />;
      case ViewState.CLIENTS: 
        return (
            <Clients 
                key={renderKey} 
                onOpenBalances={() => handleNavigate(ViewState.CLIENT_BALANCES)} 
                onOpenPortal={(client) => {
                    setSelectedClientForPortal(client);
                    handleNavigate(ViewState.CUSTOMER_PORTAL);
                }}
            />
        );
      case ViewState.CUSTOMER_PORTAL: 
        if (!selectedClientForPortal) {
            handleNavigate(ViewState.CLIENTS);
            return null;
        }
        return (
            <CustomerPortal 
                key={renderKey} 
                client={selectedClientForPortal} 
                onLogout={() => {
                    setSelectedClientForPortal(null);
                    handleNavigate(ViewState.CLIENTS);
                }} 
            />
        );
      case ViewState.CLIENT_BALANCES: return <ClientBalances key={renderKey} />;
      case ViewState.PROVIDER_BALANCES: return <ProviderBalances key={renderKey} />;
      case ViewState.REMITOS: return <Remitos key={renderKey} initialItems={itemsToBill || undefined} onItemsConsumed={() => setItemsToBill(null)} />;
      case ViewState.PRESUPUESTOS: return <Presupuestos key={renderKey} initialItems={itemsToBill || undefined} onItemsConsumed={() => setItemsToBill(null)} />;
      case ViewState.CLOUD_HUB: return <CloudHub key={renderKey} />;
      case ViewState.CONFIG_PANEL: return <ConfigPanel key={renderKey} onNavigate={handleNavigate} />;
      case ViewState.ACCOUNTING: return <Accounting key={renderKey} />;
      case ViewState.REPORTS: return <Reports key={renderKey} />;
      case ViewState.STATISTICS: return <Statistics key={renderKey} />;
      case ViewState.REPLENISHMENT: 
        return (
            <Replenishment 
                key={renderKey} 
                initialItems={itemsToReplenish || undefined} 
                onItemsConsumed={() => setItemsToReplenish(null)} 
            />
        );
      case ViewState.SHORTAGES:
        return (
            <Shortages 
                key={renderKey}
                onGenerateOrders={(items) => {
                    setItemsToReplenish(items);
                    handleNavigate(ViewState.REPLENISHMENT);
                }}
            />
        );
      case ViewState.INITIAL_IMPORT: return <InitialImport onComplete={() => handleNavigate(ViewState.INVENTORY)} />;
      case ViewState.LABEL_PRINTING: return <LabelPrinting key={renderKey} />;
      case ViewState.LICENSE_MANAGER: return <LicenseConsole key={renderKey} />;
      case ViewState.MARKETING: return <Marketing key={renderKey} onNavigate={handleNavigate} />;
      case ViewState.ONLINE_SALES: return <OnlineSales key={renderKey} />;
      case ViewState.ECOMMERCE_ADMIN: return <EcommerceAdmin key={renderKey} onNavigate={handleNavigate} />;
      case ViewState.SHOP: return <Shop key={renderKey} />;
      case ViewState.COMPANY_SETTINGS: return <CompanySettings key={renderKey} />;
      case ViewState.AFIP_CONFIG: return <AfipConfig key={renderKey} />;
      case ViewState.USERS: return <UsersComponent key={renderKey} />;
      case ViewState.BRANCHES: return <Branches key={renderKey} />;
      case ViewState.PRINT_CONFIG: return <PrintSettings key={renderKey} />;
      case ViewState.BACKUP: return <Backup key={renderKey} />;
      case ViewState.PRICE_UPDATES: return <PriceUpdates key={renderKey} />;
      case ViewState.MASS_PRODUCT_UPDATE: return <MassProductUpdate key={renderKey} />;
      case ViewState.MASS_STOCK_UPDATE: return <MassStockUpdate key={renderKey} onComplete={() => handleNavigate(ViewState.INVENTORY)} />;
      case ViewState.STOCK_ADJUSTMENT: return <StockAdjustment key={renderKey} />;
      case ViewState.DAILY_MOVEMENTS: return <DailyMovements key={renderKey} />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (isPublicShop) return <Shop />;
  if (!loggedInUser) return <Login onLogin={(u) => { setLoggedInUser(u); sessionStorage.setItem('ferrecloud_session', JSON.stringify(u)); }} />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} user={loggedInUser} onLogout={() => { setLoggedInUser(null); sessionStorage.removeItem('ferrecloud_session'); }} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-12 bg-slate-900 flex items-center px-4 justify-between z-50 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 h-full">
                {openViews.map((view) => {
                    const config = VIEW_CONFIG[view] || { icon: LayoutDashboard, label: view };
                    const Icon = config.icon;
                    return (
                        <button 
                            key={view} 
                            onClick={() => setActiveView(view)} 
                            className={`flex items-center gap-2 px-4 h-full transition-all border-r border-white/10 relative ${
                                activeView === view ? 'bg-white/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14} />
                            <span className="text-[10px] uppercase font-black tracking-widest">{config.label}</span>
                            {view !== ViewState.DASHBOARD && (
                                <X size={10} onClick={(e) => closeView(view, e)} className="ml-2 hover:text-white" />
                            )}
                        </button>
                    );
                })}
            </div>
        </header>

        <main className="flex-1 relative bg-white overflow-hidden">
            {renderViewContent(activeView)}
        </main>
      </div>
    </div>
  );
};

export default App;
