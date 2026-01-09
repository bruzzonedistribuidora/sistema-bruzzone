
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
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-200 overflow-hidden font-sans">
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-300 shadow-xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={28}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none">Inventario Maestro</h2>
                    <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Base de Datos: 140.000 Artículos</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-300 shadow-inner">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'IMPORT' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Proveedores</button>
            </div>

            <button onClick={() => { setFormData({vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], purchaseCurrency: 'ARS', saleCurrency: 'ARS', measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', conversionFactor: 1, purchasePackageQuantity: 1}); setModalTab('GENERAL'); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-[1.8rem] font-black shadow-2xl flex items-center gap-3 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">
                <PlusCircle size={20} /> Nuevo Artículo
            </button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-lg border border-slate-300 p-3 shrink-0 flex gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="text" placeholder="Buscar por Nombre, SKU o Código de Barras..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all uppercase placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-300 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[11px] uppercase font-black text-slate-300 tracking-widest">
                                <tr>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">SKU / Barras</th>
                                    <th className="w-[35%] px-6 py-5 border-r border-slate-800">Descripción</th>
                                    <th className="w-[10%] px-6 py-5 text-center border-r border-slate-800">Unidad</th>
                                    <th className="w-[10%] px-6 py-5 text-center border-r border-slate-800">Stock</th>
                                    <th className="w-[15%] px-6 py-5 text-right border-r border-slate-800">Precio Final</th>
                                    <th className="w-[15%] px-6 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-black text-indigo-700 text-xs truncate">
                                            {p.internalCodes?.[0] || p.barcodes?.[0] || 'S/C'}
                                        </td>
                                        <td className="px-6 py-4 font-black uppercase text-slate-950 text-xs truncate">{p.name}</td>
                                        <td className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase">{p.measureUnitSale || 'UNIDAD'}</td>
                                        <td className={`px-6 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= 0 ? 'text-red-500' : 'text-slate-900'}`}>{p.stock}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-950 text-lg tracking-tighter bg-slate-50/50">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handlePedir(p)} className="p-3 text-emerald-700 bg-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-200"><Truck size={16}/></button>
                                                <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-3 text-indigo-700 bg-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-200"><Pen size={16}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) await productDB.delete(p.id); }} className="p-3 text-red-400 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"><Trash2 size={16}/></button>
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
      </div>

      {/* FICHA MAESTRA RESALTADA */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-slate-400">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <Package size={32} className="text-indigo-400"/>
                          <h3 className="text-2xl font-black uppercase tracking-tighter">{formData.id ? 'EDITANDO ARTÍCULO: ' + (formData.internalCodes?.[0] || '') : 'NUEVO ARTÍCULO MAESTRO'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full"><X size={32}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-2 shrink-0 border-b-2 border-slate-200">
                      {[
                          { id: 'GENERAL', label: 'Datos del Producto', icon: Info },
                          { id: 'PRICING', label: 'Costos y Venta', icon: DollarSign },
                          { id: 'STOCK', label: 'Inventario', icon: Database }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setModalTab(tab.id as any)}
                            className={`flex-1 py-4 px-6 flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-indigo-700 shadow-xl rounded-2xl border-2 border-indigo-100' : 'text-slate-500'}`}>
                              <tab.icon size={18}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="space-y-6">
                                  <label className="text-[12px] font-black uppercase text-slate-900 block mb-2 tracking-widest ml-2">Descripción Oficial del Artículo</label>
                                  <input className="w-full p-6 bg-white border-2 border-slate-300 rounded-[2rem] font-black text-2xl uppercase focus:border-indigo-600 shadow-inner" placeholder="EJ: MARTILLO DE GOMA 500GR..." value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-900 block mb-2">SKU (Interno)</label>
                                      <input className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl font-mono text-sm font-black uppercase" value={formData.internalCodes?.[0] || ''} onChange={e => setFormData({...formData, internalCodes: [e.target.value.toUpperCase()]})} />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-indigo-700 block mb-2">EAN (Barras)</label>
                                      <input className="w-full p-4 bg-indigo-50 border-2 border-indigo-300 rounded-2xl font-mono text-sm font-black text-indigo-900" value={formData.barcodes?.[0] || ''} onChange={e => setFormData({...formData, barcodes: [e.target.value]})} />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-900 block mb-2">Categoría</label>
                                      <select className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm font-black uppercase" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                          <option value="">SIN CATEGORÍA</option>
                                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-900 block mb-2">Marca</label>
                                      <select className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm font-black uppercase" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                          <option value="">GENÉRICA</option>
                                          {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                  <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-200">
                                      <h4 className="text-sm font-black uppercase text-indigo-700 border-b-2 border-indigo-100 pb-4 flex items-center gap-3"><Calculator size={20}/> Costos</h4>
                                      <div>
                                          <label className="text-[11px] font-black text-slate-900 uppercase block mb-3 ml-2">Costo Lista Proveedor (Sin IVA)</label>
                                          <div className="relative">
                                              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
                                              <input type="number" className="w-full pl-14 p-6 bg-white border-2 border-slate-300 rounded-[2.5rem] font-black text-5xl text-slate-900 outline-none focus:border-indigo-600" value={formData.listCost || 0} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} />
                                          </div>
                                      </div>
                                      <div className="space-y-4">
                                          <label className="text-[10px] font-black text-slate-600 uppercase block ml-2">Descuentos en Cadena (%)</label>
                                          <div className="grid grid-cols-4 gap-4">
                                              {[0, 1, 2, 3].map(idx => (
                                                  <input key={idx} type="number" className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl text-center font-black text-lg focus:border-indigo-600" value={formData.discounts?.[idx] || 0} onChange={e => {
                                                      const newD = [...(formData.discounts || [0,0,0,0])];
                                                      newD[idx] = parseFloat(e.target.value) || 0;
                                                      updatePricing({discounts: newD});
                                                  }} />
                                              ))}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-8 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><TrendingUp size={200}/></div>
                                      <div className="relative z-10 space-y-8">
                                          <h4 className="text-sm font-black uppercase text-indigo-400 border-b border-white/10 pb-4 flex items-center gap-3"><Zap size={20}/> Salida de Venta</h4>
                                          <div className="grid grid-cols-2 gap-8">
                                              <div>
                                                  <label className="text-[10px] font-black text-indigo-300 uppercase block mb-3 ml-2">Utilidad (%)</label>
                                                  <input type="number" className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-[2rem] font-black text-4xl text-indigo-400 outline-none focus:border-indigo-500" value={formData.profitMargin || 30} onChange={e => updatePricing({profitMargin: parseFloat(e.target.value) || 0})} />
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-black text-indigo-300 uppercase block mb-3 ml-2">Alícuota IVA</label>
                                                  <select className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-[2rem] font-black text-2xl outline-none" value={formData.vatRate || 21} onChange={e => updatePricing({vatRate: parseFloat(e.target.value) || 0})}>
                                                      <option value={21} className="text-slate-900">21.0 %</option>
                                                      <option value={10.5} className="text-slate-900">10.5 %</option>
                                                      <option value={0} className="text-slate-900">Exento</option>
                                                  </select>
                                              </div>
                                          </div>
                                          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-center shadow-xl border-4 border-indigo-400/50">
                                              <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em] mb-3">Precio Público Sugerido</p>
                                              <h3 className="text-7xl font-black tracking-tighter text-white">${formData.priceFinal?.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 border-t-4 border-slate-200 bg-white flex justify-end gap-6 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-500 font-black text-sm uppercase tracking-widest hover:text-red-600 transition-colors">Cerrar</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-950 text-white px-20 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl flex items-center gap-4 hover:bg-indigo-700 active:scale-95 transition-all">
                          {isSaving ? <RefreshCw className="animate-spin" size={24}/> : <Save size={24}/>} Guardar Ficha Maestra
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
