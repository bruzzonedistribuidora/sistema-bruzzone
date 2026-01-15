
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Receipt, ShoppingCart, Package, Users, Truck, Wallet, 
    Calculator, Layers, ClipboardList, Bot, X, Plus,
    FileSpreadsheet, AlertTriangle, Settings2, CheckCircle,
    ShoppingBag, Laptop, PackagePlus, Globe, Key, Network,
    Tag, Laptop2, Globe2, BarChart3
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
    { id: ViewState.STOCK_ADJUSTMENT, label: "Ajuste Existencias", category: "Inventario", icon: Settings2, color: "bg-slate-800" },
    { id: ViewState.SHORTAGES, label: "Faltantes", category: "Logística", icon: AlertTriangle, color: "bg-orange-600" },
    { id: ViewState.REPLENISHMENT, label: "Armar Pedido", category: "Logística", icon: PackagePlus, color: "bg-emerald-600" },
    { id: ViewState.TREASURY, label: "Caja y Fondos", category: "Finanzas", icon: Wallet, color: "bg-emerald-600" },
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
    ViewState.REPLENISHMENT, ViewState.TREASURY, ViewState.REPORTS
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
      {/* ... (Modal de personalización se mantiene igual) */}
    </div>
  );
};

export default Dashboard;
