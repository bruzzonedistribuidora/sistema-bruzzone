
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2, Upload, Ruler, Building2, Store,
    // Add missing icons
    Globe, ArrowRight, TrendingUp
} from 'lucide-react';
import { Product, Provider, Brand, Category } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import Providers from './Providers';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  
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

  const updatePricing = (updates: Partial<Product>) => {
      setFormData(prev => {
          const next = { ...prev, ...updates };
          const listCost = next.listCost || 0;
          const ds = next.discounts || [0, 0, 0, 0];
          const coef = ds.reduce((acc, d) => acc * (1 - (d / 100)), 1);
          const costAfterDiscounts = listCost * coef;
          const margin = next.profitMargin || 30;
          const priceNeto = costAfterDiscounts * (1 + (margin / 100));
          const vat = next.vatRate || 21;
          const priceFinal = priceNeto * (1 + (vat / 100));

          return {
              ...next,
              costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(4)),
              priceNeto: parseFloat(priceNeto.toFixed(2)),
              priceFinal: parseFloat(priceFinal.toFixed(2))
          };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name) {
          alert("La descripción es obligatoria");
          return;
      }
      setIsSaving(true);
      try {
          const productToSave: Product = {
              id: formData.id || `PROD-${Date.now()}`,
              internalCodes: formData.internalCodes || ['S/C'],
              barcodes: formData.barcodes || [],
              providerCodes: formData.providerCodes || [],
              name: formData.name.toUpperCase(),
              brand: formData.brand || 'GENÉRICO',
              category: formData.category || 'GENERAL',
              provider: formData.provider || '',
              description: formData.description || '',
              listCost: formData.listCost || 0,
              costAfterDiscounts: formData.costAfterDiscounts || 0,
              discounts: formData.discounts || [0, 0, 0, 0],
              profitMargin: formData.profitMargin || 30,
              priceNeto: formData.priceNeto || 0,
              priceFinal: formData.priceFinal || 0,
              vatRate: formData.vatRate || 21,
              stockPrincipal: formData.stockPrincipal || 0,
              stockDeposito: formData.stockDeposito || 0,
              stockSucursal: formData.stockSucursal || 0,
              stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0),
              stockMinimo: formData.stockMinimo || 0,
              stockMaximo: formData.stockMaximo || 0,
              reorderPoint: formData.reorderPoint || 0,
              measureUnitPurchase: formData.measureUnitPurchase || 'UNIDAD',
              measureUnitSale: formData.measureUnitSale || 'UNIDAD',
              conversionFactor: formData.conversionFactor || 1,
              purchaseCurrency: formData.purchaseCurrency || 'ARS',
              saleCurrency: formData.saleCurrency || 'ARS',
              isCombo: formData.isCombo || false,
              comboItems: formData.comboItems || [],
              stockDetails: formData.stockDetails || [],
              location: formData.location || '',
              ecommerce: formData.ecommerce || { isPublished: false }
          } as Product;

          await productDB.save(productToSave);
          setIsModalOpen(false);
          setFormData({});
          await loadProducts();
      } catch (err) {
          console.error(err);
          alert("Error al guardar el artículo");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="p-3 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden font-sans">
      {/* HEADER PRINCIPAL */}
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
                <button onClick={() => setInventoryTab('BRANDS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Marcas</button>
                <button onClick={() => setInventoryTab('CATEGORIES')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'CATEGORIES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Rubros</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PROVIDERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Proveedores</button>
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setFormData({vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], purchaseCurrency: 'ARS', saleCurrency: 'ARS', measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', conversionFactor: 1}); setModalTab('GENERAL'); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black shadow-lg flex items-center gap-2 hover:bg-indigo-600 transition-all uppercase text-[9px] tracking-widest">
                    <Plus size={14} /> Alta Artículo
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
                        <input type="text" placeholder="Buscar por Nombre o SKU..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[8px] uppercase font-black text-slate-300 tracking-wider">
                                <tr>
                                    <th className="w-[15%] px-4 py-3 cursor-pointer" onClick={() => requestSort('internalCodes')}>SKU</th>
                                    <th className="w-[40%] px-4 py-3 cursor-pointer" onClick={() => requestSort('name')}>Descripción</th>
                                    <th className="w-[12%] px-4 py-3 text-center">Stock</th>
                                    <th className="w-[15%] px-4 py-3 text-right">PVP Final</th>
                                    <th className="w-[18%] px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors text-[10px]">
                                        <td className="px-4 py-2 font-mono font-bold text-indigo-600 truncate">{p.internalCodes?.[0]}</td>
                                        <td className="px-4 py-2 font-black uppercase text-slate-700 truncate">{p.name}</td>
                                        <td className="px-4 py-2 text-center font-bold">{p.stock}</td>
                                        <td className="px-4 py-2 text-right font-black text-slate-900">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Pen size={12}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) await productDB.delete(p.id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12}/></button>
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
        {inventoryTab === 'BRANDS' && (
            <div className="bg-white rounded-2xl border p-4 h-full overflow-y-auto custom-scrollbar animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {brands.map(b => (
                        <div key={b.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center group">
                            <span className="text-[10px] font-black uppercase truncate">{b.name}</span>
                            <button onClick={() => setBrands(brands.filter(x => x.id !== b.id))} className="text-slate-200 group-hover:text-red-500"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {inventoryTab === 'CATEGORIES' && (
            <div className="bg-white rounded-2xl border p-4 h-full overflow-y-auto custom-scrollbar animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categories.map(c => (
                        <div key={c.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center group">
                            <span className="text-[10px] font-black uppercase truncate">{c.name}</span>
                            <button onClick={() => setCategories(categories.filter(x => x.id !== c.id))} className="text-slate-200 group-hover:text-red-500"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>

      {/* MODAL MAESTRO DE ARTÍCULO */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <Package size={22} className="text-indigo-400"/>
                          <h3 className="text-xs font-black uppercase tracking-widest">{formData.id ? 'Ficha Maestra: ' + formData.internalCodes?.[0] : 'Alta de Nuevo Artículo'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-1 shrink-0 overflow-x-auto no-scrollbar">
                      {[
                          { id: 'GENERAL', label: 'General / Identificación', icon: Info },
                          { id: 'PRICING', label: 'Costos y Precios', icon: DollarSign },
                          { id: 'STOCK', label: 'Stock y Ubicaciones', icon: Database },
                          { id: 'TECHNICAL', label: 'Digital / E-commerce', icon: Globe }
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
                      
                      {/* PESTAÑA: GENERAL */}
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                                  <div>
                                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Descripción Comercial del Artículo</label>
                                      <input className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs uppercase focus:bg-white focus:border-indigo-100" placeholder="EJ: MARTILLO BOLITA 500GR CABO FIBRA..." value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Código Interno (SKU)</label>
                                          <input className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-[11px] font-bold uppercase" value={formData.internalCodes?.[0] || ''} onChange={e => setFormData({...formData, internalCodes: [e.target.value.toUpperCase()]})} />
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Cód. de Barras (EAN)</label>
                                          <input className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-[11px]" value={formData.barcodes?.[0] || ''} onChange={e => setFormData({...formData, barcodes: [e.target.value]})} />
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Cód. de Proveedor</label>
                                          <input className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-[11px] uppercase" value={formData.providerCodes?.[0] || ''} onChange={e => setFormData({...formData, providerCodes: [e.target.value.toUpperCase()]})} />
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2">Clasificación</h4>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Marca</label>
                                          <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold uppercase" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                              <option value="">-- SELECCIONAR --</option>
                                              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Rubro / Categoría</label>
                                          <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold uppercase" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                              <option value="">-- SELECCIONAR --</option>
                                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                          </select>
                                      </div>
                                  </div>

                                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 md:col-span-2">
                                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2">Unidades y Logística</h4>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                          <div>
                                              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Unidad de Venta</label>
                                              <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold" value={formData.measureUnitSale || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitSale: e.target.value})}>
                                                  <option value="UNIDAD">UNIDAD</option><option value="METRO">METRO</option><option value="KG">KILO</option><option value="LITRO">LITRO</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Factor Conversión</label>
                                              <input type="number" className="w-full p-2.5 bg-slate-50 border rounded-xl text-[10px] font-black" value={formData.conversionFactor || 1} onChange={e => setFormData({...formData, conversionFactor: parseFloat(e.target.value) || 1})} />
                                          </div>
                                          <div className="col-span-2 md:col-span-1">
                                              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Proveedor Principal</label>
                                              <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold uppercase" value={formData.provider || ''} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                                  <option value="">-- SELECCIONAR --</option>
                                                  {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* PESTAÑA: COSTOS Y PRECIOS */}
                      {modalTab === 'PRICING' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8">
                                  <div className="md:col-span-5 space-y-6">
                                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2 flex items-center gap-2"><Calculator size={14}/> Estructura de Costos</h4>
                                      <div>
                                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Costo de Lista Bruto</label>
                                          <div className="relative group">
                                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                              <input type="number" className="w-full pl-10 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-2xl text-slate-900 focus:bg-white focus:border-indigo-100 outline-none" value={formData.listCost || 0} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} />
                                          </div>
                                      </div>
                                      <div className="space-y-3">
                                          <label className="text-[9px] font-black uppercase text-slate-400 block ml-1">Cadena de Descuentos (Bonificaciones %)</label>
                                          <div className="grid grid-cols-4 gap-2">
                                              {[0, 1, 2, 3].map(idx => (
                                                  <div key={idx} className="relative">
                                                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" size={10}/>
                                                      <input type="number" className="w-full p-2 bg-slate-50 border rounded-xl text-center font-black text-xs" value={formData.discounts?.[idx] || 0} onChange={e => {
                                                          const newD = [...(formData.discounts || [0,0,0,0])];
                                                          newD[idx] = parseFloat(e.target.value) || 0;
                                                          updatePricing({discounts: newD});
                                                      }} />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="md:col-span-2 flex flex-col justify-center items-center">
                                      <div className="w-px h-full bg-slate-100 relative">
                                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-500 rounded-full border border-indigo-100 shadow-sm"><ArrowRight size={14}/></div>
                                      </div>
                                  </div>

                                  <div className="md:col-span-5 space-y-6">
                                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2 flex items-center gap-2"><TrendingUp size={14}/> Política de Venta</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Utilidad (%)</label>
                                              <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xl text-indigo-600" value={formData.profitMargin || 30} onChange={e => updatePricing({profitMargin: parseFloat(e.target.value) || 0})} />
                                          </div>
                                          <div>
                                              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Tasa IVA (%)</label>
                                              <select className="w-full p-3 bg-slate-50 border rounded-xl font-black text-lg" value={formData.vatRate || 21} onChange={e => updatePricing({vatRate: parseFloat(e.target.value) || 0})}>
                                                  <option value={21}>21.0%</option><option value={10.5}>10.5%</option><option value={27}>27.0%</option><option value={0}>Exento</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                                          <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80}/></div>
                                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Precio Final Sugerido</p>
                                          <h3 className="text-4xl font-black tracking-tighter text-white">${formData.priceFinal?.toLocaleString() || '0'}</h3>
                                          <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase">Costo Neto: ${formData.costAfterDiscounts?.toLocaleString()}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* PESTAÑA: STOCK */}
                      {modalTab === 'STOCK' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center space-y-4">
                                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Store size={24}/></div>
                                      <div className="text-center">
                                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Mostrador Local</h4>
                                          <p className="text-[8px] text-slate-400 font-bold uppercase mb-4">Stock Principal</p>
                                          <input type="number" className="w-full p-4 bg-slate-50 border rounded-3xl font-black text-3xl text-center outline-none focus:bg-white focus:border-indigo-100" value={formData.stockPrincipal || 0} onChange={e => setFormData({...formData, stockPrincipal: parseFloat(e.target.value) || 0})} />
                                      </div>
                                  </div>
                                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center space-y-4">
                                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Building2 size={24}/></div>
                                      <div className="text-center">
                                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Depósito</h4>
                                          <p className="text-[8px] text-slate-400 font-bold uppercase mb-4">Reserva Stock</p>
                                          <input type="number" className="w-full p-4 bg-slate-50 border rounded-3xl font-black text-3xl text-center outline-none focus:bg-white focus:border-emerald-100" value={formData.stockDeposito || 0} onChange={e => setFormData({...formData, stockDeposito: parseFloat(e.target.value) || 0})} />
                                      </div>
                                  </div>
                                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center space-y-4">
                                      <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Truck size={24}/></div>
                                      <div className="text-center">
                                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Sucursal</h4>
                                          <p className="text-[8px] text-slate-400 font-bold uppercase mb-4">Punto Externo</p>
                                          <input type="number" className="w-full p-4 bg-slate-50 border rounded-3xl font-black text-3xl text-center outline-none focus:bg-white focus:border-orange-100" value={formData.stockSucursal || 0} onChange={e => setFormData({...formData, stockSucursal: parseFloat(e.target.value) || 0})} />
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
                                  <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-2 flex items-center gap-2"><RefreshCw size={14}/> Límites de Reposición</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                          <label className="text-[8px] font-black uppercase text-red-400 block mb-1">Stock Mínimo</label>
                                          <input type="number" className="w-full p-2 bg-white border border-red-200 rounded-lg font-black text-center text-red-600" value={formData.stockMinimo || 0} onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                          <label className="text-[8px] font-black uppercase text-indigo-400 block mb-1">Punto de Pedido</label>
                                          <input type="number" className="w-full p-2 bg-white border border-indigo-200 rounded-lg font-black text-center text-indigo-600" value={formData.reorderPoint || 0} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                          <label className="text-[8px] font-black uppercase text-green-400 block mb-1">Stock Máximo</label>
                                          <input type="number" className="w-full p-2 bg-white border border-green-200 rounded-lg font-black text-center text-green-600" value={formData.stockMaximo || 0} onChange={e => setFormData({...formData, stockMaximo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div className="bg-slate-900 p-4 rounded-xl flex flex-col justify-center">
                                          <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Ubicación Física</label>
                                          <input className="w-full p-2 bg-white/10 border border-white/10 rounded-lg font-bold text-[10px] text-white uppercase text-center" placeholder="EJ: EST-A-42" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value.toUpperCase()})} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* PESTAÑA: ECOMMERCE */}
                      {modalTab === 'TECHNICAL' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-8">
                                  <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-4 flex items-center gap-2"><Globe size={16}/> Canales de Venta Digital</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <EcommerceToggle active={formData.ecommerce?.mercadoLibre} label="Mercado Libre" onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce||{}), mercadoLibre: !formData.ecommerce?.mercadoLibre}})} />
                                      <EcommerceToggle active={formData.ecommerce?.tiendaNube} label="Tienda Nube" onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce||{}), tiendaNube: !formData.ecommerce?.tiendaNube}})} />
                                      <EcommerceToggle active={formData.ecommerce?.webPropia} label="Web Propia" onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce||{}), webPropia: !formData.ecommerce?.webPropia}})} />
                                  </div>
                                  <div className="pt-6 border-t">
                                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Imagen del Producto (URL o Archivo)</label>
                                      <div className="flex gap-4">
                                          <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
                                              <Upload size={24}/>
                                          </div>
                                          <input className="flex-1 p-3 bg-slate-50 border rounded-xl text-[10px] font-medium h-fit mt-2" placeholder="Pegar URL de imagen aquí..." value={formData.ecommerce?.imageUrl || ''} onChange={e => setFormData({...formData, ecommerce: {...(formData.ecommerce||{}), imageUrl: e.target.value}})} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t bg-white flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-900 text-white px-12 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                          {isSaving ? <RefreshCw className="animate-spin" size={14}/> : <Save size={14}/>} Guardar en Fichero
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isEntityModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Añadir {inventoryTab === 'BRANDS' ? 'Marca' : 'Rubro'}</h3>
                      <button onClick={() => setIsEntityModalOpen(false)}><X size={16}/></button>
                  </div>
                  <div className="p-5 space-y-4">
                      <input 
                        className="w-full p-3 bg-slate-100 border rounded-xl outline-none font-black text-xs uppercase" 
                        placeholder="Nombre..." 
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (inventoryTab === 'BRANDS') setBrands([...brands, { id: Date.now().toString(), name: val.toUpperCase() }]);
                                else setCategories([...categories, { id: Date.now().toString(), name: val.toUpperCase() }]);
                                setIsEntityModalOpen(false);
                            }
                        }}
                      />
                      <p className="text-[8px] text-slate-400 uppercase text-center">Presione ENTER para guardar</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const EcommerceToggle: React.FC<{ active?: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${active ? 'bg-indigo-50 border-indigo-600 shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
        <span className={`text-[10px] font-black uppercase ${active ? 'text-indigo-900' : ''}`}>{label}</span>
        {active ? <CheckCircle size={16} className="text-indigo-600"/> : <X size={16}/>}
    </button>
);

export default Inventory;
