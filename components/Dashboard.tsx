import React, { useState, useEffect, useMemo } from 'react';
import { 
    Receipt, ShoppingCart, Package, Users, Truck, Wallet, 
    Calculator, Layers, ClipboardList, Bot, X, Plus,
    FileSpreadsheet, AlertTriangle, Settings2, CheckCircle,
    ShoppingBag, Laptop, PackagePlus, Globe, Key, Network,
    Tag, Laptop2, Globe2, BarChart3, Activity, DollarSign,
    Tags, Boxes as BoxesIcon, UserSearch, Search, Cloud
} from 'lucide-react';
import { ViewState, SystemLicense } from '../types';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

interface ShortcutConfig {
    id: ViewState;
    label: string;
    category: string;
    icon: any;
    color: string;
}

const ALL_MODULES: ShortcutConfig[] = [
    // VENTAS
    { id: ViewState.POS, label: "Venta (POS)", category: "Ventas", icon: Receipt, color: "bg-indigo-500" },
    { id: ViewState.CLIENT_BALANCES, label: "Ctas Ctes Clientes", category: "Ventas", icon: DollarSign, color: "bg-emerald-600" },
    { id: ViewState.REMITOS, label: "Libro Remitos", category: "Ventas", icon: ClipboardList, color: "bg-slate-600" },
    { id: ViewState.PRESUPUESTOS, label: "Presupuestos", category: "Ventas", icon: FileSpreadsheet, color: "bg-teal-600" },
    { id: ViewState.CLIENTS, label: "Fichero Clientes", category: "Ventas", icon: Users, color: "bg-sky-500" },
    
    // INVENTARIO
    { id: ViewState.INVENTORY, label: "Maestro Art.", category: "Inventario", icon: Package, color: "bg-slate-700" },
    { id: ViewState.PRICE_LISTS, label: "Listas Precios", category: "Inventario", icon: Tags, color: "bg-amber-600" },
    { id: ViewState.MASS_STOCK_UPDATE, label: "Excel Stock", category: "Inventario", icon: BoxesIcon, color: "bg-cyan-700" },
    { id: ViewState.MASS_PRODUCT_UPDATE, label: "Cambios Masivos", category: "Inventario", icon: Layers, color: "bg-slate-800" },
    { id: ViewState.STOCK_ADJUSTMENT, label: "Ajuste Existencias", category: "Inventario", icon: Settings2, color: "bg-slate-800" },
    { id: ViewState.STOCK_TRANSFERS, label: "Traslados Stock", category: "Inventario", icon: Activity, color: "bg-indigo-600" },
    
    // COMPRAS Y LOGISTICA
    { id: ViewState.PURCHASES, label: "Gestión Compras", category: "Compras", icon: Truck, color: "bg-blue-500" },
    { id: ViewState.PROVIDERS, label: "Fichero Prov.", category: "Compras", icon: UserSearch, color: "bg-slate-600" },
    { id: ViewState.PROVIDER_BALANCES, label: "Ctas Ctes Prov.", category: "Compras", icon: DollarSign, color: "bg-rose-600" },
    { id: ViewState.SHORTAGES, label: "Faltantes", category: "Logística", icon: AlertTriangle, color: "bg-orange-600" },
    { id: ViewState.REPLENISHMENT, label: "Armar Pedido", category: "Logística", icon: PackagePlus, color: "bg-emerald-600" },
    
    // FINANZAS Y GESTION
    { id: ViewState.TREASURY, label: "Caja y Fondos", category: "Finanzas", icon: Wallet, color: "bg-emerald-600" },
    { id: ViewState.DAILY_MOVEMENTS, label: "Gastos Diarios", category: "Finanzas", icon: Activity, color: "bg-red-500" },
    { id: ViewState.ACCOUNTING, label: "Contabilidad Pro", category: "Finanzas", icon: Calculator, color: "bg-violet-600" },
    { id: ViewState.ANALYTICS, label: "Panel Control", category: "Gestión", icon: BarChart3, color: "bg-blue-600" },
    { id: ViewState.REPORTS, label: "Reportes Full", category: "Gestión", icon: BarChart3, color: "bg-indigo-900" },
    
    // E-COMMERCE
    { id: ViewState.ECOMMERCE_ADMIN, label: "Web Admin", category: "E-Commerce", icon: Laptop2, color: "bg-pink-600" },
    { id: ViewState.ONLINE_SALES, label: "Hub ML/Nube", category: "E-Commerce", icon: Globe2, color: "bg-indigo-600" },
    { id: ViewState.MARKETING, label: "Marketing/Puntos", category: "E-Commerce", icon: Tag, color: "bg-pink-500" },
    
    // SISTEMA
    { id: ViewState.CLOUD_HUB, label: "Nube / Red LAN", category: "Sistema", icon: Network, color: "bg-orange-600" },
    { id: ViewState.CONFIG_PANEL, label: "Configuración", category: "Sistema", icon: Settings2, color: "bg-slate-500" },
];

