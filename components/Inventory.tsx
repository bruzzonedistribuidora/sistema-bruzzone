
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2, Upload, Ruler, Building2, Store, Globe, ArrowRight, TrendingUp,
    Scale, Boxes as BoxesIcon, Plus as PlusIcon, Minus as MinusIcon,
    MapPin, AlertTriangle
} from 'lucide-react';
import { Product, Provider, Brand, Category } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import Providers from './Providers';
import InitialImport from './InitialImport';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'CODES' | 'PRICING' | 'STOCK'>('GENERAL');

  const loadProducts = async () => {
      setIsLoading(true);
      if (searchTerm.trim().length > 2) {
          const results = await productDB.search(searchTerm);
          setProducts(results);
      } else {
          const initial = await productDB.getAll(100);
          setProducts(initial);
      }
      setIsLoading(false);
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

  const handleArrayUpdate = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number, value: string) => {
      setFormData(prev => {
          const arr = [...(prev[field] || [''])];
          arr[index] = value.toUpperCase();
          return { ...prev, [field]: arr };
      });
  };

  const addArrayItem = (field: 'internalCodes' | 'barcodes' | 'providerCodes') => {
      setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number) => {
      setFormData(prev => {
          const arr = [...(prev[field] || [])];
          if (arr.length <= 1 && field === 'internalCodes') return prev; 
          arr.splice(index, 1);
          return { ...prev, [field]: arr };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name) return alert("El nombre es obligatorio");
      
      setIsSaving(true);
      try {
          const productToSave: Product = {
              ...formData,
              id: formData.id || `PROD-${Date.now()}`,
              name: (formData.name || '').toUpperCase(),
              internalCodes: (formData.internalCodes || ['']).filter(c => c.trim() !== ''),
              barcodes: (formData.barcodes || []).filter(c => c.trim() !== ''),
              providerCodes: (formData.providerCodes || []).filter(c => c.trim() !== ''),
              stockPrincipal: formData.stockPrincipal || 0,
              stockDeposito: formData.stockDeposito || 0,
              stockSucursal: formData.stockSucursal || 0,
              stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0),
              ecommerce: formData.ecommerce || { isPublished: false },
              isCombo: formData.isCombo || false,
              comboItems: formData.comboItems || [],
              stockDetails: formData.stockDetails || [],
              listCost: formData.listCost || 0,
              discounts: formData.discounts || [0,0,0,0],
              profitMargin: formData.profitMargin || 30,
              vatRate: formData.vatRate || 21,
              measureUnitPurchase: formData.measureUnitPurchase || 'UNIDAD',
              measureUnitSale: formData.measureUnitSale || 'UNIDAD',
              conversionFactor: formData.conversionFactor || 1,
              purchaseCurrency: formData.purchaseCurrency || 'ARS',
              saleCurrency: formData.saleCurrency || 'ARS'
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
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-200 overflow-hidden font-sans">
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-300 shadow-xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={28}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none">Maestro de Artículos</h2>
                    <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Base de Datos Centralizada</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-300 shadow-inner">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white/50'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'IMPORT' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white/50'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white/50'}`}>Proveedores</button>
            </div>

            <button onClick={() => { setFormData({name: '', brand: '', category: '', provider: '', internalCodes: [''], barcodes: [], providerCodes: [], vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], purchaseCurrency: 'ARS', saleCurrency: 'ARS', measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', conversionFactor: 1, purchasePackageQuantity: 1, stockPrincipal: 0, stockDeposito: 0, stockSucursal: 0}); setModalTab('GENERAL'); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.8rem] font-black shadow-2xl flex items-center gap-3 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">
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
                        <input type="text" placeholder="Buscar por Nombre, Marca, SKU..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={loadProducts} className="bg-slate-900 text-white px-6 rounded-[1.5rem] hover:bg-slate-800 transition-all">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-300 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 text-white sticky top-0 z-20 text-[11px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="w-[15%] px-6 py-5">SKU / Ref</th>
                                    <th className="w-[30%] px-6 py-5">Descripción Comercial</th>
                                    <th className="w-[15%] px-6 py-5">Marca</th>
                                    <th className="w-[10%] px-6 py-5 text-center">Stock</th>
                                    <th className="w-[10%] px-6 py-5 text-right">Precio Final</th>
                                    <th className="w-[20%] px-6 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sortedProducts.length > 0 ? (
                                    sortedProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-mono font-black text-indigo-700 text-xs truncate">{p.internalCodes?.[0] || 'S/C'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black uppercase text-slate-950 text-xs truncate">{p.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-600 text-[10px] uppercase truncate">{p.brand || 'GENÉRICO'}</p>
                                            </td>
                                            <td className={`px-6 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.stockMinimo || 0) ? 'text-red-500' : 'text-slate-900'}`}>{p.stock}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-950 text-lg tracking-tighter bg-slate-50/50">${p.priceFinal?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1.5">
                                                    <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-2.5 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"><Pen size={14}/></button>
                                                    <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) { await productDB.delete(p.id); loadProducts(); } }} className="p-2.5 text-red-300 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-50"><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <Database size={64} strokeWidth={1} />
                                                <p className="font-black uppercase text-xs tracking-[0.3em]">
                                                    {searchTerm ? 'No hay artículos para esa búsqueda' : 'La base de datos está vacía'}
                                                </p>
                                                {!searchTerm && (
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase max-w-xs">
                                                        Importe un archivo CSV o cree su primer artículo con el botón superior.
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
        {inventoryTab === 'IMPORT' && <InitialImport onComplete={() => setInventoryTab('PRODUCTS')} />}
        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-500 rounded-3xl shadow-xl"><Package size={32}/></div>
                          <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{formData.id ? 'Editar Artículo' : 'Nuevo Artículo Pro'}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Ficha Técnica Centralizada</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={32}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 shrink-0 border-b border-slate-200">
                      {(['GENERAL', 'CODES', 'PRICING', 'STOCK'] as const).map(tab => (
                          <button key={tab} onClick={() => setModalTab(tab)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                              {tab === 'GENERAL' ? 'Identidad' : tab === 'CODES' ? 'Códigos / Barras' : tab === 'PRICING' ? 'Precios & Rentabilidad' : 'Existencias'}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar space-y-8">
                      {modalTab === 'GENERAL' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                              <div className="space-y-6">
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Nombre del Producto / Descripción Larga</label>
                                      <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-800 uppercase focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Marca</label>
                                          <input list="brands" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold uppercase outline-none focus:border-indigo-500" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value.toUpperCase()})} />
                                          <datalist id="brands">{brands.map(b => <option key={b.id} value={b.name}/>)}</datalist>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Rubro / Categoría</label>
                                          <input list="categories" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold uppercase outline-none focus:border-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value.toUpperCase()})} />
                                          <datalist id="categories">{categories.map(c => <option key={c.id} value={c.name}/>)}</datalist>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Proveedor Principal</label>
                                      <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold uppercase outline-none focus:border-indigo-500" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                          <option value="">SIN PROVEEDOR</option>
                                          {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                                  <div className="w-32 h-32 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                                      <ImageIcon size={48}/>
                                  </div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previsualización de Catálogo Web</p>
                              </div>
                          </div>
                      )}

                      {modalTab === 'CODES' && (
                          <div className="space-y-8 animate-fade-in">
                              <CodeManager label="SKUs Propios / Referencias Internas" icon={Hash} items={formData.internalCodes || []} onAdd={() => addArrayItem('internalCodes')} onUpdate={(i, v) => handleArrayUpdate('internalCodes', i, v)} onRemove={(i) => removeArrayItem('internalCodes', i)} />
                              <CodeManager label="Códigos de Barras (EAN13 / UPC)" icon={Barcode} items={formData.barcodes || []} onAdd={() => addArrayItem('barcodes')} onUpdate={(i, v) => handleArrayUpdate('barcodes', i, v)} onRemove={(i) => removeArrayItem('barcodes', i)} />
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
                              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Truck size={16}/> Base de Costo</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-2 block">Costo de Lista ($)</label>
                                          <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-900 text-lg focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.listCost || ''} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-2 block">Bonificación (%)</label>
                                          <div className="flex gap-2">
                                              <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-emerald-600 focus:bg-white focus:border-emerald-500 outline-none text-center" value={formData.discounts?.[0] || ''} placeholder="D1" onChange={e => { const ds = [...(formData.discounts || [0,0,0,0])]; ds[0] = parseFloat(e.target.value) || 0; updatePricing({discounts: ds}); }} />
                                          </div>
                                      </div>
                                  </div>
                                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                                      <span className="text-[10px] font-black text-indigo-600 uppercase">Costo Neto Final:</span>
                                      <span className="text-xl font-black text-slate-900">${formData.costAfterDiscounts?.toLocaleString()}</span>
                                  </div>
                              </div>

                              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-8 flex flex-col justify-center">
                                  <div className="text-center space-y-2">
                                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Rentabilidad y Venta</p>
                                      <h4 className="text-5xl font-black tracking-tighter leading-none">${formData.priceFinal?.toLocaleString()}</h4>
                                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Precio de Venta Sugerido (PVP Final)</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 text-center">Margen Utilidad (%)</label>
                                          <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-center text-xl text-indigo-400 outline-none focus:bg-white/10" value={formData.profitMargin || ''} onChange={e => updatePricing({profitMargin: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 text-center">Alícuota IVA (%)</label>
                                          <select className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-center text-xs" value={formData.vatRate} onChange={e => updatePricing({vatRate: parseFloat(e.target.value)})}>
                                              <option value="21" className="text-slate-900">21% (GENERAL)</option>
                                              <option value="10.5" className="text-slate-900">10.5% (REDUCIDO)</option>
                                              <option value="0" className="text-slate-900">EXENTO</option>
                                          </select>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'STOCK' && (
                          <div className="space-y-8 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <StockInput label="Mostrador / Local" value={formData.stockPrincipal || 0} onChange={v => setFormData({...formData, stockPrincipal: v})} color="bg-indigo-50 border-indigo-100 text-indigo-700" />
                                  <StockInput label="Depósito General" value={formData.stockDeposito || 0} onChange={v => setFormData({...formData, stockDeposito: v})} color="bg-emerald-50 border-emerald-100 text-emerald-700" />
                                  <StockInput label="Sucursales" value={formData.stockSucursal || 0} onChange={v => setFormData({...formData, stockSucursal: v})} color="bg-orange-50 border-orange-100 text-orange-700" />
                              </div>
                              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm grid grid-cols-2 gap-8">
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Stock Mínimo (Alerta)</label>
                                      <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-red-500 focus:bg-white focus:border-red-500 outline-none" value={formData.stockMinimo || ''} onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})} />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Punto de Re-pedido</label>
                                      <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-orange-500 focus:bg-white focus:border-orange-500 outline-none" value={formData.reorderPoint || ''} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-900 text-white px-16 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                          {isSaving ? <RefreshCw className="animate-spin"/> : <Save size={20}/>} Guardar Producto
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- COMPONENTES ATÓMICOS PARA EL MODAL ---

const CodeManager: React.FC<{ label: string, icon: any, items: string[], onAdd: () => void, onUpdate: (i: number, v: string) => void, onRemove: (i: number) => void }> = ({ label, icon: Icon, items, onAdd, onUpdate, onRemove }) => (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Icon size={14}/> {label}</h4>
            <button onClick={onAdd} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline"><Plus size={14}/> Agregar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
                <div key={idx} className="relative group">
                    <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-xs uppercase focus:bg-white focus:border-indigo-500 outline-none" value={item} onChange={e => onUpdate(idx, e.target.value)} />
                    <button onClick={() => onRemove(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                </div>
            ))}
            {items.length === 0 && <p className="text-[10px] text-slate-300 italic py-2">Sin códigos registrados.</p>}
        </div>
    </div>
);

const StockInput: React.FC<{ label: string, value: number, onChange: (v: number) => void, color: string }> = ({ label, value, onChange, color }) => (
    <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col space-y-4 ${color}`}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-center">{label}</p>
        <div className="flex items-center gap-4">
            <button onClick={() => onChange(Math.max(0, value - 1))} className="p-3 bg-white/50 rounded-xl hover:bg-white transition-all"><MinusIcon size={20}/></button>
            <input type="number" className="flex-1 bg-transparent text-center font-black text-4xl outline-none" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} />
            <button onClick={() => onChange(value + 1)} className="p-3 bg-white/50 rounded-xl hover:bg-white transition-all"><PlusIcon size={20}/></button>
        </div>
    </div>
);

const ImageIcon = ({ size }: { size: number }) => <Globe size={size} />;

export default Inventory;
