import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Save, X, Layers, CheckCircle, Trash2, Filter, 
    ArrowRight, Info, AlertTriangle, Package, Tag, Building2, 
    Percent, DollarSign, RefreshCw, Plus, CheckSquare, Square,
    Check as CheckIcon, Calculator, Trash, MousePointer2, PlusCircle
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
    const [searchCurrency, setSearchCurrency] = useState('');
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tempChanges, setTempChanges] = useState<Record<string, Partial<Product>>>({});

    // Atributos a cambiar (Bloque Medio)
    const [massForm, setMassForm] = useState({
        brand: '',
        category: '',
        provider: '',
        purchaseCurrency: '',
        vatRate: '',
        concatenate: '',
        reorderPoint: '',
        stockMaximo: '',
        purchasePackageQuantity: '',
        abbreviation: '',
        otherCosts: '',
        active: true,
        syncOnline: true
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
            const matchCurrency = !searchCurrency || p.purchaseCurrency === searchCurrency;
            
            return matchName && matchCode && matchBrand && matchCategory && matchProvider && matchCurrency;
        });
    }, [products, searchName, searchCode, searchBrand, searchCategory, searchProvider, searchCurrency]);

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
            if (massForm.purchaseCurrency) updates.purchaseCurrency = massForm.purchaseCurrency;
            if (massForm.vatRate !== '') updates.vatRate = parseFloat(massForm.vatRate);
            if (massForm.reorderPoint !== '') updates.reorderPoint = parseFloat(massForm.reorderPoint);
            if (massForm.stockMaximo !== '') updates.stockMaximo = parseFloat(massForm.stockMaximo);
            if (massForm.purchasePackageQuantity !== '') updates.purchasePackageQuantity = parseFloat(massForm.purchasePackageQuantity);
            
            // Lógica de concatenación
            if (massForm.concatenate) {
                updates.name = (p.name + " " + massForm.concatenate).toUpperCase();
            }

            nextTemp[id] = { ...(nextTemp[id] || {}), ...updates };
        });

        setTempChanges(nextTemp);
        alert(`Cambios aplicados visualmente a ${selectedIds.size} ítems. Presione 'Guardar' para confirmar.`);
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
            return { ...p, ...updates };
        });

        await productDB.saveBulk(productsToSave);
        setTempChanges({});
        setSelectedIds(new Set());
        await loadProducts();
        setIsApplying(false);
        alert("✅ Cambios guardados permanentemente en la base de datos.");
    };

    return (
        <div className="h-full bg-[#d4d0c8] p-1 flex flex-col space-y-1 font-sans overflow-hidden border-2 border-[#808080]">
            
            <header className="bg-black text-white p-1 text-center shrink-0 border-b-2 border-white">
                <h1 className="text-[11px] font-black tracking-[0.3em] uppercase">Modificaciones Masivas de Productos</h1>
            </header>

            {/* PANEL 1: FILTROS DE BÚSQUEDA */}
            <div className="relative border-2 border-[#808080] p-4 bg-[#d4d0c8] shadow-inner">
                <span className="absolute -top-3 left-4 bg-[#d4d0c8] px-2 text-[10px] font-black uppercase text-slate-800 border-x border-t border-[#808080]">Filtros de busqueda</span>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-1 mt-2">
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Nombre:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={searchName} onChange={e => setSearchName(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Codigo:</label>
                        <div className="flex gap-1 flex-1">
                            <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
                            <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                        </div>
                    </div>
                    
                    {/* Espacio central grande como en la imagen */}
                    <div className="md:row-span-3 md:col-span-1 border-2 border-[#808080] bg-[#eeeeee] flex items-center justify-center">
                        <Plus size={48} className="text-green-600 opacity-50"/>
                    </div>

                    <div className="flex justify-end col-span-1">
                        <button onClick={loadProducts} className="bg-[#e1e1e1] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-bold text-xs hover:bg-white active:border-r-white active:border-b-white active:border-l-[#808080] active:border-t-[#808080] flex items-center gap-2 shadow-sm">
                            <Search size={14}/> Buscar
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Marca:</label>
                        <select className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={searchBrand} onChange={e => setSearchBrand(e.target.value)}>
                            <option value="">TODAS</option>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Rubro:</label>
                        <select className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={searchCategory} onChange={e => setSearchCategory(e.target.value)}>
                            <option value="">TODOS</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" checked /> Activos</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Proveedor:</label>
                        <select className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={searchProvider} onChange={e => setSearchProvider(e.target.value)}>
                            <option value="">TODOS</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Moneda:</label>
                        <select className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs" value={searchCurrency} onChange={e => setSearchCurrency(e.target.value)}>
                            <option value="">TODAS</option>
                            <option value="ARS">PESOS</option>
                            <option value="USD">DÓLARES</option>
                        </select>
                    </div>

                    <div className="col-span-4 grid grid-cols-5 gap-2 pt-2 border-t border-[#808080]/30">
                        <label className="flex items-center gap-1 text-[9px] font-bold"><input type="checkbox" className="w-3 h-3" /> Sincroniza Online</label>
                        <label className="flex items-center gap-1 text-[9px] font-bold"><input type="checkbox" className="w-3 h-3" /> Tiene Foto</label>
                        <label className="flex items-center gap-1 text-[9px] font-bold"><input type="checkbox" className="w-3 h-3" /> Con Stock</label>
                        <label className="flex items-center gap-1 text-[9px] font-bold"><input type="checkbox" className="w-3 h-3" /> Usa Balanza</label>
                        <div className="flex items-center gap-1 text-[9px] font-bold">
                            <input type="checkbox" className="w-3 h-3" /> Fecha de creación
                            <span className="ml-2 text-[8px] text-slate-500">Desde: 16/01/2026 Hasta: 16/01/2026</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANEL 2: ATRIBUTOS A CAMBIAR */}
            <div className="relative border-2 border-[#808080] p-4 bg-[#d4d0c8] shadow-inner">
                <span className="absolute -top-3 left-4 bg-[#d4d0c8] px-2 text-[10px] font-black uppercase text-slate-800 border-x border-t border-[#808080]">Seleccione los productos y atributos a cambiar</span>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-1 mt-2">
                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Marca:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={massForm.brand} onChange={e => setMassForm({...massForm, brand: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                        <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                    </div>
                    
                    <div className="md:row-span-3 md:col-span-1 border-2 border-[#808080] bg-[#eeeeee] flex items-center justify-center">
                        <Plus size={48} className="text-green-600 opacity-50"/>
                    </div>

                    <div className="flex justify-end col-span-1">
                        <button onClick={handleApplyMassChanges} className="bg-white border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-black text-xs text-green-700 hover:bg-green-50 flex items-center gap-2 shadow-sm">
                            <CheckIcon size={14}/> Aplicar
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Rubro:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={massForm.category} onChange={e => setMassForm({...massForm, category: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                        <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1 items-start pl-2">
                         <label className="flex items-center gap-1 text-[9px] font-bold"><input type="checkbox" className="w-3 h-3" defaultChecked /> Activos</label>
                         <label className="flex items-center gap-1 text-[9px] font-bold"><input type="checkbox" className="w-3 h-3" defaultChecked /> Sincroniza con tienda online</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Proveedor:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={massForm.provider} onChange={e => setMassForm({...massForm, provider: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                        <input className="w-1/2 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">Mon. Com:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs uppercase" value={massForm.purchaseCurrency} onChange={e => setMassForm({...massForm, purchaseCurrency: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold">IVA:</label>
                        <select className="border-2 border-[#808080] bg-white p-0.5 text-[10px]" value={massForm.vatRate} onChange={e => setMassForm({...massForm, vatRate: e.target.value})}>
                            <option value="">Seleccio</option>
                            <option value="21">21.0%</option>
                            <option value="10.5">10.5%</option>
                        </select>
                        <label className="text-[11px] font-bold ml-1">Concatenar:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs" value={massForm.concatenate} onChange={e => setMassForm({...massForm, concatenate: e.target.value})} />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="w-16 text-right text-[11px] font-bold text-slate-700">P.Pedido:</label>
                        <div className="flex items-center gap-1">
                             <input type="checkbox" className="w-3 h-3" />
                             <input type="number" className="w-20 border-2 border-[#808080] bg-[#e1e1e1] p-0.5 text-xs text-right" value={massForm.reorderPoint} onChange={e => setMassForm({...massForm, reorderPoint: e.target.value})} />
                        </div>
                        <label className="text-[11px] font-bold ml-1 whitespace-nowrap">Stock Deseado:</label>
                        <div className="flex items-center gap-1">
                             <input type="checkbox" className="w-3 h-3" />
                             <input type="number" className="w-20 border-2 border-[#808080] bg-[#e1e1e1] p-0.5 text-xs text-right" value={massForm.stockMaximo} onChange={e => setMassForm({...massForm, stockMaximo: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 col-span-2">
                        <button className="bg-[#e1e1e1] border-2 border-white border-r-[#808080] border-b-[#808080] px-3 py-0.5 font-bold text-[10px] uppercase">Cambios en Almacén</button>
                        <label className="text-[11px] font-bold">Otros Cost.:</label>
                        <input className="flex-1 border-2 border-[#808080] bg-white p-0.5 text-xs" />
                        <button className="p-0.5 bg-green-50 text-green-600 border border-[#808080]"><Plus size={10}/></button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <label className="w-24 text-right text-[11px] font-bold text-slate-700">Cantidad por Bulto:</label>
                        <input type="checkbox" className="w-3 h-3" />
                        <input type="number" className="w-20 border-2 border-[#808080] bg-[#e1e1e1] p-0.5 text-xs text-right" value={massForm.purchasePackageQuantity} onChange={e => setMassForm({...massForm, purchasePackageQuantity: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <label className="text-[11px] font-bold">Abreviatura:</label>
                        <input type="checkbox" className="w-3 h-3" />
                        <input className="flex-1 border-2 border-[#808080] bg-[#e1e1e1] p-0.5 text-xs" />
                    </div>
                </div>
            </div>

            {/* GRILLA DE ARTICULOS (Resultados) */}
            <div className="flex-1 bg-white border-2 border-[#808080] overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead className="bg-[#1a1a1a] text-white text-[10px] font-bold uppercase sticky top-0 z-10">
                            <tr className="divide-x divide-slate-600">
                                <th className="p-1 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="w-4 h-4 bg-white border border-[#808080] rounded-sm flex items-center justify-center">
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
                                <th className="p-1.5">ListaCodi</th>
                                <th className="p-1.5">Marca</th>
                                <th className="p-1.5">Rubro <input type="checkbox" className="ml-1" /></th>
                                <th className="p-1.5">Proveedor</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] divide-y divide-slate-200">
                            {filteredProducts.map(p => {
                                const changes = tempChanges[p.id] || {};
                                return (
                                    <tr key={p.id} className={`hover:bg-[#fff9c4] transition-colors divide-x divide-slate-100 ${selectedIds.has(p.id) ? 'bg-[#e3f2fd]' : ''}`}>
                                        <td className="p-1 text-center">
                                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectOne(p.id)} />
                                        </td>
                                        <td className="p-1 text-center">{changes.purchasePackageQuantity || p.purchasePackageQuantity || 1}</td>
                                        <td className="p-1 text-slate-400">---</td>
                                        <td className="p-1 font-bold text-blue-800">{p.internalCodes[0]}</td>
                                        <td className="p-1 font-bold uppercase truncate max-w-[250px]">{changes.name || p.name}</td>
                                        <td className="p-1 text-center font-bold text-slate-600">{p.stock}</td>
                                        <td className="p-1 text-center">
                                            {changes.reorderPoint !== undefined ? <span className="text-green-700 font-bold">{changes.reorderPoint}</span> : p.reorderPoint}
                                        </td>
                                        <td className="p-1 text-center">
                                            {changes.stockMaximo !== undefined ? <span className="text-green-700 font-bold">{changes.stockMaximo}</span> : p.stockMaximo}
                                        </td>
                                        <td className="p-1 text-slate-400">1</td>
                                        <td className={`p-1 uppercase ${changes.brand ? 'text-green-700 font-bold' : 'text-slate-500'}`}>
                                            {changes.brand || p.brand}
                                        </td>
                                        <td className={`p-1 uppercase ${changes.category ? 'text-green-700 font-bold' : 'text-slate-500'}`}>
                                            {changes.category || p.category}
                                        </td>
                                        <td className={`p-1 uppercase ${changes.provider ? 'text-green-700 font-bold' : 'text-slate-500'}`}>
                                            {changes.provider || p.provider}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BARRA DE ACCIÓN INFERIOR */}
            <div className="bg-[#d4d0c8] border-t-2 border-white p-2 flex justify-between items-center shrink-0">
                <button 
                    onClick={() => { if(confirm('¿Eliminar seleccionados del listado actual?')) setSelectedIds(new Set()); }}
                    className="flex items-center gap-1 bg-[#f0f0f0] border-2 border-white border-r-[#808080] border-b-[#808080] text-red-700 px-3 py-1 font-bold text-[10px] uppercase hover:bg-white shadow-sm"
                >
                    <Trash size={12}/> Eliminar productos seleccionados
                </button>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleSaveToDB} 
                        disabled={isApplying || Object.keys(tempChanges).length === 0}
                        className="bg-[#f0f0f0] border-2 border-white border-r-[#808080] border-b-[#808080] px-8 py-1.5 font-black text-xs uppercase flex items-center gap-2 hover:bg-white disabled:opacity-30 shadow-sm"
                    >
                        {isApplying ? <RefreshCw className="animate-spin" size={14}/> : <Save size={14}/>} Guardar
                    </button>
                    <button 
                        onClick={() => { setTempChanges({}); setSelectedIds(new Set()); }}
                        className="bg-[#f0f0f0] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1.5 font-bold text-xs uppercase hover:bg-white shadow-sm flex items-center gap-1"
                    >
                        <X size={14}/> Cancelar
                    </button>
                </div>
            </div>

            <style>{`
                input[type="checkbox"] {
                    accent-color: #4f46e5;
                }
                .shadow-inner {
                    box-shadow: inset 2px 2px 4px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default MassProductUpdate;
