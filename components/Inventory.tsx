
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
    // Add missing MapPin icon to imports
    MapPin
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
  const [modalTab, setModalTab] = useState<'GENERAL' | 'CODES' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

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
          if (arr.length <= 1 && field === 'internalCodes') return prev; // Siempre debe haber un SKU
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
              name: formData.name.toUpperCase(),
              internalCodes: (formData.internalCodes || ['']).filter(c => c.trim() !== ''),
              barcodes: (formData.barcodes || []).filter(c => c.trim() !== ''),
              providerCodes: (formData.providerCodes || []).filter(c => c.trim() !== ''),
              stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0),
              ecommerce: formData.ecommerce || { isPublished: false }
          } as Product;

          if (productToSave.internalCodes.length === 0) {
              productToSave.internalCodes = [`SKU-${Date.now().toString().slice(-6)}`];
          }

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
                    <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Gestión Pro: 140.000 Artículos</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-300 shadow-inner">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'IMPORT' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Proveedores</button>
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
                        <input type="text" placeholder="Buscar por Nombre, Marca, SKU, Barras o Código de Proveedor..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-300 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[11px] uppercase font-black text-slate-300 tracking-widest">
                                <tr>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">SKU / Ref</th>
                                    <th className="w-[35%] px-6 py-5 border-r border-slate-800">Descripción</th>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">Marca / Rubro</th>
                                    <th className="w-[10%] px-6 py-5 text-center border-r border-slate-800">Stock</th>
                                    <th className="w-[10%] px-6 py-5 text-right border-r border-slate-800">PVP Final</th>
                                    <th className="w-[15%] px-6 py-5 text-center">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-black text-indigo-700 text-xs truncate">{p.internalCodes?.[0] || 'S/C'}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.barcodes?.[0] || 'SIN EAN'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black uppercase text-slate-950 text-xs truncate">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Prov: {p.provider || 'S/D'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-600 text-[10px] uppercase truncate">{p.brand || 'GENÉRICO'}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.category || 'SIN RUBRO'}</p>
                                        </td>
                                        <td className={`px-6 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.stockMinimo || 0) ? 'text-red-500' : 'text-slate-900'}`}>{p.stock}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-950 text-lg tracking-tighter bg-slate-50/50">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-3 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"><Pen size={16}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) await productDB.delete(p.id); }} className="p-3 text-red-300 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-50"><Trash2 size={16}/></button>
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

      {/* FICHA MAESTRA ULTRA-COMPLETA */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-slate-400">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-3 bg-indigo-500 rounded-2xl"><Package size={32}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{formData.id ? 'EDITANDO ARTÍCULO' : 'NUEVO ARTÍCULO MAESTRO'}</h3>
                              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuración Completa de Ficha</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform p-3 bg-white/10 rounded-full"><X size={32}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-2 shrink-0 border-b-2 border-slate-200 overflow-x-auto no-scrollbar">
                      {[
                          { id: 'GENERAL', label: 'Básico', icon: Info },
                          { id: 'CODES', label: 'Códigos y Refs', icon: Hash },
                          { id: 'PRICING', label: 'Costos y Venta', icon: DollarSign },
                          { id: 'STOCK', label: 'Existencias', icon: Database },
                          { id: 'TECHNICAL', label: 'Logística y Unid.', icon: Scaling }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setModalTab(tab.id as any)}
                            className={`flex-1 py-4 px-6 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all min-w-[140px] ${modalTab === tab.id ? 'bg-white text-indigo-700 shadow-xl rounded-2xl border-2 border-indigo-100' : 'text-slate-500'}`}>
                              <tab.icon size={18}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
                      
                      {/* TABS GENERAL */}
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="space-y-6">
                                  <label className="text-[12px] font-black uppercase text-slate-900 block mb-2 tracking-widest ml-2">Descripción Comercial (Lo que se ve en la Factura)</label>
                                  <input className="w-full p-6 bg-white border-2 border-slate-300 rounded-[2rem] font-black text-2xl uppercase focus:border-indigo-600 shadow-inner" placeholder="EJ: MARTILLO DE GOMA 500GR CABO FIBRA..." value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-900 block mb-2">Marca</label>
                                      <select className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm font-black uppercase" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                          <option value="">-- GENÉRICA --</option>
                                          {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-900 block mb-2">Rubro / Categoría</label>
                                      <select className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm font-black uppercase" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                          <option value="">-- SIN RUBRO --</option>
                                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-indigo-700 block mb-2">Proveedor Principal</label>
                                      <select className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-sm font-black uppercase text-indigo-900" value={formData.provider || ''} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                          <option value="">-- SELECCIONAR PROVEEDOR --</option>
                                          {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* TABS CÓDIGOS (Varios códigos de barra, sku, etc) */}
                      {modalTab === 'CODES' && (
                          <div className="space-y-12 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                  {/* CÓDIGOS INTERNOS */}
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                                          <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2"><Hash size={16}/> Códigos Internos (SKUs)</h4>
                                          <button onClick={() => addArrayItem('internalCodes')} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-all"><PlusIcon size={14}/></button>
                                      </div>
                                      <div className="space-y-2">
                                          {(formData.internalCodes || ['']).map((code, idx) => (
                                              <div key={idx} className="flex gap-2">
                                                  <input className="flex-1 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-xs font-black uppercase focus:border-indigo-500 outline-none" value={code} onChange={e => handleArrayUpdate('internalCodes', idx, e.target.value)} placeholder="SKU-001..." />
                                                  <button onClick={() => removeArrayItem('internalCodes', idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  {/* CÓDIGOS DE BARRAS */}
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                                          <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2"><Barcode size={16}/> Códigos de Barra (EAN/UPC)</h4>
                                          <button onClick={() => addArrayItem('barcodes')} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-all"><PlusIcon size={14}/></button>
                                      </div>
                                      <div className="space-y-2">
                                          {(formData.barcodes || []).map((code, idx) => (
                                              <div key={idx} className="flex gap-2">
                                                  <input className="flex-1 p-3 bg-indigo-50 border-2 border-indigo-100 rounded-xl font-mono text-xs font-black text-indigo-700 outline-none focus:border-indigo-500" value={code} onChange={e => handleArrayUpdate('barcodes', idx, e.target.value)} placeholder="779123456789..." />
                                                  <button onClick={() => removeArrayItem('barcodes', idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                              </div>
                                          ))}
                                          {formData.barcodes?.length === 0 && (
                                              <button onClick={() => addArrayItem('barcodes')} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-400 transition-all">Añadir Código de Barras</button>
                                          )}
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
                                  {/* CÓDIGOS DE PROVEEDOR */}
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                                          <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2"><Truck size={16}/> Refs de Proveedor</h4>
                                          <button onClick={() => addArrayItem('providerCodes')} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-all"><PlusIcon size={14}/></button>
                                      </div>
                                      <div className="space-y-2">
                                          {(formData.providerCodes || []).map((code, idx) => (
                                              <div key={idx} className="flex gap-2">
                                                  <input className="flex-1 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-xs font-black uppercase" value={code} onChange={e => handleArrayUpdate('providerCodes', idx, e.target.value)} placeholder="CÓDIGO DE FÁBRICA..." />
                                                  <button onClick={() => removeArrayItem('providerCodes', idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  {/* OTROS CÓDIGOS AUXILIARES */}
                                  <div className="space-y-4">
                                      <h4 className="text-xs font-black uppercase text-slate-800 border-b-2 border-slate-100 pb-3 flex items-center gap-2"><Zap size={16}/> Códigos Auxiliares (Sist. Anterior)</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                          <input className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-bold" placeholder="Cód. Aux 1" value={formData.otrosCodigos1 || ''} onChange={e => setFormData({...formData, otrosCodigos1: e.target.value.toUpperCase()})} />
                                          <input className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-bold" placeholder="Cód. Aux 2" value={formData.otrosCodigos2 || ''} onChange={e => setFormData({...formData, otrosCodigos2: e.target.value.toUpperCase()})} />
                                          <input className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-bold" placeholder="Cód. Aux 3" value={formData.otrosCodigos3 || ''} onChange={e => setFormData({...formData, otrosCodigos3: e.target.value.toUpperCase()})} />
                                          <input className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-bold" placeholder="Cód. Aux 4" value={formData.otrosCodigos4 || ''} onChange={e => setFormData({...formData, otrosCodigos4: e.target.value.toUpperCase()})} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* TABS PRECIOS */}
                      {modalTab === 'PRICING' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                  <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-200">
                                      <h4 className="text-sm font-black uppercase text-indigo-700 border-b-2 border-indigo-100 pb-4 flex items-center gap-3"><Calculator size={20}/> Costos</h4>
                                      <div className="grid grid-cols-2 gap-6">
                                          <div>
                                              <label className="text-[10px] font-black text-slate-900 uppercase block mb-3 ml-2">Costo Lista (Bruto)</label>
                                              <div className="relative">
                                                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                                                  <input type="number" className="w-full pl-10 p-4 bg-white border-2 border-slate-300 rounded-2xl font-black text-2xl" value={formData.listCost || 0} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} />
                                              </div>
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-black text-slate-900 uppercase block mb-3 ml-2">Moneda Compra</label>
                                              <select className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-black text-sm" value={formData.purchaseCurrency || 'ARS'} onChange={e => setFormData({...formData, purchaseCurrency: e.target.value})}>
                                                  <option value="ARS">PESOS (ARS)</option>
                                                  <option value="USD">DÓLARES (USD)</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div className="space-y-4">
                                          <label className="text-[9px] font-black text-slate-600 uppercase block ml-2 tracking-widest">Descuentos en Cadena (Proveedor)</label>
                                          <div className="grid grid-cols-4 gap-3">
                                              {[0, 1, 2, 3].map(idx => (
                                                  <div key={idx} className="relative group">
                                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">%</span>
                                                      <input type="number" className="w-full pl-6 p-3 bg-white border-2 border-slate-300 rounded-xl text-center font-black text-xs focus:border-indigo-600" value={formData.discounts?.[idx] || 0} onChange={e => {
                                                          const newD = [...(formData.discounts || [0,0,0,0])];
                                                          newD[idx] = parseFloat(e.target.value) || 0;
                                                          updatePricing({discounts: newD});
                                                      }} />
                                                  </div>
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

                      {/* TABS EXISTENCIAS */}
                      {modalTab === 'STOCK' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                                      <h5 className="text-[11px] font-black uppercase text-indigo-700 mb-6 flex items-center gap-2"><Store size={16}/> Local Mostrador</h5>
                                      <input type="number" className="w-full p-6 bg-white border-2 border-slate-300 rounded-[1.8rem] font-black text-4xl text-center" value={formData.stockPrincipal || 0} onChange={e => setFormData({...formData, stockPrincipal: parseFloat(e.target.value) || 0})} />
                                  </div>
                                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                                      <h5 className="text-[11px] font-black uppercase text-emerald-700 mb-6 flex items-center gap-2"><Building2 size={16}/> Depósito Gral</h5>
                                      <input type="number" className="w-full p-6 bg-white border-2 border-slate-300 rounded-[1.8rem] font-black text-4xl text-center" value={formData.stockDeposito || 0} onChange={e => setFormData({...formData, stockDeposito: parseFloat(e.target.value) || 0})} />
                                  </div>
                                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                                      <h5 className="text-[11px] font-black uppercase text-orange-600 mb-6 flex items-center gap-2"><MapPin size={16}/> Stock Sucursal</h5>
                                      <input type="number" className="w-full p-6 bg-white border-2 border-slate-300 rounded-[1.8rem] font-black text-4xl text-center" value={formData.stockSucursal || 0} onChange={e => setFormData({...formData, stockSucursal: parseFloat(e.target.value) || 0})} />
                                  </div>
                              </div>

                              <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-4">Parámetros de Reposición Automatizada</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 ml-1">Stock Mínimo</label>
                                          <input type="number" className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl font-black text-white" value={formData.stockMinimo || 0} onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 ml-1">Stock Máximo</label>
                                          <input type="number" className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl font-black text-white" value={formData.stockMaximo || 0} onChange={e => setFormData({...formData, stockMaximo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 ml-1">Punto de Pedido</label>
                                          <input type="number" className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl font-black text-white" value={formData.reorderPoint || 0} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 ml-1">Ubicación Física</label>
                                          <input type="text" className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl font-black text-indigo-400 uppercase" placeholder="EJ: ESTANTE A-4" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value.toUpperCase()})} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* TABS AVANZADO */}
                      {modalTab === 'TECHNICAL' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                                      <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2 border-b pb-4"><Scaling size={16}/> Unidades y Conversión</h4>
                                      <div className="grid grid-cols-2 gap-6">
                                          <div>
                                              <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Unidad Compra</label>
                                              <input className="w-full p-3 bg-white border rounded-xl font-bold uppercase" value={formData.measureUnitPurchase || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitPurchase: e.target.value.toUpperCase()})} />
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Unidad Venta</label>
                                              <input className="w-full p-3 bg-white border rounded-xl font-bold uppercase" value={formData.measureUnitSale || 'UNIDAD'} onChange={e => setFormData({...formData, measureUnitSale: e.target.value.toUpperCase()})} />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Cant. por Bulto / Pack</label>
                                          <input type="number" className="w-full p-3 bg-white border rounded-xl font-black" value={formData.purchasePackageQuantity || 1} onChange={e => setFormData({...formData, purchasePackageQuantity: parseFloat(e.target.value) || 1})} />
                                      </div>
                                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                          <label className="text-[9px] font-black text-indigo-600 uppercase mb-2 block">Factor Venta (Multiplicador)</label>
                                          <input type="number" step="0.01" className="w-full p-3 bg-white border-2 border-indigo-300 rounded-xl font-black text-indigo-700" value={formData.conversionFactor || 1} onChange={e => setFormData({...formData, conversionFactor: parseFloat(e.target.value) || 1})} />
                                          <p className="text-[8px] text-indigo-400 font-medium uppercase mt-2 italic">Ej: Si compras m2 pero vendes por caja de 2.2m2, factor = 2.2</p>
                                      </div>
                                  </div>

                                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                                      <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2 border-b pb-4"><Globe size={16}/> Publicación Online</h4>
                                      <div className="space-y-4">
                                          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border">
                                              <span className="text-[10px] font-black uppercase text-slate-600">Publicado en mi Web</span>
                                              <div onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce||{isPublished:false}), webPropia: !formData.ecommerce?.webPropia, isPublished: true}})} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.ecommerce?.webPropia ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.ecommerce?.webPropia ? 'right-1' : 'left-1'}`}></div>
                                              </div>
                                          </div>
                                          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border">
                                              <span className="text-[10px] font-black uppercase text-slate-600">Publicado en Mercado Libre</span>
                                              <div onClick={() => setFormData({...formData, ecommerce: {...(formData.ecommerce||{isPublished:false}), mercadoLibre: !formData.ecommerce?.mercadoLibre, isPublished: true}})} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.ecommerce?.mercadoLibre ? 'bg-[#FFF159]' : 'bg-slate-300'}`}>
                                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.ecommerce?.mercadoLibre ? 'right-1' : 'left-1'}`}></div>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="pt-4">
                                          <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Imagen URL</label>
                                          <input className="w-full p-3 bg-white border rounded-xl text-[10px] font-bold" placeholder="https://..." value={formData.ecommerce?.imageUrl || ''} onChange={e => setFormData({...formData, ecommerce: {...(formData.ecommerce||{isPublished:false}), imageUrl: e.target.value}})} />
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
