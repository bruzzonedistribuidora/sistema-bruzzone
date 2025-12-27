
import React, { useState, useMemo } from 'react';
import { 
    BarChart3, Calendar, Download, TrendingUp, TrendingDown, 
    DollarSign, FileText, ShoppingBag, Truck, ArrowUpRight, 
    ArrowDownLeft, Filter, Search, Eye, BarChart as BarChartIcon,
    PieChart as PieIcon, ChevronRight, Clock, Hash, Target,
    Layers, Tag, Box, AlertCircle, Percent, ArrowRight,
    TrendingUp as ProfitIcon, Scale, Landmark, CheckCircle,
    AlertTriangle, ShoppingCart, Info, Activity, Boxes
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import { Product, Provider, Category, Brand, CompanyConfig, CurrencyQuote } from '../types';

type ReportSection = 'PERFORMANCE' | 'PROFITABILITY' | 'STOCK_VALUE';

const COLORS = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

const Reports: React.FC = () => {
    const [activeSection, setActiveSection] = useState<ReportSection>('PERFORMANCE');
    
    // --- CARGA DE DATOS MAESTROS Y CONFIG ---
    const products: Product[] = useMemo(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    }, []);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : {};
    }, []);

    const currencies: CurrencyQuote[] = useMemo(() => companyConfig.currencies || [], [companyConfig]);

    // --- LÓGICA DE VALORIZACIÓN DE STOCK CON CONVERSIÓN DE DIVISAS ---
    const stockValuation = useMemo(() => {
        return products.reduce((acc, p) => {
            let cost = p.costAfterDiscounts || p.listCost;
            let sale = p.priceFinal;

            if (p.purchaseCurrency === 'USD') {
                const quote = currencies[0] || { value: 1000 }; 
                cost = cost * quote.value;
            }

            const totalCost = cost * (p.stock || 0);
            const totalSale = sale * (p.stock || 0);

            return {
                totalCost: acc.totalCost + totalCost,
                totalSale: acc.totalSale + totalSale,
                potentialProfit: acc.potentialProfit + (totalSale - totalCost)
            };
        }, { totalCost: 0, totalSale: 0, potentialProfit: 0 });
    }, [products, currencies]);

    // --- RENTABILIDAD POR CATEGORÍA ---
    const profitabilityByCategory = useMemo(() => {
        const stats: Record<string, { name: string, profit: number }> = {};
        products.forEach(p => {
            const cat = p.category || 'GENERAL';
            if (!stats[cat]) stats[cat] = { name: cat, profit: 0 };
            
            let cost = p.costAfterDiscounts || p.listCost;
            if (p.purchaseCurrency === 'USD') cost *= (currencies[0]?.value || 1000);
            
            const unitProfit = p.priceFinal - cost;
            stats[cat].profit += unitProfit * (p.stock > 0 ? 1 : 0);
        });
        return Object.values(stats).sort((a, b) => b.profit - a.profit).slice(0, 8);
    }, [products, currencies]);

    // --- MARCAS TOP (PARETO) ---
    const brandPareto = useMemo(() => {
        const brands: Record<string, number> = {};
        products.forEach(p => {
            const b = p.brand || 'GENÉRICO';
            brands[b] = (brands[b] || 0) + (p.priceFinal * (p.stock > 0 ? 1 : 0));
        });
        return Object.entries(brands)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [products]);

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden">
            
            {/* CABECERA DE INTELIGENCIA */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <BarChart3 size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Reportes Avanzados</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Inteligencia de Negocio en Tiempo Real
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveSection('PERFORMANCE')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeSection === 'PERFORMANCE' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>Desempeño</button>
                    <button onClick={() => setActiveSection('PROFITABILITY')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeSection === 'PROFITABILITY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>Rentabilidad</button>
                    <button onClick={() => setActiveSection('STOCK_VALUE')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeSection === 'STOCK_VALUE' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Valor Stock</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
                
                {activeSection === 'PERFORMANCE' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform"><TrendingUp size={60}/></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Caja Estimada Hoy</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">$215.420</h3>
                                <p className="text-[9px] font-bold text-green-500 mt-2 flex items-center gap-1"><ArrowUpRight size={12}/> +5% vs promedio</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 text-green-600 group-hover:scale-110 transition-transform"><Target size={60}/></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Artículos con Stock</p>
                                <h3 className="text-2xl font-black text-green-600 tracking-tighter">84.210</h3>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">60% del catálogo total</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform"><ShoppingBag size={60}/></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Promedio</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">$14.800</h3>
                                <p className="text-[9px] font-bold text-indigo-500 mt-2 uppercase">Tendencia Estable</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600 group-hover:scale-110 transition-transform"><AlertTriangle size={60}/></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bajo Stock Mínimo</p>
                                <h3 className="text-2xl font-black text-red-600 tracking-tighter">1.240</h3>
                                <p className="text-[9px] font-bold text-red-400 mt-2 uppercase">Requiere Reposición</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm h-[400px] flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                        <Layers size={18} className="text-indigo-500"/> Rentabilidad por Categoría
                                    </h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full">Top 8 Segmentos</span>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={profitabilityByCategory} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#64748b'}} width={100} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="profit" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm h-[400px] flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                        <Tag size={18} className="text-orange-500"/> Mix de Marcas (Inversión)
                                    </h3>
                                    <button className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Ver todas</button>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={brandPareto} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {brandPareto.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-500">{value}</span>}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'STOCK_VALUE' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Landmark size={280}/>
                            </div>
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 text-center lg:text-left">
                                <div className="space-y-2">
                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Capital Inmovilizado (Costo ARS)</p>
                                    <h2 className="text-5xl font-black tracking-tighter leading-none">${stockValuation.totalCost.toLocaleString('es-AR')}</h2>
                                    <p className="text-slate-500 text-xs font-medium italic">Suma total de mercadería a precio de compra</p>
                                </div>
                                <div className="space-y-2 border-l border-white/10 pl-0 lg:pl-8">
                                    <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.3em]">Valor de Recupero (PVP ARS)</p>
                                    <h2 className="text-5xl font-black tracking-tighter leading-none">${stockValuation.totalSale.toLocaleString('es-AR')}</h2>
                                    <p className="text-slate-500 text-xs font-medium italic">Proyección de caja total por liquidación</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-center">
                                    <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-center">Utilidad Bruta Proyectada</p>
                                    <h2 className="text-4xl font-black text-center text-white tracking-tighter leading-none">+${stockValuation.potentialProfit.toLocaleString('es-AR')}</h2>
                                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: '32%' }}></div>
                                    </div>
                                    <p className="text-[8px] text-center text-slate-400 mt-2 font-black uppercase tracking-widest">Margen Global Stock: 32.4%</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                                <h4 className="font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-3 text-sm">
                                    <AlertTriangle size={20} className="text-red-500"/> Dinero Dormido (Obsolescencia)
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm font-black text-xs">90d</div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-xs">4.520 Artículos sin venta</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">Inversión: $1.250.000</p>
                                            </div>
                                        </div>
                                        <button className="text-[8px] font-black text-indigo-600 uppercase bg-white px-3 py-1.5 rounded-lg border shadow-sm hover:bg-slate-50 transition-all">Ver Listado</button>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                        Sugerencia IA: El 12% de tu stock no ha rotado en el último trimestre. Considera realizar ofertas de combo o liquidación para recuperar liquidez.
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                                <h4 className="font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-3 text-sm">
                                    <TrendingUp size={20} className="text-green-500"/> Clasificación ABC (Rotación)
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm font-black">A</div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-xs">Top 250 Artículos Críticos</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">Generan el 72% de tus ingresos</p>
                                            </div>
                                        </div>
                                        <CheckCircle size={18} className="text-green-500"/>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                                        <Info size={16} className="text-indigo-500 shrink-0"/>
                                        <p className="text-[9px] text-slate-500 font-medium uppercase leading-tight">Mantener stock excedente de estos artículos garantiza la continuidad operativa.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTÓN DE DESCARGA PDF */}
            <div className="fixed bottom-20 right-10 z-50">
                 <button onClick={() => window.print()} className="bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 hover:scale-110 transition-all active:scale-95 group">
                    <Download size={24} className="group-hover:-translate-y-1 transition-transform"/>
                    <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-800 border border-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Informe Gerencial PDF</div>
                 </button>
            </div>
        </div>
    );
};

export default Reports;
