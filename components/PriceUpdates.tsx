import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileSpreadsheet, ArrowRight, CheckCircle, 
    ChevronRight, LayoutTemplate, 
    X, List, BookmarkPlus, 
    RefreshCw, Layers, TrendingUp, TrendingDown, PackagePlus, 
    PackageMinus, Calculator, Tag, Percent,
    Truck, FileText, AlertOctagon, Building2, Edit2, Plus, Trash2, Save, Info,
    Search, ArrowLeft, Eye, ShoppingBag, Zap, Sparkles, RotateCcw
} from 'lucide-react';
import { Provider, PriceList, Product } from '../types';

interface ColumnMapping {
    code: number | null;
    providerCode: number | null;
    description: number | null;
    cost: number | null;
    brand: number | null;
    category: number | null;
    provider: number | null;
    profit: number | null;
    ignored: number[];
}

interface MappingTemplate {
    id: string;
    name: string;
    providerId?: string;
    mode: 'UPDATE' | 'INITIAL';
    mapping: ColumnMapping;
}

interface AnalysisResult {
    totalExcel: number;
    matched: number;
    newItems: number;
    discontinued: number;
    avgVariation: number;
    impactDetails: {
        code: string;
        desc: string;
        oldCost: number;
        newCost: number;
        variation: number;
        brand: string;
        category: string;
        provider: string;
        status: 'UPDATE' | 'NEW' | 'DISCONTINUED';
    }[];
}

