import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calculator, Landmark, Download, TrendingUp, Activity, 
    ArrowUpRight, ArrowDownLeft, Scale, ShieldCheck, 
    ShieldAlert, Receipt, ShoppingCart, 
    History, AlertTriangle, Info,
    ArrowLeftRight, LineChart as ChartIcon, FileText,
    TrendingDown, CheckCircle2, Search
} from 'lucide-react';
import { DailyExpense, Purchase } from '../types';

type AccSection = 'FISCAL' | 'CASHFLOW' | 'EQUILIBRIO' | 'RESULTADOS';

const Accounting: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AccSection>('FISCAL');
  const [fiscalTab, setFiscalTab] = useState<'VENTAS' | 'COMPRAS'>('VENTAS');
  const [searchTerm, setSearchTerm] = useState('');

  // --- CARGA DE DATOS DESDE STORAGE ---
  const [sales, setSales] = useState<any[]>(() => {
    try {
        const saved = localStorage.getItem('ferrecloud_sales_history');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
        const saved = localStorage.getItem('ferrecloud_purchases');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    const handleSalesUpdate = () => {
      const saved = localStorage.getItem('ferrecloud_sales_history');
      setSales(saved ? JSON.parse(saved) : []);
    };
    const handlePurchasesUpdate = () => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      setPurchases(saved ? JSON.parse(saved) : []);
    };

    window.addEventListener('ferrecloud_sales_history_updated', handleSalesUpdate);
    window.addEventListener('ferrecloud_purchases_updated', handlePurchasesUpdate);

    return () => {
      window.removeEventListener('ferrecloud_sales_history_updated', handleSalesUpdate);
      window.removeEventListener('ferrecloud_purchases_updated', handlePurchasesUpdate);
    };
  }, []);

  // --- LÓGICA FISCAL (LIBRO DE IVA Y DECISIÓN) ---
  const fiscalReport = useMemo(() => {
    // Procesar Ventas (IVA Débito)
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

    // Procesar Compras (IVA Crédito)
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

    // Estrategia solicitada por el usuario
    const strategy = balance > 0 
        ? {
            title: "ESTRATEGIA RECOMENDADA: COMPRAR STOCK",
            desc: "Tu IVA Débito (Ventas) es mayor al Crédito (Compras). Para reducir el pago de impuestos de este mes, te conviene realizar compras de mercadería ahora y generar crédito fiscal.",
            color: "bg-orange-500",
            icon: ShoppingCart,
            status: "IVA a Pagar",
            accent: "border-orange-200 text-orange-600"
          }
        : {
            title: "ESTRATEGIA RECOMENDADA: FACTURAR / VENDER",
            desc: "Tienes IVA Crédito acumulado a tu favor. Es un excelente momento para emitir facturas de venta, ya que no tendrás que desembolsar efectivo para cubrir el IVA generado.",
            color: "bg-emerald-600",
            icon: Receipt,
            status: "IVA a Favor",
            accent: "border-emerald-200 text-emerald-600"
          };

    return { 
        ventas: v_list, 
        compras: c_list, 
        totalDebito, 
        totalCredito, 
        balance,
        strategy
    };
  }, [sales, purchases]);

  const filteredItems = useMemo(() => {
    const list = fiscalTab === 'VENTAS' ? fiscalReport.ventas : fiscalReport.compras;
    if (!searchTerm) return list;
    return list.filter(item => 
        item.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fiscalTab, fiscalReport, searchTerm]);

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
      
      {/* CABECERA DINÁMICA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                <Calculator size={32}/>
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Contabilidad & Fiscal</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Activity size={14} className="text-green-500 animate-pulse"/> Análisis de Posición Impositiva Real
                </p>
            </div>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200 overflow-x-auto no-scrollbar">
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
                  
                  {/* MONITOR ESTRATÉGICO */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
                        <div className={`lg:col-span-8 ${fiscalReport.strategy.color} rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex items-center gap-8`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={120}/></div>
                            <div className="p-5 bg-white/20 rounded-3xl shrink-0 backdrop-blur-md">
                                <fiscalReport.strategy.icon size={48}/>
                            </div>
                            <div className="relative z-10">
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Monitor Fiscal Estratégico</p>
                                <h4 className="text-xl font-black uppercase tracking-tight leading-tight mb-2">
                                    {fiscalReport.strategy.title}
                                </h4>
                                <p className="text-white/80 text-xs font-medium max-w-xl leading-relaxed">{fiscalReport.strategy.desc}</p>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center text-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Posición Neta Estimada</p>
                            <h3 className={`text-4xl font-black tracking-tighter ${fiscalReport.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${Math.abs(fiscalReport.balance).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                            </h3>
                            <span className={`text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-full w-fit mx-auto border ${fiscalReport.strategy.accent}`}>
                                {fiscalReport.strategy.status}
                            </span>
                        </div>
                  </div>

                  {/* CARDS DE TOTALES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                        <div className="bg-white p-6 rounded-3xl border border-red-100 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IVA Ventas (Débito)</p>
                                <p className="text-2xl font-black text-red-600 tracking-tighter">${fiscalReport.totalDebito.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
                            </div>
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ArrowUpRight size={24}/></div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-green-100 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IVA Compras (Crédito)</p>
                                <p className="text-2xl font-black text-green-600 tracking-tighter">${fiscalReport.totalCredito.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
                            </div>
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><ArrowDownLeft size={24}/></div>
                        </div>
                  </div>

                  {/* TABLAS DEL LIBRO DE IVA */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 shrink-0">
                            <div className="flex bg-slate-200 rounded-xl p-1 shadow-inner">
                                <button onClick={() => setFiscalTab('VENTAS')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${fiscalTab === 'VENTAS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Libro Ventas</button>
                                <button onClick={() => setFiscalTab('COMPRAS')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${fiscalTab === 'COMPRAS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Libro Compras</button>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por entidad o ID..." 
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all">
                                    <Download size={14}/> Exportar Excel
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
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
                                    {filteredItems.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-4 font-bold text-slate-400 group-hover:text-slate-600">{doc.date}</td>
                                            <td className="px-4 py-4 font-black text-slate-800 uppercase tracking-tight">{doc.id}</td>
                                            <td className="px-4 py-4 font-bold text-slate-500 uppercase truncate max-w-[200px]">{doc.entity}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-400">${doc.neto.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-600">${doc.iva.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-8 py-4 text-right font-black text-slate-900">${doc.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">
                                                <ShieldAlert size={48} className="mx-auto mb-4 opacity-10"/>
                                                Sin registros impositivos en este periodo
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                  </div>
              </div>
          )}

          {/* OTRAS SECCIONES EN CONSTRUCCIÓN */}
          {activeSection !== 'FISCAL' && (
              <div className="h-full flex items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="text-center opacity-30">
                      <ChartIcon size={64} className="mx-auto mb-4 text-slate-300"/>
                      <p className="font-black uppercase tracking-widest text-slate-400">Sección en proceso de consolidación de datos financieros</p>
                      <p className="text-[10px] font-bold uppercase mt-2">Módulo {activeSection}</p>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default Accounting;
