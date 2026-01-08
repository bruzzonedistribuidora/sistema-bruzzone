
import React, { useState, useEffect } from 'react';
import { 
    X, Smartphone, ShoppingBag, LayoutDashboard, Database, 
    Receipt, Truck, Wallet, Bot, Settings, FileUp, Layers, Zap, 
    Package, ListOrdered, RotateCcw, FileSpreadsheet, Tag, Users,
    Calculator, TrendingUp, FileBarChart2, Cloud, Laptop,
    ShoppingCart as OrderIcon, AlertTriangle, PackagePlus, BarChart3,
    Settings2, DollarSign, Key, ShieldAlert
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
import StockTransfers from './components/StockTransfers';
import CloudHub from './components/CloudHub';
import LicenseManager from './components/LicenseManager';
import Login from './components/Login';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';
import MobileApp from './components/MobileApp';
import { ViewState, User, Client, InvoiceItem, SystemLicense } from './types';

const VIEW_CONFIG: Record<string, { icon: any, label: string, color: string }> = {
    [ViewState.DASHBOARD]: { icon: LayoutDashboard, label: "Escritorio", color: "bg-slate-500" },
    [ViewState.ANALYTICS]: { icon: BarChart3, label: "Dashboard", color: "bg-indigo-600" },
    [ViewState.INVENTORY]: { icon: Database, label: "Inventario Maestro", color: "bg-indigo-500" },
    [ViewState.STOCK_ADJUSTMENT]: { icon: Settings2, label: "Ajuste Stock", color: "bg-slate-800" },
    [ViewState.POS]: { icon: Receipt, label: "Punto de Venta", color: "bg-emerald-500" },
    [ViewState.PURCHASES]: { icon: Truck, label: "Compras / Gastos", color: "bg-blue-500" },
    [ViewState.TREASURY]: { icon: Wallet, label: "Tesorería", color: "bg-orange-500" },
    [ViewState.ACCOUNTING]: { icon: Calculator, label: "Contabilidad", color: "bg-violet-600" },
    [ViewState.AI_ASSISTANT]: { icon: Bot, label: "Asistente IA", color: "bg-pink-500" },
    [ViewState.CONFIG_PANEL]: { icon: Settings, label: "Configuración", color: "bg-slate-700" },
    [ViewState.INITIAL_IMPORT]: { icon: FileUp, label: "Importador Excel", color: "bg-indigo-600" },
    [ViewState.PRICE_UPDATES]: { icon: Layers, label: "Precios & Listas", color: "bg-violet-500" },
    [ViewState.MASS_PRODUCT_UPDATE]: { icon: Zap, label: "Cambios Masivos", color: "bg-amber-500" },
    [ViewState.ONLINE_SALES]: { icon: OrderIcon, label: "Hub de Ventas Online", color: "bg-indigo-600" },
    [ViewState.ECOMMERCE_ADMIN]: { icon: Laptop, label: "Gestión Catálogo Web", color: "bg-pink-600" },
    [ViewState.SHOP]: { icon: ShoppingBag, label: "Tienda Online", color: "bg-pink-600" },
    [ViewState.PUBLIC_PORTAL]: { icon: Smartphone, label: "Portal Fidelidad", color: "bg-amber-500" },
    [ViewState.MARKETING]: { icon: Tag, label: "Marketing & Puntos", color: "bg-red-500" },
    [ViewState.CLIENTS]: { icon: Users, label: "Fichero Clientes", color: "bg-sky-500" },
    [ViewState.CLIENT_BALANCES]: { icon: DollarSign, label: "Saldos Clientes", color: "bg-emerald-600" },
    [ViewState.PROVIDER_BALANCES]: { icon: DollarSign, label: "Saldos Proveedores", color: "bg-orange-600" },
    [ViewState.REMITOS]: { icon: ListOrdered, label: "Remitos", color: "bg-blue-600" },
    [ViewState.PRESUPUESTOS]: { icon: FileSpreadsheet, label: "Presupuestos", color: "bg-teal-500" },
    [ViewState.SALES_ORDERS]: { icon: Package, label: "Pedidos", color: "bg-green-600" },
    [ViewState.CREDIT_NOTES]: { icon: RotateCcw, label: "Notas de Crédito", color: "bg-red-500" },
    [ViewState.PROVIDERS]: { icon: Truck, label: "Proveedores", color: "bg-slate-800" },
    [ViewState.STATISTICS]: { icon: TrendingUp, label: "Estadísticas", color: "bg-cyan-500" },
    [ViewState.REPORTS]: { icon: FileBarChart2, label: "Reportes", color: "bg-indigo-400" },
    [ViewState.CLOUD_HUB]: { icon: Cloud, label: "Nube Central", color: "bg-indigo-900" },
    [ViewState.SHORTAGES]: { icon: AlertTriangle, label: "Monitor Faltantes", color: "bg-orange-600" },
    [ViewState.REPLENISHMENT]: { icon: PackagePlus, label: "Armado Pedido", color: "bg-emerald-600" },
    [ViewState.LICENSE_MANAGER]: { icon: Key, label: "Gestión Licencias", color: "bg-slate-900" },
};

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [openViews, setOpenViews] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const [activeView, setActiveView] = useState<ViewState>(() => {
    if (window.location.pathname.includes('/shop')) return ViewState.SHOP;
    return ViewState.DASHBOARD;
  });
  const [itemsToBill, setItemsToBill] = useState<InvoiceItem[] | null>(null);
  const [portalPreviewClient, setPortalPreviewClient] = useState<Client | null>(null);
  const [systemLicense, setSystemLicense] = useState<SystemLicense | null>(null);

  const loadLicense = () => {
    const saved = localStorage.getItem('ferrecloud_license');
    if (saved) setSystemLicense(JSON.parse(saved));
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('ferrecloud_session');
    if (savedSession) setLoggedInUser(JSON.parse(savedSession));

    loadLicense();
    window.addEventListener('license_updated', loadLicense);

    const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('license_updated', loadLicense);
    };
  }, []);

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
    
    if (activeView === view) {
        setActiveView(newViews[newViews.length - 1]);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('ferrecloud_session');
  };

  const renderViewContent = (view: ViewState) => {
    // Si el sistema está bloqueado y no es el creador, mostramos pantalla de bloqueo
    if (systemLicense?.status === 'LOCKED' && loggedInUser?.roleId !== 'creator') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-100 p-10">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-red-100 text-center max-w-md space-y-6 animate-fade-in">
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert size={64}/>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">SISTEMA BLOQUEADO</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Su licencia ha sido suspendida por el proveedor. Por favor, regularice su situación administrativa para restablecer el servicio.</p>
                    <div className="pt-6 border-t">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soporte Técnico Cloud</p>
                    </div>
                </div>
            </div>
        );
    }

    switch (view) {
      case ViewState.DASHBOARD: return <Dashboard onNavigate={handleNavigate} />;
      case ViewState.ANALYTICS: return <AnalyticsDashboard onNavigate={handleNavigate} />;
      case ViewState.INVENTORY: return <Inventory />;
      case ViewState.STOCK_ADJUSTMENT: return <StockAdjustment />;
      case ViewState.PROVIDERS: return <Providers />;
      case ViewState.MASS_PRODUCT_UPDATE: return <MassProductUpdate />;
      case ViewState.STOCK_TRANSFERS: return <StockTransfers />;
      case ViewState.TREASURY: return <Treasury />;
      case ViewState.CLIENTS: return <Clients onOpenPortal={(c) => { setPortalPreviewClient(c); handleNavigate(ViewState.CUSTOMER_PORTAL); }} />;
      case ViewState.CLIENT_BALANCES: return <ClientBalances onNavigateToHistory={(c) => { setPortalPreviewClient(c); handleNavigate(ViewState.CUSTOMER_PORTAL); }} />;
      case ViewState.PROVIDER_BALANCES: return <ProviderBalances />;
      case ViewState.ONLINE_SALES: return <OnlineSales />;
      case ViewState.ACCOUNTING: return <Accounting />;
      case ViewState.STATISTICS: return <Statistics />;
      case ViewState.REPORTS: return <Reports />;
      case ViewState.BACKUP: return <Backup />;
      case ViewState.BRANCHES: return <Branches />;
      case ViewState.USERS: return <UsersComponent />;
      case ViewState.PRICE_UPDATES: return <PriceUpdates />;
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
      case ViewState.INITIAL_IMPORT: return <InitialImport onComplete={() => handleNavigate(ViewState.INVENTORY)} />;
      case ViewState.POS: return <POS initialCart={itemsToBill || undefined} onCartUsed={() => setItemsToBill(null)} />;
      case ViewState.PURCHASES: return <Purchases />;
      case ViewState.REMITOS: return <Remitos onBillRemitos={(items) => { setItemsToBill(items); handleNavigate(ViewState.POS); }} />;
      case ViewState.PRESUPUESTOS: return <Presupuestos onConvertToSale={(items) => { setItemsToBill(items); handleNavigate(ViewState.POS); }} />;
      case ViewState.SALES_ORDERS: return <SalesOrders />;
      case ViewState.CREDIT_NOTES: return <CreditNotes />;
      case ViewState.CUSTOMER_PORTAL: return portalPreviewClient ? <CustomerPortal client={portalPreviewClient} onLogout={() => closeView(ViewState.CUSTOMER_PORTAL)} /> : null;
      case ViewState.CLOUD_HUB: return <CloudHub />;
      case ViewState.SHORTAGES: return <Shortages onGenerateOrders={(items) => { setItemsToBill(null); handleNavigate(ViewState.REPLENISHMENT); }} />;
      case ViewState.REPLENISHMENT: return <Replenishment />;
      case ViewState.LICENSE_MANAGER: return <LicenseManager />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const isPublicView = activeView === ViewState.SHOP || activeView === ViewState.PUBLIC_PORTAL;

  if (isPublicView) {
      return <div className="h-screen w-full bg-white overflow-hidden">{renderViewContent(activeView)}</div>;
  }

  if (!loggedInUser) {
    return <Login onLogin={(u) => { setLoggedInUser(u); localStorage.setItem('ferrecloud_session', JSON.stringify(u)); }} />;
  }

  if (isMobile) {
      return <MobileApp user={loggedInUser} onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} user={loggedInUser} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-1 z-50 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
            {openViews.map((view) => {
                const config = VIEW_CONFIG[view] || { icon: LayoutDashboard, label: view };
                const Icon = config.icon;
                return (
                    <button 
                        key={view} 
                        onClick={() => setActiveView(view)} 
                        className={`flex items-center gap-3 px-4 h-10 rounded-t-xl transition-all border-x border-t relative group min-w-[140px] max-w-[200px] ${
                            activeView === view 
                            ? 'bg-slate-50 text-indigo-600 border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] font-black' 
                            : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50/50'
                        }`}
                    >
                        <Icon size={14} className={activeView === view ? 'text-indigo-600' : 'text-slate-300'} />
                        <span className="text-[10px] uppercase tracking-wider whitespace-nowrap truncate flex-1 text-left">
                            {config.label}
                        </span>
                        {view !== ViewState.DASHBOARD && (
                            <div 
                                onClick={(e) => closeView(view, e)}
                                className={`p-1 rounded-md transition-colors ${activeView === view ? 'hover:bg-indigo-100 text-indigo-400' : 'hover:bg-slate-200 text-slate-300'}`}
                            >
                                <X size={12} />
                            </div>
                        )}
                        {activeView === view && (
                            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-indigo-600"></div>
                        )}
                    </button>
                );
            })}
        </header>

        <main className="flex-1 relative bg-slate-50 overflow-hidden">
          {openViews.map((view) => (
            <div 
              key={view} 
              className={`absolute inset-0 transition-opacity duration-200 ${
                activeView === view ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {renderViewContent(view)}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default App;