const PriceUpdates: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'LISTS' | 'MASS_UPDATE'>('LISTS');
    const [viewingListDetail, setViewingListDetail] = useState<PriceList | null>(null);
    const [listSearchTerm, setListSearchTerm] = useState('');

    // --- DATOS DEL SISTEMA ---
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    // --- ESTADO DE LISTAS DE PRECIOS (CON FALLBACK GARANTIZADO) ---
    const [priceLists, setPriceLists] = useState<PriceList[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_lists');
        const parsed = saved ? JSON.parse(saved) : [];
        if (parsed.length === 0) {
            return [
                { id: '1', name: 'Lista Base (Público)', type: 'BASE', active: true },
                { id: '2', name: 'Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true },
                { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true },
            ];
        }
        return parsed;
    });

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<PriceList | null>(null);
    const [listForm, setListForm] = useState<Partial<PriceList>>({ name: '', type: 'CUSTOM', fixedMargin: 30, active: true });

    useEffect(() => {
        localStorage.setItem('ferrecloud_price_lists', JSON.stringify(priceLists));
    }, [priceLists]);

    // --- LÓGICA DE DETALLE DE ARTÍCULOS ---
    const productsInList = useMemo(() => {
        if (!viewingListDetail) return [];
        const term = listSearchTerm.toLowerCase();
        
        return products.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.internalCodes.some(c => c.toLowerCase().includes(term))
        ).map(p => {
            const cost = p.costAfterDiscounts || p.listCost;
            const margin = viewingListDetail.type === 'BASE' ? p.profitMargin : (viewingListDetail.fixedMargin || 0);
            const priceNeto = cost * (1 + (margin / 100));
            const priceFinal = priceNeto * (1 + (p.vatRate / 100));
            
            return {
                ...p,
                appliedMargin: margin,
                calculatedPrice: priceFinal
            };
        });
    }, [products, viewingListDetail, listSearchTerm]);

    // --- MASS UPDATE WIZARD STATE ---
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [importMode, setImportMode] = useState<'UPDATE' | 'INITIAL'>('UPDATE');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('manual');
    const [fileName, setFileName] = useState<string>('');
    const [mapping, setMapping] = useState<ColumnMapping>({ 
        code: null, providerCode: null, description: null, cost: null, 
        brand: null, category: null, provider: null, profit: null, ignored: [] 
    });
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Mock de filas de Excel para visualización del mapeo
    const [rawExcelRows] = useState([
        ['COD-101', 'REF-99', 'PALA ANCHA ACERO', 'TRAMONTINA', 'JARDIN', 'PROV-A', '12500.00', '35'],
        ['COD-102', 'REF-88', 'PICO PUNTA PRO', 'GHERARDI', 'CONSTRUCCION', 'PROV-B', '24000.00', '40'],
        ['COD-205', 'REF-77', 'TENAZA 12 PULG', 'BIASSONI', 'HERRAMIENTAS', 'PROV-A', '8500.00', '35'],
    ]);

    const runAnalysis = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const impact: AnalysisResult['impactDetails'] = [];
            rawExcelRows.forEach(row => {
                const code = row[mapping.code ?? 0];
                const newCost = parseFloat(row[mapping.cost ?? 6]) || 0;
                impact.push({ 
                    code, desc: row[mapping.description ?? 2], oldCost: newCost * 0.9, newCost, variation: 10, 
                    brand: 'MARCA', category: 'CATEGORIA', provider: 'PROV', status: 'UPDATE' 
                });
            });
            setAnalysis({
                totalExcel: rawExcelRows.length,
                matched: rawExcelRows.length,
                newItems: 0,
                discontinued: 0,
                avgVariation: 10,
                impactDetails: impact
            });
            setIsProcessing(false);
            setStep(3);
        }, 1000);
    };

    const handleSaveList = () => {
        if (!listForm.name) return;
        setPriceLists(prev => {
            if (editingList) {
                return prev.map(l => l.id === editingList.id ? { ...l, ...listForm } as PriceList : l);
            } else {
                return [...prev, { ...listForm, id: Date.now().toString() } as PriceList];
            }
        });
        setIsListModalOpen(false);
    };

    const MAP_FIELDS = [
        { key: 'code', label: 'Cód. SKU', icon: Tag, color: 'bg-blue-600' },
        { key: 'description', label: 'Descripción', icon: FileText, color: 'bg-yellow-500' },
        { key: 'cost', label: 'Costo Neto', icon: Calculator, color: 'bg-green-600' },
    ];

    return (
        <div className="p-4 h-full flex flex-col space-y-4 bg-slate-50 overflow-hidden font-sans">
            
            {/* TABS SUPERIORES */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-xl">
                        <Calculator size={24}/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Precios & Listas</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Control de Rentabilidad Global</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner border border-slate-200">
                    <button 
                        onClick={() => {setActiveTab('LISTS'); setViewingListDetail(null);}} 
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'LISTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                        <List size={14}/> Listas de Venta
                    </button>
                    <button 
                        onClick={() => {setActiveTab('MASS_UPDATE'); setViewingListDetail(null);}} 
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'MASS_UPDATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                        <RefreshCw size={14}/> Actualización Masiva
                    </button>
                </div>
            </div>

            {/* CONTENIDO DE LISTAS DE VENTA */}
            {activeTab === 'LISTS' && !viewingListDetail && (
                <div className="flex-1 flex flex-col gap-6 animate-fade-in overflow-hidden">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                            <Info size={14} className="text-indigo-600"/>
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Las listas aplican márgenes automáticos sobre el costo neto</p>
                        </div>
                        <button 
                            onClick={() => {setEditingList(null); setListForm({name: '', type: 'CUSTOM', fixedMargin: 30, active: true}); setIsListModalOpen(true);}}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                            <Plus size={16}/> Nueva Lista
                        </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-20 px-2">
                        {priceLists.map(list => (
                            <div key={list.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group h-fit relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${list.type === 'BASE' ? 'bg-indigo-600' : 'bg-green-500'}`}></div>
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight truncate mb-1">{list.name}</h3>
                                            <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${list.type === 'BASE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                {list.type === 'BASE' ? 'Margen Variable' : 'Margen Fijo'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => {setEditingList(list); setListForm(list); setIsListModalOpen(true);}} className="p-2.5 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                                            {list.id !== '1' && (
                                                <button onClick={() => setPriceLists(priceLists.filter(x => x.id !== list.id))} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Impacto en Venta</p>
                                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {list.type === 'BASE' ? (
                                                <div className="flex items-center gap-2"><Zap size={24} className="text-indigo-600"/> <span className="text-2xl uppercase">S/ ARTÍCULO</span></div>
                                            ) : `+${list.fixedMargin}%`}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setViewingListDetail(list)}
                                    className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                                    Auditar Artículos <ArrowRight size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DETALLE DE ARTÍCULOS DENTRO DE UNA LISTA */}
            {activeTab === 'LISTS' && viewingListDetail && (
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setViewingListDetail(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ArrowLeft size={20}/></button>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{viewingListDetail.name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Visor de Precios Finales</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Buscar en esta lista..." 
                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/5 rounded-2xl outline-none text-white font-bold text-sm focus:bg-white focus:text-slate-900 transition-all uppercase"
                                value={listSearchTerm}
                                onChange={e => setListSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Descripción / SKU</th>
                                    <th className="px-8 py-5 text-right">Costo Neto</th>
                                    <th className="px-8 py-5 text-center">Margen</th>
                                    <th className="px-8 py-5 text-right bg-indigo-50/30">Precio Final</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                {productsInList.length === 0 ? (
                                    <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">Sin resultados para el filtro actual</td></tr>
                                ) : productsInList.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 uppercase leading-none mb-1.5">{p.name}</p>
                                            <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase">{p.internalCodes[0]}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-slate-400">${(p.costAfterDiscounts || p.listCost).toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-center font-black text-slate-600">
                                            <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">+{p.appliedMargin}%</span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-lg text-slate-900 bg-indigo-50/10 tracking-tighter">${p.calculatedPrice.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-right"><button className="p-2 text-slate-300 hover:text-indigo-600"><Eye size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ACTUALIZACIÓN MASIVA (WIZARD) */}
            {activeTab === 'MASS_UPDATE' && (
                <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                    <div className="bg-slate-900 px-8 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                        <div className="flex gap-10">
                            {[
                                { n: 1, label: 'Origen Datos' },
                                { n: 2, label: 'Mapeo Columnas' },
                                { n: 3, label: 'Análisis Impacto' }
                            ].map(s => (
                                <div key={s.n} className={`flex items-center gap-3 transition-all ${step === s.n ? 'opacity-100' : 'opacity-30'}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s.n ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{s.n}</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>
                        {/* Fix: Imported RotateCcw from lucide-react to avoid 'Cannot find name' error */}
                        <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white transition-colors"><RotateCcw size={20}/></button>
                    </div>

                    <div className="flex-1 p-10 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                        {step === 1 && (
                            <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <button onClick={() => setImportMode('UPDATE')} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${importMode === 'UPDATE' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xl' : 'border-slate-100 text-slate-400'}`}>
                                            <RefreshCw size={32}/>
                                            <span className="font-black text-xs uppercase tracking-widest">Sincronizar Costos</span>
                                        </button>
                                        <button onClick={() => setImportMode('INITIAL')} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${importMode === 'INITIAL' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xl' : 'border-slate-100 text-slate-400'}`}>
                                            <PackagePlus size={32}/>
                                            <span className="font-black text-xs uppercase tracking-widest">Alta de Productos</span>
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Proveedor / Catálogo</label>
                                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase text-xs" value={selectedProviderId} onChange={e => setSelectedProviderId(e.target.value)}>
                                                <option value="">-- Seleccionar Proveedor --</option>
                                                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative group border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-indigo-400 transition-all bg-white cursor-pointer">
                                            <FileSpreadsheet size={64} className="mx-auto text-slate-300 mb-4 group-hover:scale-110 transition-transform" />
                                            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">{fileName || 'Subir Lista de Precios (.Excel / .CSV)'}</p>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setFileName(e.target.files[0].name)} />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setStep(2)} 
                                        disabled={!fileName}
                                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                        Configurar Columnas <ChevronRight size={18}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-2xl"><Sparkles size={24} className="text-indigo-400"/></div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-tight">Mapeo de Atributos</h4>
                                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Vincule los campos del Excel con los de FerreCloud</p>
                                        </div>
                                    </div>
                                    <button onClick={runAnalysis} className="bg-white text-indigo-900 px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Analizar Impacto</button>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
                                    <div className="grid grid-cols-8 bg-slate-50 p-4 gap-4 sticky top-0 border-b">
                                        {[0,1,2,3,4,5,6,7].map(i => (
                                            <div key={i} className="space-y-2">
                                                <select className="w-full text-[10px] font-black bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500" value={Object.entries(mapping).find(([_, val]) => val === i)?.[0] || 'none'} onChange={e => {
                                                        const val = e.target.value;
                                                        const newM = {...mapping} as any;
                                                        Object.keys(newM).forEach(key => { if (newM[key] === i) newM[key] = null; });
                                                        if (val !== 'none') newM[val] = i;
                                                        setMapping(newM);
                                                    }}>
                                                    <option value="none">Ignorar</option>
                                                    {MAP_FIELDS.map(f => ( <option key={f.key} value={f.key}>{f.label}</option> ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {rawExcelRows.map((row, rIdx) => (
                                            <div key={rIdx} className="grid grid-cols-8">
                                                {row.map((cell, cIdx) => (
                                                    <div key={cIdx} className="p-4 text-[11px] font-mono text-slate-500 truncate border-r last:border-r-0 border-slate-50">{cell}</div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && analysis && (
                            <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-center shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Coincidentes</p>
                                        <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">{analysis.matched}</h4>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-center shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aumento Promedio</p>
                                        <h4 className="text-4xl font-black text-red-600 tracking-tighter">+{analysis.avgVariation}%</h4>
                                    </div>
                                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-center shadow-2xl">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Impacto Global</p>
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">LISTO</h4>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[400px]">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase border-b sticky top-0">
                                                <tr>
                                                    <th className="px-8 py-4">Artículo</th>
                                                    <th className="px-8 py-4 text-right">Anterior</th>
                                                    <th className="px-8 py-4 text-right">Nuevo</th>
                                                    <th className="px-8 py-4 text-center">Variación</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-[11px]">
                                                {analysis.impactDetails.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-8 py-4 font-black uppercase text-slate-800">{item.desc}</td>
                                                        <td className="px-8 py-4 text-right font-bold text-slate-400">${item.oldCost.toLocaleString()}</td>
                                                        <td className="px-8 py-4 text-right font-black text-slate-900">${item.newCost.toLocaleString()}</td>
                                                        <td className="px-8 py-4 text-center font-black text-red-600">▲ {item.variation}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <button onClick={() => {alert('Base de datos de precios actualizada.'); setStep(1); setActiveTab('LISTS');}} className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">
                                    PROCESAR CAMBIOS EN EL SISTEMA
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: EDITAR / CREAR LISTA DE PRECIOS */}
            {isListModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><List size={24}/></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">{editingList ? 'Editar Lista' : 'Nueva Lista'}</h3>
                            </div>
                            <button onClick={() => setIsListModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Nombre de la Lista</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-800 uppercase shadow-sm" value={listForm.name} onChange={e => setListForm({...listForm, name: e.target.value.toUpperCase()})} autoFocus />
                                </div>
                                {listForm.type === 'CUSTOM' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Margen General (%)</label>
                                        <div className="relative">
                                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={24}/>
                                            <input type="number" className="w-full pl-12 p-6 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-5xl text-indigo-700 shadow-sm" value={listForm.fixedMargin} onChange={e => setListForm({...listForm, fixedMargin: parseFloat(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleSaveList} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                                <Save size={24}/> Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceUpdates;
