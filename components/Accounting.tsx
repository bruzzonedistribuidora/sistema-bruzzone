
import React, { useState } from 'react';
import { 
    Calculator, FileText, BookOpen, PieChart, Landmark, Plus, 
    Search, Download, TrendingUp, Target, Activity, DollarSign, 
    ArrowUpRight, ArrowDownRight, Filter, Settings, FileBarChart 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const Accounting: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'FISCAL' | 'RESULTADOS' | 'KPIS'>('FISCAL');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const pnlData = [
      { name: 'Ene', ingresos: 4500, gastos: 3200 },
      { name: 'Feb', ingresos: 5200, gastos: 4100 },
      { name: 'Mar', ingresos: 4800, gastos: 2900 },
      { name: 'Abr', ingresos: 6100, gastos: 3500 },
      { name: 'May', ingresos: 5800, gastos: 3100 },
      { name: 'Jun', ingresos: 7200, gastos: 4500 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden">
      <div className="flex justify-between items-end bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Calculator size={28} className="text-indigo-600"/> Análisis Contable y Fiscal
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Reportes de rentabilidad, exportaciones impositivas y KPIs financieros</p>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
            <button onClick={() => setActiveSection('FISCAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'FISCAL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Fiscal / CITI</button>
            <button onClick={() => setActiveSection('RESULTADOS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'RESULTADOS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Estado Resultados</button>
            <button onClick={() => setActiveSection('KPIS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSection === 'KPIS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>KPIs Financieros</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-10">
          {activeSection === 'FISCAL' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Landmark size={24}/></div>
                              <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">Exportación Libro IVA Digital</h4>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">Generación de archivos .txt para importación masiva en el portal de ARCA (Rg. 3685).</p>
                          <div className="space-y-4">
                              <input type="month" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none" value={period} onChange={e => setPeriod(e.target.value)} />
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
                                  <p className="text-4xl font-black text-green-400 tracking-tighter leading-none">$125.420</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Saldo Técnico</p>
                                  <p className="text-4xl font-black text-slate-300 tracking-tighter leading-none">$0.00</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'RESULTADOS' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-[450px]">
                      <div className="flex justify-between items-center mb-8">
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">Evolución de Utilidad Operativa</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">
                              <TrendingUp size={14}/> ROI: +12.5%
                          </div>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                          <AreaChart data={pnlData}>
                              <defs>
                                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                              <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                              <Area type="monotone" dataKey="ingresos" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
                              <Area type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={4} fill="transparent" name="Gastos" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Accounting;
