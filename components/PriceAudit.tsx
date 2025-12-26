
import React, { useState, useMemo } from 'react';
import { 
    ShieldAlert, TrendingUp, TrendingDown, Clock, Scale, 
    Zap, AlertTriangle, CheckCircle2, Search, Filter, 
    ArrowRight, DollarSign, History, BarChart3, Layers,
    Tag, Percent, RefreshCw, Calculator, ShoppingCart, 
    ChevronRight, Info, Eye
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Product, Category, Brand } from '../types';

type AuditTab = 'ALERTS' | 'SIMULATOR' | 'HISTORY';

const PriceAudit: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AuditTab>('ALERTS');
    const [searchTerm, setSearchTerm] = useState('');

    // --- CARGA DE DATOS ---
    const products: Product[] = useMemo(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    }, []);

    // --- LÓGICA 1: DETECCIÓN DE MÁRGENES EN PELIGRO ---
    // Productos donde (Venta / Costo) < (Margen Esperado)
    const marginAlerts = useMemo(() => {
        return products.filter(p => {
            const currentMargin = p.costAfterDiscounts > 0 
                ? ((p.priceNeto - p.costAfterDiscounts) / p.costAfterDiscounts) * 100 
                : 0;
            // Alerta si el margen real es 5% menor al configurado en la ficha
            return currentMargin < (p.profitMargin - 5);
        }).sort((a, b) => {
            const marginA = ((a.priceNeto - a.costAfterDiscounts) / a.costAfterDiscounts);
            const marginB = ((b.priceNeto - b.costAfterDiscounts) / b.costAfterDiscounts);
            return marginA - marginB;
        });
    }, [products]);

    // --- LÓGICA 2: ARTÍCULOS "CONGELADOS" ---
    // Simulación: productos que no se actualizaron hace más de 45 días
    const frozenProducts = useMemo(() => {
        return products.slice(0, 15); // Mock de ejemplo
    }, [products]);

    // --- DATOS PARA GRÁFICO DE INFLACIÓN (MOCK) ---
    const inflationData = [
        { month: 'Jun', costoPromedio: 100 },
        { month: 'Jul', costoPromedio: 108 },
        { month: 'Ago', costoPromedio: 115 },
        { month: 'Sep', costoPromedio: 128 },
        { month: 'Oct', costoPromedio: 142 },
    ];

    const stats = useMemo(() => {
        const totalProducts = products.length;
        const alertCount = marginAlerts.length;
        const healthScore = Math.max(0, 100 - (alertCount / (totalProducts || 1) * 500)); // Puntuación 0-100
        return { totalProducts, alertCount, healthScore };
    }, [products, marginAlerts]);

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            
            {/* CABECERA DE CONTROL */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-3xl shadow-xl ${stats.healthScore > 80 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        <ShieldAlert size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Auditoría de Precios</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                Salud del Margen: <span className={stats.healthScore > 80 ? 'text-green-500' : 'text-red-500'}>{stats.healthScore.toFixed(0)}%</span>
                            </p>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stats.alertCount} Artículos fuera de margen</p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('ALERTS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeTab === 'ALERTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>Alertas Críticas</button>
                    <button onClick={() => setActiveTab('SIMULATOR')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeTab === 'SIMULATOR' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>Simulador Impacto</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Trazabilidad</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
                
                {activeTab === 'ALERTS' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        
                        {/* WIDGET: GRÁFICO INFLACIÓN RECIBIDA */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                    <TrendingUp size={18} className="text-red-500"/> Evolución de Costos (Promedio)
                                </h3>
                                <span className="text-[9px] font-black text-red-500 uppercase bg-red-50 px-3 py-1 rounded-full">+14.2% este mes</span>
                            </div>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={inflationData}>
                                        <defs>
                                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}} />
                                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                            labelStyle={{fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px'}}
                                        />
                                        <Area type="monotone" dataKey="costoPromedio" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* WIDGET: ACCIÓN RÁPIDA */}
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Zap size={150}/>
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-tight">Reparación Masiva de Márgenes</h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Hay {stats.alertCount} productos cuyo precio de venta no cubre el margen mínimo deseado debido a subas de costos recientes.</p>
                            <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <RefreshCw size={16}/> Sincronizar Todo Ahora
                            </button>
                        </div>

                        {/* TABLA DE ALERTAS */}
                        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-orange-500"/> Artículos con Rentabilidad Comprometida
                                </h4>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                    <input type="text" placeholder="Filtrar alertas..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500 w-64 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] sticky top-0">
                                        <tr>
                                            <th className="px-8 py-5">Artículo / SKU</th>
                                            <th className="px-8 py-5 text-right">Costo Actual</th>
                                            <th className="px-8 py-5 text-right">Venta Actual</th>
                                            <th className="px-8 py-5 text-center">Margen Real</th>
                                            <th className="px-8 py-5 text-center">Margen Obj.</th>
                                            <th className="px-8 py-5 text-right">Pérdida/Unit</th>
                                            <th className="px-8 py-5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[11px]">
                                        {marginAlerts.length === 0 ? (
                                            <tr><td colSpan={7} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">Todos los márgenes están saludables</td></tr>
                                        ) : marginAlerts.map(p => {
                                            const realMargin = ((p.priceNeto - p.costAfterDiscounts) / p.costAfterDiscounts) * 100;
                                            const expectedNeto = p.costAfterDiscounts * (1 + p.profitMargin / 100);
                                            const loss = expectedNeto - p.priceNeto;

                                            return (
                                                <tr key={p.id} className="hover:bg-red-50/30 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <p className="font-black text-slate-800 uppercase leading-none mb-1.5">{p.name}</p>
                                                        <p className="text-[8px] text-indigo-500 font-mono font-bold uppercase">{p.internalCodes[0]}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-bold text-slate-400">${p.costAfterDiscounts.toLocaleString('es-AR')}</td>
                                                    <td className="px-8 py-5 text-right font-black text-slate-900">${p.priceFinal.toLocaleString('es-AR')}</td>
                                                    <td className="px-8 py-5 text-center font-black text-red-600">
                                                        <span className="bg-red-50 px-2 py-1 rounded-lg border border-red-100">{realMargin.toFixed(1)}%</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center font-black text-slate-400">{p.profitMargin}%</td>
                                                    <td className="px-8 py-5 text-right font-black text-red-600">-${loss.toLocaleString('es-AR')}</td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white">
                                                            <RefreshCw size={14}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SIMULATOR' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                <Calculator size={24} className="text-indigo-600"/> Proyector de Re-Marcación
                            </h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed italic">Aplica aumentos simulados por Marca o Categoría para ver cómo impacta en el valor total de tu stock y tu recaudación proyectada.</p>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Seleccionar Marca</label>
                                        <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700">
                                            <option value="">TODAS LAS MARCAS</option>
                                            <option value="">BOSCH</option>
                                            <option value="">STANLEY</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">% Aumento Proyectado</label>
                                        <div className="relative">
                                            <input type="number" className="w-full p-4 pl-10 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-black text-2xl text-slate-800" placeholder="0" />
                                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                                    <BarChart3 size={20}/> Procesar Simulación
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <TrendingUp size={240}/>
                            </div>
                            <div className="relative z-10 space-y-10">
                                <div>
                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Incremento en Valuación de Stock</p>
                                    <h2 className="text-6xl font-black tracking-tighter leading-none">+$0.00</h2>
                                    <p className="text-slate-500 text-xs font-bold uppercase mt-2">Patrimonio Neto Adicional</p>
                                </div>
                                <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                                    <div>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Impacto Ticket Prom.</p>
                                        <h4 className="text-2xl font-black text-green-400">+$0</h4>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Artículos Afectados</p>
                                        <h4 className="text-2xl font-black text-slate-100">0 SKUs</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceAudit;
