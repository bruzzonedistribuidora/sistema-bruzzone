import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling
} from 'lucide-react';
import { Product, Provider, CompanyConfig, Branch, Brand, Category } from '../types';
import { productDB } from '../services/storageService';
import Providers from './Providers';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isMassImportOpen, setIsMassImportOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<{type: 'BRAND' | 'CATEGORY', active: boolean}>({type: 'BRAND', active: false});
  
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [entityForm, setEntityForm] = useState<{id?: string, name: string}>({ name: '' });
  const [quickAddName, setQuickAddName] = useState('');
  const [massInput, setMassInput] = useState('');
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

  // Estado auxiliar para la calculadora de fraccionamiento
  const [bulkCost, setBulkCost] = useState<number>(0);

  const providers: Provider[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'), []);
  const branches: Branch[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_branches') || '[]'), []);

  useEffect(() => { localStorage.setItem('ferrecloud_brands', JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem('ferrecloud_categories', JSON.stringify(categories)); }, [categories]);

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

  // Lógica de Precios con Fraccionamiento
  useEffect(() => {
    const listCost = Number(formData.listCost) || 0;
    const coefBonif = Number(formData.coeficienteBonificacionCosto) || 1;
    const costAfterDiscounts = listCost * coefBonif;
    const margin = Number(formData.profitMargin) || 0;
    const priceNeto = costAfterDiscounts * (1 + margin / 100);
    const vatRate = Number(formData.vatRate) || 21;
    const priceFinal = priceNeto * (1 + vatRate / 100);

    setFormData(prev => ({
        ...prev,
        costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)),
        priceNeto: parseFloat(priceNeto.toFixed(2)),
        priceFinal: parseFloat(priceFinal.toFixed(2))
    }));
  }, [formData.listCost, formData.coeficienteBonificacionCosto, formData.profitMargin, formData.vatRate]);

  const handleOpenModal = (p?: Product) => {
    if (p) {
        setFormData({
            ...p,
            internalCodes: p.internalCodes || [''],
            barcodes: p.barcodes || [''],
            providerCodes: p.providerCodes || [''],
            otrosCodigos1: p.otrosCodigos1 || '',
            otrosCodigos2: p.otrosCodigos2 || '',
            otrosCodigos3: p.otrosCodigos3 || '',
            otrosCodigos4: p.otrosCodigos4 || '',
            purchasePackageQuantity: p.purchasePackageQuantity || 1
        });
        setBulkCost((p.listCost || 0) * (p.purchasePackageQuantity || 1));
    } else {
        setFormData({
            id: Date.now().toString(), 
            internalCodes: [''], 
            barcodes: [''], 
            providerCodes: [''],
            otrosCodigos1: '', otrosCodigos2: '', otrosCodigos3: '', otrosCodigos4: '',
            purchasePackageQuantity: 1,
            name: '', brand: '', provider: '', category: '',
            listCost: 0, coeficienteBonificacionCosto: 1, 
            profitMargin: 30,
            vatRate: 21, stock: 0,
            tasa: 0, alicuotaImpuestoInterno: 0,
            stockDetails: branches.map(b => ({ branchId: b.id, branchName: b.name, quantity: 0 })),
            ecommerce: { isPublished: false },
            isCombo: false, comboItems: [],
            purchaseCurrency: 'ARS', saleCurrency: 'ARS',
            discounts: []
        });
        setBulkCost(0);
    }
    setModalTab('GENERAL');
    setIsModalOpen(true);
  };

  const handleBulkCalc = (cost: number, qty: number) => {
      setBulkCost(cost);
      if (qty > 0) {
          const unitCost = cost / qty;
          setFormData(prev => ({...prev, listCost: unitCost, purchasePackageQuantity: qty}));
      }
  };

  const handleSaveEntity = () => {
    if (!entityForm.name) return;
    const newEntity = { id: entityForm.id || Date.now().toString(), name: entityForm.name.toUpperCase() };
    if (inventoryTab === 'BRANDS') setBrands(prev => entityForm.id ? prev.map(b => b.id === entityForm.id ? newEntity : b) : [newEntity, ...prev]);
    else setCategories(prev => entityForm.id ? prev.map(c => c.id === entityForm.id ? newEntity : c) : [newEntity, ...prev]);
    setIsEntityModalOpen(false);
  };

  const handleQuickAdd = () => {
    if (!quickAddName) return;
    const newEntity = { id: Date.now().toString(), name: quickAddName.toUpperCase() };
    if (isQuickAddOpen.type === 'BRAND') {
        setBrands(prev => [newEntity, ...prev]);
        setFormData({...formData, brand: newEntity.name});
    } else {
        setCategories(prev => [newEntity, ...prev]);
        setFormData({...formData, category: newEntity.name});
    }
    setQuickAddName('');
    setIsQuickAddOpen({type: 'BRAND', active: false});
  };

  // Gestión de Arreglos de Códigos
  const updateCodeArray = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number, value: string) => {
      const next = [...(formData[field] || [])];
      next[index] = value.toUpperCase();
      setFormData({...formData, [field]: next});
  };

  const addCodeField = (field: 'internalCodes' | 'barcodes' | 'providerCodes') => {
      setFormData({...formData, [field]: [...(formData[field] || []), '']});
  };

  const removeCodeField = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number) => {
      const next = (formData[field] || []).filter((_, i) => i !== index);
      setFormData({...formData, [field]: next.length === 0 ? [''] : next});
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-50 overflow-hidden font-sans">
      {/* HEADER CON PESTAÑAS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Boxes size={32}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestión de Stock</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Control de Catálogo Maestro</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('BRANDS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Marcas</button>
                <button onClick={() => setInventoryTab('CATEGORIES')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${inventoryTab === 'CATEGORIES' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Rubros</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${inventoryTab === 'PROVIDERS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Proveedores</button>
            </div>

            <div className="flex gap-2">
                {inventoryTab !== 'PROVIDERS' && (
                    <button onClick={() => inventoryTab === 'PRODUCTS' ? handleOpenModal() : setIsEntityModalOpen(true)} className="bg-slate-900 text-white px-8 py-3.5 rounded-[1.8rem] font-black shadow-xl flex items-center gap-3 hover:bg-indigo-600 transition-all uppercase text-[10px] tracking-widest active:scale-95">
                        <Plus size={18} /> Nuevo {inventoryTab === 'PRODUCTS' ? 'Artículo' : inventoryTab === 'BRANDS' ? 'Marca' : 'Rubro'}
                    </button>
                )}
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2 shrink-0 flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar en el catálogo maestro (+140.000 artículos)..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">Identificación / Códigos</th>
                                    <th className="px-6 py-5">Descripción Comercial</th>
                                    <th className="px-6 py-5 text-center">Rubro / Marca</th>
                                    <th className="px-6 py-5 text-right">Stock</th>
                                    <th className="px-6 py-5 text-right bg-slate-800">Precio Venta</th>
                                    <th className="px-6 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors group">
                                        <td className="px-6 py-5">
                                            <p className="font-mono font-black text-indigo-600">{p.internalCodes?.[0] || 'S/C'}</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">EAN: {p.barcodes?.[0] || '-'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-black text-slate-800 uppercase leading-none mb-1.5">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{p.provider}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg border text-[9px] font-black uppercase mb-1 block w-fit mx-auto">{p.category}</span>
                                            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{p.brand}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-lg tracking-tighter">
                                            {p.stock?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 bg-indigo-50/10">
                                            <p className="text-lg tracking-tighter text-indigo-700">${p.priceFinal?.toLocaleString('es-AR')}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(p)} className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"><Pen size={14} /></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar artículo?')) await productDB.delete(p.id); }} className="p-3 bg-white text-red-400 rounded-xl shadow-sm border border-red-100 hover:bg-red-50 hover:text-white transition-all"><Trash2 size={14} /></button>
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

        {(inventoryTab === 'BRANDS' || inventoryTab === 'CATEGORIES') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto h-full pb-10 custom-scrollbar animate-fade-in">
                {(inventoryTab === 'BRANDS' ? brands : categories).map(entity => (
                    <div key={entity.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-8 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform`}>
                            {inventoryTab === 'BRANDS' ? <Tag size={120}/> : <Layers size={120}/>}
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-slate-100 text-indigo-600 rounded-2xl"><Hash size={20}/></div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEntityForm(entity); setIsEntityModalOpen(true); }} className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border hover:bg-indigo-600 hover:text-white transition-all"><Pen size={14}/></button>
                                    <button onClick={() => inventoryTab === 'BRANDS' ? setBrands(brands.filter(b => b.id !== entity.id)) : setCategories(categories.filter(c => c.id !== entity.id))} className="p-2 bg-white text-red-400 rounded-xl shadow-sm border hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{entity.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {entity.id}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>

      {/* MODAL: NUEVA ENTIDAD (INDIVIDUAL) */}
      {isEntityModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-xl font-black uppercase tracking-tighter">Gestionar {inventoryTab === 'BRANDS' ? 'Marca' : 'Rubro'}</h3>
                      <button onClick={() => setIsEntityModalOpen(false)}><X size={32}/></button>
                  </div>
                  <div className="p-10 space-y-6">
                      <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-slate-800 uppercase" value={entityForm.name} onChange={e => setEntityForm({...entityForm, name: e.target.value})} autoFocus />
                      <button onClick={handleSaveEntity} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                          <Save size={20}/> Guardar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL ALTA DE PRODUCTO - REDISEÑADO PARA MULTICODIGOS Y FRACCIONAMIENTO */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><Package size={32}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{formData.name || 'Nuevo Artículo'}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Ficha Técnica Integral con Fraccionamiento</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={32} /></button>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 gap-1 border-b border-slate-200 shrink-0">
                      {[
                        { id: 'GENERAL', label: 'Identificación', icon: Tag },
                        { id: 'PRICING', label: 'Costos y Fraccionamiento', icon: DollarSign },
                        { id: 'TECHNICAL', label: 'Ferretería / Fiscal', icon: Settings2 },
                        { id: 'STOCK', label: 'Logística', icon: Boxes }
                      ].map(tab => (
                          <button key={tab.id} onClick={() => setModalTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${modalTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                              <tab.icon size={16}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                      <div className="animate-fade-in">
                          {modalTab === 'GENERAL' && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                  <div className="space-y-6">
                                      <div>
                                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre del Artículo</label>
                                          <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black text-xl text-slate-800 uppercase shadow-sm focus:border-indigo-600 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="relative">
                                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Marca</label>
                                              <div className="flex gap-2">
                                                  <select className="flex-1 p-4 bg-white border rounded-2xl font-bold uppercase text-xs outline-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                                      <option value="">-- SELECCIONE --</option>
                                                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                  </select>
                                                  <button onClick={() => setIsQuickAddOpen({type: 'BRAND', active: true})} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all"><Plus size={20}/></button>
                                              </div>
                                          </div>
                                          <div className="relative">
                                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Rubro</label>
                                              <div className="flex gap-2">
                                                  <select className="flex-1 p-4 bg-white border rounded-2xl font-bold uppercase text-xs outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                      <option value="">-- SELECCIONE --</option>
                                                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                  </select>
                                                  <button onClick={() => setIsQuickAddOpen({type: 'CATEGORY', active: true})} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all"><Plus size={20}/></button>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="space-y-2">
                                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Proveedor Principal</label>
                                          <select className="w-full p-4 bg-white border rounded-2xl font-bold uppercase text-xs" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                              <option value="">-- SELECCIONE PROVEEDOR --</option>
                                              {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                          </select>
                                      </div>

                                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 border-b pb-2">Códigos Adicionales Personalizados</h4>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase">Código 1</label>
                                                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] font-bold uppercase outline-none focus:bg-white focus:border-indigo-400" value={formData.otrosCodigos1} onChange={e => setFormData({...formData, otrosCodigos1: e.target.value.toUpperCase()})} />
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase">Código 2</label>
                                                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] font-bold uppercase outline-none focus:bg-white focus:border-indigo-400" value={formData.otrosCodigos2} onChange={e => setFormData({...formData, otrosCodigos2: e.target.value.toUpperCase()})} />
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase">Código 3</label>
                                                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] font-bold uppercase outline-none focus:bg-white focus:border-indigo-400" value={formData.otrosCodigos3} onChange={e => setFormData({...formData, otrosCodigos3: e.target.value.toUpperCase()})} />
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase">Código 4</label>
                                                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] font-bold uppercase outline-none focus:bg-white focus:border-indigo-400" value={formData.otrosCodigos4} onChange={e => setFormData({...formData, otrosCodigos4: e.target.value.toUpperCase()})} />
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                                      {/* MULTICODIGOS */}
                                      <div className="space-y-8">
                                          <CodeListManager 
                                              label="Códigos SKU / Internos" 
                                              codes={formData.internalCodes || []} 
                                              onUpdate={(i, v) => updateCodeArray('internalCodes', i, v)} 
                                              onAdd={() => addCodeField('internalCodes')} 
                                              onRemove={(i) => removeCodeField('internalCodes', i)} 
                                          />
                                          <CodeListManager 
                                              label="Códigos de Barra (EAN/GTIN)" 
                                              codes={formData.barcodes || []} 
                                              onUpdate={(i, v) => updateCodeArray('barcodes', i, v)} 
                                              onAdd={() => addCodeField('barcodes')} 
                                              onRemove={(i) => removeCodeField('barcodes', i)} 
                                          />
                                          <CodeListManager 
                                              label="Códigos del Proveedor" 
                                              codes={formData.providerCodes || []} 
                                              onUpdate={(i, v) => updateCodeArray('providerCodes', i, v)} 
                                              onAdd={() => addCodeField('providerCodes')} 
                                              onRemove={(i) => removeCodeField('providerCodes', i)} 
                                          />
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalTab === 'PRICING' && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                                      <div className="space-y-6">
                                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">{"Fraccionamiento Bulto -> Unidad"}</label>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Costo Bulto Entero</label>
                                                  <div className="relative group">
                                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18}/>
                                                      <input type="number" className="w-full pl-10 p-3 bg-white border border-indigo-200 rounded-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" value={bulkCost} onChange={e => handleBulkCalc(parseFloat(e.target.value) || 0, formData.purchasePackageQuantity || 1)} />
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Unidades por Bulto</label>
                                                  <div className="relative group">
                                                      <Scaling className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18}/>
                                                      <input type="number" className="w-full pl-10 p-3 bg-white border border-indigo-200 rounded-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.purchasePackageQuantity} onChange={e => handleBulkCalc(bulkCost, parseFloat(e.target.value) || 1)} />
                                                  </div>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="space-y-4">
                                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Análisis de Costo Unitario</label>
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Costo Lista Unitario</label>
                                                  <div className="relative group">
                                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" size={20}/>
                                                      <input type="number" className="w-full pl-11 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-slate-800" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})} />
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Coef. Bonif. Costo</label>
                                                  <input type="number" step="0.001" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-indigo-600" value={formData.coeficienteBonificacionCosto} onChange={e => setFormData({...formData, coeficienteBonificacionCosto: parseFloat(e.target.value) || 1})} />
                                              </div>
                                          </div>
                                      </div>

                                      <div className="space-y-4 pt-6 border-t border-slate-100">
                                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Márgenes de Ganancia</label>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Margen Base (%)</label>
                                                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl text-indigo-600" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})} />
                                              </div>
                                              <div className="flex flex-col justify-end pb-1 text-right">
                                                  <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Costo c/ Bonif: ${formData.costAfterDiscounts}</p>
                                                  <p className="text-[8px] text-indigo-400 uppercase font-black tracking-widest">Neto de Venta: ${formData.priceNeto}</p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="bg-slate-950 p-12 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-center relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Activity size={240}/></div>
                                      <div className="relative z-10 space-y-12">
                                          <div className="text-center space-y-2">
                                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Precio Venta Final (IVA INC.)</p>
                                              <div className="flex items-baseline justify-center gap-3">
                                                  <span className="text-4xl font-black text-indigo-500">$</span>
                                                  <h2 className="text-8xl font-black tracking-tighter leading-none text-white transition-all">{formData.priceFinal?.toLocaleString('es-AR')}</h2>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalTab === 'TECHNICAL' && (
                              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-12">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                      <div className="space-y-6">
                                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Settings2 size={16}/> Configuración Fiscal</h4>
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tasa ($)</label>
                                                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl" value={formData.tasa} onChange={e => setFormData({...formData, tasa: parseFloat(e.target.value) || 0})} />
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Imp. Interno (%)</label>
                                                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl" value={formData.alicuotaImpuestoInterno} onChange={e => setFormData({...formData, alicuotaImpuestoInterno: parseFloat(e.target.value) || 0})} />
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalTab === 'STOCK' && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-3">
                                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Stock Mínimo</p>
                                      <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-600 outline-none font-black text-4xl text-center text-red-600" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})} />
                                  </div>
                                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-3">
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Punto de Pedido</p>
                                      <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-4xl text-center text-indigo-600" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                  </div>
                                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-3">
                                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Stock Máximo / Ideal</p>
                                      <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-black text-4xl text-center text-green-600" value={formData.stockMaximo} onChange={e => setFormData({...formData, stockMaximo: parseFloat(e.target.value) || 0})} />
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={async () => { if(formData.name) { await productDB.save(formData as Product); setIsModalOpen(false); } }} className="bg-slate-900 text-white px-16 py-4 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                          <Save size={20}/> Aplicar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* QUICK ADD MODAL (BRAND/CATEGORY) */}
      {isQuickAddOpen.active && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="font-black uppercase tracking-tighter">Alta Rápida: {isQuickAddOpen.type === 'BRAND' ? 'Marca' : 'Rubro'}</h3>
                      <button onClick={() => setIsQuickAddOpen({type: 'BRAND', active: false})}><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <input 
                        type="text" 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-slate-800 uppercase" 
                        value={quickAddName} 
                        onChange={e => setQuickAddName(e.target.value)} 
                        autoFocus 
                        placeholder="Nombre de la nueva entidad..."
                      />
                      <button onClick={handleQuickAdd} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                          <CheckCircle size={18}/> Incorporar y Seleccionar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Componente Helper para Listas de Códigos
const CodeListManager: React.FC<{
    label: string, 
    codes: string[], 
    onUpdate: (i: number, v: string) => void, 
    onAdd: () => void, 
    onRemove: (i: number) => void
}> = ({ label, codes, onUpdate, onAdd, onRemove }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                <button onClick={onAdd} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><PlusSquare size={20}/></button>
            </div>
            <div className="space-y-2">
                {codes.map((code, idx) => (
                    <div key={idx} className="flex gap-2 group animate-fade-in">
                        <input 
                            className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase"
                            value={code}
                            placeholder="Ingrese código..."
                            onChange={e => onUpdate(idx, e.target.value)}
                        />
                        {codes.length > 1 && (
                            <button onClick={() => onRemove(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Inventory;
