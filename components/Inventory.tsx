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
          
          // Cálculo de Costo Unitario considerando el factor de conversión
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
    <div className="p-3 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden font-sans">
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-indigo-400 rounded-xl"><Boxes size={20}/></div>
                <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Inventario Maestro</h2>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">Base de 140.000 Artículos</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PROVIDERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Proveedores</button>
                <button onClick={() => setInventoryTab('BRANDS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Marcas</button>
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setFormData({vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], purchaseCurrency: 'ARS', saleCurrency: 'ARS', measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', conversionFactor: 1, purchasePackageQuantity: 1}); setModalTab('GENERAL'); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black shadow-lg flex items-center gap-2 hover:bg-indigo-600 transition-all uppercase text-[9px] tracking-widest">
                    <Plus size={14} /> Nuevo Artículo
                </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-2 animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 shrink-0 flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input type="text" placeholder="Buscar por Nombre, SKU o Código de Barras..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[8px] uppercase font-black text-slate-300 tracking-wider">
                                <tr>
                                    <th className="w-[12%] px-4 py-3 cursor-pointer" onClick={() => requestSort('internalCodes')}>SKU / Barras</th>
                                    <th className="w-[35%] px-4 py-3 cursor-pointer" onClick={() => requestSort('name')}>Descripción</th>
                                    <th className="w-[10%] px-4 py-3 text-center">Unidad</th>
                                    <th className="w-[10%] px-4 py-3 text-center">Stock</th>
                                    <th className="w-[13%] px-4 py-3 text-right">PVP Final</th>
                                    <th className="w-[20%] px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors text-[10px]">
                                        <td className="px-4 py-2 font-mono font-bold text-indigo-600 truncate">
                                            {p.internalCodes?.[0] || p.barcodes?.[0] || 'S/C'}
                                        </td>
                                        <td className="px-4 py-2 font-black uppercase text-slate-700 truncate">{p.name}</td>
                                        <td className="px-4 py-2 text-center text-[9px] font-bold text-slate-400 uppercase">{p.measureUnitSale || 'UNIDAD'}</td>
                                        <td className="px-4 py-2 text-center font-bold">{p.stock}</td>
                                        <td className="px-4 py-2 text-right font-black text-slate-900">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => handlePedir(p)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Pedir Reposición"><Truck size={12}/></button>
                                                <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Pen size={12}/></button>
                                                <button onClick={() => alert('Imprimiendo etiquetas...')} className="p-1.5 text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Barcode size={12}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) await productDB.delete(p.id); }} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12}/></button>
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
            <div className="bg-white rounded-2xl border p-4 h-full overflow-y-auto custom-scrollbar animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {brands.map(b => (
                        <div key={b.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center group">
                            <span className="text-[10px] font-black uppercase truncate">{b.name}</span>
                            <button onClick={() => setBrands(brands.filter(x => x.id !== b.id))} className="text-slate-200 group-hover:text-red-500 transition-colors"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* MODAL FICHA MAESTRA COMPLETA */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <Package size={22} className="text-indigo-400"/>
                          <h3 className="text-xs font-black uppercase tracking-widest">{formData.id ? 'Ficha Maestra: ' + (formData.internalCodes?.[0] || 'S/D') : 'Alta de Nuevo Artículo'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-1 shrink-0 overflow-x-auto no-scrollbar">
                      {[
                          { id: 'GENERAL', label: 'Identificación y Unidad', icon: Info },
                          { id: 'PRICING', label: 'Costos y Precios', icon: DollarSign },
                          { id: 'STOCK', label: 'Stock y Unidades', icon: Database },
                          { id: 'TECHNICAL', label: 'Digital / Web', icon: Globe }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setModalTab(tab.id as any)}
                            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-indigo-600 shadow-sm rounded-xl' : 'text-slate-400'}`}>
                              <tab.icon size={14}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                                  <div>
                                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Descripción del Artículo</label>
                                      <input className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs uppercase" placeholder="EJ: MARTILLO BOLITA 500GR..." value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Código Interno (SKU)</label>
                                          <input className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-[11px] font-bold uppercase" placeholder="Opcional" value={formData.internalCodes?.[0] || ''} onChange={e => setFormData({...formData, internalCodes: [e.target.value.toUpperCase()]})} />
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-indigo-400 block mb-1">Código de Barras (EAN)</label>
                                          <input className="w-full p-2.5 bg-indigo-50 border-2 border-indigo-100 rounded-xl font-mono text-[11px] font-bold" value={formData.barcodes?.[0] || ''} onChange={e => setFormData({...formData, barcodes: [e.target.value]})} />
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Rubro / Categoría</label>
                                          <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                              <option value="">SIN CATEGORÍA</option>
                                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Marca</label>
                                          <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                              <option value="">GENÉRICA</option>
                                              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-indigo-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Scale size={140}/></div>
                                  <div className="relative z-10 space-y-6">
                                      <h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Scaling size={22} className="text-indigo-400"/> Unidad de Medida y Venta</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                          <div>
                                              <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2">Unidad de Compra</label>
                                              <select className="w-full p-3 bg-white/10 border border-white/10 rounded-xl font-bold uppercase text-xs outline-none" value={formData.measureUnitPurchase || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitPurchase: e.target.value})}>
                                                  <option value="UNIDAD" className="text-slate-900">Unidad / Pieza</option>
                                                  <option value="CAJA" className="text-slate-900">Caja / Bulto</option>
                                                  <option value="BOLSA" className="text-slate-900">Bolsa / Bolsa</option>
                                                  <option value="METRO" className="text-slate-900">Metro Lineal</option>
                                                  <option value="KG" className="text-slate-900">Kilogramo</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2">Unidad de Venta (Mostrador)</label>
                                              <select className="w-full p-3 bg-white border border-transparent rounded-xl font-black uppercase text-xs text-slate-900 shadow-xl" value={formData.measureUnitSale || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitSale: e.target.value})}>
                                                  <option value="UNIDAD">Por Unidad</option>
                                                  <option value="METRO">Por Metro</option>
                                                  <option value="FRACCION">Por Fracción</option>
                                                  <option value="PACK">Por Pack / Caja</option>
                                              </select>
                                          </div>
                                          <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/30">
                                              <label className="text-[9px] font-black text-white uppercase tracking-widest block mb-2">Factor Multiplicador</label>
                                              <div className="flex items-center gap-3">
                                                  <input type="number" step="0.001" className="w-full p-2 bg-white rounded-lg font-black text-slate-900 outline-none" value={formData.conversionFactor || 1} onChange={e => updatePricing({conversionFactor: parseFloat(e.target.value) || 1})} />
                                                  {/* Wrap Icon with span to support title attribute which is not on LucideProps */}
                                                  <span title="Factor por el cual se multiplica el costo de compra para obtener el costo de venta. Ejemplo: Compras caja de 100 y vendes x1, factor 0.01">
                                                      <Info size={20} className="text-indigo-400 shrink-0" />
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8">
                                  <div className="md:col-span-5 space-y-6">
                                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2 flex items-center gap-2"><Calculator size={14}/> Estructura de Costos</h4>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 block mb-2">Costo Lista (Proveedor)</label>
                                          <div className="relative">
                                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                              <input type="number" className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-2xl text-slate-900 focus:bg-white focus:border-indigo-100 outline-none" value={formData.listCost || 0} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} />
                                          </div>
                                      </div>
                                      <div className="space-y-3">
                                          <label className="text-[9px] font-black text-slate-400 block ml-1">Bonificaciones en Cadena (%)</label>
                                          <div className="grid grid-cols-4 gap-2">
                                              {[0, 1, 2, 3].map(idx => (
                                                  <div key={idx}>
                                                      <input type="number" className="w-full p-2 bg-slate-50 border rounded-xl text-center font-black text-xs" value={formData.discounts?.[idx] || 0} onChange={e => {
                                                          const newD = [...(formData.discounts || [0,0,0,0])];
                                                          newD[idx] = parseFloat(e.target.value) || 0;
                                                          updatePricing({discounts: newD});
                                                      }} />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center">
                                          <span className="text-[9px] font-black text-slate-400 uppercase">Costo Final Unitario de Venta</span>
                                          <span className="font-black text-indigo-600">${((formData.listCost || 0) * (formData.discounts?.reduce((acc,d) => acc * (1 - d/100), 1) || 1) * (formData.conversionFactor || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                  </div>
                                  <div className="md:col-span-2 flex flex-col justify-center items-center">
                                      <ArrowRight size={24} className="text-slate-200"/>
                                  </div>
                                  <div className="md:col-span-5 space-y-6">
                                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2 flex items-center gap-2"><TrendingUp size={14}/> Política de Venta</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[8px] font-black text-slate-400 block mb-1">Utilidad (%)</label>
                                              <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xl text-indigo-600" value={formData.profitMargin || 30} onChange={e => updatePricing({profitMargin: parseFloat(e.target.value) || 0})} />
                                          </div>
                                          <div>
                                              <label className="text-[8px] font-black text-slate-400 block mb-1">IVA (%)</label>
                                              <select className="w-full p-3 bg-slate-50 border rounded-xl font-black text-lg" value={formData.vatRate || 21} onChange={e => updatePricing({vatRate: parseFloat(e.target.value) || 0})}>
                                                  <option value={21}>21%</option><option value={10.5}>10.5%</option><option value={0}>Exento</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Precio Final Mostrador</p>
                                          <h3 className="text-4xl font-black tracking-tighter text-white">${formData.priceFinal?.toLocaleString() || '0'}</h3>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'STOCK' && (
                          <div className="space-y-6 animate-fade-in">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Store size={14}/> Mostrador</h4>
                                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-3xl text-center outline-none focus:bg-white focus:border-indigo-500" value={formData.stockPrincipal || 0} onChange={e => setFormData({...formData, stockPrincipal: parseFloat(e.target.value) || 0})} />
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Building2 size={14}/> Depósito</h4>
                                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-3xl text-center outline-none focus:bg-white focus:border-emerald-500" value={formData.stockDeposito || 0} onChange={e => setFormData({...formData, stockDeposito: parseFloat(e.target.value) || 0})} />
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><ArrowRight size={14}/> Punto de Pedido</h4>
                                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-3xl text-center outline-none focus:bg-white focus:border-orange-500" value={formData.reorderPoint || 0} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                    </div>
                               </div>
                          </div>
                      )}

                      {modalTab === 'TECHNICAL' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                                  <div className="flex items-center gap-4 border-b pb-6">
                                      <div onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce || {}), webPropia: !formData.ecommerce?.webPropia}})} className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${formData.ecommerce?.webPropia ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.ecommerce?.webPropia ? 'right-1' : 'left-1'}`}></div>
                                      </div>
                                      <div>
                                          <h4 className="text-sm font-black uppercase tracking-tight">Publicar en Mi Tienda Online</h4>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronización automática con la web propia</p>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="space-y-4">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Imagen del Producto (URL o Carga)</label>
                                          <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center group hover:border-indigo-400 transition-all cursor-pointer relative overflow-hidden">
                                              {formData.ecommerce?.imageUrl ? (
                                                  <img src={formData.ecommerce.imageUrl} className="w-full h-full object-cover" />
                                              ) : (
                                                  <><Upload size={24} className="text-slate-300 group-hover:text-indigo-400"/><span className="text-[10px] font-black text-slate-300 uppercase mt-2">Cargar Fotografía</span></>
                                              )}
                                          </div>
                                          <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" placeholder="URL de la imagen..." value={formData.ecommerce?.imageUrl || ''} onChange={e => setFormData({...formData, ecommerce: {...(formData.ecommerce || {}), imageUrl: e.target.value}})} />
                                      </div>
                                      <div className="space-y-6">
                                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border">
                                              <div onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce || {}), isOffer: !formData.ecommerce?.isOffer}})} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.ecommerce?.isOffer ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.ecommerce?.isOffer ? 'right-1' : 'left-1'}`}></div>
                                              </div>
                                              <span className="text-[10px] font-black uppercase text-slate-700">Producto en Oferta</span>
                                          </div>
                                          {formData.ecommerce?.isOffer && (
                                              <div>
                                                  <label className="text-[9px] font-black text-orange-600 uppercase tracking-widest ml-2 block mb-2">Precio de Oferta Especial ($)</label>
                                                  <input type="number" className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl font-black text-2xl text-orange-600 outline-none" value={formData.ecommerce?.offerPrice || 0} onChange={e => setFormData({...formData, ecommerce: {...(formData.ecommerce || {}), offerPrice: parseFloat(e.target.value) || 0}})} />
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t bg-white flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-900 text-white px-12 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                          {isSaving ? <RefreshCw className="animate-spin" size={14}/> : <Save size={14}/>} Guardar Artículo
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
