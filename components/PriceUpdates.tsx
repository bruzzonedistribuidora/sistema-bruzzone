
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    FileSpreadsheet, ArrowRight, CheckCircle, 
    ChevronRight, LayoutTemplate, 
    X, List, RefreshCw, Calculator, Percent,
    Edit2, Plus, Trash2, Save,
    Search, ArrowLeft, Eye, Zap, Sparkles,
    BarChart3, ShieldAlert, ArrowUpRight, RotateCcw, PlusCircle,
    TrendingUp, ArrowLeftRight, Link2, Info, Truck, Upload
} from 'lucide-react';
import { Provider, PriceList, Product } from '../types';
import { addToReplenishmentQueue, productDB } from '../services/storageService';

const DEFAULT_PRICE_LISTS: PriceList[] = [
    { id: '1', name: 'Lista 1 - Mostrador (Público)', type: 'BASE', active: true },
    { id: '2', name: 'Lista 2 - Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true },
    { id: '3', name: 'Lista 3 - Mayorista / Reventa', type: 'CUSTOM', fixedMargin: 15, active: true },
];

const PriceUpdates: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'LISTS' | 'MASS_UPDATE'>('LISTS');
    const [viewingListDetail, setViewingListDetail] = useState<PriceList | null>(null);
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [priceLists, setPriceLists] = useState<PriceList[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_lists');
        return saved ? JSON.parse(saved) : DEFAULT_PRICE_LISTS;
    });

    const loadProducts = async () => {
        const all = await productDB.getAll();
        setProducts(all);
    };

    useEffect(() => {
        loadProducts();
        localStorage.setItem('ferrecloud_price_lists', JSON.stringify(priceLists));
    }, [priceLists]);

    const calculatePriceForProduct = (p: Product, list: PriceList): number => {
        const cost = p.costAfterDiscounts || p.listCost || 0;
        if (list.baseListId) {
            const baseList = priceLists.find(l => l.id === list.baseListId);
            if (!baseList) return 0;
            const basePrice = calculatePriceForProduct(p, baseList);
            return basePrice * (1 + (list.adjustmentPercentage || 0) / 100);
        }
        const margin = list.type === 'BASE' ? (p.profitMargin || 30) : (list.fixedMargin || 0);
        const priceNeto = cost * (1 + (margin / 100));
        return priceNeto * (1 + ((p.vatRate || 21) / 100));
    };

    const handlePedir = (p: Product) => {
        if (addToReplenishmentQueue(p)) {
            alert(`Artículo ${p.name} agregado a reposición.`);
        }
    };

    const handleCostImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n').slice(1);
            const updates: Product[] = [];
            
            for (const line of lines) {
                const [sku, newCost] = line.split(';');
                if (!sku || !newCost) continue;
                const p = products.find(prod => prod.internalCodes.includes(sku.trim()));
                if (p) {
                    const listCost = parseFloat(newCost.replace(',', '.'));
                    const coef = (p.discounts || [0,0,0,0]).reduce((acc, d) => acc * (1 - (d/100)), 1);
                    const costAfterDiscounts = listCost * coef;
                    const priceNeto = costAfterDiscounts * (1 + (p.profitMargin || 30) / 100);
                    updates.push({
                        ...p,
                        listCost,
                        costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)),
                        priceNeto: parseFloat(priceNeto.toFixed(2)),
                        priceFinal: parseFloat((priceNeto * (1 + (p.vatRate || 21)/100)).toFixed(2))
                    });
                }
            }
            if (updates.length > 0) {
                await productDB.saveBulk(updates);
                alert(`✅ Se actualizaron costos para ${updates.length} artículos.`);
                await loadProducts();
            }
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    const productsInList = useMemo(() => {
        if (!viewingListDetail) return [];
        const term = listSearchTerm.toLowerCase();
        return products
            .filter(p => p.name.toLowerCase().includes(term) || p.internalCodes[0].toLowerCase().includes(term))
            .slice(0, 50)
            .map(p => ({ ...p, calculatedPrice: calculatePriceForProduct(p, viewingListDetail) }));
    }, [products, viewingListDetail, listSearchTerm]);

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Calculator size={32}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Estrategia de Precios</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">Gestión de Márgenes y Sincronización</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
                    <button onClick={() => setActiveTab('LISTS')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${activeTab === 'LISTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}><List size={16}/> Listas de Venta</button>
                    <button onClick={() => setActiveTab('MASS_UPDATE')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${activeTab === 'MASS_UPDATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}><RefreshCw size={16}/> Sincronizar Costos</button>
                </div>
            </div>

            {activeTab === 'LISTS' && !viewingListDetail && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-20">
                    {priceLists.map(list => (
                        <div key={list.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group h-fit relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter truncate mb-1">{list.name}</h3>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${list.type === 'BASE' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{list.type === 'BASE' ? 'Dinámico' : 'Fijo'}</span>
                                </div>
                            </div>
                            <button onClick={() => setViewingListDetail(list)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">Explorar Lista <ArrowRight size={16}/></button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'LISTS' && viewingListDetail && (
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <button onClick={() => setViewingListDetail(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ArrowLeft size={24}/></button>
                        <div className="flex-1 px-8">
                             <h3 className="text-xl font-black uppercase tracking-tighter">{viewingListDetail.name}</h3>
                             <input type="text" placeholder="Filtrar por SKU o Nombre..." className="w-full max-w-md mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:bg-white focus:text-slate-900 transition-all uppercase" value={listSearchTerm} onChange={e => setListSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-10 py-6">Descripción</th>
                                    <th className="px-10 py-6 text-right">Costo Neto</th>
                                    <th className="px-10 py-6 text-right font-black text-indigo-600">PVP con IVA</th>
                                    <th className="px-10 py-6 text-center">Pedido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {productsInList.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-10 py-4">
                                            <p className="font-black text-slate-800 uppercase text-xs truncate max-w-xs">{p.name}</p>
                                            <p className="text-[9px] font-mono font-bold text-indigo-500 uppercase">SKU: {p.internalCodes?.[0]}</p>
                                        </td>
                                        <td className="px-10 py-4 text-right font-bold text-slate-400">${p.costAfterDiscounts.toLocaleString()}</td>
                                        <td className="px-10 py-4 text-right font-black text-lg text-slate-900">${p.calculatedPrice?.toLocaleString()}</td>
                                        <td className="px-10 py-4 text-center">
                                            <button onClick={() => handlePedir(p)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Truck size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'MASS_UPDATE' && (
                <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden animate-fade-in p-12">
                    <div className="max-w-xl mx-auto text-center space-y-8">
                         <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><FileSpreadsheet size={48}/></div>
                         <h3 className="text-3xl font-black uppercase tracking-tighter">Sincronización por Planilla</h3>
                         <p className="text-slate-400 font-medium">Actualiza miles de costos subiendo un CSV con formato <span className="font-black text-slate-900">SKU;COSTO_LISTA</span></p>
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-4 border-dashed border-slate-100 rounded-[3rem] p-16 text-slate-300 font-black text-sm uppercase hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative group">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCostImport} />
                            {isProcessing ? <RefreshCw className="animate-spin text-indigo-600 mx-auto" size={48}/> : <Upload className="mx-auto mb-4 group-hover:text-indigo-600" size={48}/>}
                            {isProcessing ? 'Procesando Fichero...' : 'Click para Seleccionar CSV'}
                         </div>
                         <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4 text-left">
                            <Info className="text-amber-600 shrink-0" size={20}/>
                            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">Nota: La primera fila debe ser el encabezado. El sistema buscará el SKU exacto y actualizará el costo bruto recalculando todos los PVP.</p>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceUpdates;
