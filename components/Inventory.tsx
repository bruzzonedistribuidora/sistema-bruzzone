
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, 
    Barcode, Pen, Trash2, Tag, Layers, RefreshCw, 
    Truck, PlusCircle, CheckCircle, Hash,
    Boxes as BoxesIcon, PackagePlus, ShoppingCart, AlertCircle, Database,
    Calculator, MapPin, Percent, DollarSign, TrendingUp, Zap, List, PlusSquare,
    Ruler, Scale, Box, ShoppingBag, DatabaseZap, FileUp, Camera, Image as ImageIcon,
    History, Link2, Info, ChevronRight, ListPlus, LayoutGrid, FileText, Globe
} from 'lucide-react';
import { Product, Provider, Brand, Category, ComboItem } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import InitialImport from './InitialImport';

type ProductTab = 'GENERAL' | 'PRECIOS' | 'STOCK' | 'LOGISTICA' | 'WEB';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT'>('PRODUCTS');
  const [activeProductTab, setActiveProductTab] = useState<ProductTab>('GENERAL');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [providers, setProviders] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));

  const initialFormState: Partial<Product> = {
      name: '',
      brand: 'GENERICO',
      category: 'GENERAL',
      provider: '',
      internalCodes: [''],
      barcodes: [],
      providerCodes: [''],
      otrosCodigos1: '',
      otrosCodigos2: '',
      otrosCodigos3: '',
      otrosCodigos4: '',
      listCost: 0,
      purchasePackageQuantity: 1, // Divisor de compra
      salePackageQuantity: 1,     // Multiplicador de venta
      discounts: [0, 0, 0, 0],
      profitMargin: 30,
      vatRate: 21,
      stockPrincipal: 0,
      stockDeposito: 0,
      stockSucursal: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      reorderPoint: 0,
      priceFinal: 0,
      measureUnitPurchase: 'UNIDAD',
      measureUnitSale: 'UNIDAD',
      conversionFactor: 1,
      ecommerce: { isPublished: false, imageUrl: '' },
      isCombo: false,
      comboItems: []
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);
  const [newBarcode, setNewBarcode] = useState('');

  const loadProducts = async () => {
      setIsLoading(true);
      try {
          const stats = await productDB.getStats();
          setTotalCount(stats.count);
          if (searchTerm.trim().length > 2) {
              const results = await productDB.search(searchTerm);
              setProducts(results);
          } else {
              const initial = await productDB.getAll(60);
              setProducts(initial);
          }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadProducts();
    const handleUpdate = () => loadProducts();
    window.addEventListener('ferrecloud_products_updated', handleUpdate);
    return () => window.removeEventListener('ferrecloud_products_updated', handleUpdate);
  }, [searchTerm]);

  const calculatePrices = (data: Partial<Product>) => {
      // Costo de lista dividido por cantidad en bulto (Compra)
      const baseList = parseFloat(data.listCost as any) || 0;
      const purchaseQty = parseFloat(data.purchasePackageQuantity as any) || 1;
      const unitListCost = baseList / purchaseQty;

      const d = data.discounts || [0, 0, 0, 0];
      const coef = (1 - (parseFloat(d[0] as any) || 0)/100) * 
                   (1 - (parseFloat(d[1] as any) || 0)/100) * 
                   (1 - (parseFloat(d[2] as any) || 0)/100) * 
                   (1 - (parseFloat(d[3] as any) || 0)/100);
      
      const netCost = unitListCost * coef;
      const margin = parseFloat(data.profitMargin as any) || 0;
      const priceNeto = netCost * (1 + margin/100);
      const vat = parseFloat(data.vatRate as any) || 21;
      
      // Multiplicado por cantidad de venta (si vende pack)
      const saleQty = parseFloat(data.salePackageQuantity as any) || 1;
      const final = (priceNeto * (1 + vat/100)) * saleQty;

      return {
          costAfterDiscounts: parseFloat(netCost.toFixed(4)),
          priceNeto: parseFloat(priceNeto.toFixed(2)),
          priceFinal: parseFloat(final.toFixed(2))
      };
  };

  const updateField = (field: string, value: any) => {
      setFormData(prev => {
          let next = { ...prev };
          if (field.startsWith('d_')) {
              const idx = parseInt(field.split('_')[1]);
              const newDiscounts = [...(prev.discounts || [0,0,0,0])];
              newDiscounts[idx] = parseFloat(value) || 0;
              next.discounts = newDiscounts;
          } else {
              (next as any)[field] = value;
          }
          const updates = calculatePrices(next);
          return { ...next, ...updates };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name || !formData.internalCodes?.[0]) {
          alert("Nombre y Código SKU son obligatorios.");
          return;
      }
      setIsLoading(true);
      const productToSave: Product = {
          ...formData,
          id: formData.id || `PROD-${Date.now()}`,
          name: formData.name.toUpperCase(),
          brand: (formData.brand || 'GENERICO').toUpperCase(),
          category: (formData.category || 'GENERAL').toUpperCase(),
          provider: (formData.provider || 'S/D').toUpperCase(),
          stock: (parseFloat(formData.stockPrincipal as any) || 0) + (parseFloat(formData.stockDeposito as any) || 0) + (parseFloat(formData.stockSucursal as any) || 0)
      } as Product;

      await productDB.save(productToSave);
      setIsModalOpen(false);
      await loadProducts();
      setIsLoading(false);
  };

  const quickAdd = (type: 'BRAND' | 'PROVIDER' | 'CATEGORY') => {
      const name = prompt(`Nueva ${type}:`);
      if (!name) return;
      const upper = name.toUpperCase();
      if (type === 'BRAND') {
          const next = [...brands, { id: Date.now().toString(), name: upper }];
          setBrands(next);
          localStorage.setItem('ferrecloud_brands', JSON.stringify(next));
          setFormData(prev => ({ ...prev, brand: upper }));
      } else if (type === 'CATEGORY') {
          const next = [...categories, { id: Date.now().toString(), name: upper }];
          setCategories(next);
          localStorage.setItem('ferrecloud_categories', JSON.stringify(next));
          setFormData(prev => ({ ...prev, category: upper }));
      } else {
          const next: Provider[] = [...providers, { id: Date.now().toString(), name: upper, cuit: '', contact: '', phone: '', email: '', address: '', balance: 0, defaultDiscounts: [0,0,0] as [number, number, number] }];
          setProviders(next);
          localStorage.setItem('ferrecloud_providers', JSON.stringify(next));
          setFormData(prev => ({ ...prev, provider: upper }));
      }
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-100 overflow-hidden font-sans">
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={24}/></div>
              <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter">Maestro de Artículos</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{totalCount.toLocaleString()} SKUs Registrados</p>
              </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Visualizar Stock</button>
              <button onClick={() => setInventoryTab('IMPORT')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Importación Masiva</button>
          </div>
          <button onClick={() => { setFormData(initialFormState); setActiveProductTab('GENERAL'); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Plus size={16}/> Alta de Artículo
          </button>
      </div>

      <div className="flex-1 overflow-hidden">
          {inventoryTab === 'PRODUCTS' ? (
              <div className="h-full flex flex-col space-y-4">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0 relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                      <input 
                        type="text" 
                        placeholder="BUSCAR POR NOMBRE, MARCA O CUALQUIER CÓDIGO (140.000 ARTÍCULOS)..." 
                        className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl font-bold text-xs outline-none focus:bg-white focus:border-indigo-500 uppercase transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>

                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="px-6 py-4">Descripción del Bien</th>
                                      <th className="px-6 py-4">Códigos</th>
                                      <th className="px-6 py-4 text-center">Stock</th>
                                      <th className="px-6 py-4 text-right">Precio Público</th>
                                      <th className="px-6 py-4 text-center">Acciones</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[11px]">
                                  {products.map(p => (
                                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-3">
                                              <p className="font-black text-slate-800 uppercase leading-none mb-1">{p.name}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.brand} • {p.category}</p>
                                          </td>
                                          <td className="px-6 py-3 font-mono">
                                              <p className="text-[9px] font-bold text-indigo-600">I: {p.internalCodes?.[0]}</p>
                                              <p className="text-[9px] text-emerald-600">P: {p.providerCodes?.[0] || '---'}</p>
                                          </td>
                                          <td className={`px-6 py-3 text-center font-black text-base tracking-tighter ${p.stock <= (p.reorderPoint || 0) ? 'text-red-500' : 'text-slate-900'}`}>
                                              {p.stock}
                                          </td>
                                          <td className="px-6 py-3 text-right font-black text-slate-900 text-base tracking-tighter">
                                              ${p.priceFinal?.toLocaleString()}
                                          </td>
                                          <td className="px-6 py-3 text-center">
                                              <div className="flex justify-center gap-1">
                                                  <button title="Editar Ficha" onClick={() => { setFormData(p); setActiveProductTab('GENERAL'); setIsModalOpen(true); }} className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Pen size={14}/></button>
                                                  <button title="Añadir a Reposición" onClick={() => addToReplenishmentQueue(p)} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Truck size={14}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          ) : (
              <InitialImport onComplete={() => setInventoryTab('PRODUCTS')} />
          )}
      </div>

      {/* MODAL FICHA TÉCNICA REDISEÑADA (ESTILO ESCRITORIO COMPACTO) */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-slate-200 rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col border border-white/20">
                  {/* Header Compacto */}
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <FileText size={18} className="text-indigo-400"/>
                          <h3 className="text-sm font-black uppercase tracking-widest">{formData.id ? 'Mantenimiento de Producto' : 'Ingreso de Nuevo Artículo'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={24}/></button>
                  </div>
                  
                  {/* Selector de Solapas */}
                  <div className="flex bg-slate-300/50 p-1 shrink-0 gap-1 border-b border-slate-300">
                      {[
                          { id: 'GENERAL', label: 'General', icon: Info },
                          { id: 'PRECIOS', label: 'Costos/Venta', icon: DollarSign },
                          { id: 'STOCK', label: 'Inventario', icon: Database },
                          { id: 'LOGISTICA', label: 'Fraccionados/Bultos', icon: Ruler },
                          { id: 'WEB', label: 'E-Commerce', icon: Globe }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveProductTab(tab.id as ProductTab)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-t-xl text-[10px] font-black uppercase transition-all ${activeProductTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/40'}`}>
                              <tab.icon size={12}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar min-h-[450px]">
                      {activeProductTab === 'GENERAL' && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fade-in">
                              <div className="md:col-span-12">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Nombre Comercial / Descripción</label>
                                  <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs uppercase focus:border-indigo-500" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                              </div>
                              <div className="md:col-span-4">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Rubro / Categoría</label>
                                  <div className="flex gap-1">
                                      <select className="flex-1 p-2 bg-slate-50 border rounded-lg text-xs font-bold uppercase" value={formData.category} onChange={e => updateField('category', e.target.value)}>
                                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                      </select>
                                      <button onClick={() => quickAdd('CATEGORY')} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={14}/></button>
                                  </div>
                              </div>
                              <div className="md:col-span-4">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Marca</label>
                                  <div className="flex gap-1">
                                      <select className="flex-1 p-2 bg-slate-50 border rounded-lg text-xs font-bold uppercase" value={formData.brand} onChange={e => updateField('brand', e.target.value)}>
                                          {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                      </select>
                                      <button onClick={() => quickAdd('BRAND')} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={14}/></button>
                                  </div>
                              </div>
                              <div className="md:col-span-4">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Proveedor Principal</label>
                                  <div className="flex gap-1">
                                      <select className="flex-1 p-2 bg-slate-50 border rounded-lg text-xs font-bold uppercase" value={formData.provider} onChange={e => updateField('provider', e.target.value)}>
                                          <option value="">SIN PROVEEDOR</option>
                                          {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                      </select>
                                      <button onClick={() => quickAdd('PROVIDER')} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={14}/></button>
                                  </div>
                              </div>
                              <div className="md:col-span-3">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Código SKU Interno</label>
                                  <input type="text" className="w-full p-2 bg-indigo-50 border border-indigo-100 rounded-lg font-bold text-xs uppercase" value={formData.internalCodes?.[0]} onChange={e => updateField('internalCodes', [e.target.value.toUpperCase()])} />
                              </div>
                              <div className="md:col-span-3">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Cód. Prov / Catálogo</label>
                                  <input type="text" className="w-full p-2 bg-emerald-50 border border-emerald-100 rounded-lg font-bold text-xs uppercase" value={formData.providerCodes?.[0]} onChange={e => updateField('providerCodes', [e.target.value.toUpperCase()])} />
                              </div>
                              <div className="md:col-span-6">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Código de Barras (EAN13)</label>
                                  <div className="flex gap-1">
                                      <input type="text" className="flex-1 p-2 bg-slate-50 border rounded-lg font-bold text-xs" value={newBarcode} onChange={e => setNewBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setFormData({...formData, barcodes: [...(formData.barcodes||[]), newBarcode]}), setNewBarcode(''))} />
                                      <button onClick={() => { if(newBarcode) { setFormData({...formData, barcodes: [...(formData.barcodes||[]), newBarcode]}); setNewBarcode(''); } }} className="bg-slate-900 text-white p-2 rounded-lg"><Plus size={14}/></button>
                                  </div>
                              </div>
                              <div className="md:col-span-12">
                                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Otros Códigos Relacionados (Catálogos antiguos, referencias cruzadas)</label>
                                  <div className="grid grid-cols-4 gap-2">
                                      <input type="text" placeholder="Cód 1" className="p-2 border rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos1} onChange={e => updateField('otrosCodigos1', e.target.value)} />
                                      <input type="text" placeholder="Cód 2" className="p-2 border rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos2} onChange={e => updateField('otrosCodigos2', e.target.value)} />
                                      <input type="text" placeholder="Cód 3" className="p-2 border rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos3} onChange={e => updateField('otrosCodigos3', e.target.value)} />
                                      <input type="text" placeholder="Cód 4" className="p-2 border rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos4} onChange={e => updateField('otrosCodigos4', e.target.value)} />
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeProductTab === 'PRECIOS' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                  <div className="md:col-span-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Costo Lista (Bruto)</label>
                                      <input type="number" className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-black text-sm" value={formData.listCost || ''} onChange={e => updateField('listCost', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Tasa IVA %</label>
                                      <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-xs" value={formData.vatRate} onChange={e => updateField('vatRate', e.target.value)}>
                                          <option value="21">IVA 21.0%</option>
                                          <option value="10.5">IVA 10.5%</option>
                                          <option value="0">EXENTO</option>
                                      </select>
                                  </div>
                                  <div className="md:col-span-2 grid grid-cols-4 gap-2">
                                      {[0,1,2,3].map(i => (
                                          <div key={i}>
                                              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Bonif {i+1}</label>
                                              <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center" value={formData.discounts?.[i] || ''} onChange={e => updateField(`d_${i}`, e.target.value)} />
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                                      <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                                          <span className="text-[10px] font-black text-indigo-400 uppercase">Análisis Unitario</span>
                                          <Calculator size={14} className="text-indigo-300"/>
                                      </div>
                                      <div className="flex justify-between items-baseline">
                                          <span className="text-xs font-bold text-slate-500">Costo Neto Unitario</span>
                                          <span className="text-xl font-black text-slate-900">${formData.costAfterDiscounts?.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between items-center gap-4">
                                          <div className="flex-1">
                                              <label className="text-[9px] font-black text-indigo-600 uppercase block mb-1">Utilidad (%)</label>
                                              <input type="number" className="w-full p-2 bg-white border border-indigo-200 rounded-lg font-black text-lg text-indigo-700" value={formData.profitMargin} onChange={e => updateField('profitMargin', e.target.value)} />
                                          </div>
                                          <div className="flex-1 text-right">
                                              <p className="text-[9px] font-black text-slate-400 uppercase">Precio Neto Grav.</p>
                                              <p className="text-lg font-black text-slate-700">${formData.priceNeto?.toLocaleString()}</p>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={100}/></div>
                                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">PRECIO DE VENTA FINAL</p>
                                      <h3 className="text-6xl font-black tracking-tighter text-green-400 leading-none">
                                          ${formData.priceFinal?.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                      </h3>
                                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-4">Incluye IVA {formData.vatRate}%</p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeProductTab === 'STOCK' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="p-5 bg-slate-50 border rounded-2xl">
                                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Stock Mostrador / Local</label>
                                      <input type="number" className="w-full p-3 bg-white border rounded-xl font-black text-xl text-slate-800" value={formData.stockPrincipal} onChange={e => updateField('stockPrincipal', e.target.value)} />
                                  </div>
                                  <div className="p-5 bg-slate-50 border rounded-2xl">
                                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Stock Depósito Gral.</label>
                                      <input type="number" className="w-full p-3 bg-white border rounded-xl font-black text-xl text-slate-800" value={formData.stockDeposito} onChange={e => updateField('stockDeposito', e.target.value)} />
                                  </div>
                                  <div className="p-5 bg-slate-50 border rounded-2xl">
                                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Stock Sucursal</label>
                                      <input type="number" className="w-full p-3 bg-white border rounded-xl font-black text-xl text-slate-800" value={formData.stockSucursal} onChange={e => updateField('stockSucursal', e.target.value)} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Stock Mínimo</label>
                                      <input type="number" className="w-full p-2 bg-red-50 border border-red-100 rounded-lg font-bold text-red-600" value={formData.stockMinimo} onChange={e => updateField('stockMinimo', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Punto de Pedido</label>
                                      <input type="number" className="w-full p-2 bg-orange-50 border border-orange-100 rounded-lg font-bold text-orange-600" value={formData.reorderPoint} onChange={e => updateField('reorderPoint', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Stock Deseado / Máx</label>
                                      <input type="number" className="w-full p-2 bg-green-50 border border-green-100 rounded-lg font-bold text-green-600" value={formData.stockMaximo} onChange={e => updateField('stockMaximo', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Lead Time (Días)</label>
                                      <input type="number" className="w-full p-2 bg-slate-50 border rounded-lg font-bold text-slate-600" value={formData.reorderPoint} />
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeProductTab === 'LOGISTICA' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                              <div className="bg-slate-50 p-8 rounded-[2rem] border space-y-6">
                                  <h4 className="text-[11px] font-black uppercase text-indigo-600 border-b pb-4 flex items-center gap-2">
                                      <Truck size={14}/> Fraccionamiento de Compra
                                  </h4>
                                  <div className="grid grid-cols-1 gap-4">
                                      <div>
                                          <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-4">
                                              Defina cuántas unidades contiene el bulto que compra al proveedor para prorratear el costo unitario automáticamente.
                                          </p>
                                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cant. por Bulto (Divisor)</label>
                                          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-indigo-100">
                                              <input type="number" className="flex-1 bg-transparent font-black text-3xl text-indigo-700 outline-none" value={formData.purchasePackageQuantity} onChange={e => updateField('purchasePackageQuantity', e.target.value)} />
                                              <span className="text-[10px] font-black text-indigo-400 uppercase">Uni / Caja</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-slate-50 p-8 rounded-[2rem] border space-y-6">
                                  <h4 className="text-[11px] font-black uppercase text-orange-600 border-b pb-4 flex items-center gap-2">
                                      <ShoppingBag size={14}/> Fraccionamiento de Venta
                                  </h4>
                                  <div className="grid grid-cols-1 gap-4">
                                      <div>
                                          <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-4">
                                              Si este artículo se vende como un Pack o Conjunto indivisible, el sistema multiplicará el precio unitario por este valor.
                                          </p>
                                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Venta por Pack (Multiplicador)</label>
                                          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-orange-100">
                                              <input type="number" className="flex-1 bg-transparent font-black text-3xl text-orange-700 outline-none" value={formData.salePackageQuantity} onChange={e => updateField('salePackageQuantity', e.target.value)} />
                                              <span className="text-[10px] font-black text-orange-400 uppercase">Uni / Pack</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="md:col-span-2 grid grid-cols-3 gap-4 border-t pt-6">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Peso Unitario (Kg)</label>
                                      <input type="number" step="0.001" className="w-full p-2 border rounded-lg font-bold" />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tara / Desperdicio</label>
                                      <input type="number" className="w-full p-2 border rounded-lg font-bold" />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Unidad Medida</label>
                                      <select className="w-full p-2 border rounded-lg font-bold text-xs uppercase" value={formData.measureUnitSale} onChange={e => updateField('measureUnitSale', e.target.value)}>
                                          <option value="UNIDAD">UNIDAD</option><option value="METRO">METRO</option><option value="KG">KILOGRAMO</option><option value="LITRO">LITRO</option>
                                      </select>
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeProductTab === 'WEB' && (
                          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-6">
                                    <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-black uppercase tracking-widest">Estado E-Commerce</h4>
                                            <div onClick={() => updateField('ecommerce', {...formData.ecommerce, isPublished: !formData.ecommerce?.isPublished})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${formData.ecommerce?.isPublished ? 'bg-green-500' : 'bg-slate-600'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.ecommerce?.isPublished ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { k: 'mercadoLibre', l: 'Mercado Libre', color: 'text-yellow-400' },
                                                { k: 'tiendaNube', l: 'Tienda Nube', color: 'text-blue-400' },
                                                { k: 'webPropia', l: 'Catálogo Web Propio', color: 'text-indigo-400' }
                                            ].map(plat => (
                                                <button 
                                                    key={plat.k}
                                                    onClick={() => updateField('ecommerce', {...formData.ecommerce, [plat.k]: !((formData.ecommerce as any)[plat.k])})}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${((formData.ecommerce as any)[plat.k]) ? 'border-indigo-500 bg-white/5' : 'border-white/5 text-slate-500'}`}>
                                                    <span className={`text-[10px] font-black uppercase ${((formData.ecommerce as any)[plat.k]) ? plat.color : ''}`}>{plat.l}</span>
                                                    {((formData.ecommerce as any)[plat.k]) ? <CheckCircle size={16}/> : <div className="w-4 h-4 rounded-full border border-white/10"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                               </div>
                               <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] border-slate-200 bg-slate-50 p-10">
                                    <Camera size={48} className="text-slate-300 mb-4"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vincular imagen para tienda online</p>
                                    <button className="mt-4 bg-white border px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-900 hover:text-white transition-all">Seleccionar Archivo</button>
                               </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isLoading} className="bg-slate-900 text-white px-10 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                          {isLoading ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} Grabar Ficha de Artículo
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