const DEFAULT_SHORTCUTS = [
    ViewState.POS, ViewState.INVENTORY, ViewState.CLOUD_HUB, 
    ViewState.REPLENISHMENT, ViewState.TREASURY, ViewState.CLIENT_BALANCES
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [license, setLicense] = useState<SystemLicense | null>(null);
  const [userShortcuts, setUserShortcuts] = useState<ViewState[]>(() => {
      const saved = localStorage.getItem('ferrecloud_user_shortcuts');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  const loadLicense = () => {
    const saved = localStorage.getItem('ferrecloud_license');
    if (saved) setLicense(JSON.parse(saved));
  };

  useEffect(() => {
      localStorage.setItem('ferrecloud_user_shortcuts', JSON.stringify(userShortcuts));
      loadLicense();
      window.addEventListener('license_updated', loadLicense);
      return () => window.removeEventListener('license_updated', loadLicense);
  }, [userShortcuts]);

  const isModuleEnabled = (id: ViewState) => {
    if (!license) return true;
    return license.enabledModules[id] !== false;
  };

  const visibleShortcuts = useMemo(() => 
    ALL_MODULES.filter(m => userShortcuts.includes(m.id) && isModuleEnabled(m.id)),
  [userShortcuts, license]);

  const toggleShortcut = (id: ViewState) => {
      setUserShortcuts(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar font-sans relative">
      <div className="p-10 md:p-16 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full min-h-screen">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Escritorio</h1>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.6em]">Bruzzone Cloud Launcher</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 w-full animate-fade-in pb-20">
            {visibleShortcuts.map(shortcut => {
                const Icon = shortcut.icon;
                return (
                    <button 
                        key={shortcut.id}
                        onClick={() => onNavigate(shortcut.id)}
                        className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all flex flex-col items-center gap-6 group text-center active:scale-95 border-b-8 border-b-indigo-100/50"
                    >
                        <div className={`p-6 rounded-[2rem] ${shortcut.color} text-white shadow-2xl group-hover:scale-110 transition-transform`}>
                            <Icon size={40}/>
                        </div>
                        <div>
                            <p className="text-base font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{shortcut.label}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{shortcut.category}</p>
                        </div>
                    </button>
                );
            })}
            
            <button 
                onClick={() => setIsEditMode(true)}
                className="bg-slate-100/50 border-4 border-dashed border-slate-200 p-8 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white transition-all group min-h-[180px]"
            >
                <Plus size={48} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Personalizar</span>
            </button>
        </div>
      </div>
      
      {isEditMode && (
          <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl"><Layers size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-widest leading-none">Configurar Accesos</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Seleccione los módulos para su pantalla principal</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditMode(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {ALL_MODULES.map(m => (
                              <button 
                                key={m.id}
                                onClick={() => toggleShortcut(m.id)}
                                className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${userShortcuts.includes(m.id) ? 'border-indigo-600 bg-white shadow-lg scale-[1.02]' : 'border-slate-100 bg-white/50 grayscale opacity-60 hover:opacity-100 hover:bg-white'}`}>
                                  <div className={`p-3 rounded-xl ${m.color} text-white shadow-lg`}><m.icon size={20}/></div>
                                  <div className="flex-1">
                                      <p className="font-black text-xs uppercase text-slate-800 leading-tight">{m.label}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.category}</p>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${userShortcuts.includes(m.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                                      {userShortcuts.includes(m.id) && <CheckIcon size={14} strokeWidth={4}/>}
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userShortcuts.length} Módulos anclados</p>
                      <button onClick={() => setIsEditMode(false)} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-600">Guardar Cambios</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const CheckIcon: React.FC<{ size: number, strokeWidth: number }> = ({ size, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default Dashboard;
