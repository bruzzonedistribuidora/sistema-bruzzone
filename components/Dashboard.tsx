import React, { useState, useEffect, useMemo } from 'react';
import { 
    Receipt, ShoppingCart, Package, Users, Truck, Wallet, 
    Calculator, Layers, ClipboardList, Bot, X, Plus,
    FileSpreadsheet, AlertTriangle, Settings2, CheckCircle,
    ShoppingBag, Laptop, PackagePlus, Globe, Key, Network,
    Tag, Laptop2, Globe2, BarChart3, Activity
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
    { id: ViewState.POS, label: "Venta (POS)", category: "Ventas", icon: Receipt, color: "bg-indigo-500" },
    { id: ViewState.INVENTORY, label: "Maestro Art.", category: "Inventario", icon: Package, color: "bg-slate-700" },
    { id: ViewState.MASS_PRODUCT_UPDATE, label: "Cambios Masivos", category: "Inventario", icon: Layers, color: "bg-slate-800" },
    { id: ViewState.STOCK_ADJUSTMENT, label: "Ajuste Existencias", category: "Inventario", icon: Settings2, color: "bg-slate-800" },
    { id: ViewState.SHORTAGES, label: "Faltantes", category: "Logística", icon: AlertTriangle, color: "bg-orange-600" },
    { id: ViewState.REPLENISHMENT, label: "Armar Pedido", category: "Logística", icon: PackagePlus, color: "bg-emerald-600" },
    { id: ViewState.TREASURY, label: "Caja y Fondos", category: "Finanzas", icon: Wallet, color: "bg-emerald-600" },
    { id: ViewState.DAILY_MOVEMENTS, label: "Gastos Diarios", category: "Finanzas", icon: Activity, color: "bg-red-500" },
    { id: ViewState.CLIENTS, label: "Clientes", category: "Ventas", icon: Users, color: "bg-sky-500" },
    { id: ViewState.PURCHASES, label: "Compras", category: "Stock", icon: Truck, color: "bg-blue-500" },
    { id: ViewState.ACCOUNTING, label: "Contabilidad", category: "Finanzas", icon: Calculator, color: "bg-violet-600" },
    { id: ViewState.ECOMMERCE_ADMIN, label: "Web Admin", category: "E-Commerce", icon: Laptop2, color: "bg-pink-600" },
    { id: ViewState.ONLINE_SALES, label: "Hub ML/Nube", category: "E-Commerce", icon: Globe2, color: "bg-indigo-600" },
    { id: ViewState.REPORTS, label: "Reportes Full", category: "Gestión", icon: BarChart3, color: "bg-indigo-900" },
    { id: ViewState.CLOUD_HUB, label: "Nube / Red LAN", category: "Sistema", icon: Network, color: "bg-indigo-800" },
];

const DEFAULT_SHORTCUTS = [
    ViewState.POS, ViewState.INVENTORY, ViewState.CLOUD_HUB, 
    ViewState.REPLENISHMENT, ViewState.TREASURY, ViewState.MASS_PRODUCT_UPDATE
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
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans relative">
      <div className="p-10 md:p-20 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Mi Escritorio</h1>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.6em]">Bruzzone Cloud Launcher</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10 w-full animate-fade-in">
            {visibleShortcuts.map(shortcut => {
                const Icon = shortcut.icon;
                return (
                    <button 
                        key={shortcut.id}
                        onClick={() => onNavigate(shortcut.id)}
                        className="bg-white/80 backdrop-blur-md p-10 rounded-[4rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all flex flex-col items-center gap-8 group text-center active:scale-95 border-b-8 border-b-indigo-100"
                    >
                        <div className={`p-8 rounded-[2.5rem] ${shortcut.color} text-white shadow-2xl group-hover:scale-110 transition-transform`}>
                            <Icon size={48}/>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{shortcut.label}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shortcut.category}</p>
                        </div>
                    </button>
                );
            })}
            <button 
                onClick={() => setIsEditMode(true)}
                className="bg-slate-100/50 border-4 border-dashed border-slate-200 p-10 rounded-[4rem] flex flex-col items-center justify-center gap-6 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white transition-all group"
            >
                <Plus size={56} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-xs font-black uppercase tracking-widest">Personalizar</span>
            </button>
        </div>
      </div>
      
      {isEditMode && (
          <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-xl font-black uppercase tracking-widest">Configurar Accesos Directos</h3>
                      <button onClick={() => setIsEditMode(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ALL_MODULES.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => toggleShortcut(m.id)}
                            className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${userShortcuts.includes(m.id) ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white grayscale opacity-50'}`}>
                              <div className={`p-3 rounded-xl ${m.color} text-white`}><m.icon size={20}/></div>
                              <div className="text-left">
                                  <p className="font-black text-xs uppercase text-slate-800">{m.label}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{m.category}</p>
                              </div>
                              {userShortcuts.includes(m.id) && <CheckCircle size={20} className="ml-auto text-indigo-600" />}
                          </button>
                      ))}
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button onClick={() => setIsEditMode(false)} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Guardar Configuración</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
