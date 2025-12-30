import Sidebar from "./Sidebar";
import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Smartphone, ShoppingBag, Plus, LayoutDashboard, Database, 
    Receipt, Truck, Wallet, Bot, Settings, FileUp, Layers, Zap, 
    Search as SearchIcon, ChevronRight, Package, ListOrdered,
    RotateCcw, Landmark, FileSpreadsheet, Tag, Clock, Users,
    Calculator, TrendingUp, FileBarChart2, Building2, ShieldCheck,
    LayoutTemplate, HardDrive, Sparkles, ShieldAlert, Globe, Heart
} from 'lucide-react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import POS from './POS';
import Purchases from './Purchases';
import Clients from './Clients';
import Providers from './Providers';
import Treasury from './Treasury';
import Accounting from './Accounting';
import Statistics from './Statistics';
import Reports from './Reports';
import Backup from './Backup';
import Branches from './Branches';
import UsersComponent from './Users';
import PriceUpdates from './PriceUpdates';
import Assistant from './Assistant';
import CompanySettings from './CompanySettings';
import AfipConfig from './AfipConfig';
import DailyMovements from './DailyMovements';
import Employees from './Employees';
import ConfigPanel from './ConfigPanel';
import Marketing from './Marketing';
import PriceAudit from './PriceAudit';
import OnlineSales from './OnlineSales';
import EcommerceAdmin from './EcommerceAdmin';
import PublicPortal from './PublicPortal';
import Shop from './Shop';
import InitialImport from './InitialImport';
import CustomerPortal from './CustomerPortal';
import Remitos from './Remitos';
import Presupuestos from './Presupuestos';
import SalesOrders from './SalesOrders';
import CreditNotes from './CreditNotes';
import MassProductUpdate from './MassProductUpdate';
import StockTransfers from './StockTransfers';
import Login from './Login';
import { ViewState, User, Client, InvoiceItem } from '../types'; // bien

