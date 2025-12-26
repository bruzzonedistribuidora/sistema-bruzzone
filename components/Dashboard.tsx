
import React, { useState, useEffect } from 'react';
import { 
    Receipt, ShoppingCart, Package, Users, Truck, Wallet, 
    Calculator, Settings, Layers, ClipboardList, TrendingUp, 
    Activity, ArrowUpRight, Search, FileText, Bot, Tags,
    History, Globe, Landmark, ShieldCheck, FileSpreadsheet,
    FileBarChart2, AlertTriangle, Star, Check, Edit3, X, Plus,
    ListOrdered, Tag, CalendarDays, Shield, ArrowLeftRight,
    Building2, HardDrive, LayoutTemplate, Store, DollarSign,
    Zap, Boxes, FileUp, Smartphone, UserCheck, CheckCircle,
    Sparkles, ShieldAlert, RotateCcw
} from 'lucide-react';
import { ViewState } from '../types';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

interface Shortcut {
    id: ViewState;
    label: string;
    category: string;
    icon: any;
    color: string;
}

const ALL_SHORTCUTS: Shortcut[] = [
    // --- VENTAS ---
    { id: ViewState.POS, label: "Punto de Venta", category: "Ventas", icon: Receipt, color: "bg-gradient-to-br from-green-400 to-emerald-600" },
    { id: ViewState.SALES_ORDERS, label: "Pedidos Clientes", category: "Ventas", icon: ListOrdered, color: "bg-gradient-to-br from-green-500 to-teal-600" },
    { id: ViewState.CREDIT_NOTES, label: "Notas de Crédito", category: "Ventas", icon: RotateCcw, color: "bg-gradient-to-br from-red-400 to-rose-600" },
    { id: ViewState.ONLINE_SALES, label: "Ventas Online", category: "Ventas", icon: Globe, color: "bg-gradient-to-br from-sky-400 to-blue-600" },
    { id: ViewState.REMITOS, label: "Remitos / Cta Cte", category: "Ventas", icon: ClipboardList, color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { id: ViewState.CLIENTS, label: "Fichero Clientes", category: "Ventas", icon: Users, color: "bg-gradient-to-br from-slate-400 to-slate-600" },
    { id: ViewState.CLIENT_BALANCES, label: "Saldos Clientes", category: "Ventas", icon: Landmark, color: "bg-gradient-to-br from-rose-400 to-red-600" },
    { id: ViewState.PRESUPUESTOS, label: "Presupuestos", category: "Ventas", icon: FileSpreadsheet, color: "bg-gradient-to-br from-emerald-400 to-teal-600" },

    // --- STOCK & COMPRAS ---
    { id: ViewState.INVENTORY, label: "Artículos", category: "Stock", icon: Package, color: "bg-gradient-to-br from-indigo-400 to-indigo-700" },
    { id: ViewState.PRICE_UPDATES, label: "Listas Precios", category: "Stock", icon: Layers, color: "bg-gradient-to-br from-violet-400 to-purple-700" },
    { id: ViewState.MASS_PRODUCT_UPDATE, label: "Cambios Masivos", category: "Stock", icon: Zap, color: "bg-gradient-to-br from-amber-400 to-orange-500" },
    { id: ViewState.STOCK_TRANSFERS, label: "Traslados", category: "Stock", icon: ArrowLeftRight, color: "bg-gradient-to-br from-slate-600 to-slate-800" },
    { id: ViewState.PURCHASES, label: "Cargar Compras", category: "Stock", icon: Truck, color: "bg-gradient-to-br from-slate-700 to-slate-900" },
    { id: ViewState.REPLENISHMENT, label: "Pedidos Prov.", category: "Stock", icon: ShoppingCart, color: "bg-gradient-to-br from-indigo-600 to-blue-800" },
    { id: ViewState.SHORTAGES, label: "Faltantes", category: "Stock", icon: AlertTriangle, color: "bg-gradient-to-br from-orange-400 to-red-500" },
    { id: ViewState.LABEL_PRINTING, label: "Etiquetas", category: "Stock", icon: Tag, color: "bg-gradient-to-br from-amber-500 to-yellow-600" },

    // --- FINANZAS ---
    { id: ViewState.TREASURY, label: "Tesorería", category: "Finanzas", icon: Wallet, color: "bg-gradient-to-br from-orange-400 to-orange-600" },
    { id: ViewState.DAILY_MOVEMENTS, label: "Gastos Diarios", category: "Finanzas", icon: CalendarDays, color: "bg-gradient-to-br from-rose-500 to-pink-700" },
    { id: ViewState.ACCOUNTING, label: "Contabilidad", category: "Finanzas", icon: Calculator, color: "bg-gradient-to-br from-slate-500 to-slate-700" },
    { id: ViewState.STATISTICS, label: "Estadísticas", category: "Finanzas", icon: TrendingUp, color: "bg-gradient-to-br from-cyan-400 to-blue-500" },
    { id: ViewState.REPORTS, label: "Reportes", category: "Finanzas", icon: FileBarChart2, color: "bg-gradient-to-br from-sky-500 to-indigo-600" },
    { id: ViewState.EMPLOYEES, label: "Personal", category: "Finanzas", icon: UserCheck, color: "bg-gradient-to-br from-indigo-500 to-purple-600" },

    // --- CONFIGURACIÓN ---
    { id: ViewState.CONFIG_PANEL, label: "Panel Maestro", category: "Sistema", icon: Settings, color: "bg-gradient-to-br from-slate-800 to-slate-950" },
    { id: ViewState.COMPANY_SETTINGS, label: "Mi Empresa", category: "Sistema", icon: Building2, color: "bg-gradient-to-br from-blue-600 to-indigo-800" },
    { id: ViewState.AFIP_CONFIG, label: "Enlace AFIP", category: "Sistema", icon: ShieldCheck, color: "bg-gradient-to-br from-blue-400 to-indigo-500" },
    { id: ViewState.USERS, label: "Usuarios/Roles", category: "Sistema", icon: Shield, color: "bg-gradient-to-br from-purple-500 to-indigo-700" },
    { id: ViewState.BRANCHES, label: "Sucursales", category: "Sistema", icon: Store, color: "bg-gradient-to-br from-teal-500 to-emerald-700" },
    { id: ViewState.PRINT_CONFIG, label: "Imprenta", category: "Sistema", icon: LayoutTemplate, color: "bg-gradient-to-br from-orange-500 to-amber-700" },
    { id: ViewState.BACKUP, label: "Base de Datos", category: "Sistema", icon: HardDrive, color: "bg-gradient-to-br from-slate-600 to-slate-900" },

    // --- INTELIGENCIA ---
    { id: ViewState.AI_ASSISTANT, label: "FerreBot IA", category: "Inteligencia", icon: Bot, color: "bg-gradient-to-br from-pink-500 to-rose-600" },
    { id: ViewState.MARKETING, label: "Marketing", category: "Inteligencia", icon: Sparkles, color: "bg-gradient-to-br from-indigo-600 to-purple-700" },
    { id: ViewState.PRICE_AUDIT, label: "Auditoría Precios", category: "Inteligencia", icon: ShieldAlert, color: "bg-gradient-to-br from-red-500 to-orange-600" },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<ViewState[]>(() => {
    const saved = localStorage.getItem('ferrecloud_pinned_v3');
    return saved ? JSON.parse(saved) : [ViewState.POS, ViewState.INVENTORY, ViewState.REMITOS, ViewState.TREASURY, ViewState.PURCHASES, ViewState.PRESUPUESTOS, ViewState.CLIENT_BALANCES, ViewState.PRICE_UPDATES, ViewState.AI_ASSISTANT, ViewState.REPORTS, ViewState.MARKETING, ViewState.PRICE_AUDIT, ViewState.CREDIT_NOTES];
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_pinned_v3', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (id: ViewState) => {
    if (pinnedIds.includes(id)) {
        if (pinnedIds.length > 1) {
            setPinnedIds(pinnedIds.filter(p => p !== id));
        }
    } else {
        setPinnedIds([...pinnedIds, id]);
    }
  };

  const DesktopIcon: React.FC<{ shortcut: Shortcut, isPinned: boolean, editMode: boolean }> = ({ shortcut, isPinned, editMode }) => (
    <div className="relative group animate-fade-in">
        <div 
            onClick={() => !editMode && onNavigate(shortcut.id)}
            className={`w-full flex flex-col items-center gap-3 p-4 rounded-[2.5rem] transition-all cursor-pointer ${
                editMode ? 'scale-95' : 'hover:bg-white/40 hover:backdrop-blur-md hover:scale-105 active:scale-95'
            } ${editMode && !isPinned ? 'opacity-40 grayscale hover:opacity-70' : 'opacity-100'}`}
        >
            <div className={`w-20 h-20 rounded-[1.8rem] ${shortcut.color} flex items-center justify-center text-white shadow-2xl transition-all border border-white/20 relative overflow-visible`}>
                <shortcut.icon size={32} />
                
                {editMode && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            togglePin(shortcut.id); 
                        }}
                        className={`absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all z-30 ${
                            isPinned ? 'bg-green-500 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:bg-slate-700'
                        }`}
                        title={isPinned ? "Quitar del escritorio" : "Anclar al escritorio"}
                    >
                        {isPinned ? <Check size={18} strokeWidth={4}/> : <Plus size={18} strokeWidth={4}/>}
                    </button>
                )}
            </div>
            <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 opacity-70">{shortcut.category}</p>
                <p className={`text-[11px] font-black uppercase tracking-tighter transition-colors ${editMode && !isPinned ? 'text-slate-400' : 'text-slate-800'}`}>{shortcut.label}</p>
            </div>
        </div>
    </div>
  );

  const categories = Array.from(new Set(ALL_SHORTCUTS.map(s => s.category)));

  return (
    <div className="h-full bg-slate-50 relative overflow-hidden flex flex-col custom-scrollbar overflow-y-auto">
      {/* Fondos Decorativos Dinámicos */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-100 rounded-full blur-[120px] opacity-40"></div>

      <div className="relative z-10 flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full">
        {/* Cabecera Superior */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    {isEditMode ? 'Personalizar Escritorio' : 'Mi Escritorio'}
                </h1>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                    {isEditMode 
                        ? 'Selecciona los módulos que utilizas con frecuencia' 
                        : <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Bruzzone Cloud OS • 140.000 Artículos</>
                    }
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 text-xs ${
                        isEditMode ? 'bg-indigo-600 text-white ring-8 ring-indigo-50' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {isEditMode ? <><CheckCircle size={18}/> Finalizar Edición</> : <><Edit3 size={18}/> Personalizar Iconos</>}
                </button>
            </div>
        </div>

        {/* MODO EDICIÓN: Agrupado por categorías */}
        {isEditMode ? (
            <div className="space-y-12 animate-fade-in pb-20">
                {categories.map(cat => (
                    <div key={cat} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{cat}</h3>
                            <div className="h-px bg-slate-200 w-full"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                            {ALL_SHORTCUTS.filter(s => s.category === cat).map(s => (
                                <DesktopIcon 
                                    key={s.id} 
                                    shortcut={s} 
                                    isPinned={pinnedIds.includes(s.id)} 
                                    editMode={true} 
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            /* MODO NORMAL: Grilla limpia de favoritos */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12 animate-fade-in">
                {ALL_SHORTCUTS.filter(s => pinnedIds.includes(s.id)).map(s => (
                    <DesktopIcon 
                        key={s.id} 
                        shortcut={s} 
                        isPinned={true} 
                        editMode={false} 
                    />
                ))}
                
                {/* Botón de Añadir Rápido al final */}
                <button 
                    onClick={() => setIsEditMode(true)}
                    className="flex flex-col items-center gap-3 p-4 rounded-[2.5rem] opacity-40 hover:opacity-100 hover:bg-white/40 transition-all group"
                >
                    <div className="w-20 h-20 rounded-[1.8rem] border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-all">
                        <Plus size={32} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tighter text-slate-400">Añadir Más</span>
                </button>
            </div>
        )}

        {/* Widgets de Estado (Solo modo normal) */}
        {!isEditMode && (
            <div className="mt-auto pt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:bg-white/80 transition-all">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <Activity size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Datos</p>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter mt-1">140k SKUs OK</h4>
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:bg-white/80 transition-all">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal ARCA</p>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter mt-1">Conectado</h4>
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:bg-white/80 transition-all">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <DollarSign size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Hoy</p>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter mt-1">$215.420</h4>
                    </div>
                </div>
            </div>
        )}
      </div>

      <footer className="p-8 text-center mt-auto">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Bruzzone Cloud OS v4.1</p>
      </footer>
    </div>
  );
};

export default Dashboard;
