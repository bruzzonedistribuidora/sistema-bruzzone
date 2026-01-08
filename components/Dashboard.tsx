
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
    // Add missing LayoutGrid import
    LayoutGrid
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ViewState, Product, Client, Provider, CashRegister, DailyExpense, Purchase } from '../types';

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

  // --- PERSISTENCIA DE PREFERENCIAS ---
  useEffect(() => {
      localStorage.setItem('ferrecloud_user_shortcuts', JSON.stringify(userShortcuts));
  }, [userShortcuts]);

  // --- CARGA DE DATOS PARA KPIs ---
  const [data, setData] = useState({
      available: 0,
      toCollect: 0,
      toPay: 0,
      recentActivity: [] as any[]
  });

  useEffect(() => {
    const registers: CashRegister[] = JSON.parse(localStorage.getItem('ferrecloud_registers') || '[]');
    const clients: Client[] = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
    const providers: Provider[] = JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]');
    const sales: any[] = JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]');
    const expenses: DailyExpense[] = JSON.parse(localStorage.getItem('daily_movements') || '[]');
    const purchases: Purchase[] = JSON.parse(localStorage.getItem('ferrecloud_purchases') || '[]');

    const available = registers.reduce((acc, r) => acc + (r.balance || 0), 0);
    const toCollect = clients.reduce((acc, c) => acc + (c.balance || 0), 0);
    const toPay = providers.reduce((acc, p) => acc + (p.balance || 0), 0);

    const activities = [
        ...sales.map(s => ({ type: 'SALE', label: `Venta: ${s.client}`, amount: s.total, date: s.date, icon: ArrowUpRight, color: 'text-green-500' })),
        ...expenses.map(e => ({ type: 'EXPENSE', label: e.description, amount: e.amount, date: e.date, icon: ArrowDownLeft, color: 'text-red-500' })),
        ...purchases.map(p => ({ type: 'PURCHASE', label: `Compra: ${p.providerName}`, amount: p.total, date: p.date, icon: Truck, color: 'text-blue-500' }))
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    setData({ available, toCollect, toPay, recentActivity: activities });
  }, []);

  const visibleShortcuts = useMemo(() => 
    ALL_MODULES.filter(m => userShortcuts.includes(m.id)),
  [userShortcuts]);

  const toggleShortcut = (id: ViewState) => {
      setUserShortcuts(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      
      {/* AREA DE KPIs: PRIORIDAD SUPERIOR */}
      <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Escritorio Central</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Activity size={14} className="text-green-500 animate-pulse"/> Estado financiero consolidado en la nube
                </p>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Base de Datos OK</span>
                </div>
            </div>
        </div>

        {/* CABECERA FINANCIERA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={120}/></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Dinero en Cajas</p>
                <h3 className="text-5xl font-black tracking-tighter leading-none">${data.available.toLocaleString('es-AR')}</h3>
                <div className="mt-8 flex items-center gap-2">
                    <button onClick={() => onNavigate(ViewState.TREASURY)} className="text-[9px] font-black uppercase text-indigo-300 hover:text-white flex items-center gap-1 transition-colors">
                        Ver Arqueo <ArrowRight size={12}/>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><UserCheck size={120}/></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Cuentas por Cobrar</p>
                <h3 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">${data.toCollect.toLocaleString('es-AR')}</h3>
                <div className="mt-8 flex items-center gap-2">
                    <button onClick={() => onNavigate(ViewState.CLIENTS)} className="text-[9px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1">
                        Gestionar Mora <ArrowRight size={12}/>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Truck size={120}/></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Pagos a Proveedores</p>
                <h3 className="text-5xl font-black text-red-500 tracking-tighter leading-none">${data.toPay.toLocaleString('es-AR')}</h3>
                <div className="mt-8 flex items-center gap-2">
                    <button onClick={() => onNavigate(ViewState.PURCHASES)} className="text-[9px] font-black uppercase text-slate-500 hover:underline flex items-center gap-1">
                        Ver Vencimientos <ArrowRight size={12}/>
                    </button>
                </div>
            </div>
        </div>

        {/* SECCIÓN INTERMEDIA: GRÁFICO Y ACTIVIDAD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-600"/> Rendimiento Comercial
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Flujo de Ingresos Semanal</p>
                    </div>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                            { name: 'Lun', in: 45000 }, { name: 'Mar', in: 52000 }, { name: 'Mie', in: 48000 },
                            { name: 'Jue', in: 61000 }, { name: 'Vie', in: 55000 }, { name: 'Sab', in: 85000 }, { name: 'Dom', in: 20000 },
                        ]}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="in" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorIn)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-2">
                    <History size={20} className="text-slate-400"/> Recientes
                </h3>
                <div className="space-y-6 flex-1">
                    {data.recentActivity.map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between group animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-slate-50 ${act.color} group-hover:scale-110 transition-transform`}>
                                    <act.icon size={18}/>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 truncate max-w-[120px]">{act.label}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{act.date}</p>
                                </div>
                            </div>
                            <p className={`font-black text-sm tracking-tighter ${act.type === 'SALE' ? 'text-green-600' : 'text-slate-800'}`}>
                                {act.type === 'SALE' ? '+' : '-'}${act.amount.toLocaleString()}
                            </p>
                        </div>
                    ))}
                    {data.recentActivity.length === 0 && (
                        <div className="text-center py-10 opacity-30">
                            <Activity size={40} className="mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase">Sin actividad registrada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* BARRA DE MODULOS PERSONALIZABLES: FIJADA AL FONDO */}
      <div className="bg-white border-t border-slate-200 px-8 py-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
          <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <LayoutGrid size={18}/>
                    </div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em]">Mis Accesos Rápidos</h3>
              </div>
              <button 
                onClick={() => setIsEditMode(true)}
                className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                title="Configurar accesos directos">
                <Settings2 size={20}/>
              </button>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
              {visibleShortcuts.map(shortcut => {
                  const Icon = shortcut.icon;
                  return (
                    <button 
                      key={shortcut.id}
                      onClick={() => onNavigate(shortcut.id)}
                      className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group shrink-0 active:scale-95 min-w-[180px]"
                    >
                        <div className={`p-3 rounded-xl ${shortcut.color} text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform`}>
                            <Icon size={18}/>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{shortcut.label}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{shortcut.category}</p>
                        </div>
                    </button>
                  );
              })}
              
              <button 
                onClick={() => setIsEditMode(true)}
                className="flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl px-6 py-4 text-slate-300 hover:border-indigo-200 hover:text-indigo-400 transition-all shrink-0">
                  <Plus size={20}/>
              </button>
          </div>
      </div>

      {/* MODAL: PERSONALIZAR ESCRITORIO */}
      {isEditMode && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-500 rounded-[1.8rem] shadow-xl"><Settings2 size={32}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Personalizar Mi Escritorio</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Seleccione los módulos que desea tener a mano</p>
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
                          <Check size={18}/> Guardar Preferencias
                      </button>
                  </div>
              </div>
          </div>
      )}

      <footer className="fixed bottom-0 left-64 right-0 pointer-events-none pb-2 text-center opacity-10">
          <p className="text-[7px] font-black uppercase tracking-[1em]">Bruzzone Cloud Finance Engine v4.9 • Buenos Aires, ARG</p>
      </footer>
    </div>
  );
};

export default Dashboard;
