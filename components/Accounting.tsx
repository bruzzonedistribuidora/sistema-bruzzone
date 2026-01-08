
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calculator, FileText, BookOpen, PieChart, Landmark, Plus, 
    Search, Download, TrendingUp, Target, Activity, DollarSign, 
    ArrowUpRight, ArrowDownRight, ArrowDownLeft, Filter, Settings, FileBarChart,
    Scale, Clock, Calendar, Zap, AlertTriangle, TrendingDown,
    ListTree, ArrowLeftRight, CheckCircle2, X, Save, PlusCircle,
    History, Library, ShieldCheck, ChevronRight, Info, Wallet,
    TrendingUp as ProfitIcon, BarChart3, LineChart as ChartIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, LineChart, Line } from 'recharts';
import { Product, DailyExpense, SalesOrder, CurrentAccountMovement } from '../types';

type AccSection = 'DIARIO' | 'RESULTADOS' | 'PLAN' | 'EQUILIBRIO' | 'FISCAL' | 'CASHFLOW';

interface JournalEntry {
    id: string;
    date: string;
    description: string;
    items: {
        accountId: string;
        accountName: string;
        debit: number;
        credit: number;
    }[];
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO';
    balance: number;
}

const INITIAL_ACCOUNTS: Account[] = [
    { id: '1', code: '1.1.01', name: 'Caja Moneda Nacional', type: 'ACTIVO', balance: 0 },
    { id: '2', code: '1.1.02', name: 'Banco Galicia Cta Cte', type: 'ACTIVO', balance: 0 },
    { id: '3', code: '1.1.05', name: 'Mercaderías (Stock)', type: 'ACTIVO', balance: 0 },
    { id: '4', code: '2.1.01', name: 'Proveedores a Pagar', type: 'PASIVO', balance: 0 },
    { id: '5', code: '4.1.01', name: 'Ventas de Mercadería', type: 'INGRESO', balance: 0 },
    { id: '6', code: '5.1.01', name: 'Costo de Mercadería Vendida', type: 'EGRESO', balance: 0 },
    { id: '7', code: '5.2.01', name: 'Gastos de Administración', type: 'EGRESO', balance: 0 },
];

