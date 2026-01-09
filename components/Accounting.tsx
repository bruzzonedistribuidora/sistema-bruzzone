import React, { useState, useMemo } from 'react';
import { 
    Calculator, Landmark, Download, TrendingUp, Activity, 
    ArrowUpRight, ArrowDownLeft, Scale, ShieldCheck, 
    ShieldAlert, Receipt, ShoppingCart, TrendingDown,
    X, Save, History, AlertTriangle, Info, FileText,
    ArrowLeftRight, LineChart as ChartIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DailyExpense, Purchase } from '../types';

type AccSection = 'DIARIO' | 'RESULTADOS' | 'EQUILIBRIO' | 'FISCAL' | 'CASHFLOW';

const Accounting: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AccSection>('FISCAL');
  const [fiscalTab, setFiscalTab] = useState<'VENTAS' | 'COMPRAS'>('VENTAS');

  // --- CARGA DE DATOS DESDE STORAGE ---
  const sales: any[] = useMemo(() => {
    try {
        const saved = localStorage.getItem('ferrecloud_sales_history');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }, []);

  const purchases: Purchase[] = useMemo(() => {
    try {
        const saved = localStorage.getItem('ferrecloud_purchases');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }, []);

  const expenses: DailyExpense[] = useMemo(() => {
    try {
        const saved = localStorage.getItem('daily_movements');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }, []);

  // --- LÓGICA FISCAL (LIBRO DE IVA Y DECISIÓN) ---
  const fiscalReport = useMemo(() => {
    const v_list = sales.map(s => {
        const total = s.total || 0;
        const neto = total / 1.21;
        const iva = total - neto;
        return { 
            date: s.date ? s.date.split(',')[0] : 'S/D', 
            id: s.id, 
            entity: s.client || 'Consumidor Final', 
            neto, 
            iva, 
            total 
        };
    });

    const c_list = purchases.map(p => {
        const total = p.total || 0;
        const neto = total / 1.21;
        const iva = total - neto;
        return { 
            date: p.date, 
            id: p.id, 
            entity: p.providerName, 
            neto, 
            iva, 
            total 
        };
    });

    const totalDebito = v_list.reduce((a, c) => a + c.iva, 0);
    const totalCredito = c_list.reduce((a, c) => a + c.iva, 0);
    const balance = totalDebito - totalCredito;

    return { 
        ventas: v_list, 
        compras: c_list, 
        totalDebito, 
        totalCredito, 
        balance,
        // Recomendación estratégica solicitada por el usuario
        advice: balance > 0 
            ? {
                title: "RECOMENDACIÓN: CONVIENE COMPRAR STOCK",
                desc: "Tu IVA Débito (ventas) supera al Crédito (compras). Comprar mercadería ahora te permitirá generar crédito fiscal para compensar y bajar lo que debes pagar de IVA.",
                color: "bg-orange-500",
                icon: ShoppingCart
              }
            : {
                title: "RECOMENDACIÓN: CONVIENE FACTURAR",
                desc: "Tienes IVA Crédito a favor. Puedes emitir facturas de venta con tranquilidad ya que cuentas con saldo fiscal para cubrir el débito generado.",
                color: "bg-green-600",
                icon: Receipt
              }
    };
  }, [sales, purchases]);

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
      
      {/* HEADER DE MÓDULO */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                <Calculator size={32}/>
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Contabilidad & Fiscal</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Activity size={14} className="text-green-500 animate-pulse"/> Análisis de Posición Impositiva
                </p>
            </div>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
            {[
                { id: 'FISCAL', label: 'Libro IVA', icon: Landmark },
                { id: 'CASHFLOW', label: 'Cash Flow', icon: ArrowLeftRight },
                { id: 'EQUILIBRIO', label: 'Pto. Equilibrio', icon: Scale },
                { id: 'RESULTADOS', label: 'Estado P&L', icon: TrendingUp },
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
          
          {activeSection === 'FISCAL' && (
              <div className="h-full flex flex-col space-y-6 animate-fade-in overflow-hidden">
                  
                  {/* ASISTENTE DE DECISIÓN FISCAL */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
                        <div className={`lg:col-span-8 ${fiscalReport.advice.color} rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex items-center gap-8`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={120}/></div>
                            <div className="p-4 bg-white/20 rounded-3xl shrink-0">
                                <fiscalReport.advice.icon size={40}/>
                            </div>
                            <div className="relative z-10">
                                <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Asistente de Estrategia Bruzzone</p>
                                <h4 className="text-xl font-black uppercase tracking-tight leading-tight mb-2">
                                    {fiscalReport.advice.title}
                                </h4>
                                <p className="text-white/80 text-xs font-medium leading-relaxed max-w-xl">{fiscalReport.advice.desc}</p>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Posición Neta (IVA {new Date().toLocaleDateString('es-AR', {month: 'long'})})</p>
                            <h3 className={`text-4xl font-black tracking-tighter ${fiscalReport.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${Math.abs(fiscalReport.balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                            </h3>
                            <span className={`text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-full w-fit ${fiscalReport.balance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {fiscalReport.balance > 0 ? 'IVA a Pagar (Débito > Crédito)' : 'IVA a Favor (Crédito > Débito)'}
                            </span>
                        </div>
                  </div>

                  {/* MINI CARDS DE TOTALES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                        <div className="bg-white p-6 rounded-3xl border border-red-100 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IVA Ventas (Débito)</p>
                                <p className="text-2xl font-black text-red-600 tracking-tighter">${fiscalReport.totalDebito.toLocaleString('es-AR')}</p>
                            </div>
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ArrowUpRight size={24}/></div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-green-100 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IVA Compras (Crédito)</p>
                                <p className="text-2xl font-black text-green-600 tracking-tighter">${fiscalReport.totalCredito.toLocaleString('es-AR')}</p>
                            </div>
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><ArrowDownLeft size={24}/></div>
                        </div>
                  </div>

                  {/* TABLAS DE DETALLE LIBRO DE IVA */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex bg-slate-200 rounded-xl p-1 shadow-inner">
                                <button onClick={() => setFiscalTab('VENTAS')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${fiscalTab === 'VENTAS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>IVA Ventas</button>
                                <button onClick={() => setFiscalTab('COMPRAS')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${fiscalTab === 'COMPRAS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>IVA Compras</button>
                            </div>
                            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all">
                                <Download size={14}/> Exportar para Contador
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-5">Fecha</th>
                                        <th className="px-4 py-5">Comprobante</th>
                                        <th className="px-4 py-5">{fiscalTab === 'VENTAS' ? 'Cliente' : 'Proveedor'}</th>
                                        <th className="px-6 py-5 text-right">Neto Gravado</th>
                                        <th className="px-6 py-5 text-right">IVA (21%)</th>
                                        <th className="px-8 py-5 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[11px]">
                                    {(fiscalTab === 'VENTAS' ? fiscalReport.ventas : fiscalReport.compras).map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-4 font-bold text-slate-400 group-hover:text-slate-600">{doc.date}</td>
                                            <td className="px-4 py-4 font-black text-slate-800 uppercase tracking-tight">{doc.id}</td>
                                            <td className="px-4 py-4 font-bold text-slate-500 uppercase truncate max-w-[200px]">{doc.entity}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-400">${doc.neto.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-600">${doc.iva.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-8 py-4 text-right font-black text-slate-900">${doc.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    ))}
                                    {(fiscalTab === 'VENTAS' ? fiscalReport.ventas : fiscalReport.compras).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">
                                                <ShieldAlert size={48} className="mx-auto mb-4 opacity-10"/>
                                                Sin registros para el período seleccionado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                  </div>
              </div>
          )}

          {/* OTRAS SECCIONES SIMULADAS PARA COMPLETAR EL MÓDULO */}
          {activeSection !== 'FISCAL' && (
              <div className="h-full flex items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="text-center opacity-30">
                      <ChartIcon size={64} className="mx-auto mb-4"/>
                      <p className="font-black uppercase tracking-widest">Sección en proceso de consolidación</p>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Accounting;
