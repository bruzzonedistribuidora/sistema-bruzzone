import React, { useState, useMemo, useEffect } from 'react';
/* Added Info to the imports from lucide-react */
import { 
    Calculator, FileText, BookOpen, PieChart, Landmark, Plus, 
    Search, Download, TrendingUp, Target, Activity, DollarSign, 
    ArrowUpRight, ArrowDownRight, Filter, Settings, FileBarChart,
    Scale, Clock, Calendar, Zap, AlertTriangle, TrendingDown,
    ListTree, ArrowLeftRight, CheckCircle2, X, Save, PlusCircle,
    History, Library, ShieldCheck, ChevronRight, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
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
  const [activeSection, setActiveSection] = useState<AccSection>('DIARIO');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- PERSISTENCIA CONTABLE ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
      const saved = localStorage.getItem('ferrecloud_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
      const saved = localStorage.getItem('ferrecloud_journal');
      return saved ? JSON.parse(saved) : [];
  });

  // --- DATOS DE OTROS MÓDULOS ---
  const products: Product[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'), []);
  const expenses: DailyExpense[] = useMemo(() => JSON.parse(localStorage.getItem('daily_movements') || '[]'), []);
  const sales: any[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'), []);

  useEffect(() => {
      localStorage.setItem('ferrecloud_accounts', JSON.stringify(accounts));
      localStorage.setItem('ferrecloud_journal', JSON.stringify(entries));
  }, [accounts, entries]);

  // --- LÓGICA DE NUEVO ASIENTO ---
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
      date: new Date().toISOString().split('T')[0],
      description: '',
      items: [{ accountId: '', accountName: '', debit: 0, credit: 0 }]
  });

  const handleAddLine = () => {
      setNewEntry(prev => ({
          ...prev,
          items: [...(prev.items || []), { accountId: '', accountName: '', debit: 0, credit: 0 }]
      }));
  };

  const handleSaveEntry = () => {
      const totalDebit = newEntry.items?.reduce((acc, i) => acc + i.debit, 0) || 0;
      const totalCredit = newEntry.items?.reduce((acc, i) => acc + i.credit, 0) || 0;

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
          alert("Error de Partida Doble: El Debe y el Haber no coinciden.");
          return;
      }

      const entryToSave: JournalEntry = {
          ...newEntry as JournalEntry,
          id: `AS-${Date.now()}`
      };

      setEntries([entryToSave, ...entries]);
      setIsEntryModalOpen(false);
      setNewEntry({
          date: new Date().toISOString().split('T')[0],
          description: '',
          items: [{ accountId: '', accountName: '', debit: 0, credit: 0 }]
      });
  };

  // --- CÁLCULOS FINANCIEROS PARA DASHBOARD ---
  const financials = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const fixedExp = expenses.filter(e => e.category === 'FIXED').reduce((acc, e) => acc + e.amount, 0);
    const varExp = expenses.filter(e => e.category === 'VARIABLE').reduce((acc, e) => acc + e.amount, 0);
    const avgMargin = products.length > 0 ? products.reduce((acc, p) => acc + p.profitMargin, 0) / products.length : 30;
    const grossProfit = totalSales * (avgMargin / 100);
    const netProfit = grossProfit - fixedExp - varExp;
    return { totalSales, fixedExp, varExp, grossProfit, netProfit, avgMargin, breakEven: fixedExp / (avgMargin / 100) };
  }, [products, expenses, sales]);

  const pnlData = [
      { name: 'Ventas', monto: financials.totalSales, fill: '#4f46e5' },
      { name: 'Ut. Bruta', monto: financials.grossProfit, fill: '#10b981' },
      { name: 'Gastos', monto: financials.fixedExp + financials.varExp, fill: '#f43f5e' },
      { name: 'Ut. Neta', monto: financials.netProfit, fill: '#8b5cf6' },
  ];

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
                    <ShieldCheck size={14} className="text-green-500"/> Sistema de Libros y Balances Sincronizados
                </p>
            </div>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
            {[
                { id: 'DIARIO', label: 'Libro Diario', icon: BookOpen },
                { id: 'RESULTADOS', label: 'Dashboard P&L', icon: TrendingUp },
                { id: 'PLAN', label: 'Plan de Cuentas', icon: ListTree },
                { id: 'FISCAL', label: 'Libro IVA (ARCA)', icon: Landmark },
                { id: 'EQUILIBRIO', label: 'Pto. Equilibrio', icon: Scale },
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
          
          {/* SECCIÓN: LIBRO DIARIO */}
          {activeSection === 'DIARIO' && (
              <div className="flex flex-col h-full space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                      <div className="relative w-80 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                          <input type="text" placeholder="Buscar asiento por glosa..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      </div>
                      <button onClick={() => setIsEntryModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95">
                          <PlusCircle size={16}/> Nuevo Asiento Manual
                      </button>
                  </div>

                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left">
                              <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                  <tr>
                                      <th className="px-8 py-5">Fecha / ID</th>
                                      <th className="px-4 py-5">Cuenta Contable</th>
                                      <th className="px-4 py-5">Concepto / Glosa</th>
                                      <th className="px-8 py-5 text-right">Debe (+)</th>
                                      <th className="px-8 py-5 text-right">Haber (-)</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {entries.length === 0 ? (
                                      <tr><td colSpan={5} className="py-40 text-center text-slate-300 font-black uppercase tracking-[0.3em]"><History size={64} className="mx-auto mb-4 opacity-10"/>Sin asientos registrados</td></tr>
                                  ) : entries.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map(entry => (
                                      <React.Fragment key={entry.id}>
                                          <tr className="bg-slate-50/50">
                                              <td className="px-8 py-4 font-black text-indigo-600 text-[10px]">{entry.date} <span className="ml-2 text-slate-400 font-mono">#{entry.id.slice(-6)}</span></td>
                                              <td colSpan={2} className="px-4 py-4 font-black text-slate-700 uppercase text-[10px] italic">{entry.description}</td>
                                              <td className="px-8 py-4"></td>
                                              <td className="px-8 py-4"></td>
                                          </tr>
                                          {entry.items.map((item, idx) => (
                                              <tr key={`${entry.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                  <td className="px-8 py-3"></td>
                                                  <td className="px-4 py-3">
                                                      <p className="text-[10px] font-black text-slate-600 uppercase">{item.accountName}</p>
                                                      <p className="text-[8px] font-mono text-slate-400">{item.accountId}</p>
                                                  </td>
                                                  <td className="px-4 py-3 text-[10px] text-slate-400">Ref. Automática</td>
                                                  <td className="px-8 py-3 text-right font-black text-slate-900">{item.debit > 0 ? `$${item.debit.toLocaleString('es-AR')}` : '-'}</td>
                                                  <td className="px-8 py-3 text-right font-black text-slate-900">{item.credit > 0 ? `$${item.credit.toLocaleString('es-AR')}` : '-'}</td>
                                              </tr>
                                          ))}
                                      </React.Fragment>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* SECCIÓN: DASHBOARD P&L */}
          {activeSection === 'RESULTADOS' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-full overflow-y-auto custom-scrollbar">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8 h-fit">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">Rendimiento Mensual</h3>
                          <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-green-100">Margen: {financials.avgMargin.toFixed(1)}%</div>
                      </div>
                      <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={pnlData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                  <Bar dataKey="monto" radius={[12, 12, 0, 0]} barSize={60}>
                                      {pnlData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={120}/></div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Utilidad Neta (Simulada)</p>
                          <h4 className={`text-5xl font-black tracking-tighter ${financials.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${financials.netProfit.toLocaleString('es-AR')}
                          </h4>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Detalle Operativo</h4>
                          <div className="space-y-3">
                              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Costos Venta</span><span className="font-black text-slate-800">${(financials.totalSales - financials.grossProfit).toLocaleString()}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Gastos Fijos</span><span className="font-black text-slate-800">${financials.fixedExp.toLocaleString()}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Gastos Variables</span><span className="font-black text-slate-800">${financials.varExp.toLocaleString()}</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* SECCIÓN: PLAN DE CUENTAS */}
          {activeSection === 'PLAN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in overflow-y-auto h-full pb-10 custom-scrollbar">
                  {accounts.map(acc => (
                      <div key={acc.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                          <div className="flex justify-between items-start mb-6">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-widest ${acc.type === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-100' : acc.type === 'PASIVO' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600'}`}>
                                  {acc.type}
                              </span>
                              <p className="text-[10px] font-mono font-bold text-slate-400">{acc.code}</p>
                          </div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-tight mb-4 h-10 overflow-hidden">{acc.name}</h4>
                          <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                              <p className="text-xl font-black text-slate-900 tracking-tighter">$0,00</p>
                          </div>
                      </div>
                  ))}
                  <button className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group">
                      <PlusCircle size={40} className="mb-2 group-hover:scale-110 transition-transform"/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Nueva Cuenta</span>
                  </button>
              </div>
          )}

          {/* SECCIÓN: FISCAL ARCA */}
          {activeSection === 'FISCAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 flex flex-col">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Landmark size={32}/></div>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Libro IVA Digital (TXTs)</h3>
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Genera los archivos para importar en el portal de ARCA (ex-AFIP) según RG 3685.</p>
                      
                      <div className="space-y-4 pt-6 border-t border-slate-100 mt-auto">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Período Fiscal</label>
                          <input type="month" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all" defaultValue={new Date().toISOString().slice(0, 7)} />
                          <div className="grid grid-cols-2 gap-3 pt-4">
                              <button className="bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95"><Download size={18}/> Ventas.txt</button>
                              <button className="bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95"><Download size={18}/> Compras.txt</button>
                          </div>
                      </div>
                  </div>

                  <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><FileBarChart size={280}/></div>
                      <div className="relative z-10">
                          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Posición Estimada IVA</p>
                          <h4 className="text-6xl font-black tracking-tighter text-white mb-2 leading-none">$0,00</h4>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Saldo Técnico a Favor (Estimado)</p>
                      </div>
                      <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/10 mt-20">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14}/> Nota Auditoría</p>
                          <p className="text-xs text-slate-300 italic font-medium leading-relaxed">Los valores mostrados aquí son proyecciones basadas en los comprobantes registrados en sistema. Para una presentación formal, consulte a su contador utilizando el reporte TXT.</p>
                      </div>
                  </div>
              </div>
          )}

          {/* SECCIÓN: PUNTO DE EQUILIBRIO */}
          {activeSection === 'EQUILIBRIO' && (
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-16 animate-fade-in">
                  <div className="flex-1 space-y-10">
                      <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                          <Scale size={48}/>
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Umbral de Supervivencia Financiera</h3>
                      <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">Para cubrir costos fijos por <span className="text-slate-900 font-black">${financials.fixedExp.toLocaleString()}</span> con su margen actual, su ferretería necesita vender:</p>
                      <div className="flex gap-4">
                          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                              <Target size={20} className="text-indigo-600"/>
                              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Meta Mensual Alcanzada: 65%</span>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-900 p-16 rounded-[4rem] text-center min-w-[420px] shadow-[0_50px_80px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden border-4 border-indigo-500/20">
                      <div className="absolute top-0 right-0 p-4 opacity-5 text-white"><Zap size={140}/></div>
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6">Punto de Equilibrio (Ventas)</p>
                      <h4 className="text-7xl font-black text-white tracking-tighter mb-4 leading-none">
                          ${financials.breakEven.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-8">FACTURACIÓN BRUTA REQUERIDA / MES</p>
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
                            <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Nuevo Registro en Diario</h3>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Ajuste Contable por Partida Doble</p>
                          </div>
                      </div>
                      <button onClick={() => setIsEntryModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Fecha de Operación</label>
                              <input type="date" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Descripción / Glosa</label>
                              <input type="text" placeholder="Ej: Depreciación de herramientas, Pago impuestos..." className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:ring-2 focus:ring-indigo-600" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} />
                          </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                  <tr>
                                      <th className="px-6 py-4">Cuenta Contable</th>
                                      <th className="px-6 py-4 text-right">Debe ($)</th>
                                      <th className="px-6 py-4 text-right">Haber ($)</th>
                                      <th className="px-6 py-4 w-10"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {newEntry.items?.map((item, idx) => (
                                      <tr key={idx} className="animate-fade-in">
                                          <td className="px-6 py-3">
                                              <select 
                                                className="w-full p-2 bg-slate-50 rounded-xl font-bold text-[10px] uppercase outline-none focus:bg-white border border-transparent focus:border-indigo-500 transition-all"
                                                value={item.accountId}
                                                onChange={e => {
                                                    const acc = accounts.find(a => a.id === e.target.value);
                                                    const nextItems = [...(newEntry.items || [])];
                                                    nextItems[idx] = { ...item, accountId: e.target.value, accountName: acc?.name || '' };
                                                    setNewEntry({...newEntry, items: nextItems});
                                                }}
                                              >
                                                  <option value="">-- Seleccionar Cuenta --</option>
                                                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                              </select>
                                          </td>
                                          <td className="px-6 py-3">
                                              <input type="number" className="w-full p-2 text-right bg-slate-50 rounded-xl font-black text-sm outline-none" value={item.debit || ''} onChange={e => {
                                                  const nextItems = [...(newEntry.items || [])];
                                                  nextItems[idx] = { ...item, debit: parseFloat(e.target.value) || 0, credit: 0 };
                                                  setNewEntry({...newEntry, items: nextItems});
                                              }} />
                                          </td>
                                          <td className="px-6 py-3">
                                              <input type="number" className="w-full p-2 text-right bg-slate-50 rounded-xl font-black text-sm outline-none" value={item.credit || ''} onChange={e => {
                                                  const nextItems = [...(newEntry.items || [])];
                                                  nextItems[idx] = { ...item, credit: parseFloat(e.target.value) || 0, debit: 0 };
                                                  setNewEntry({...newEntry, items: nextItems});
                                              }} />
                                          </td>
                                          <td className="px-6 py-3">
                                              <button onClick={() => setNewEntry({...newEntry, items: newEntry.items?.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          <button onClick={handleAddLine} className="w-full py-4 text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-2">
                              <Plus size={14}/> Añadir Renglón Contable
                          </button>
                      </div>

                      <div className="flex justify-between items-center p-8 bg-slate-900 rounded-[2.5rem] shadow-xl text-white">
                          <div className="flex gap-10">
                              <div className="text-center">
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Debe</p>
                                  <p className="text-2xl font-black text-white">${newEntry.items?.reduce((a,c) => a + c.debit, 0).toLocaleString('es-AR')}</p>
                              </div>
                              <div className="text-center">
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Haber</p>
                                  <p className="text-2xl font-black text-white">${newEntry.items?.reduce((a,c) => a + c.credit, 0).toLocaleString('es-AR')}</p>
                              </div>
                          </div>
                          
                          {Math.abs((newEntry.items?.reduce((a,c) => a + c.debit, 0) || 0) - (newEntry.items?.reduce((a,c) => a + c.credit, 0) || 0)) < 0.01 ? (
                              <div className="flex items-center gap-3 bg-green-500/20 text-green-400 px-6 py-3 rounded-2xl border border-green-500/30">
                                  <CheckCircle2 size={24}/>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Balanceado</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-3 bg-red-500/20 text-red-400 px-6 py-3 rounded-2xl border border-red-500/30 animate-pulse">
                                  <AlertTriangle size={24}/>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Fuera de Balance</span>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsEntryModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Descartar</button>
                      <button onClick={handleSaveEntry} className="bg-slate-900 text-white px-20 py-4 rounded-[1.8rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                          <Save size={20}/> Registrar Asiento
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Accounting;
