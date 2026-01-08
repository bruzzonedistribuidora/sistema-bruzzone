
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Receipt, ShoppingCart, Package, Users, Truck, Wallet, 
    Calculator, Settings, Layers, ClipboardList, TrendingUp, 
    Activity, ArrowUpRight, ArrowRight, Search, FileText, Bot, Tags,
    History, Globe, Landmark, ShieldCheck, FileSpreadsheet,
    FileBarChart2, AlertTriangle, Star, Check, Edit3, X, Plus,
    ListOrdered, Tag, CalendarDays, Shield, ArrowLeftRight,
    Building2, HardDrive, LayoutTemplate, Store, DollarSign,
    Zap, Boxes, FileUp, Smartphone, UserCheck, CheckCircle,
    Sparkles, ShieldAlert, RotateCcw, ArrowDownRight, ArrowDownLeft,
    ShoppingBag, Laptop, Heart, PackagePlus, Settings2, Eye, EyeOff,
    LayoutGrid
} from 'lucide-react';
import { ViewState } from '../types';

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

// Mapa de todos los módulos disponibles para elegir
const ALL_MODULES: ShortcutConfig[] = [
    { id: ViewState.POS, label: "Punto de Venta", category: "Ventas", icon: Receipt, color: "bg-indigo-500" },
    { id: ViewState.INVENTORY, label: "Stock Maestro", category: "Inventario", icon: Package, color: "bg-slate-700" },
    { id: ViewState.SHORTAGES, label: "Faltantes", category: "Logística", icon: AlertTriangle, color: "bg-orange-600" },
    { id: ViewState.REPLENISHMENT, label: "Armar Pedido", category: "Logística", icon: PackagePlus, color: "bg-emerald-600" },
    { id: ViewState.TREASURY, label: "Caja y Fondos", category: "Finanzas", icon: Wallet, color: "bg-emerald-600" },
    { id: ViewState.CLIENTS, label: "Clientes", category: "Ventas", icon: Users, color: "bg-sky-500" },
    { id: ViewState.PURCHASES, label: "Compras", category: "Stock", icon: Truck, color: "bg-blue-500" },
    { id: ViewState.ACCOUNTING, label: "Contabilidad", category: "Finanzas", icon: Calculator, color: "bg-violet-600" },
    { id: ViewState.ECOMMERCE_ADMIN, label: "Catálogo Web", category: "Digital", icon: Laptop, color: "bg-pink-600" },
    { id: ViewState.ONLINE_SALES, label: "Ventas Online", category: "Digital", icon: ShoppingCart, color: "bg-indigo-600" },
    { id: ViewState.PRICE_UPDATES, label: "Precios", category: "Stock", icon: Layers, color: "bg-orange-500" },
    { id: ViewState.REMITOS, label: "Remitos", category: "Ventas", icon: ClipboardList, color: "bg-blue-600" },
    { id: ViewState.PRESUPUESTOS, label: "Presupuestos", category: "Ventas", icon: FileSpreadsheet, color: "bg-teal-500" },
    { id: ViewState.AI_ASSISTANT, label: "FerreBot IA", category: "Inteligencia", icon: Bot, color: "bg-indigo-900" },
    { id: ViewState.DAILY_MOVEMENTS, label: "Gastos Diarios", category: "Finanzas", icon: DollarSign, color: "bg-red-500" },
    { id: ViewState.EMPLOYEES, label: "Personal", category: "RRHH", icon: Users, color: "bg-blue-400" },
    { id: ViewState.CLOUD_HUB, label: "Nube Central", category: "Sistema", icon: Globe, color: "bg-indigo-800" },
];

const DEFAULT_SHORTCUTS = [
    ViewState.POS, ViewState.INVENTORY, ViewState.SHORTAGES, 
    ViewState.REPLENISHMENT, ViewState.TREASURY, ViewState.CLIENTS
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [userShortcuts, setUserShortcuts] = useState<ViewState[]>(() => {
      const saved = localStorage.getItem('ferrecloud_user_shortcuts');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_user_shortcuts', JSON.stringify(userShortcuts));
  }, [userShortcuts]);

  const visibleShortcuts = useMemo(() => 
    ALL_MODULES.filter(m => userShortcuts.includes(m.id)),
  [userShortcuts]);

  const toggleShortcut = (id: ViewState) => {
      setUserShortcuts(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans relative">
      
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-slate-200 rounded-full blur-[80px] -z-10 opacity-40"></div>

      <div className="p-10 md:p-16 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">
        
        <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">Mi Escritorio</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Plataforma de Gestión Bruzzone Cloud</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 w-full animate-fade-in">
            {visibleShortcuts.map(shortcut => {
                const Icon = shortcut.icon;
                return (
                    <button 
                        key={shortcut.id}
                        onClick={() => onNavigate(shortcut.id)}
                        className="bg-white/80 backdrop-blur-sm p-8 rounded-[3rem] border border-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-6 group text-center active:scale-95 border-b-4 border-b-indigo-100"
                    >
                        <div className={`p-6 rounded-[2rem] ${shortcut.color} text-white shadow-xl group-hover:scale-110 transition-transform`}>
                            <Icon size={32}/>
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{shortcut.label}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{shortcut.category}</p>
                        </div>
                    </button>
                );
            })}

            <button 
                onClick={() => setIsEditMode(true)}
                className="bg-slate-100/50 border-4 border-dashed border-slate-200 p-8 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white transition-all group"
            >
                <Plus size={40} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Personalizar</span>
            </button>
        </div>

        <div className="mt-20 flex items-center gap-6 text-slate-300">
            <div className="h-px w-20 bg-slate-200"></div>
            <p className="text-[9px] font-black uppercase tracking-widest">Sincronizado con Nube Central</p>
            <div className="h-px w-20 bg-slate-200"></div>
        </div>
      </div>

      {isEditMode && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-500 rounded-[1.8rem] shadow-xl"><Settings2 size={32}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Configurar Lanzador</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Personaliza los módulos de tu pantalla de inicio</p>
                          </div>
                      </div>
                      <button onClick={() => setIsEditMode(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {ALL_MODULES.map(module => {
                              const isSelected = userShortcuts.includes(module.id);
                              const Icon = module.icon;
                              return (
                                  <button 
                                    key={module.id}
                                    onClick={() => toggleShortcut(module.id)}
                                    className={`flex items-center p-5 rounded-3xl border-2 transition-all text-left group ${isSelected ? 'bg-white border-indigo-600 shadow-xl' : 'bg-transparent border-slate-200 hover:border-slate-300 opacity-60'}`}>
                                      <div className={`p-4 rounded-2xl mr-4 ${isSelected ? module.color : 'bg-slate-200'} text-white shadow-lg transition-all`}>
                                          <Icon size={20}/>
                                      </div>
                                      <div className="flex-1">
                                          <p className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{module.label}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{module.category}</p>
                                      </div>
                                      {isSelected ? <CheckCircle size={20} className="text-indigo-600"/> : <Plus size={20} className="text-slate-300"/>}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end shrink-0">
                      <button 
                        onClick={() => setIsEditMode(false)}
                        className="bg-slate-900 text-white px-16 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                          <Check size={18}/> Aplicar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
