
import React, { useState, useMemo } from 'react';
import { 
    Calculator, FileText, BookOpen, PieChart, Landmark, Plus, 
    Search, Download, TrendingUp, Target, Activity, DollarSign, 
    ArrowUpRight, ArrowDownRight, Filter, Settings, FileBarChart,
    Scale, Clock, Calendar, Zap, AlertTriangle, TrendingDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ComposedChart, Line } from 'recharts';
import { Product, DailyExpense, SalesOrder } from '../types';

type AccSection = 'RESULTADOS' | 'CASHFLOW' | 'EQUILIBRIO' | 'FISCAL';
type TimeFrame = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const Accounting: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AccSection>('RESULTADOS');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTHLY');

  // --- OBTENCIÓN DE DATOS REALES DEL STORAGE ---
  const products: Product[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'), []);
  const expenses: DailyExpense[] = useMemo(() => JSON.parse(localStorage.getItem('daily_movements') || '[]'), []);
  const sales: any[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'), []);

  // --- CÁLCULOS FINANCIEROS ---
  const financials = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const fixedExpenses = expenses.filter(e => e.category === 'FIXED').reduce((acc, e) => acc + e.amount, 0);
    const variableExpenses = expenses.filter(e => e.category === 'VARIABLE').reduce((acc, e) => acc + e.amount, 0);
    
    // Margen promedio ponderado (simulado basado en el catálogo)
    const avgMargin = products.length > 0 
        ? products.reduce((acc, p) => acc + p.profitMargin, 0) / products.length 
        : 30;

    const grossProfit = totalSales * (avgMargin / 100);
    const netProfit = grossProfit - fixedExpenses - variableExpenses;

    // Punto de Equilibrio: Gastos Fijos / % Margen
    const breakEvenMonthly = fixedExpenses / (avgMargin / 100);

    return {
        totalSales,
        fixedExpenses,
        variableExpenses,
        grossProfit,
        netProfit,
        avgMargin,
        breakEvenMonthly
    };
  }, [products, expenses, sales]);

  const getBreakEvenByPeriod = () => {
    const base = financials.breakEvenMonthly;
    switch(timeFrame) {
        case 'DAILY': return base / 30;
        case 'WEEKLY': return base / 4;
        case 'YEARLY': return base * 12;
        default: return base;
    }
  };

  const pnlData = [
      { name: 'Ventas', monto: financials.totalSales, fill: '#4f46e5' },
      { name: 'Utilidad Bruta', monto: financials.grossProfit, fill: '#10b981' },
      { name: 'Gastos Totales', monto: financials.fixedExpenses + financials.variableExpenses, fill: '#f43f5e' },
      { name: 'Utilidad Neta', monto: financials.netProfit, fill: '#8b5cf6' },
  ];

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
      {/* CABECERA DINÁMICA */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                <Calculator size={32}/>
            </div>
            <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Contabilidad Central</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Activity size={14} className="text-green-500"/> Análisis de Rentabilidad y Punto de Equilibrio
                </p>
            </div>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
            {[
                { id: 'RESULTADOS', label: 'Edo. Resultados', icon: FileText },
                { id: 'CASHFLOW', label: 'Cashflow', icon: TrendingUp },
                { id: 'EQUILIBRIO', label: 'Pto. Equilibrio', icon: Scale },
                { id: 'FISCAL', label: 'Reportes ARCA', icon: Landmark },
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as AccSection)} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeSection === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                    <tab.icon size={14}/> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
          
          {/* SECCIÓN: ESTADO DE RESULTADOS */}
          {activeSection === 'RESULTADOS' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">Desglose de Utilidad Mensual</h3>
                          <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                              Margen Promedio: {financials.avgMargin.toFixed(1)}%
                          </div>
                      </div>
                      <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={pnlData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                  <Bar dataKey="monto" radius={[12, 12, 0, 0]} barSize={60}>
                                      {pnlData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={120}/></div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Utilidad Neta Estimada</p>
                          <h4 className={`text-5xl font-black tracking-tighter ${financials.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${financials.netProfit.toLocaleString('es-AR')}
                          </h4>
                          <p className="text-[9px] font-bold text-slate-500 mt-4 uppercase tracking-widest italic">Después de Gastos y Costos</p>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Detalle de Gastos</h4>
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Fijos</span>
                                  <span className="font-black text-slate-800">${financials.fixedExpenses.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Variables</span>
                                  <span className="font-black text-slate-800">${financials.variableExpenses.toLocaleString()}</span>
                              </div>
                              <div className="pt-3 border-t border-dashed flex justify-between items-center">
                                  <span className="text-xs font-black text-indigo-600 uppercase">Total Operativo</span>
                                  <span className="font-black text-lg text-indigo-600">${(financials.fixedExpenses + financials.variableExpenses).toLocaleString()}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* SECCIÓN: PUNTO DE EQUILIBRIO */}
          {activeSection === 'EQUILIBRIO' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as TimeFrame[]).map(tf => (
                          <button 
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`p-6 rounded-[2rem] border-2 transition-all text-center ${timeFrame === tf ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-slate-400 hover:border-indigo-100'}`}>
                              <p className="text-[10px] font-black uppercase tracking-widest mb-1">{tf === 'DAILY' ? 'Diario' : tf === 'WEEKLY' ? 'Semanal' : tf === 'MONTHLY' ? 'Mensual' : 'Anual'}</p>
                              <h4 className="text-xl font-black tracking-tight">
                                  {tf === 'DAILY' ? 'Día' : tf === 'WEEKLY' ? 'Semana' : tf === 'MONTHLY' ? 'Mes' : 'Año'}
                              </h4>
                          </button>
                      ))}
                  </div>

                  <div className="bg-white p-12 rounded-[3.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-12">
                      <div className="flex-1 space-y-6">
                          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                              <Scale size={40}/>
                          </div>
                          <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Facturación Necesaria para no Perder</h3>
                          <p className="text-slate-500 font-medium leading-relaxed max-w-md">Para cubrir tus gastos fijos de <span className="text-slate-900 font-black">${financials.fixedExpenses.toLocaleString()}</span> con un margen del <span className="text-indigo-600 font-black">{financials.avgMargin.toFixed(1)}%</span>, tu facturación objetivo es:</p>
                      </div>
                      <div className="bg-slate-900 p-12 rounded-[3rem] text-center min-w-[350px] shadow-2xl relative overflow-hidden border-4 border-indigo-500/20">
                          <div className="absolute top-0 right-0 p-4 opacity-10 text-white"><Zap size={80}/></div>
                          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Meta de Ventas {timeFrame}</p>
                          <h4 className="text-6xl font-black text-white tracking-tighter mb-4">
                              ${getBreakEvenByPeriod().toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </h4>
                          <div className="bg-white/10 p-3 rounded-2xl">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Equivale a aprox. {(getBreakEvenByPeriod() / 15000).toFixed(0)} tickets de $15k</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* SECCIÓN: CASHFLOW */}
          {activeSection === 'CASHFLOW' && (
              <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm h-[500px] animate-fade-in flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">Flujo de Fondos Proyectado</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Disponibilidad de liquidez en el tiempo</p>
                      </div>
                      <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase">Ingresos</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase">Egresos</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                              { d: 'Semana 1', in: 120000, out: 85000 },
                              { d: 'Semana 2', in: 150000, out: 90000 },
                              { d: 'Semana 3', in: 110000, out: 140000 },
                              { d: 'Semana 4', in: 180000, out: 95000 },
                          ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black'}} />
                              <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                              <Area type="monotone" dataKey="in" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} strokeWidth={4} />
                              <Area type="monotone" dataKey="out" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={4} />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}

          {/* SECCIÓN: FISCAL (RESTAURADA) */}
          {activeSection === 'FISCAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Landmark size={24}/></div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">Exportación Libro IVA Digital</h4>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Generación de archivos .txt para importación masiva en el portal de ARCA (Rg. 3685).</p>
                      <div className="space-y-4">
                          <input type="month" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none" defaultValue={new Date().toISOString().slice(0, 7)} />
                          <div className="grid grid-cols-2 gap-3">
                              <button className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 transition-all"><Download size={16}/> CITI Ventas</button>
                              <button className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 transition-all"><Download size={16}/> CITI Compras</button>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><FileBarChart size={180}/></div>
                      <div className="relative z-10">
                          <h4 className="font-black uppercase tracking-widest text-indigo-400 text-[10px] mb-2">Posición Mensual IVA</h4>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed">Estimación de débito y crédito fiscal basada en ventas y compras registradas.</p>
                      </div>
                      <div className="relative z-10 mt-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                          <div>
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">A Pagar (Est.)</p>
                              <p className="text-4xl font-black text-green-400 tracking-tighter leading-none">$0.00</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Técnico</p>
                              <p className="text-4xl font-black text-slate-300 tracking-tighter leading-none">$0.00</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Accounting;
