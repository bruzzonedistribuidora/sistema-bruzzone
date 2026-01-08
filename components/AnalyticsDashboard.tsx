
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, UserCheck, Truck, TrendingUp, History, Activity, 
    ArrowUpRight, ArrowDownLeft, ArrowRight, Building2,
    CalendarDays, DollarSign, Calculator, Receipt, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CashRegister, Client, Provider, DailyExpense, Purchase, ViewState } from '../types';

interface AnalyticsDashboardProps {
    onNavigate: (view: ViewState) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onNavigate }) => {
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
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    setData({ available, toCollect, toPay, recentActivity: activities });
  }, []);

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-10 font-sans pb-24">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">Centro de Parámetros</h1>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Activity size={14} className="text-green-500 animate-pulse"/> Analítica financiera en tiempo real
                </p>
            </div>
            <div className="flex items-center gap-4">
                 <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <CalendarDays size={18} className="text-indigo-500"/>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
        </div>

        {/* PARÁMETROS SOLICITADOS: DISPONIBLE, POR COBRAR, POR PAGAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={120}/></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Dinero Disponible (Cajas)</p>
                <h3 className="text-6xl font-black tracking-tighter leading-none">${data.available.toLocaleString('es-AR')}</h3>
                <div className="mt-12 flex items-center gap-2">
                    <button onClick={() => onNavigate(ViewState.TREASURY)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                        Ir a Arqueo <ArrowRight size={14}/>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><UserCheck size={120}/></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Cuentas por Cobrar (Clientes)</p>
                <h3 className="text-6xl font-black text-slate-800 tracking-tighter leading-none">${data.toCollect.toLocaleString('es-AR')}</h3>
                <div className="mt-12 flex items-center gap-2">
                    <button onClick={() => onNavigate(ViewState.CLIENTS)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                        Gestión Cobranzas <ArrowRight size={14}/>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Truck size={120}/></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Cuentas por Pagar (Proveedores)</p>
                <h3 className="text-6xl font-black text-red-600 tracking-tighter leading-none">${data.toPay.toLocaleString('es-AR')}</h3>
                <div className="mt-12 flex items-center gap-2">
                    <button onClick={() => onNavigate(ViewState.PURCHASES)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                        Ver Deudas <ArrowRight size={14}/>
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                            <TrendingUp size={28} className="text-indigo-600"/> Rendimiento Comercial
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Flujo de ingresos semanal consolidado</p>
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
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="in" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorIn)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-10 flex items-center gap-3">
                    <History size={28} className="text-slate-400"/> Actividad
                </h3>
                <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {data.recentActivity.map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between group animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-slate-50 ${act.color} group-hover:scale-110 transition-transform`}>
                                    <act.icon size={20}/>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1.5 truncate max-w-[150px]">{act.label}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{act.date}</p>
                                </div>
                            </div>
                            <p className={`font-black text-sm tracking-tighter ${act.type === 'SALE' ? 'text-green-600' : 'text-slate-800'}`}>
                                {act.type === 'SALE' ? '+' : '-'}${act.amount.toLocaleString('es-AR')}
                            </p>
                        </div>
                    ))}
                    {data.recentActivity.length === 0 && (
                        <div className="text-center py-10 opacity-30">
                            <Activity size={48} className="mx-auto mb-3" />
                            <p className="text-[10px] font-black uppercase">Sin actividad reciente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-indigo-900 rounded-[3.5rem] p-12 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 p-12 opacity-5 pointer-events-none rotate-12"><Building2 size={280}/></div>
            <div className="relative z-10 space-y-4 text-center md:text-left">
                <h4 className="text-3xl font-black uppercase tracking-tighter">Informes de Rentabilidad</h4>
                <p className="text-indigo-200 text-sm max-w-md font-medium leading-relaxed">Acceda al análisis completo de márgenes por rubro, stock dormido y punto de equilibrio operativo.</p>
            </div>
            <button 
                onClick={() => onNavigate(ViewState.REPORTS)}
                className="relative z-10 bg-white text-indigo-900 px-12 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-3">
                <BarChart3 size={20}/> Reporte Gerencial Full
            </button>
        </div>

        <footer className="fixed bottom-0 left-64 right-0 pointer-events-none pb-4 text-center opacity-10">
            <p className="text-[7px] font-black uppercase tracking-[1.5em]">Bruzzone Cloud Finance Engine v5.1 • Buenos Aires, ARG</p>
        </footer>
    </div>
  );
};

export default AnalyticsDashboard;
