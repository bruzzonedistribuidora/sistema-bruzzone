
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2, Upload, Ruler, Building2, Store, Globe, ArrowRight, TrendingUp,
    Scale, Boxes as BoxesIcon
} from 'lucide-react';
import { Product, Provider, Brand, Category, ViewState } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import Providers from './Providers';
import InitialImport from './InitialImport';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

  const loadProducts = async () => {
      if (searchTerm.trim().length > 2) {
          const results = await productDB.search(searchTerm);
          setProducts(results);
      } else {
          const initial = await productDB.getAll(100);
          setProducts(initial);
      }
  };

  useEffect(() => {
    loadProducts();
    const handleSync = () => loadProducts();
    window.addEventListener('ferrecloud_products_updated', handleSync);
    return () => window.removeEventListener('ferrecloud_products_updated', handleSync);
  }, [searchTerm]);

  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Product] || '';
        let bValue = b[sortConfig.key as keyof Product] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [products, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = (sortConfig.key === key && sortConfig.direction === 'asc') ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handlePedir = (p: Product) => {
      if (addToReplenishmentQueue(p)) {
          alert(`Articulo ${p.name} enviado a la cola de pedidos.`);
      }
  };

  const updatePricing = (updates: Partial<Product>) => {
      setFormData(prev => {
          const next = { ...prev, ...updates };
          const listCost = next.listCost || 0;
          const ds = next.discounts || [0, 0, 0, 0];
          const coef = ds.reduce((acc, d) => acc * (1 - (d / 100)), 1);
          
          const factor = next.conversionFactor || 1;
          const unitCostBase = (listCost * coef) * factor;
          
          const margin = next.profitMargin || 30;
          const priceNeto = unitCostBase * (1 + (margin / 100));
          const vat = next.vatRate || 21;
          const priceFinal = priceNeto * (1 + (vat / 100));

          return {
              ...next,
              costAfterDiscounts: parseFloat((listCost * coef).toFixed(4)),
              priceNeto: parseFloat(priceNeto.toFixed(2)),
              priceFinal: parseFloat(priceFinal.toFixed(2))
          };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name) return;
      
      setIsSaving(true);
      try {
          let internalCode = formData.internalCodes?.[0];
          const barcode = formData.barcodes?.[0];

          if (!internalCode && barcode) {
              internalCode = barcode;
          } else if (!internalCode && !barcode) {
              internalCode = `AUTO-${Date.now().toString().slice(-6)}`;
          }

          const productToSave: Product = {
              ...formData,
              id: formData.id || `PROD-${internalCode}-${Date.now()}`,
              name: formData.name.toUpperCase(),
              internalCodes: [internalCode!],
              barcodes: formData.barcodes || [],
              providerCodes: formData.providerCodes || [],
              purchasePackageQuantity: formData.purchasePackageQuantity || 1,
              conversionFactor: formData.conversionFactor || 1,
              stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0),
              ecommerce: formData.ecommerce || { isPublished: false }
          } as Product;

          await productDB.save(productToSave);
          setIsModalOpen(false);
          setFormData({});
          await loadProducts();
      } catch (err) {
          alert("Error al guardar el artículo");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="p-3 h-full flex flex-col space-y-3 bg-slate-200 overflow-hidden font-sans">
      <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-md shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-indigo-400 rounded-xl"><Boxes size={24}/></div>
                <div>
                    <h2 className="text-lg font-black text-slate-950 uppercase tracking-tighter leading-none">Inventario Maestro</h2>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-1">Base de 140.000 Artículos</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-300">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Proveedores</button>
                <button onClick={() => setInventoryTab('BRANDS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Marcas</button>
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setFormData({vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], purchaseCurrency: 'ARS', saleCurrency: 'ARS', measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', conversionFactor: 1, purchasePackageQuantity: 1}); setModalTab('GENERAL'); setIsModalOpen(true); }} className="bg-slate-950 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">
                    <Plus size={18} /> Nuevo Artículo
                </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-2 animate-fade-in">
                <div className="bg-white rounded-xl shadow-md border border-slate-300 p-2 shrink-0 flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar por Nombre, SKU o Código de Barras..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-black outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all uppercase placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-300 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[10px] uppercase font-black text-slate-100 tracking-wider">
                                <tr>
                                    <th className="w-[12%] px-4 py-4 cursor-pointer border-r border-slate-800" onClick={() => requestSort('internalCodes')}>SKU / Barras</th>
                                    <th className="w-[35%] px-4 py-4 cursor-pointer border-r border-slate-800" onClick={() => requestSort('name')}>Descripción</th>
                                    <th className="w-[10%] px-4 py-4 text-center border-r border-slate-800">Unidad</th>
                                    <th className="w-[10%] px-4 py-4 text-center border-r border-slate-800">Stock</th>
                                    <th className="w-[13%] px-4 py-4 text-right border-r border-slate-800">PVP Final</th>
                                    <th className="w-[20%] px-4 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-indigo-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-black text-indigo-700 truncate border-r border-slate-100 text-xs">
                                            {p.internalCodes?.[0] || p.barcodes?.[0] || 'S/C'}
                                        </td>
                                        <td className="px-4 py-3 font-black uppercase text-slate-950 truncate border-r border-slate-100 text-xs">{p.name}</td>
                                        <td className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase border-r border-slate-100">{p.measureUnitSale || 'UNIDAD'}</td>
                                        <td className="px-4 py-3 text-center font-black text-slate-900 border-r border-slate-100 text-sm">{p.stock}</td>
                                        <td className="px-4 py-3 text-right font-black text-slate-950 border-r border-slate-100 text-sm bg-slate-50/50">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => handlePedir(p)} className="p-2 text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-200" title="Pedir Reposición"><Truck size={14}/></button>
                                                <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-2 text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-200"><Pen size={14}/></button>
                                                <button onClick={() => alert('Imprimiendo etiquetas...')} className="p-2 text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-300"><Barcode size={14}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) await productDB.delete(p.id); }} className="p-2 text-red-600 bg-red-100 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
        {inventoryTab === 'IMPORT' && <InitialImport onComplete={() => setInventoryTab('PRODUCTS')} />}
        {inventoryTab === 'PROVIDERS' && <Providers />}
        {inventoryTab === 'BRANDS' && (
            <div className="bg-white rounded-2xl border border-slate-300 p-4 h-full overflow-y-auto custom-scrollbar animate-fade-in shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {brands.map(b => (
                        <div key={b.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex justify-between items-center group hover:border-indigo-400 transition-all">
                            <span className="text-[11px] font-black uppercase truncate text-slate-900">{b.name}</span>
                            <button onClick={() => setBrands(brands.filter(x => x.id !== b.id))} className="text-slate-300 group-hover:text-red-600 transition-colors"><X size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* MODAL FICHA MAESTRA COMPLETA */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-400">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <Package size={28} className="text-indigo-400"/>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest">{formData.id ? 'Ficha Maestra: ' + (formData.internalCodes?.[0] || 'S/D') : 'Alta de Nuevo Artículo'}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Módulo de gestión de inventario crítico</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full"><X size={28}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-2 shrink-0 border-b border-slate-300">
                      {[
                          { id: 'GENERAL', label: 'Identificación', icon: Info },
                          { id: 'PRICING', label: 'Costos y Precios', icon: DollarSign },
                          { id: 'STOCK', label: 'Stock y Unidades', icon: Database },
                          { id: 'TECHNICAL', label: 'Digital / Web', icon: Globe }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setModalTab(tab.id as any)}
                            className={`flex-1 py-4 px-4 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-indigo-700 shadow-md rounded-2xl border-2 border-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}>
                              <tab.icon size={18}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50">
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-8 animate-fade-in">
                              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-6">
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-950 block mb-2 tracking-widest">Descripción del Artículo (Ficha Oficial)</label>
                                      <input className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-black text-base uppercase focus:border-indigo-600 shadow-inner" placeholder="EJ: MARTILLO BOLITA 500GR CABO FIBRA..." value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                      <div>
                                          <label className="text-[9px] font-black uppercase text-slate-600 block mb-2">Código Interno (SKU)</label>
                                          <input className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono text-sm font-black uppercase" placeholder="AUTO-GEN" value={formData.internalCodes?.[0] || ''} onChange={e => setFormData({...formData, internalCodes: [e.target.value.toUpperCase()]})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black uppercase text-indigo-700 block mb-2">Código de Barras (EAN)</label>
                                          <input className="w-full p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl font-mono text-sm font-black text-indigo-900" value={formData.barcodes?.[0] || ''} onChange={e => setFormData({...formData, barcodes: [e.target.value]})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black uppercase text-slate-600 block mb-2">Rubro / Categoría</label>
                                          <select className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-black uppercase" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                              <option value="">SIN CATEGORÍA</option>
                                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black uppercase text-slate-600 block mb-2">Marca</label>
                                          <select className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-black uppercase" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                              <option value="">GENÉRICA</option>
                                              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Scale size={160}/></div>
                                  <div className="relative z-10 space-y-8">
                                      <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4"><Scaling size={28} className="text-indigo-400"/> Unidades y Conversión</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                          <div>
                                              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-3">Unidad de Compra (Proveedor)</label>
                                              <select className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl font-black uppercase text-sm outline-none focus:border-indigo-400" value={formData.measureUnitPurchase || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitPurchase: e.target.value})}>
                                                  <option value="UNIDAD" className="text-slate-900">Unidad / Pieza</option>
                                                  <option value="CAJA" className="text-slate-900">Caja / Bulto</option>
                                                  <option value="BOLSA" className="text-slate-900">Bolsa / Bolsa</option>
                                                  <option value="METRO" className="text-slate-900">Metro Lineal</option>
                                                  <option value="KG" className="text-slate-900">Kilogramo</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-3">Unidad de Venta (Mostrador)</label>
                                              <select className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black uppercase text-sm text-slate-950 shadow-xl" value={formData.measureUnitSale || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitSale: e.target.value})}>
                                                  <option value="UNIDAD">Por Unidad</option>
                                                  <option value="METRO">Por Metro</option>
                                                  <option value="FRACCION">Por Fracción</option>
                                                  <option value="PACK">Por Pack / Caja</option>
                                              </select>
                                          </div>
                                          <div className="bg-indigo-600/30 p-6 rounded-[2rem] border-2 border-indigo-400/50">
                                              <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] block mb-3">Factor de Conversión</label>
                                              <div className="flex items-center gap-4">
                                                  <input type="number" step="0.001" className="w-full p-4 bg-white rounded-2xl font-black text-slate-950 text-xl outline-none shadow-inner" value={formData.conversionFactor || 1} onChange={e => updatePricing({conversionFactor: parseFloat(e.target.value) || 1})} />
                                                  <span title="Si compras Caja x100 y vendes x1 unidad, el factor es 0.01">
                                                      <Info size={28} className="text-indigo-300 shrink-0 cursor-help" />
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="space-y-8 animate-fade-in">
                              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-12">
                                  <div className="md:col-span-6 space-y-8">
                                      <h4 className="text-xs font-black uppercase text-indigo-700 border-b-2 border-indigo-50 pb-3 flex items-center gap-3"><Calculator size={18}/> Costos de Origen</h4>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest block mb-3 ml-2">Costo Lista Bruto (Sin IVA)</label>
                                          <div className="relative group">
                                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={24}/>
                                              <input type="number" className="w-full pl-12 p-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] font-black text-4xl text-slate-950 focus:bg-white focus:border-indigo-600 outline-none shadow-inner transition-all" value={formData.listCost || 0} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} />
                                          </div>
                                      </div>
                                      <div className="space-y-4">
                                          <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest block ml-2">Cadena de Descuentos (%)</label>
                                          <div className="grid grid-cols-4 gap-3">
                                              {[0, 1, 2, 3].map(idx => (
                                                  <div key={idx} className="relative">
                                                      <input type="number" className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl text-center font-black text-lg focus:border-indigo-600" value={formData.discounts?.[idx] || 0} onChange={e => {
                                                          const newD = [...(formData.discounts || [0,0,0,0])];
                                                          newD[idx] = parseFloat(e.target.value) || 0;
                                                          updatePricing({discounts: newD});
                                                      }} />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex justify-between items-center shadow-inner">
                                          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Costo Neto x Venta</span>
                                          <span className="font-black text-3xl text-indigo-700 font-mono">${((formData.listCost || 0) * (formData.discounts?.reduce((acc,d) => acc * (1 - d/100), 1) || 1) * (formData.conversionFactor || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                  </div>
                                  
                                  <div className="md:col-span-6 space-y-8 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
                                      <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-white/10 pb-3 flex items-center gap-3"><TrendingUp size={18}/> Salida a Venta</h4>
                                      <div className="grid grid-cols-2 gap-6">
                                          <div>
                                              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-2 ml-2">Utilidad (%)</label>
                                              <input type="number" className="w-full p-5 bg-white/5 border-2 border-white/20 rounded-3xl font-black text-3xl text-indigo-400 outline-none focus:border-indigo-500 focus:bg-white/10" value={formData.profitMargin || 30} onChange={e => updatePricing({profitMargin: parseFloat(e.target.value) || 0})} />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-2 ml-2">Alícuota IVA</label>
                                              <select className="w-full p-5 bg-white/5 border-2 border-white/20 rounded-3xl font-black text-2xl outline-none focus:border-indigo-500" value={formData.vatRate || 21} onChange={e => updatePricing({vatRate: parseFloat(e.target.value) || 0})}>
                                                  <option value={21} className="text-slate-900">21.0%</option>
                                                  <option value={10.5} className="text-slate-900">10.5%</option>
                                                  <option value={27} className="text-slate-900">27.0%</option>
                                                  <option value={0} className="text-slate-900">Exento</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl ring-8 ring-indigo-600/20 text-center">
                                          <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em] mb-3">Precio Sugerido Mostrador</p>
                                          <h3 className="text-6xl font-black tracking-tighter text-white">${formData.priceFinal?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0'}</h3>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'STOCK' && (
                          <div className="space-y-8 animate-fade-in">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-6">
                                        <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b-2 border-indigo-50 pb-3 flex items-center gap-3"><Store size={18} className="text-indigo-600"/> Mostrador</h4>
                                        <input type="number" className="w-full p-6 bg-slate-50 border-2 border-slate-300 rounded-[2rem] font-black text-5xl text-center outline-none focus:bg-white focus:border-indigo-600" value={formData.stockPrincipal || 0} onChange={e => setFormData({...formData, stockPrincipal: parseFloat(e.target.value) || 0})} />
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm space-y-6">
                                        <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b-2 border-emerald-50 pb-3 flex items-center gap-3"><Building2 size={18} className="text-emerald-600"/> Depósito</h4>
                                        <input type="number" className="w-full p-6 bg-slate-50 border-2 border-slate-300 rounded-[2rem] font-black text-5xl text-center outline-none focus:bg-white focus:border-emerald-600" value={formData.stockDeposito || 0} onChange={e => setFormData({...formData, stockDeposito: parseFloat(e.target.value) || 0})} />
                                    </div>
                                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
                                        <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-3"><ArrowRight size={18}/> Pto. Pedido</h4>
                                        <input type="number" className="w-full p-6 bg-white/5 border-2 border-white/20 rounded-[2rem] font-black text-5xl text-center outline-none focus:border-orange-500" value={formData.reorderPoint || 0} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                    </div>
                               </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 border-t border-slate-300 bg-white flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-950 text-white px-16 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                          {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>} Guardar Ficha Maestra
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
