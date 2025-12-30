
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
    ShoppingBag, Laptop
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ViewState, Product, Client, Provider, CashRegister, DailyExpense, Purchase } from '../types';

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
    { id: ViewState.POS, label: "Ventas (POS)", category: "Ventas", icon: Receipt, color: "bg-indigo-500" },
    { id: ViewState.INVENTORY, label: "Artículos", category: "Stock", icon: Package, color: "bg-slate-700" },
    { id: ViewState.TREASURY, label: "Caja/Fondos", category: "Finanzas", icon: Wallet, color: "bg-emerald-600" },
    { id: ViewState.ACCOUNTING, label: "Contabilidad", category: "Finanzas", icon: Calculator, color: "bg-violet-600" },
    { id: ViewState.ECOMMERCE_ADMIN, label: "Gestión Web", category: "Digital", icon: Laptop, color: "bg-pink-600" },
    { id: ViewState.PUBLIC_PORTAL, label: "Fidelidad", category: "Digital", icon: Smartphone, color: "bg-amber-500" },
    { id: ViewState.PRICE_UPDATES, label: "Precios", category: "Stock", icon: Layers, color: "bg-orange-500" },
    { id: ViewState.AI_ASSISTANT, label: "FerreBot IA", category: "Inteligencia", icon: Bot, color: "bg-indigo-900" },
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // --- CARGA DE DATOS PARA KPIs ---
  const registers: CashRegister[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_registers') || '[]'), []);
  const clients: Client[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'), []);
  const providers: Provider[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'), []);
  const sales: any[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'), []);
  const expenses: DailyExpense[] = useMemo(() => JSON.parse(localStorage.getItem('daily_movements') || '[]'), []);
  const purchases: Purchase[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_purchases') || '[]'), []);

  // --- CÁLCULOS FINANCIEROS ---
  const financialSummary = useMemo(() => {
    const available = registers.reduce((acc, r) => acc + (r.balance || 0), 0);
    const toCollect = clients.reduce((acc, c) => acc + (c.balance || 0), 0);
    const toPay = providers.reduce((acc, p) => acc + (p.balance || 0), 0);
    
    // Simulación de datos para gráfico (semanal)
    const chartData = [
        { name: 'Lun', in: 45000, out: 12000 },
        { name: 'Mar', in: 52000, out: 45000 },
        { name: 'Mie', in: 48000, out: 15000 },
        { name: 'Jue', in: 61000, out: 22000 },
        { name: 'Vie', in: 55000, out: 30000 },
        { name: 'Sab', in: 85000, out: 12000 },
        { name: 'Dom', in: 20000, out: 5000 },
    ];

    return { available, toCollect, toPay, chartData };
  }, [registers, clients, providers]);

  // Consolidado de últimos movimientos
  const recentActivity = useMemo(() => {
      const activities = [
          ...sales.map(s => ({ type: 'SALE', label: `Venta: ${s.client}`, amount: s.total, date: s.date, icon: ArrowUpRight, color: 'text-green-500' })),
          ...expenses.map(e => ({ type: 'EXPENSE', label: e.description, amount: e.amount, date: e.date, icon: ArrowDownLeft, color: 'text-red-500' })),
          ...purchases.map(p => ({ type: 'PURCHASE', label: `Compra: ${p.providerName}`, amount: p.total, date: p.date, icon: Truck, color: 'text-blue-500' }))
      ];
      return activities.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [sales, expenses, purchases]);

  return (
    <div className="h-full bg-slate-50 relative overflow-hidden flex flex-col custom-scrollbar overflow-y-auto p-6 space-y-6">
      
      {/* CABECERA FINANCIERA (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          {/* DINERO DISPONIBLE */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={120}/></div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Dinero Disponible (Cajas)</p>
              <h3 className="text-5xl font-black tracking-tighter leading-none">${financialSummary.available.toLocaleString('es-AR')}</h3>
              <div className="mt-6 flex items-center gap-2 text-indigo-300">
                  <Activity size={14} className="animate-pulse"/>
                  <span className="text-[8px] font-black uppercase tracking-widest">Sincronizado en la nube</span>
              </div>
          </div>

          {/* SALDOS A COBRAR */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><UserCheck size={120}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Saldos a Cobrar (Cta Cte)</p>
              <h3 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">${financialSummary.toCollect.toLocaleString('es-AR')}</h3>
              <button onClick={() => onNavigate(ViewState.CLIENTS)} className="mt-6 text-indigo-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 hover:underline">Gestionar Cobranzas <ArrowRight size={10}/></button>
          </div>

          {/* DEUDAS A PAGAR */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Truck size={120}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Deudas a Pagar (Prov)</p>
              <h3 className="text-5xl font-black text-red-500 tracking-tighter leading-none">${financialSummary.toPay.toLocaleString('es-AR')}</h3>
              <button onClick={() => onNavigate(ViewState.PURCHASES)} className="mt-6 text-slate-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 hover:underline">Ver vencimientos <ArrowRight size={10}/></button>
          </div>
      </div>

      {/* SECCIÓN INTERMEDIA: GRÁFICO Y ACTIVIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
          {/* FLUJO DE CAJA SEMANAL */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-8">
                  <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600"/> Rendimiento Semanal
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Comparativa Ingresos vs Egresos</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                          <span className="text-[9px] font-black uppercase text-slate-500">Ingresos</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
                          <span className="text-[9px] font-black uppercase text-slate-500">Gastos</span>
                      </div>
                  </div>
              </div>
              <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialSummary.chartData}>
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
                          <Area type="monotone" dataKey="out" stroke="#f43f5e" strokeWidth={3} fillOpacity={0} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* ÚLTIMOS MOVIMIENTOS */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-2">
                  <History size={20} className="text-slate-400"/> Actividad
              </h3>
              <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  {recentActivity.map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl bg-slate-50 ${act.color} group-hover:scale-110 transition-transform`}>
                                  <act.icon size={18}/>
                              </div>
                              <div>
                                  <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 truncate max-w-[120px]">{act.label}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">{act.date}</p>
                              </div>
                          </div>
                          <p className={`font-black text-sm tracking-tighter ${act.type === 'EXPENSE' || act.type === 'PURCHASE' ? 'text-slate-800' : 'text-green-600'}`}>
                              {act.type === 'SALE' ? '+' : '-'}${act.amount.toLocaleString()}
                          </p>
                      </div>
                  ))}
                  {recentActivity.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                          <Activity size={40} className="mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase">Sin actividad hoy</p>
                      </div>
                  )}
              </div>
              <button onClick={() => onNavigate(ViewState.TREASURY)} className="mt-8 w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Ver Libro Diario</button>
          </div>
      </div>

      {/* SECCIÓN INFERIOR: ACCESOS RÁPIDOS */}
      <div className="pt-4 shrink-0 pb-12">
          <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Módulos Operativos</h3>
              <div className="h-px bg-slate-200 w-full"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {ALL_SHORTCUTS.map(shortcut => (
                  <button 
                    key={shortcut.id}
                    onClick={() => onNavigate(shortcut.id)}
                    className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-3 group text-center"
                  >
                      <div className={`p-3 rounded-2xl ${shortcut.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                          <shortcut.icon size={20}/>
                      </div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{shortcut.label}</span>
                  </button>
              ))}
          </div>
      </div>

      <footer className="text-center py-4 opacity-20">
          <p className="text-[9px] font-black uppercase tracking-[0.5em]">Bruzzone Cloud Finance Engine v4.5</p>
      </footer>
    </div>
  );
};

export default Dashboard;
