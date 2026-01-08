
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Receipt, ShoppingCart, Package, Users, Truck, Wallet, 
    Calculator, Layers, ClipboardList, Bot, X, Plus,
    FileSpreadsheet, AlertTriangle, Settings2, CheckCircle,
    ShoppingBag, Laptop, PackagePlus, Globe
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
      
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px] -z-10 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-slate-200 rounded-full blur-[100px] -z-10 opacity-40"></div>

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

        <div className="mt-24 flex items-center gap-8 text-slate-300">
            <div className="h-px w-32 bg-slate-200"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Central de Operaciones Sincronizada</p>
            <div className="h-px w-32 bg-slate-200"></div>
        </div>
      </div>

      {isEditMode && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-10 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-5 bg-indigo-500 rounded-[2rem] shadow-2xl shadow-indigo-500/20"><Settings2 size={40}/></div>
                          <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Configurar Escritorio</h3>
                              <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-2">Active los módulos que utiliza en su rutina diaria</p>
                          </div>
                      </div>
                      <button onClick={() => setIsEditMode(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={40}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {ALL_MODULES.map(module => {
                              const isSelected = userShortcuts.includes(module.id);
                              const Icon = module.icon;
                              return (
                                  <button 
                                    key={module.id}
                                    onClick={() => toggleShortcut(module.id)}
                                    className={`flex items-center p-6 rounded-[2.5rem] border-2 transition-all text-left group ${isSelected ? 'bg-white border-indigo-600 shadow-2xl' : 'bg-transparent border-slate-200 hover:border-slate-300 opacity-60'}`}>
                                      <div className={`p-5 rounded-3xl mr-5 ${isSelected ? module.color : 'bg-slate-200'} text-white shadow-xl transition-all`}>
                                          <Icon size={24}/>
                                      </div>
                                      <div className="flex-1">
                                          <p className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{module.label}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{module.category}</p>
                                      </div>
                                      {isSelected ? <CheckCircle size={24} className="text-indigo-600"/> : <Plus size={24} className="text-slate-300"/>}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <div className="p-10 bg-white border-t border-slate-100 flex justify-end shrink-0">
                      <button 
                        onClick={() => setIsEditMode(false)}
                        className="bg-slate-900 text-white px-20 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
                          Guardar Preferencias
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