// Mapeo exhaustivo de iconos para las pestañas y el lanzador
const VIEW_CONFIG: Record<string, { icon: any, label: string, color: string }> = {
    [ViewState.DASHBOARD]: { icon: LayoutDashboard, label: "Escritorio", color: "bg-slate-500" },
    [ViewState.INVENTORY]: { icon: Database, label: "Inventario Maestro", color: "bg-indigo-500" },
    [ViewState.POS]: { icon: Receipt, label: "Punto de Venta", color: "bg-emerald-500" },
    [ViewState.PURCHASES]: { icon: Truck, label: "Compras / Gastos", color: "bg-blue-500" },
    [ViewState.TREASURY]: { icon: Wallet, label: "Tesorería", color: "bg-orange-500" },
    [ViewState.ACCOUNTING]: { icon: Calculator, label: "Contabilidad", color: "bg-violet-600" },
    [ViewState.AI_ASSISTANT]: { icon: Bot, label: "Asistente IA", color: "bg-pink-500" },
    [ViewState.CONFIG_PANEL]: { icon: Settings, label: "Configuración", color: "bg-slate-700" },
    [ViewState.INITIAL_IMPORT]: { icon: FileUp, label: "Importador Excel", color: "bg-indigo-600" },
    [ViewState.PRICE_UPDATES]: { icon: Layers, label: "Listas de Precios", color: "bg-violet-500" },
    [ViewState.MASS_PRODUCT_UPDATE]: { icon: Zap, label: "Cambios Masivos", color: "bg-amber-500" },
    [ViewState.SHOP]: { icon: ShoppingBag, label: "Tienda Online", color: "bg-pink-600" },
    [ViewState.PUBLIC_PORTAL]: { icon: Smartphone, label: "Portal Fidelidad", color: "bg-amber-500" },
    [ViewState.MARKETING]: { icon: Heart, label: "Marketing & Puntos", color: "bg-red-500" },
    [ViewState.CLIENTS]: { icon: Users, label: "Fichero Clientes", color: "bg-sky-500" },
    [ViewState.REMITOS]: { icon: ListOrdered, label: "Remitos", color: "bg-blue-600" },
    [ViewState.PRESUPUESTOS]: { icon: FileSpreadsheet, label: "Presupuestos", color: "bg-teal-500" },
    [ViewState.SALES_ORDERS]: { icon: Package, label: "Pedidos", color: "bg-green-600" },
    [ViewState.CREDIT_NOTES]: { icon: RotateCcw, label: "Notas de Crédito", color: "bg-red-500" },
    [ViewState.PROVIDERS]: { icon: Truck, label: "Proveedores", color: "bg-slate-800" },
    [ViewState.STATISTICS]: { icon: TrendingUp, label: "Estadísticas", color: "bg-cyan-500" },
    [ViewState.REPORTS]: { icon: FileBarChart2, label: "Reportes", color: "bg-indigo-400" },
    [ViewState.BACKUP]: { icon: HardDrive, label: "Respaldo Datos", color: "bg-slate-600" },
};

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [openViews, setOpenViews] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [quickNavSearch, setQuickNavSearch] = useState("");
  const [itemsToBill, setItemsToBill] = useState<InvoiceItem[] | null>(null);
  const [portalPreviewClient, setPortalPreviewClient] = useState<Client | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('ferrecloud_session');
    if (savedSession) setLoggedInUser(JSON.parse(savedSession));
  }, []);

  const handleNavigate = (view: ViewState) => {
    if (!openViews.includes(view)) {
        setOpenViews([...openViews, view]);
    }
    setActiveView(view);
    setIsQuickNavOpen(false);
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

  const filteredLauncherItems = useMemo(() => {
    const items = Object.entries(ViewState)
        .filter(([_, value]) => value !== ViewState.LOGIN && value !== ViewState.CUSTOMER_PORTAL)
        .map(([_, value]) => ({
            // --- FIX: Explicitly cast 'value' as ViewState to resolve 'unknown' type assignment to key prop errors ---
            id: value as ViewState,
            // --- FIX: Explicitly cast 'value' to string and use parentheses for spread evaluation to avoid unexpected token errors ---
            ...(VIEW_CONFIG[value as string] || { icon: Package, label: (value as string).replace(/_/g, ' '), color: "bg-slate-400" })
        }));
    
    if (!quickNavSearch) return items;
    return items.filter(i => i.label.toLowerCase().includes(quickNavSearch.toLowerCase()));
  }, [quickNavSearch]);

  const renderViewContent = (view: ViewState) => {
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
      case ViewState.INITIAL_IMPORT: return <InitialImport onComplete={() => setActiveView(ViewState.INVENTORY)} />;
      case ViewState.POS: return <POS initialCart={itemsToBill || undefined} onCartUsed={() => setItemsToBill(null)} />;
      case ViewState.PURCHASES: return <Purchases />;
      case ViewState.REMITOS: return <Remitos onBillRemitos={(items) => { setItemsToBill(items); setActiveView(ViewState.POS); }} />;
      case ViewState.PRESUPUESTOS: return <Presupuestos onConvertToSale={(items) => { setItemsToBill(items); setActiveView(ViewState.POS); }} />;
      case ViewState.SALES_ORDERS: return <SalesOrders />;
      case ViewState.CREDIT_NOTES: return <CreditNotes />;
      case ViewState.CUSTOMER_PORTAL: return portalPreviewClient ? <CustomerPortal client={portalPreviewClient} onLogout={() => closeView(ViewState.CUSTOMER_PORTAL)} /> : null;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (!loggedInUser) {
    return <Login onLogin={(u) => { setLoggedInUser(u); localStorage.setItem('ferrecloud_session', JSON.stringify(u)); }} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} user={loggedInUser} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* TAB BAR SUPERIOR MEJORADA */}
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
            
            {/* BOTÓN + MEJORADO */}
            <button 
                onClick={() => setIsQuickNavOpen(!isQuickNavOpen)}
                className={`p-2 rounded-lg ml-2 transition-all ${isQuickNavOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title="Abrir nueva ventana"
            >
                <Plus size={20} className={`transition-transform duration-300 ${isQuickNavOpen ? 'rotate-45' : ''}`} />
            </button>
        </header>

        {/* LANZADOR RÁPIDO (MODAL FLOTANTE) */}
        {isQuickNavOpen && (
            <div className="absolute top-16 left-6 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 z-[100] flex flex-col animate-fade-in max-h-[500px] overflow-hidden">
                <div className="p-4 bg-slate-900">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Buscar módulo..." 
                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs text-white font-bold outline-none focus:bg-white focus:text-slate-900 transition-all uppercase"
                            value={quickNavSearch}
                            onChange={e => setQuickNavSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                    {filteredLauncherItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => handleNavigate(item.id as ViewState)}
                            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl text-white ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                    <item.icon size={16}/>
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{item.label}</p>
                                    {openViews.includes(item.id as ViewState) && (
                                        <span className="text-[8px] font-black text-indigo-500 uppercase">Ya abierto</span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"/>
                        </button>
                    ))}
                </div>
            </div>
        )}

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
