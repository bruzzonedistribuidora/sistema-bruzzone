
import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileSpreadsheet, ArrowRight, CheckCircle, 
    ChevronRight, LayoutTemplate, 
    X, List, BookmarkPlus, 
    RefreshCw, Layers, TrendingUp, TrendingDown, PackagePlus, 
    PackageMinus, Calculator, Tag, Percent,
    Truck, FileText, AlertOctagon, Building2, Edit2, Plus, Trash2, Save
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

    // --- DATOS DEL SISTEMA ---
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

    const [providers] = useState<Provider[]>(() => {
        const saved = localStorage.getItem('ferrecloud_providers');
        return saved ? JSON.parse(saved) : [];
    });

    // --- ESTADO DE LISTAS DE PRECIOS ---
    const [priceLists, setPriceLists] = useState<PriceList[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_lists');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Lista Base (Público)', type: 'BASE', active: true },
            { id: '2', name: 'Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true },
            { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true },
        ];
    });

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<PriceList | null>(null);
    const [listForm, setListForm] = useState<Partial<PriceList>>({ name: '', type: 'CUSTOM', fixedMargin: 0, active: true });

    useEffect(() => {
        localStorage.setItem('ferrecloud_price_lists', JSON.stringify(priceLists));
    }, [priceLists]);

    // --- MASS UPDATE WIZARD STATE ---
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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

    const [templates, setTemplates] = useState<MappingTemplate[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_templates');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_price_templates', JSON.stringify(templates));
    }, [templates]);

    const [rawExcelRows] = useState([
        ['SKU-001', 'PROV-11', 'MARTILLO GALPONERO 20OZ', 'BOSCH', 'HERRAMIENTAS', 'PROVEEDOR A', '4500.00', '35'],
        ['SKU-002', 'PROV-22', 'TALADRO 13MM 600W', 'DEWALT', 'ELECTRICAS', 'PROVEEDOR B', '85000.00', '40'],
        ['SKU-NEW', 'PROV-99', 'NUEVO ARTICULO TEST', 'GENERICO', 'VARIOS', 'PROVEEDOR C', '1250.00', '30'],
        ['SKU-003', 'PROV-33', 'PINZA UNIVERSAL 8', 'STANLEY', 'MANO', 'PROVEEDOR A', '7200.00', '35'],
    ]);

    const availableTemplates = templates.filter(t => 
        t.mode === importMode && (importMode === 'INITIAL' || t.providerId === selectedProviderId)
    );

    const runAnalysis = () => {
        setIsProcessing(true);
        const selectedProvider = providers.find(p => p.id === selectedProviderId);
        
        setTimeout(() => {
            const impact: AnalysisResult['impactDetails'] = [];
            let totalVariation = 0;
            let matchedCount = 0;

            rawExcelRows.forEach(row => {
                const code = row[mapping.code ?? 0];
                const newCost = parseFloat(row[mapping.cost ?? 6]) || 0;
                const brand = mapping.brand !== null ? row[mapping.brand] : 'GENERICO';
                const category = mapping.category !== null ? row[mapping.category] : 'GENERAL';
                const providerName = mapping.provider !== null ? row[mapping.provider] : (selectedProvider?.name || 'DESCONOCIDO');

                const existing = products.find(p => p.internalCodes.includes(code) || p.barcodes.includes(code));

                if (existing) {
                    matchedCount++;
                    const oldCost = existing.costAfterDiscounts || existing.listCost;
                    const variation = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0;
                    totalVariation += variation;
                    impact.push({ 
                        code, desc: existing.name, oldCost, newCost, variation, 
                        brand: existing.brand, category: existing.category, provider: existing.provider,
                        status: 'UPDATE' 
                    });
                } else {
                    impact.push({ 
                        code, desc: row[mapping.description ?? 2] || 'SIN DESCRIPCION', oldCost: 0, newCost, variation: 0, 
                        brand, category, provider: providerName,
                        status: 'NEW' 
                    });
                }
            });

            let discontinuedCount = 0;
            if (importMode === 'UPDATE' && selectedProvider) {
                const providerProducts = products.filter(p => p.provider === selectedProvider.name);
                const excelCodes = rawExcelRows.map(r => r[mapping.code ?? 0]);
                const discontinued = providerProducts.filter(p => !p.internalCodes.some(c => excelCodes.includes(c)));
                discontinuedCount = discontinued.length;
                discontinued.forEach(p => {
                    impact.push({ 
                        code: p.internalCodes[0], desc: p.name, oldCost: p.costAfterDiscounts, newCost: 0, variation: 0, 
                        brand: p.brand, category: p.category, provider: p.provider,
                        status: 'DISCONTINUED' 
                    });
                });
            }

            setAnalysis({
                totalExcel: rawExcelRows.length,
                matched: matchedCount,
                newItems: impact.filter(i => i.status === 'NEW').length,
                discontinued: discontinuedCount,
                avgVariation: matchedCount > 0 ? totalVariation / matchedCount : 0,
                impactDetails: impact
            });

            setIsProcessing(false);
            setStep(3);
        }, 1200);
    };

    const handleSaveTemplate = () => {
        if (!mapping.code || !mapping.cost) {
            alert("Debe mapear al menos el Código y el Costo para guardar una plantilla.");
            return;
        }
        const name = prompt("Nombre para esta plantilla:");
        if (!name) return;
        
        const newTmpl: MappingTemplate = {
            id: `tmpl-${Date.now()}`,
            name,
            providerId: importMode === 'UPDATE' ? selectedProviderId : undefined,
            mode: importMode,
            mapping: { ...mapping }
        };
        
        setTemplates(prev => {
            const updated = [...prev, newTmpl];
            localStorage.setItem('ferrecloud_price_templates', JSON.stringify(updated));
            return updated;
        });
        
        setSelectedTemplateId(newTmpl.id);
        alert(`Plantilla "${name}" guardada con éxito.`);
    };

    const finalizeUpdate = () => {
        if (!analysis) return;
        setIsProcessing(true);

        setTimeout(() => {
            let updateCount = 0;
            let insertCount = 0;

            const updatedProducts = products.map(p => {
                const match = analysis.impactDetails.find(i => p.internalCodes.includes(i.code) && i.status === 'UPDATE');
                if (match) {
                    updateCount++;
                    const priceNeto = match.newCost * (1 + (p.profitMargin / 100));
                    const priceFinal = priceNeto * (1 + (p.vatRate / 100));
                    return { 
                        ...p, 
                        listCost: match.newCost, 
                        costAfterDiscounts: match.newCost,
                        priceNeto: parseFloat(priceNeto.toFixed(2)),
                        priceFinal: parseFloat(priceFinal.toFixed(2))
                    };
                }
                return p;
            });

            let finalProductList: Product[] = [...updatedProducts];

            if (importMode === 'INITIAL') {
                const newProductsToAdd: Product[] = analysis.impactDetails.filter(i => i.status === 'NEW').map(item => {
                    insertCount++;
                    const profitMargin = 30; 
                    const vatRate = 21.0; 
                    const priceNeto = item.newCost * (1 + (profitMargin / 100));
                    const priceFinal = priceNeto * (1 + (vatRate / 100));

                    const newP: Product = {
                        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        internalCodes: [item.code],
                        barcodes: [],
                        providerCodes: [],
                        name: item.desc,
                        brand: item.brand,
                        provider: item.provider,
                        description: '',
                        category: item.category,
                        measureUnitSale: 'Unidad',
                        measureUnitPurchase: 'Unidad',
                        conversionFactor: 1,
                        purchaseCurrency: 'ARS',
                        saleCurrency: 'ARS',
                        vatRate: 21.0,
                        listCost: item.newCost,
                        discounts: [0, 0, 0, 0],
                        costAfterDiscounts: item.newCost,
                        profitMargin: profitMargin,
                        priceNeto: parseFloat(priceNeto.toFixed(2)),
                        priceFinal: parseFloat(priceFinal.toFixed(2)),
                        stock: 0,
                        stockDetails: [],
                        minStock: 0,
                        desiredStock: 0,
                        reorderPoint: 0,
                        location: '',
                        ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
                        isCombo: false,
                        comboItems: []
                    };
                    return newP;
                });
                finalProductList = [...finalProductList, ...newProductsToAdd];
            }

            setProducts(finalProductList);
            localStorage.setItem('ferrecloud_products', JSON.stringify(finalProductList));
            
            alert(`Sincronización Exitosa.\n- Actualizados: ${updateCount}\n- Nuevos incorporados: ${insertCount}`);
            
            setStep(1);
            setAnalysis(null);
            setIsProcessing(false);
            setFileName('');
        }, 2000);
    };

    // --- MANEJO DE LISTAS DE PRECIOS ---
    const handleOpenListModal = (list?: PriceList) => {
        if (list) {
            setEditingList(list);
            setListForm(list);
        } else {
            setEditingList(null);
            setListForm({ name: '', type: 'CUSTOM', fixedMargin: 30, active: true });
        }
        setIsListModalOpen(true);
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

    const handleDeleteList = (id: string) => {
        if (id === '1') {
            alert("No se puede eliminar la lista base.");
            return;
        }
        if (confirm("¿Está seguro que desea eliminar esta lista de precios?")) {
            setPriceLists(prev => prev.filter(l => l.id !== id));
        }
    };

    const MAP_FIELDS = [
        { key: 'code', label: 'Cód. Interno (SKU)', icon: Tag, color: 'bg-blue-600' },
        { key: 'providerCode', label: 'Cód. Proveedor', icon: Truck, color: 'bg-slate-600' },
        { key: 'description', label: 'Descripción / Nombre', icon: FileText, color: 'bg-yellow-500' },
        { key: 'brand', label: 'Marca', icon: BookmarkPlus, color: 'bg-purple-600' },
        { key: 'category', label: 'Categoría', icon: Layers, color: 'bg-indigo-600' },
        { key: 'provider', label: 'Proveedor', icon: Building2, color: 'bg-teal-600' },
        { key: 'cost', label: 'Costo Neto', icon: Calculator, color: 'bg-green-600' },
        { key: 'profit', label: '% Ganancia', icon: Percent, color: 'bg-orange-500' },
    ];

    return (
        <div className="p-4 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Calculator size={18} className="text-indigo-600"/> Gestión de Listas y Costos
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setActiveTab('LISTS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'LISTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Venta Público</button>
                    <button onClick={() => setActiveTab('MASS_UPDATE')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'MASS_UPDATE' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Importación Masiva</button>
                </div>
            </div>

            {activeTab === 'LISTS' && (
                <div className="flex-1 flex flex-col gap-4 animate-fade-in overflow-hidden">
                    <div className="flex justify-end pr-2">
                        <button 
                            onClick={() => handleOpenListModal()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Plus size={16}/> Nueva Lista
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-10">
                        {priceLists.map(list => (
                            <div key={list.id} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group h-fit relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${list.type === 'BASE' ? 'bg-indigo-600' : 'bg-green-500'}`}></div>
                                <div>
                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div className="max-w-[70%]">
                                            <h3 className="font-black text-slate-800 uppercase tracking-tight truncate">{list.name}</h3>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${list.type === 'BASE' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                                {list.type === 'BASE' ? 'Automática' : 'Custom'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenListModal(list)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={14}/></button>
                                            {list.id !== '1' && (
                                                <button onClick={() => handleDeleteList(list.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pl-2">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Margen Aplicado</p>
                                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {list.type === 'BASE' ? 'S/ ARTÍCULO' : `+${list.fixedMargin}%`}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t border-gray-50 flex justify-end pl-2">
                                     <button className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors flex items-center gap-2">Ver Artículos <ChevronRight size={12}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'MASS_UPDATE' && (
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in min-h-0">
                    <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
                        <div className="flex gap-8">
                            {[
                                { n: 1, label: 'Parámetros' },
                                { n: 2, label: 'Mapeo Columnas' },
                                { n: 3, label: 'Análisis Impacto' }
                            ].map(s => (
                                <div key={s.n} className={`flex items-center gap-2 transition-all ${step === s.n ? 'opacity-100' : 'opacity-40'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s.n ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{s.n}</span>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>
                        {fileName && <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">{fileName}</span>}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 overflow-hidden">
                        {step === 1 && (
                            <div className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full p-6 animate-fade-in overflow-hidden">
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Modo de carga</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button onClick={() => setImportMode('UPDATE')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${importMode === 'UPDATE' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 text-slate-400'}`}>
                                                    <RefreshCw size={20}/>
                                                    <span className="font-black text-[10px] uppercase tracking-tighter">Actualizar Existentes</span>
                                                </button>
                                                <button onClick={() => setImportMode('INITIAL')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${importMode === 'INITIAL' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 text-slate-400'}`}>
                                                    <PackagePlus size={20}/>
                                                    <span className="font-black text-[10px] uppercase tracking-tighter">Carga Inicial</span>
                                                </button>
                                            </div>
                                        </div>

                                        {importMode === 'UPDATE' && (
                                            <div className="animate-fade-in space-y-3 pt-4 border-t border-slate-100">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">Proveedor Responsable</label>
                                                <select className="w-full p-3 bg-slate-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none" value={selectedProviderId} onChange={e => {setSelectedProviderId(e.target.value); setSelectedTemplateId('manual');}}>
                                                    <option value="">-- Seleccione Proveedor --</option>
                                                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-100">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Plantilla de Columnas</label>
                                            <select className="w-full p-3 bg-slate-50 border border-gray-100 rounded-xl text-xs font-bold outline-none" value={selectedTemplateId} onChange={e => {
                                                setSelectedTemplateId(e.target.value);
                                                if (e.target.value !== 'manual') {
                                                    const t = templates.find(x => x.id === e.target.value);
                                                    if (t) setMapping(t.mapping);
                                                } else {
                                                    setMapping({ code: null, providerCode: null, description: null, cost: null, brand: null, category: null, provider: null, profit: null, ignored: [] });
                                                }
                                            }}>
                                                <option value="manual">Mapeo Manual</option>
                                                {availableTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="relative group">
                                            <div className={`border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all ${fileName ? 'border-green-400 bg-green-50/10' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}`}>
                                                <FileSpreadsheet size={48} className={`mb-3 ${fileName ? 'text-green-500' : 'text-slate-300'}`}/>
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter text-center">{fileName || 'Haga clic o arrastre el archivo de listas'}</p>
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setFileName(e.target.files[0].name)} accept=".xlsx,.xls,.csv" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 shrink-0">
                                    <button onClick={() => setStep(2)} disabled={fileName === '' || (importMode === 'UPDATE' && !selectedProviderId)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 active:scale-95 transition-all">Siguiente: Mapear Columnas</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex-1 flex flex-col min-h-0 animate-fade-in overflow-hidden">
                                <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><LayoutTemplate size={18}/></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asigne el contenido de cada columna</p>
                                    </div>
                                    <button onClick={handleSaveTemplate} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-2">
                                        <BookmarkPlus size={14}/> Guardar Plantilla
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                                    <div className="border border-gray-200 rounded-[2rem] overflow-hidden bg-white shadow-xl min-w-[1200px]">
                                        <div className="grid grid-cols-8 bg-slate-900 p-4 gap-4 sticky top-0 z-20">
                                            {[0,1,2,3,4,5,6,7].map(i => (
                                                <div key={i} className="space-y-2">
                                                    <div className={`text-[8px] font-black py-1 px-2 rounded-full text-center border uppercase tracking-tighter flex items-center justify-center gap-1.5 h-6 ${
                                                        Object.entries(mapping).find(([_, val]) => val === i) 
                                                        ? `${MAP_FIELDS.find(f => f.key === Object.entries(mapping).find(([_, val]) => val === i)?.[0])?.color} text-white border-white/20` 
                                                        : 'bg-slate-800 text-slate-500 border-slate-700'
                                                    }`}>
                                                        {Object.entries(mapping).find(([_, val]) => val === i) ? (
                                                            <>
                                                                {React.createElement(MAP_FIELDS.find(f => f.key === Object.entries(mapping).find(([_, val]) => val === i)?.[0])?.icon || X, { size: 10 })}
                                                                {MAP_FIELDS.find(f => f.key === Object.entries(mapping).find(([_, val]) => val === i)?.[0])?.label.split(' ')[0]}
                                                            </>
                                                        ) : '---'}
                                                    </div>
                                                    <select className="w-full text-[10px] font-black bg-slate-800 text-white border-none rounded-lg p-2 outline-none cursor-pointer hover:bg-slate-700 transition-colors" value={Object.entries(mapping).find(([_, val]) => val === i)?.[0] || 'none'} onChange={e => {
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
                                        <div className="divide-y divide-gray-100">
                                            {rawExcelRows.map((row, rIdx) => (
                                                <div key={rIdx} className="grid grid-cols-8 hover:bg-slate-50 transition-colors">
                                                    {row.map((cell, cIdx) => (
                                                        <div key={cIdx} className="p-4 text-[10px] font-mono text-slate-500 truncate border-r last:border-r-0 border-gray-100">{cell}</div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border-t border-gray-100 flex justify-between shrink-0">
                                    <button onClick={() => setStep(1)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-8 hover:text-slate-800 transition-colors">Volver</button>
                                    <button onClick={runAnalysis} disabled={mapping.code === null || mapping.cost === null} className="bg-slate-900 text-white px-12 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl disabled:opacity-20 flex items-center gap-2 active:scale-95 transition-all">
                                        Analizar Impacto <ChevronRight size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && analysis && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in p-4 md:p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Layers size={20}/></div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Excel</p>
                                            <p className="text-xl font-black text-slate-800 leading-none">{analysis.totalExcel}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><PackagePlus size={20}/></div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Nuevos</p>
                                            <p className="text-xl font-black text-green-600 leading-none">{analysis.newItems}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${analysis.avgVariation > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {analysis.avgVariation > 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Variación</p>
                                            <p className={`text-xl font-black leading-none ${analysis.avgVariation > 0 ? 'text-red-600' : 'text-green-600'}`}>{analysis.avgVariation.toFixed(2)}%</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><PackageMinus size={20}/></div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Inactivos</p>
                                            <p className="text-xl font-black text-orange-600 leading-none">{analysis.discontinued}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-900 sticky top-0 z-10 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-3">Artículo / SKU</th>
                                                    <th className="px-6 py-3 text-right">Anterior</th>
                                                    <th className="px-6 py-3 text-right">Nuevo</th>
                                                    <th className="px-6 py-3 text-center">Impacto</th>
                                                    <th className="px-6 py-3 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-[10px]">
                                                {analysis.impactDetails.map((item, idx) => (
                                                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${item.status === 'NEW' && importMode === 'UPDATE' ? 'opacity-40 grayscale' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <p className="font-black text-slate-800 uppercase leading-none mb-1 truncate max-w-[200px]">{item.desc}</p>
                                                            <p className="text-[8px] font-mono font-bold text-indigo-500 uppercase">{item.code}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-400">{item.oldCost > 0 ? `$${item.oldCost.toLocaleString('es-AR')}` : '-'}</td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900">$ {item.newCost.toLocaleString('es-AR')}</td>
                                                        <td className={`px-6 py-4 text-center font-black ${item.variation > 0 ? 'text-red-500' : item.variation < 0 ? 'text-green-500' : 'text-gray-300'}`}>{item.variation !== 0 ? `${item.variation > 0 ? '▲' : '▼'} ${Math.abs(item.variation).toFixed(1)}%` : '0%'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                                                                item.status === 'UPDATE' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                                item.status === 'NEW' ? 'bg-green-50 text-green-600 border-green-100' : 
                                                                'bg-red-50 text-red-600 border-red-100'
                                                            }`}>
                                                                {item.status === 'NEW' && importMode === 'UPDATE' ? 'DESCARTADO' : item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <button onClick={() => setStep(2)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-2 hover:text-slate-800 transition-colors">Volver</button>
                                    <button onClick={finalizeUpdate} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all">
                                        <CheckCircle size={18}/> Actualizar Base de Datos
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: EDITAR / CREAR LISTA DE PRECIOS */}
            {isListModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><List size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{editingList ? 'Editar Lista' : 'Nueva Lista de Venta'}</h3>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Configuración de Rentabilidad</p>
                                </div>
                            </div>
                            <button onClick={() => setIsListModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-slate-50/50">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Nombre de la Lista</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 uppercase shadow-sm" 
                                        placeholder="Ej: LISTA GREMIO, MAYORISTA..."
                                        value={listForm.name}
                                        onChange={e => setListForm({...listForm, name: e.target.value.toUpperCase()})}
                                        autoFocus
                                    />
                                </div>
                                {listForm.type === 'CUSTOM' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Margen de Ganancia General (%)</label>
                                        <div className="relative group">
                                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={24}/>
                                            <input 
                                                type="number" 
                                                className="w-full pl-12 p-6 bg-white border-2 border-transparent rounded-[2rem] focus:border-indigo-600 outline-none font-black text-5xl text-indigo-700 shadow-sm" 
                                                placeholder="0.00"
                                                value={listForm.fixedMargin}
                                                onChange={e => setListForm({...listForm, fixedMargin: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-3 font-medium leading-relaxed italic px-2">Este porcentaje se aplicará automáticamente sobre el costo neto de todos los artículos para esta lista.</p>
                                    </div>
                                )}
                                {listForm.type === 'BASE' && (
                                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-start gap-4">
                                        <Info className="text-indigo-600 shrink-0" size={24}/>
                                        <p className="text-[10px] text-indigo-900 font-bold uppercase leading-relaxed">La Lista Base utiliza el margen individual configurado en la ficha de cada producto.</p>
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={handleSaveList}
                                className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Save size={24}/> {editingList ? 'Guardar Cambios' : 'Crear Lista de Precios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceUpdates;
