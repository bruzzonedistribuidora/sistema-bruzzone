
import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileSpreadsheet, ArrowRight, CheckCircle, 
    ChevronRight, LayoutTemplate, 
    X, List, RefreshCw, Calculator, Percent,
    Edit2, Plus, Trash2, Save,
    Search, ArrowLeft, Eye, Zap, Sparkles,
    BarChart3, ShieldAlert, ArrowUpRight, RotateCcw, PlusCircle,
    // Add Info to the lucide-react imports
    TrendingUp, ArrowLeftRight, Link2, Info
} from 'lucide-react';
import { Provider, PriceList, Product } from '../types';

const DEFAULT_PRICE_LISTS: PriceList[] = [
    { id: '1', name: 'Lista 1 - Mostrador (Público)', type: 'BASE', active: true },
    { id: '2', name: 'Lista 2 - Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true },
    { id: '3', name: 'Lista 3 - Mayorista / Reventa', type: 'CUSTOM', fixedMargin: 15, active: true },
];

interface AnalysisResult {
    totalExcel: number;
    matched: number;
    avgVariation: number;
    impactDetails: {
        desc: string;
        oldCost: number;
        newCost: number;
        variation: number;
    }[];
}

const PriceUpdates: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'LISTS' | 'MASS_UPDATE'>('LISTS');
    const [viewingListDetail, setViewingListDetail] = useState<PriceList | null>(null);
    const [listSearchTerm, setListSearchTerm] = useState('');

    const [products] = useState<Product[]>(() => {
        try {
            const saved = localStorage.getItem('ferrecloud_products');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });

    const [providers] = useState<Provider[]>(() => {
        try {
            const saved = localStorage.getItem('ferrecloud_providers');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });

    const [priceLists, setPriceLists] = useState<PriceList[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_lists');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) { 
                console.error("Error cargando listas:", e); 
            }
        }
        return DEFAULT_PRICE_LISTS;
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_price_lists', JSON.stringify(priceLists));
    }, [priceLists]);

    const resetToDefaults = () => {
        if (confirm("¿Deseas restaurar las listas de precios predeterminadas? Se perderán las personalizadas.")) {
            setPriceLists(DEFAULT_PRICE_LISTS);
        }
    };

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<PriceList | null>(null);
    const [listForm, setListForm] = useState<Partial<PriceList>>({ 
        name: '', 
        type: 'CUSTOM', 
        fixedMargin: 30, 
        baseListId: '', 
        adjustmentPercentage: 0,
        active: true 
    });

    // --- LÓGICA DE CÁLCULO RECURSIVA ---
    const calculatePriceForProduct = (p: Product, list: PriceList): number => {
        const cost = p.costAfterDiscounts || p.listCost || 0;
        
        // Caso A: La lista depende de OTRA lista
        if (list.baseListId) {
            const baseList = priceLists.find(l => l.id === list.baseListId);
            if (!baseList || baseList.id === list.id) return 0; // Evitar recursión infinita
            
            const basePrice = calculatePriceForProduct(p, baseList);
            const factor = 1 + (list.adjustmentPercentage || 0) / 100;
            return basePrice * factor;
        }

        // Caso B: La lista es BASE (Margen de ficha de producto)
        if (list.type === 'BASE') {
            const margin = p.profitMargin || 30;
            const priceNeto = cost * (1 + (margin / 100));
            return priceNeto * (1 + ((p.vatRate || 21) / 100));
        }

        // Caso C: La lista tiene un MARGEN FIJO sobre el costo
        const margin = list.fixedMargin || 0;
        const priceNeto = cost * (1 + (margin / 100));
        return priceNeto * (1 + ((p.vatRate || 21) / 100));
    };

    const productsInList = useMemo(() => {
        if (!viewingListDetail) return [];
        const term = listSearchTerm.toLowerCase().trim();
        
        const filtered = term === '' 
            ? products.slice(0, 50) 
            : products.filter(p => 
                (p.name || '').toLowerCase().includes(term) || 
                (p.internalCodes || []).some(c => c.toLowerCase().includes(term))
              ).slice(0, 50);

        return filtered.map(p => {
            const finalPrice = calculatePriceForProduct(p, viewingListDetail);
            
            return {
                ...p,
                calculatedPrice: finalPrice
            };
        });
    }, [products, viewingListDetail, listSearchTerm, priceLists]);

    // --- WIZARD DE ACTUALIZACIÓN MASIVA ---
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const handleSaveList = () => {
        if (!listForm.name) return;
        setPriceLists(prev => {
            if (editingList) {
                return prev.map(l => l.id === editingList.id ? { ...l, ...listForm } as PriceList : l);
            } else {
                return [...prev, { ...listForm, id: Date.now().toString(), active: true } as PriceList];
            }
        });
        setIsListModalOpen(false);
    };

    const runAnalysis = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setAnalysis({
                totalExcel: 1500,
                matched: 1420,
                avgVariation: 15.4,
                impactDetails: [
                    { desc: 'PALA ANCHA ACERO TRAMONTINA', oldCost: 12500, newCost: 14375, variation: 15 },
                    { desc: 'TALADRO PERCUTOR BOSCH 750W', oldCost: 85000, newCost: 98600, variation: 16 },
                    { desc: 'SET DESTORNILLADORES X6 STANLEY', oldCost: 18000, newCost: 20700, variation: 15 },
                ]
            });
            setIsProcessing(false);
            setStep(3);
        }, 1500);
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            
            {/* CABECERA DINÁMICA */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <Calculator size={32}/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Estrategia de Precios</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                             Gestión de Listas y Márgenes Globales
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
                    <button 
                        onClick={() => {setActiveTab('LISTS'); setViewingListDetail(null);}} 
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${activeTab === 'LISTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                        <List size={16}/> Listas de Venta
                    </button>
                    <button 
                        onClick={() => {setActiveTab('MASS_UPDATE'); setViewingListDetail(null);}} 
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${activeTab === 'MASS_UPDATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                        <RefreshCw size={16}/> Actualizar Costos
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL: LISTADO DE LISTAS */}
            {activeTab === 'LISTS' && !viewingListDetail && (
                <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-fade-in">
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
                        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
                            <BarChart3 className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" size={100}/>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Base de Datos</p>
                            <h4 className="text-2xl font-black">{(products || []).length.toLocaleString()} SKUs</h4>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Listas Activas</p>
                            <h4 className="text-2xl font-black text-slate-800">{(priceLists || []).length} Configuradas</h4>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-3">
                            <button 
                                onClick={resetToDefaults}
                                className="text-slate-400 hover:text-red-500 p-4 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-colors">
                                <RotateCcw size={14}/> Reparar Vistas
                            </button>
                            <button 
                                onClick={() => {
                                    setEditingList(null); 
                                    setListForm({name: '', type: 'CUSTOM', fixedMargin: 30, baseListId: '', adjustmentPercentage: 0, active: true}); 
                                    setIsListModalOpen(true);
                                }}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95">
                                <Plus size={18}/> Nueva Lista
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar px-2 pb-20">
                        {(priceLists || []).map(list => (
                            <div key={list.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group h-fit relative overflow-hidden animate-fade-in">
                                <div className={`absolute top-0 left-0 w-2.5 h-full ${list.type === 'BASE' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter truncate mb-1">{list.name}</h3>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${list.type === 'BASE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                    {list.type === 'BASE' ? 'Utilidad Variable' : 'Utilidad Fija'}
                                                </span>
                                                {list.baseListId && (
                                                    <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1">
                                                        <Link2 size={10}/> Derivada
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => {setEditingList(list); setListForm(list); setIsListModalOpen(true);}} className="p-3 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                                            {list.id !== '1' && (
                                                <button onClick={() => setPriceLists(priceLists.filter(x => x.id !== list.id))} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {list.baseListId ? `Sobre ${priceLists.find(l=>l.id===list.baseListId)?.name}` : 'Cálculo de Precio'}
                                        </p>
                                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {list.baseListId ? (
                                                <div className="flex items-center gap-2">
                                                    <ArrowLeftRight size={28} className="text-amber-500"/> 
                                                    <span className="text-2xl uppercase font-black">
                                                        {list.adjustmentPercentage! >= 0 ? '+' : ''}{list.adjustmentPercentage}%
                                                    </span>
                                                </div>
                                            ) : list.type === 'BASE' ? (
                                                <div className="flex items-center gap-2"><Zap size={28} className="text-indigo-600"/> <span className="text-2xl uppercase font-black">Dinámico</span></div>
                                            ) : `+${list.fixedMargin}%`}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setViewingListDetail(list)}
                                    className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                                    Explorar Artículos <ArrowRight size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VISTA: DETALLE DE ARTÍCULOS DENTRO DE UNA LISTA */}
            {activeTab === 'LISTS' && viewingListDetail && (
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setViewingListDetail(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-lg"><ArrowLeft size={24}/></button>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{viewingListDetail.name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <Eye size={12}/> Auditoría de PVP con IVA 
                                    {viewingListDetail.baseListId && ` • Basado en: ${priceLists.find(l=>l.id===viewingListDetail.baseListId)?.name}`}
                                </p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-[450px] group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20}/>
                            <input 
                                type="text" 
                                placeholder="Filtrar catálogo..." 
                                className="w-full pl-14 pr-6 py-4 bg-white/10 border-2 border-transparent rounded-[1.8rem] outline-none text-white font-bold text-sm focus:bg-white focus:text-slate-900 transition-all uppercase placeholder:text-slate-600"
                                value={listSearchTerm}
                                onChange={e => setListSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-10 py-6">Descripción / Marca</th>
                                    <th className="px-10 py-6 text-right">Costo Neto</th>
                                    <th className="px-10 py-6 text-center">Configuración</th>
                                    <th className="px-10 py-6 text-right bg-indigo-50/30 font-black text-indigo-600">Precio de Venta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {productsInList.length === 0 ? (
                                    <tr><td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest italic">No se encontraron artículos</td></tr>
                                ) : productsInList.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-10 py-6">
                                            <p className="font-black text-slate-800 uppercase leading-tight mb-1">{p.name || 'SIN NOMBRE'}</p>
                                            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 w-fit px-2 py-0.5 rounded-md">{(p.internalCodes && p.internalCodes[0]) || 'S/C'}</p>
                                        </td>
                                        <td className="px-10 py-6 text-right font-bold text-slate-400">${(p.costAfterDiscounts || p.listCost || 0).toLocaleString('es-AR')}</td>
                                        <td className="px-10 py-6 text-center">
                                            {viewingListDetail.baseListId ? (
                                                <span className="bg-amber-50 px-4 py-1.5 rounded-xl font-black text-amber-600 border border-amber-200 text-[10px] uppercase">
                                                    {viewingListDetail.adjustmentPercentage! >= 0 ? '+' : ''}{viewingListDetail.adjustmentPercentage}% s/ lista
                                                </span>
                                            ) : (
                                                <span className="bg-slate-100 px-4 py-1.5 rounded-xl font-black text-slate-600 border border-slate-200 text-[10px] uppercase">
                                                    +{viewingListDetail.type === 'BASE' ? (p.profitMargin || 0) : (viewingListDetail.fixedMargin || 0)}% s/ costo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6 text-right font-black text-2xl text-slate-900 bg-indigo-50/10 tracking-tighter">${(p.calculatedPrice || 0).toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODULO: ACTUALIZACIÓN MASIVA (WIZARD) */}
            {activeTab === 'MASS_UPDATE' && (
                <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                    <div className="bg-slate-900 px-10 py-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                        <div className="flex gap-12">
                            {[
                                { n: 1, label: 'Origen Excel' },
                                { n: 2, label: 'Reconocimiento' },
                                { n: 3, label: 'Audit. Impacto' }
                            ].map(s => (
                                <div key={s.n} className={`flex items-center gap-4 transition-all ${step === s.n ? 'opacity-100' : 'opacity-30'}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black ${step >= s.n ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-700 text-slate-400'}`}>{s.n}</span>
                                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">{s.label}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep(1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"><RotateCcw size={20}/></button>
                    </div>

                    <div className="flex-1 p-12 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                        {step === 1 && (
                            <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">
                                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <FileSpreadsheet size={32}/>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Sincronización de Costos</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Procesa listas de proveedores para actualizar masivamente los 140,000 artículos.</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="relative group border-4 border-dashed border-slate-100 rounded-[3.5rem] p-16 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all bg-white cursor-pointer">
                                            <FileSpreadsheet size={80} className="mx-auto text-slate-200 mb-6 group-hover:scale-110 group-hover:text-indigo-400 transition-all" />
                                            <p className="text-lg font-black text-slate-700 uppercase tracking-tight">{fileName || 'Arrastra o selecciona el archivo .XLSX'}</p>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setFileName(e.target.files[0].name)} />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Proveedor Origen</label>
                                            <select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black text-[11px] uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                                                <option value="">TODOS / IA DETECT</option>
                                                {(providers || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Vincular por:</label>
                                            <select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black text-[11px] uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                                                <option>CÓDIGO SKU (RECOMENDADO)</option>
                                                <option>CÓDIGO DE BARRAS (EAN)</option>
                                                <option>CÓDIGO PROVEEDOR</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setStep(2)} 
                                        disabled={!fileName}
                                        className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4 active:scale-95 transition-all text-sm">
                                        ANÁLISIS DE COLUMNAS <ArrowRight size={20}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-10 max-w-5xl mx-auto animate-fade-in">
                                <div className="bg-indigo-900 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120}/></div>
                                    <div className="relative z-10 flex items-center gap-6">
                                        <div className="p-4 bg-white/10 rounded-3xl shadow-xl"><LayoutTemplate size={32}/></div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase tracking-tight leading-none">Mapeo de Atributos</h4>
                                            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-2">Relacione las columnas del Excel con los datos de FerreCloud</p>
                                        </div>
                                    </div>
                                    <button onClick={runAnalysis} className="relative z-10 bg-white text-indigo-900 px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">PROCESAR IMPACTO</button>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                    <div className="grid grid-cols-4 bg-slate-50 p-8 gap-8 border-b border-slate-100">
                                        {['Columna A', 'Columna B', 'Columna C', 'Columna D'].map((col, i) => (
                                            <div key={i} className="space-y-4">
                                                <p className="text-[11px] font-black text-slate-400 uppercase text-center border-b pb-2">{col}</p>
                                                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-[11px] uppercase shadow-sm focus:border-indigo-500 outline-none transition-all">
                                                    <option>-- IGNORAR --</option>
                                                    <option selected={i===0}>CÓDIGO SKU</option>
                                                    <option selected={i===1}>DESCRIPCIÓN</option>
                                                    <option selected={i===2}>MARCA</option>
                                                    <option selected={i===3}>COSTO NETO</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 space-y-3 opacity-30 bg-white select-none">
                                        {[1,2,3,4,5].map(x => (
                                            <div key={x} className="grid grid-cols-4 gap-8 px-6 py-4 border-b last:border-0 border-slate-50">
                                                <div className="h-4 bg-slate-100 rounded-full w-24"></div>
                                                <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                                <div className="h-4 bg-slate-100 rounded-full w-32"></div>
                                                <div className="h-4 bg-slate-100 rounded-full w-20"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && analysis && (
                            <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 text-center shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform"><CheckCircle size={80}/></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vínculos Correctos</p>
                                        <h4 className="text-5xl font-black text-indigo-600 tracking-tighter">{(analysis.matched || 0)}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase">Items Localizados</p>
                                    </div>
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 text-center shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600 group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aumento Promedio</p>
                                        <h4 className="text-5xl font-black text-red-600 tracking-tighter">+{(analysis.avgVariation || 0)}%</h4>
                                        <p className="text-[9px] font-bold text-red-400 mt-3 uppercase">Variación Detectada</p>
                                    </div>
                                    <div className="bg-slate-900 p-10 rounded-[3rem] text-center shadow-2xl flex flex-col justify-center border-4 border-indigo-500/20">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Estado Proceso</p>
                                        <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">VALIDADO</h4>
                                        <p className="text-[9px] font-bold text-slate-500 mt-4 uppercase tracking-[0.3em]">LISTO PARA IMPACTAR</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[450px]">
                                    <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert size={24} className="text-orange-500"/>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Previsualización de Cambios (Top 50)</h4>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-10 py-6">Descripción Comercial</th>
                                                    <th className="px-10 py-6 text-right">Costo Ant.</th>
                                                    <th className="px-10 py-6 text-right">Costo Nuevo</th>
                                                    <th className="px-10 py-6 text-center">Variación</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-[11px]">
                                                {(analysis.impactDetails || []).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-10 py-6 font-black uppercase text-slate-800 tracking-tight leading-tight">{item.desc}</td>
                                                        <td className="px-10 py-6 text-right font-bold text-slate-400">${(item.oldCost || 0).toLocaleString('es-AR')}</td>
                                                        <td className="px-10 py-6 text-right font-black text-slate-900">${(item.newCost || 0).toLocaleString('es-AR')}</td>
                                                        <td className="px-10 py-6 text-center">
                                                            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl font-black border border-red-100 flex items-center justify-center gap-1 w-fit mx-auto">
                                                                <ArrowUpRight size={14}/> {item.variation}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <button onClick={() => {alert('Sistema actualizado.'); setStep(1); setActiveTab('LISTS');}} className="w-full py-8 bg-indigo-600 text-white rounded-[3.5rem] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all text-sm border-4 border-indigo-400/50">
                                    APLICAR NUEVOS COSTOS AL CATÁLOGO MAESTRO
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: CONFIGURACIÓN DE LISTA */}
            {isListModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-indigo-500 rounded-[1.8rem] shadow-2xl shadow-indigo-500/40"><PlusCircle size={32}/></div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{editingList ? 'Editar Lista' : 'Nueva Lista'}</h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Configuración de Rentabilidad</p>
                                </div>
                            </div>
                            <button onClick={() => setIsListModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                        </div>
                        <div className="p-12 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2">Nombre Identificatorio</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-slate-800 uppercase shadow-inner text-lg" value={listForm.name} onChange={e => setListForm({...listForm, name: e.target.value.toUpperCase()})} autoFocus />
                                </div>
                                
                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 ml-2">Metodología de Cálculo</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setListForm({...listForm, baseListId: '', type: 'CUSTOM'})}
                                            className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${!listForm.baseListId ? 'bg-white border-indigo-600 text-indigo-600 shadow-md' : 'bg-transparent border-slate-200 text-slate-400'}`}>
                                            Sobre Costo
                                        </button>
                                        <button 
                                            onClick={() => setListForm({...listForm, baseListId: priceLists[0]?.id || ''})}
                                            className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${listForm.baseListId ? 'bg-white border-indigo-600 text-indigo-600 shadow-md' : 'bg-transparent border-slate-200 text-slate-400'}`}>
                                            Sobre otra Lista
                                        </button>
                                    </div>
                                </div>

                                {!listForm.baseListId ? (
                                    <div className="animate-fade-in">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Margen General S/ Costo (%)</label>
                                        <div className="relative group">
                                            <Percent className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={40}/>
                                            <input type="number" className="w-full pl-20 p-10 bg-slate-50 border-2 border-transparent rounded-[3rem] focus:bg-white focus:border-indigo-600 outline-none font-black text-7xl text-indigo-700 shadow-inner" value={listForm.fixedMargin} onChange={e => setListForm({...listForm, fixedMargin: parseFloat(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Lista de Referencia</label>
                                                <select 
                                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase"
                                                    value={listForm.baseListId}
                                                    onChange={e => setListForm({...listForm, baseListId: e.target.value})}
                                                >
                                                    {priceLists.filter(l => l.id !== editingList?.id).map(l => (
                                                        <option key={l.id} value={l.id}>{l.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">% Ajuste (+ Recargo / - Desc.)</label>
                                                <div className="relative">
                                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                                    <input 
                                                        type="number" 
                                                        className="w-full pl-10 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-indigo-700" 
                                                        value={listForm.adjustmentPercentage} 
                                                        onChange={e => setListForm({...listForm, adjustmentPercentage: parseFloat(e.target.value) || 0})} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                                            <Info size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                                            <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">
                                                Los precios de esta lista se calcularán automáticamente aplicando el porcentaje definido sobre los precios vigentes de la lista base seleccionada.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleSaveList} className="w-full bg-slate-900 text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 text-xs">
                                <Save size={24}/> GUARDAR CAMBIOS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceUpdates;
