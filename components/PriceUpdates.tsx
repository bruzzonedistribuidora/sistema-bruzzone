
import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileSpreadsheet, ArrowRight, CheckCircle, 
    ChevronRight, LayoutTemplate, 
    X, List, RefreshCw, Calculator, Percent,
    Edit2, Plus, Trash2, Save,
    Search, ArrowLeft, Eye, Zap, Sparkles,
    BarChart3, ShieldAlert, ArrowUpRight, RotateCcw, PlusCircle,
    TrendingUp, ArrowLeftRight, Link2, Info, Truck
} from 'lucide-react';
import { Provider, PriceList, Product } from '../types';
import { addToReplenishmentQueue } from '../services/storageService';

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
        } catch (e) { return []; }
    });

    const [providers] = useState<Provider[]>(() => {
        try {
            const saved = localStorage.getItem('ferrecloud_providers');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    });

    const [priceLists, setPriceLists] = useState<PriceList[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_lists');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) { console.error("Error cargando listas:", e); }
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
        name: '', type: 'CUSTOM', fixedMargin: 30, baseListId: '', adjustmentPercentage: 0, active: true 
    });

    const calculatePriceForProduct = (p: Product, list: PriceList): number => {
        const cost = p.costAfterDiscounts || p.listCost || 0;
        if (list.baseListId) {
            const baseList = priceLists.find(l => l.id === list.baseListId);
            if (!baseList || baseList.id === list.id) return 0;
            const basePrice = calculatePriceForProduct(p, baseList);
            const factor = 1 + (list.adjustmentPercentage || 0) / 100;
            return basePrice * factor;
        }
        if (list.type === 'BASE') {
            const margin = p.profitMargin || 30;
            const priceNeto = cost * (1 + (margin / 100));
            return priceNeto * (1 + ((p.vatRate || 21) / 100));
        }
        const margin = list.fixedMargin || 0;
        const priceNeto = cost * (1 + (margin / 100));
        return priceNeto * (1 + ((p.vatRate || 21) / 100));
    };

    const handlePedir = (p: Product) => {
        if (addToReplenishmentQueue(p)) {
            alert(`Articulo ${p.name} agregado a la cola de reposición.`);
        }
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

        return filtered.map(p => ({ ...p, calculatedPrice: calculatePriceForProduct(p, viewingListDetail) }));
    }, [products, viewingListDetail, listSearchTerm, priceLists]);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const handleSaveList = () => {
        if (!listForm.name) return;
        setPriceLists(prev => {
            if (editingList) return prev.map(l => l.id === editingList.id ? { ...l, ...listForm } as PriceList : l);
            else return [...prev, { ...listForm, id: Date.now().toString(), active: true } as PriceList];
        });
        setIsListModalOpen(false);
    };

    const runAnalysis = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setAnalysis({
                totalExcel: 1500, matched: 1420, avgVariation: 15.4,
                impactDetails: [
                    { desc: 'PALA ANCHA ACERO TRAMONTINA', oldCost: 12500, newCost: 14375, variation: 15 },
                    { desc: 'TALADRO PERCUTOR BOSCH 750W', oldCost: 85000, newCost: 98600, variation: 16 },
                ]
            });
            setIsProcessing(false);
            setStep(3);
        }, 1500);
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Calculator size={32}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Estrategia de Precios</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">Gestión de Listas y Márgenes Globales</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
                    <button onClick={() => {setActiveTab('LISTS'); setViewingListDetail(null);}} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${activeTab === 'LISTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}><List size={16}/> Listas de Venta</button>
                    <button onClick={() => {setActiveTab('MASS_UPDATE'); setViewingListDetail(null);}} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${activeTab === 'MASS_UPDATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}><RefreshCw size={16}/> Actualizar Costos</button>
                </div>
            </div>

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
                            <button onClick={resetToDefaults} className="text-slate-400 hover:text-red-500 p-4 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-colors"><RotateCcw size={14}/> Reparar Vistas</button>
                            <button onClick={() => { setEditingList(null); setListForm({name: '', type: 'CUSTOM', fixedMargin: 30, baseListId: '', adjustmentPercentage: 0, active: true}); setIsListModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"><Plus size={18}/> Nueva Lista</button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar px-2 pb-20">
                        {(priceLists || []).map(list => (
                            <div key={list.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group h-fit relative overflow-hidden animate-fade-in">
                                <div className={`absolute top-0 left-0 w-2.5 h-full ${list.type === 'BASE' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter truncate mb-1">{list.name}</h3>
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${list.type === 'BASE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{list.type === 'BASE' ? 'Utilidad Variable' : 'Utilidad Fija'}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => {setEditingList(list); setListForm(list); setIsListModalOpen(true);}} className="p-3 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{list.baseListId ? `Sobre ${priceLists.find(l=>l.id===list.baseListId)?.name}` : 'Cálculo de Precio'}</p>
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{list.baseListId ? `+${list.adjustmentPercentage}%` : list.type === 'BASE' ? 'Dinámico' : `+${list.fixedMargin}%`}</div>
                                </div>
                                <button onClick={() => setViewingListDetail(list)} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">Explorar Artículos <ArrowRight size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'LISTS' && viewingListDetail && (
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setViewingListDetail(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-lg"><ArrowLeft size={24}/></button>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{viewingListDetail.name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2"><Eye size={12}/> Auditoría de PVP con IVA</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-[450px] group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20}/>
                            <input type="text" placeholder="Filtrar catálogo..." className="w-full pl-14 pr-6 py-4 bg-white/10 border-2 border-transparent rounded-[1.8rem] outline-none text-white font-bold text-sm focus:bg-white focus:text-slate-900 transition-all uppercase placeholder:text-slate-600" value={listSearchTerm} onChange={e => setListSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-10 py-6">Descripción / Marca</th>
                                    <th className="px-10 py-6 text-right">Costo Neto</th>
                                    <th className="px-10 py-6 text-right bg-indigo-50/30 font-black text-indigo-600">Precio de Venta</th>
                                    <th className="px-10 py-6 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {productsInList.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-10 py-6">
                                            <p className="font-black text-slate-800 uppercase leading-tight mb-1">{p.name || 'SIN NOMBRE'}</p>
                                            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 w-fit px-2 py-0.5 rounded-md">{p.internalCodes?.[0]}</p>
                                        </td>
                                        <td className="px-10 py-6 text-right font-bold text-slate-400">${(p.costAfterDiscounts || p.listCost || 0).toLocaleString()}</td>
                                        <td className="px-10 py-6 text-right font-black text-2xl text-slate-900 bg-indigo-50/10 tracking-tighter">${p.calculatedPrice?.toLocaleString()}</td>
                                        <td className="px-10 py-6 text-center">
                                            <button onClick={() => handlePedir(p)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Pedir Artículo"><Truck size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODULO: ACTUALIZACIÓN MASIVA (SIMPLIFICADO) */}
            {activeTab === 'MASS_UPDATE' && (
                <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden animate-fade-in p-10">
                    <div className="max-w-xl mx-auto text-center space-y-8">
                         <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><FileSpreadsheet size={40}/></div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter">Sincronización por Excel</h3>
                         <p className="text-slate-400 text-sm font-medium">Sube tu lista de costos del proveedor para actualizar todo el catálogo automáticamente.</p>
                         <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-slate-300 font-black text-xs uppercase hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">Arrastrar Archivo aquí</div>
                    </div>
                </div>
            )}

            {isListModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tighter">{editingList ? 'Editar Lista' : 'Nueva Lista'}</h3>
                            <button onClick={() => setIsListModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <input className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase text-xs" value={listForm.name} onChange={e => setListForm({...listForm, name: e.target.value.toUpperCase()})} />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setListForm({...listForm, type: 'BASE'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border transition-all ${listForm.type === 'BASE' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>Dinámica</button>
                                <button onClick={() => setListForm({...listForm, type: 'CUSTOM'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border transition-all ${listForm.type === 'CUSTOM' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>Margen Fijo</button>
                            </div>
                            <button onClick={handleSaveList} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Save size={18}/> Guardar Lista</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceUpdates;