const Accounting: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AccSection>('CASHFLOW');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- PERSISTENCIA CONTABLE ---
  const [accounts] = useState<Account[]>(() => {
      const saved = localStorage.getItem('ferrecloud_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [entries] = useState<JournalEntry[]>(() => {
      const saved = localStorage.getItem('ferrecloud_journal');
      return saved ? JSON.parse(saved) : [];
  });

  // --- DATOS DE OTROS MÓDULOS ---
  const products: Product[] = useMemo(() => {
    try {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }, []);

  const expenses: DailyExpense[] = useMemo(() => {
    try {
        const saved = localStorage.getItem('daily_movements');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }, []);

  const sales: any[] = useMemo(() => {
    try {
        const saved = localStorage.getItem('ferrecloud_sales_history');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }, []);

  // --- CÁLCULOS FINANCIEROS AVANZADOS ---
  const financials = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const fixedExp = expenses.filter(e => e.category === 'FIXED' && e.type === 'EXPENSE').reduce((acc, e) => acc + (e.amount || 0), 0);
    const varExp = expenses.filter(e => e.category === 'VARIABLE' && e.type === 'EXPENSE').reduce((acc, e) => acc + (e.amount || 0), 0);
    
    // Margen promedio real del inventario (por defecto 30%)
    const avgMargin = products.length > 0 
        ? products.reduce((acc, p) => acc + (p.profitMargin || 30), 0) / products.length 
        : 30;
    
    const marginFactor = avgMargin / 100;
    
    // Punto de Equilibrio Mensual (Base)
    const breakEvenMonthly = marginFactor > 0 ? fixedExp / marginFactor : 0;

    return { 
        totalSales, 
        fixedExp, 
        varExp, 
        avgMargin,
        be: {
            monthly: breakEvenMonthly,
            daily: breakEvenMonthly / 30,
            weekly: breakEvenMonthly / 4.33,
            annual: breakEvenMonthly * 12
        }
    };
  }, [products, expenses, sales]);

  // --- DATOS PARA GRÁFICO CASH FLOW (SIMULADO POR DÍAS) ---
  const cashflowData = useMemo(() => {
      return [
          { name: 'Lun', in: 12000, out: 8000 },
          { name: 'Mar', in: 15000, out: 11000 },
          { name: 'Mie', in: 9000, out: 12000 },
          { name: 'Jue', in: 22000, out: 5000 },
          { name: 'Vie', in: 18000, out: 14000 },
          { name: 'Sab', in: 35000, out: 10000 },
          { name: 'Dom', in: 10000, out: 2000 },
      ].map(d => ({ ...d, balance: d.in - d.out }));
  }, []);

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
      
      {/* CABECERA DINÁMICA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                <Calculator size={32}/>
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Contabilidad Central</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Activity size={14} className="text-green-500 animate-pulse"/> Análisis de Supervivencia y Liquidez
                </p>
            </div>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
            {[
                { id: 'CASHFLOW', label: 'Cash Flow', icon: ArrowLeftRight },
                { id: 'EQUILIBRIO', label: 'Pto. Equilibrio', icon: Scale },
                { id: 'DIARIO', label: 'Libro Diario', icon: BookOpen },
                { id: 'RESULTADOS', label: 'Estado P&L', icon: TrendingUp },
                { id: 'FISCAL', label: 'Libro IVA', icon: Landmark },
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as AccSection)} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest whitespace-nowrap ${activeSection === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                    <tab.icon size={14}/> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
          
          {/* SECCIÓN: CASH FLOW (FLUJO DE CAJA) */}
          {activeSection === 'CASHFLOW' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-fade-in">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col space-y-8">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><ChartIcon size={20} className="text-indigo-600"/> Movimientos de Caja (Semanal)</h3>
                          <div className="flex gap-4">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><span className="text-[10px] font-black text-slate-400 uppercase">Ingresos</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full"></div><span className="text-[10px] font-black text-slate-400 uppercase">Egresos</span></div>
                          </div>
                      </div>
                      
                      <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={cashflowData}>
                                  <defs>
                                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#94a3b8'}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#94a3b8'}} />
                                  <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                  <Area type="monotone" dataKey="in" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIn)" />
                                  <Area type="monotone" dataKey="out" stroke="#f87171" strokeWidth={4} fillOpacity={1} fill="url(#colorOut)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet size={120}/></div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Disponibilidad Real (Neto)</p>
                          <h4 className="text-5xl font-black tracking-tighter text-green-400">
                              +${cashflowData.reduce((acc, d) => acc + d.balance, 0).toLocaleString('es-AR')}
                          </h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-4 tracking-widest">Resultado de Operación Semanal</p>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Detalle Proyectado</h4>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ArrowUpRight size={16}/></div>
                                      <span className="text-xs font-black text-slate-600 uppercase">Ingresos Estimados</span>
                                  </div>
                                  <span className="font-black text-slate-900">${cashflowData.reduce((a,c) => a + c.in, 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-red-50 text-red-600 rounded-xl"><ArrowDownLeft size={16}/></div>
                                      <span className="text-xs font-black text-slate-600 uppercase">Egresos Comprometidos</span>
                                  </div>
                                  <span className="font-black text-slate-900">${cashflowData.reduce((a,c) => a + c.out, 0).toLocaleString()}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* SECCIÓN: PUNTO DE EQUILIBRIO MULTI-PERÍODO */}
          {activeSection === 'EQUILIBRIO' && (
              <div className="h-full flex flex-col space-y-6 animate-fade-in overflow-y-auto custom-scrollbar">
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-12 shrink-0">
                        <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner shrink-0">
                            <Scale size={64}/>
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Umbral de Supervivencia</h3>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl italic">Basado en sus Gastos Fijos de <span className="text-slate-900 font-black">${financials.fixedExp.toLocaleString()}</span> y un margen promedio del <span className="text-indigo-600 font-black">{financials.avgMargin.toFixed(1)}%</span>.</p>
                        </div>
                        <div className="bg-slate-900 px-10 py-6 rounded-[2rem] text-center text-white shadow-xl">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Resultado de Referencia</p>
                            <h4 className="text-3xl font-black text-white tracking-tighter uppercase">Pto. Crítico</h4>
                        </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <BreakEvenCard 
                            label="Meta Diaria" 
                            amount={financials.be.daily} 
                            desc="Para cubrir el día hoy" 
                            icon={Clock} 
                            color="indigo" 
                        />
                        <BreakEvenCard 
                            label="Meta Semanal" 
                            amount={financials.be.weekly} 
                            desc="Facturación x 7 días" 
                            icon={Calendar} 
                            color="blue" 
                        />
                        <BreakEvenCard 
                            label="Meta Mensual" 
                            amount={financials.be.monthly} 
                            desc="Ciclo de facturación" 
                            icon={Activity} 
                            color="purple" 
                            isPrimary
                        />
                        <BreakEvenCard 
                            label="Meta Anual" 
                            amount={financials.be.annual} 
                            desc="Proyección de ejercicio" 
                            icon={TrendingUp} 
                            color="slate" 
                        />
                  </div>

                  <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
                      <AlertTriangle className="text-amber-600 shrink-0" size={24}/>
                      <div>
                          <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Nota de Análisis de Riesgo</h4>
                          <p className="text-xs text-amber-700 leading-relaxed font-medium italic">El punto de equilibrio indica la facturación bruta necesaria solo para no perder dinero. Cualquier monto por debajo de estos valores resultará en un déficit operativo. Los cálculos asumen que el margen de ganancia se mantiene constante en el mix de productos vendidos.</p>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'DIARIO' && (
              <div className="flex flex-col h-full space-y-4 animate-fade-in overflow-hidden">
                  <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                      <div className="relative w-80 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                          <input type="text" placeholder="Buscar asiento..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                      <button onClick={() => setIsEntryModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95">
                          <PlusCircle size={16}/> Nuevo Asiento Manual
                      </button>
                  </div>
                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                      <div className="h-full overflow-y-auto custom-scrollbar">
                           <table className="w-full text-left">
                              <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                  <tr><th className="px-8 py-5">Fecha</th><th className="px-4 py-5">Cuenta</th><th className="px-4 py-5">Concepto</th><th className="px-8 py-5 text-right">Debe</th><th className="px-8 py-5 text-right">Haber</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {entries.length === 0 ? (
                                     <tr><td colSpan={5} className="py-40 text-center text-slate-300 font-black uppercase tracking-widest"><History size={48} className="mx-auto mb-4 opacity-10"/>Sin movimientos recientes</td></tr>
                                  ) : (
                                    entries.map(entry => (
                                        <React.Fragment key={entry.id}>
                                            {entry.items.map((item, idx) => (
                                                <tr key={`${entry.id}-${idx}`} className="hover:bg-slate-50">
                                                    <td className="px-8 py-4 text-xs font-bold text-slate-400">{idx === 0 ? entry.date : ''}</td>
                                                    <td className="px-4 py-4 font-bold text-indigo-600">{item.accountName}</td>
                                                    <td className="px-4 py-4 text-xs uppercase font-medium">{idx === 0 ? entry.description : ''}</td>
                                                    <td className="px-8 py-4 text-right font-black">{item.debit > 0 ? `$${item.debit.toLocaleString()}` : '-'}</td>
                                                    <td className="px-8 py-4 text-right font-black">{item.credit > 0 ? `$${item.credit.toLocaleString()}` : '-'}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                  )}
                              </tbody>
                           </table>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'RESULTADOS' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-full overflow-y-auto custom-scrollbar pr-2">
                   <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-8">Estado de Resultados P&L</h3>
                        <div className="h-80">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{name: 'Ingresos', v: financials.totalSales}, {name: 'Gastos Totales', v: financials.fixedExp + financials.varExp}]}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black'}} />
                                    <Tooltip />
                                    <Bar dataKey="v" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={50} />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                   </div>
                   <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-center h-fit">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Utilidad Bruta Proyectada</p>
                        <h4 className="text-5xl font-black tracking-tighter">${(financials.totalSales * (financials.avgMargin/100)).toLocaleString()}</h4>
                   </div>
              </div>
          )}
      </div>

      {/* MODAL: NUEVO ASIENTO MANUAL */}
      {isEntryModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Library size={24}/></div>
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Nuevo Registro Manual</h3>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1 tracking-widest">Ajuste Contable Directo</p>
                          </div>
                      </div>
                      <button onClick={() => setIsEntryModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  <div className="p-10 bg-slate-50 flex-1 flex flex-col items-center justify-center text-slate-300 uppercase font-black text-xs tracking-widest">
                      Formulario de Asientos en desarrollo
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- COMPONENTE INTERNO: TARJETA DE PUNTO DE EQUILIBRIO ---
const BreakEvenCard: React.FC<{ label: string, amount: number, desc: string, icon: any, color: string, isPrimary?: boolean }> = ({ label, amount, desc, icon: Icon, color, isPrimary }) => {
    const colors: any = {
        indigo: 'text-indigo-600 bg-indigo-50',
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50',
        slate: 'text-slate-600 bg-slate-50'
    };

    return (
        <div className={`p-8 rounded-[2.5rem] border flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${isPrimary ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105' : 'bg-white text-slate-800 border-slate-200'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${isPrimary ? 'bg-indigo-500 text-white' : colors[color]}`}>
                    <Icon size={20}/>
                </div>
                {isPrimary && <span className="bg-indigo-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Target Principal</span>}
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isPrimary ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
            <h4 className="text-3xl font-black tracking-tighter mb-4 leading-none">
                ${amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </h4>
            <div className="mt-auto pt-4 border-t border-dashed border-slate-200/20">
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isPrimary ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
            </div>
        </div>
    );
};

export default Accounting;
