import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Save, X, Layers, CheckCircle, Trash2, Filter, 
    ArrowRight, Info, AlertTriangle, Package, Tag, Building2, 
    Percent, DollarSign, RefreshCw, Plus, CheckSquare, Square,
    Check as CheckIcon, Calculator, Trash
} from 'lucide-react';
import { Product, Brand, Category, Provider } from '../types';
import { productDB } from '../services/storageService';

const MassProductUpdate: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    // Filtros de búsqueda (Bloque Superior)
    const [searchName, setSearchName] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [searchBrand, setSearchBrand] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [searchProvider, setSearchProvider] = useState('');
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tempChanges, setTempChanges] = useState<Record<string, Partial<Product>>>({});

    // Atributos a cambiar (Bloque Medio)
    const [massForm, setMassForm] = useState({
        brand: '',
        category: '',
        provider: '',
        reorderPoint: '',
        stockMaximo: '',
        profitMargin: '',
        vatRate: '',
        purchasePackageQuantity: ''
    });

    const [isApplying, setIsApplying] = useState(false);

    const loadProducts = async () => {
        setIsApplying(true);
        const all = await productDB.getAll();
        setProducts(all);
        setIsApplying(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchName = !searchName || p.name.toLowerCase().includes(searchName.toLowerCase());
            const matchCode = !searchCode || 
                (p.internalCodes && p.internalCodes.some(c => c.toLowerCase().includes(searchCode.toLowerCase())));
            const matchBrand = !searchBrand || p.brand === searchBrand;
            const matchCategory = !searchCategory || p.category === searchCategory;
            const matchProvider = !searchProvider || p.provider === searchProvider;
            
            return matchName && matchCode && matchBrand && matchCategory && matchProvider;
        });
    }, [products, searchName, searchCode, searchBrand, searchCategory, searchProvider]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleApplyMassChanges = () => {
        if (selectedIds.size === 0) {
            alert("Seleccione al menos un artículo en la grilla.");
            return;
        }

        const nextTemp = { ...tempChanges };
        selectedIds.forEach(id => {
            const p = products.find(prod => prod.id === id);
            if (!p) return;

            const updates: any = {};
            if (massForm.brand) updates.brand = massForm.brand;
            if (massForm.category) updates.category = massForm.category;
            if (massForm.provider) updates.provider = massForm.provider;
            if (massForm.reorderPoint !== '') updates.reorderPoint = parseFloat(massForm.reorderPoint);
            if (massForm.stockMaximo !== '') updates.stockMaximo = parseFloat(massForm.stockMaximo);
            if (massForm.profitMargin !== '') updates.profitMargin = parseFloat(massForm.profitMargin);
            if (massForm.vatRate !== '') updates.vatRate = parseFloat(massForm.vatRate);

            nextTemp[id] = { ...(nextTemp[id] || {}), ...updates };
        });

        setTempChanges(nextTemp);
        alert(`Cambios aplicados temporalmente a ${selectedIds.size} ítems. Presione 'Guardar' para finalizar.`);
    };

    const handleSaveToDB = async () => {
        const idsToUpdate = Object.keys(tempChanges);
        if (idsToUpdate.length === 0) {
            alert("No hay cambios pendientes.");
            return;
        }

        setIsApplying(true);
        const productsToSave = products.filter(p => idsToUpdate.includes(p.id)).map(p => {
            const updates = tempChanges[p.id];
            const updated = { ...p, ...updates };
            
            // Recalcular precios si cambió el margen o el IVA
            if (updates.profitMargin || updates.vatRate) {
                const priceNeto = updated.costAfterDiscounts * (1 + (updated.profitMargin || 0) / 100);
                const priceFinal = priceNeto * (1 + (updated.vatRate || 21) / 100);
                updated.priceNeto = parseFloat(priceNeto.toFixed(2));
                updated.priceFinal = parseFloat(priceFinal.toFixed(2));
            }
            return updated;
        });

        await productDB.saveBulk(productsToSave);
        setTempChanges({});
        setSelectedIds(new Set());
        await loadProducts();
        setIsApplying(false);
        alert("✅ Cambios guardados permanentemente.");
    };

    return (
        <div className="h-full bg-[#d4d0c8] p-1 flex flex-col space-y-1 font-sans overflow-hidden border-2 border-slate-400">
            
            {/* PANEL 1: FILTROS */}
            <div className="bg-[#d4d0c8] border border-slate-500 p-2 shadow-inner">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-800 bg-[#c0c0c0] px-2 border-x border-t border-slate-500 -mb-px">Filtros de busqueda</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-1 border border-slate-500 p-2 pt-3">
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Nombre:</label>
                        <input className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={searchName} onChange={e => setSearchName(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Codigo:</label>
                        <input className="flex-1 border border-slate-400 bg-white p-0.5 text-xs" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Marca:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={searchBrand} onChange={e => setSearchBrand(e.target.value)}>
                            <option value="">TODAS</option>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Rubro:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={searchCategory} onChange={e => setSearchCategory(e.target.value)}>
                            <option value="">TODOS</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Proveedor:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={searchProvider} onChange={e => setSearchProvider(e.target.value)}>
                            <option value="">TODOS</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 col-span-2">
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Sincroniza Online</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Tiene Foto</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Con Stock</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Usa Balanza</label>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={loadProducts} className="bg-[#e1e1e1] border border-slate-500 px-4 py-0.5 font-bold text-xs hover:bg-white shadow-sm flex items-center gap-1">
                            <Search size={12}/> Buscar
                        </button>
                    </div>
                </div>
            </div>

            {/* PANEL 2: ATRIBUTOS A CAMBIAR */}
            <div className="bg-[#d4d0c8] border border-slate-500 p-2 shadow-inner">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-800 bg-[#c0c0c0] px-2 border-x border-t border-slate-500 -mb-px">Seleccione los productos y atributos a cambiar</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-2 border border-slate-500 p-2 pt-3">
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Marca:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={massForm.brand} onChange={e => setMassForm({...massForm, brand: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Rubro:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={massForm.category} onChange={e => setMassForm({...massForm, category: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Proveedor:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs uppercase" value={massForm.provider} onChange={e => setMassForm({...massForm, provider: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">IVA:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-0.5 text-xs" value={massForm.vatRate} onChange={e => setMassForm({...massForm, vatRate: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            <option value="21">21.0%</option>
                            <option value="10.5">10.5%</option>
                            <option value="0">EXENTO</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">P.Pedido:</label>
                        <div className="flex items-center gap-1 flex-1">
                             <input type="checkbox" className="w-3 h-3" checked={massForm.reorderPoint !== ''} readOnly />
                             <input type="number" className="flex-1 border border-slate-400 bg-white p-0.5 text-xs text-right" value={massForm.reorderPoint} onChange={e => setMassForm({...massForm, reorderPoint: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Stock Des.:</label>
                        <div className="flex items-center gap-1 flex-1">
                             <input type="checkbox" className="w-3 h-3" checked={massForm.stockMaximo !== ''} readOnly />
                             <input type="number" className="flex-1 border border-slate-400 bg-white p-0.5 text-xs text-right" value={massForm.stockMaximo} onChange={e => setMassForm({...massForm, stockMaximo: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">% Ganancia:</label>
                        <input type="number" className="flex-1 border border-slate-400 bg-white p-0.5 text-xs text-right text-indigo-800 font-black" value={massForm.profitMargin} onChange={e => setMassForm({...massForm, profitMargin: e.target.value})} />
                    </div>
                    <div className="flex justify-end items-center">
                        <button onClick={handleApplyMassChanges} className="bg-[#e1e1e1] border border-slate-500 px-6 py-1 font-black text-xs text-green-700 hover:bg-green-50 shadow-sm flex items-center gap-1">
                            <CheckIcon size={14}/> Aplicar
                        </button>
                    </div>
                </div>
            </div>

            {/* GRILLA DE ARTICULOS */}
            <div className="flex-1 bg-white border border-slate-500 overflow-hidden flex flex-col shadow-inner">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead className="bg-[#000000] text-white text-[10px] font-black uppercase sticky top-0 z-10">
                            <tr className="divide-x divide-slate-600">
                                <th className="p-1.5 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="w-4 h-4 bg-white border border-slate-400 rounded-sm flex items-center justify-center">
                                        {/* Fix: Replaced undefined 'filteredAndSorted' with 'filteredProducts' */}
                                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 && <div className="w-2 h-2 bg-indigo-600"></div>}
                                    </button>
                                </th>
                                <th className="p-1.5">dadStock</th>
                                <th className="p-1.5">Anterior</th>
                                <th className="p-1.5">Codigo</th>
                                <th className="p-1.5">Nombre</th>
                                <th className="p-1.5 text-center">StockCalculado</th>
                                <th className="p-1.5 text-center">Punto Pedido</th>
                                <th className="p-1.5 text-center">Stock Deseado</th>
                                <th className="p-1.5">Marca</th>
                                <th className="p-1.5">Rubro</th>
                                <th className="p-1.5">Proveedor</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] divide-y divide-slate-200">
                            {/* Fix: Replaced undefined 'filteredAndSorted' with 'filteredProducts' */}
                            {filteredProducts.map(p => {
                                const changes = tempChanges[p.id] || {};
                                return (
                                    <tr key={p.id} className={`hover:bg-[#fff9c4] transition-colors divide-x divide-slate-100 ${selectedIds.has(p.id) ? 'bg-[#e3f2fd]' : ''}`}>
                                        <td className="p-1 text-center">
                                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectOne(p.id)} />
                                        </td>
                                        <td className="p-1 text-center">{p.purchasePackageQuantity || 1}</td>
                                        <td className="p-1 text-slate-400">---</td>
                                        <td className="p-1 font-bold text-indigo-700">{p.internalCodes[0]}</td>
                                        <td className="p-1 font-black uppercase truncate max-w-[250px]">{p.name}</td>
                                        <td className="p-1 text-center font-bold text-slate-600">{p.stock}</td>
                                        <td className="p-1 text-center">
                                            {changes.reorderPoint !== undefined ? <span className="text-green-700 font-black">{changes.reorderPoint}</span> : p.reorderPoint}
                                        </td>
                                        <td className="p-1 text-center">
                                            {changes.stockMaximo !== undefined ? <span className="text-green-700 font-black">{changes.stockMaximo}</span> : p.stockMaximo}
                                        </td>
                                        <td className={`p-1 uppercase ${changes.brand ? 'text-green-700 font-black' : 'text-slate-500 font-bold'}`}>
                                            {changes.brand || p.brand}
                                        </td>
                                        <td className={`p-1 uppercase ${changes.category ? 'text-green-700 font-black' : 'text-slate-500 font-bold'}`}>
                                            {changes.category || p.category}
                                        </td>
                                        <td className={`p-1 uppercase ${changes.provider ? 'text-green-700 font-black' : 'text-slate-500 font-bold'}`}>
                                            {changes.provider || p.provider}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BOTONES DE ACCION INFERIOR */}
            <div className="bg-[#d4d0c8] border-t border-slate-500 p-2 flex justify-between items-center shrink-0">
                <button 
                    onClick={() => { if(confirm('¿Eliminar seleccionados del listado actual?')) setSelectedIds(new Set()); }}
                    className="flex items-center gap-1 bg-[#f8d7da] border border-red-400 text-red-700 px-3 py-1 font-bold text-[10px] uppercase hover:bg-red-200"
                >
                    <Trash size={12}/> Eliminar productos seleccionados
                </button>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleSaveToDB} 
                        disabled={isApplying || Object.keys(tempChanges).length === 0}
                        className="bg-[#e1e1e1] border border-slate-800 px-8 py-1.5 font-black text-xs uppercase flex items-center gap-2 hover:bg-white active:bg-slate-200 transition-all disabled:opacity-30 shadow-sm"
                    >
                        {isApplying ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle size={14}/>} Guardar
                    </button>
                    <button 
                        onClick={() => { setTempChanges({}); setSelectedIds(new Set()); }}
                        className="bg-[#e1e1e1] border border-slate-500 px-6 py-1.5 font-bold text-xs uppercase hover:bg-white shadow-sm flex items-center gap-1"
                    >
                        <X size={14}/> Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MassProductUpdate;
