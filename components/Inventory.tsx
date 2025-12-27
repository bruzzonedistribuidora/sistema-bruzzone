
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, Globe, DollarSign, 
    Barcode, Pen, Trash2, Tag, Truck, Layers, Info, 
    Percent, Building2, Store, Activity, ChevronRight,
    AlertCircle, LayoutGrid, Database, Calculator, ShoppingCart,
    UserPlus, BookmarkPlus, FolderPlus, Box, List, ChevronDown, Minus,
    Hash, QrCode, PlusCircle, Check, ToggleLeft, ToggleRight, 
    Settings2, Boxes, AlertTriangle, Calendar, FileUp, FileSpreadsheet,
    Download, UploadCloud, RefreshCw
} from 'lucide-react';
import { Product, ProductStock, Brand, Category, ComboItem, Provider, CompanyConfig, Branch } from '../types';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'BRANDS' | 'CATEGORIES'>('PRODUCTS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const getDefaultProfitMargin = (): number => {
    return companyConfig.defaultProfitMargin ?? 30;
  };

  const initialProduct: Product = {
    id: '', 
    internalCodes: [''], 
    barcodes: [], 
    providerCodes: [],
    name: '', brand: '', provider: '', description: '', category: 'General',
    measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1,
    purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21.0,
    listCost: 0, discounts: [0,0,0,0], costAfterDiscounts: 0, profitMargin: getDefaultProfitMargin(),
    priceNeto: 0, priceFinal: 0, stock: 0, 
    stockDetails: [],
    minStock: 0, desiredStock: 0, reorderPoint: 0, location: '',
    ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
    isCombo: false,
    comboItems: [],
    lastProviders: []
  };

  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
      const saved = localStorage.getItem('ferrecloud_brands');
      return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
      const saved = localStorage.getItem('ferrecloud_categories');
      return saved ? JSON.parse(saved) : [];
  });

  const [providers, setProviders] = useState<Provider[]>(() => {
      const saved = localStorage.getItem('ferrecloud_providers');
      return saved ? JSON.parse(saved) : [];
  });

  const [branches] = useState<Branch[]>(() => {
      const saved = localStorage.getItem('ferrecloud_branches');
      return saved ? JSON.parse(saved) : [
          { id: '1', name: 'Casa Central' },
          { id: '2', name: 'Sucursal Norte' },
          { id: '3', name: 'Depósito' }
      ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'COMBO' | 'STOCK'>('GENERAL');
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<'BRAND' | 'CATEGORY' | 'PROVIDER' | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [comboSearch, setComboSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('ferrecloud_products', JSON.stringify(products));
    localStorage.setItem('ferrecloud_brands', JSON.stringify(brands));
    localStorage.setItem('ferrecloud_categories', JSON.stringify(categories));
    localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
  }, [products, brands, categories, providers]);

  useEffect(() => {
    let cost = 0;
    if (formData.isCombo && formData.comboItems && formData.comboItems.length > 0) {
        cost = formData.comboItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
    } else {
        cost = Number(formData.listCost) || 0;
        formData.discounts.forEach(d => {
            if (d > 0) cost = cost * (1 - d / 100);
        });
    }
    const priceNeto = cost * (1 + (Number(formData.profitMargin) || 0) / 100);
    const priceFinal = priceNeto * (1 + (Number(formData.vatRate) || 0) / 100);
    setFormData(prev => ({
        ...prev,
        listCost: formData.isCombo ? cost : prev.listCost,
        costAfterDiscounts: parseFloat(cost.toFixed(2)),
        priceNeto: parseFloat(priceNeto.toFixed(2)),
        priceFinal: parseFloat(priceFinal.toFixed(2))
    }));
  }, [formData.listCost, formData.discounts, formData.profitMargin, formData.vatRate, formData.isCombo, formData.comboItems]);

  const handleSaveProduct = () => {
    const mainSKU = formData.internalCodes[0]?.trim();
    const description = formData.name?.trim();

    if (!description || !mainSKU) {
        alert("Atención: El Código SKU Principal y la Descripción Comercial son campos obligatorios.");
        return;
    }

    const totalStock = formData.stockDetails.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const finalProduct = { 
        ...formData, 
        internalCodes: formData.internalCodes.filter(c => c.trim() !== ''),
        stock: totalStock 
    };

    setProducts(prev => {
        const existingIndex = prev.findIndex(p => p.id === finalProduct.id);
        if (existingIndex >= 0) {
            const newProducts = [...prev];
            newProducts[existingIndex] = finalProduct;
            return newProducts;
        } else {
            return [finalProduct, ...prev];
        }
    });
    setIsModalOpen(false);
  };

  const handleQuickAdd = () => {
      if (!quickAddValue.trim()) return;
      const cleanValue = quickAddValue.trim().toUpperCase();

      if (isQuickAddOpen === 'BRAND') {
          setBrands([...brands, { id: Date.now().toString(), name: cleanValue }]);
          setFormData({ ...formData, brand: cleanValue });
      } else if (isQuickAddOpen === 'CATEGORY') {
          setCategories([...categories, { id: Date.now().toString(), name: cleanValue }]);
          setFormData({ ...formData, category: cleanValue });
      } else if (isQuickAddOpen === 'PROVIDER') {
          setProviders([...providers, { id: Date.now().toString(), name: cleanValue, cuit: '', contact: '', balance: 0, defaultDiscounts: [0,0,0] }]);
          setFormData({ ...formData, provider: cleanValue });
      }
      setIsQuickAddOpen(null);
      setQuickAddValue('');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          // Separar por líneas y limpiar
          const items = content.split(/\r?\n/).map(line => line.trim().toUpperCase()).filter(line => line.length > 0);
          
          if (inventoryTab === 'BRANDS') {
              const currentNames = new Set(brands.map(b => b.name));
              const newBrands: Brand[] = [];
              items.forEach(name => {
                  if (!currentNames.has(name)) {
                      newBrands.push({ id: `b-${Date.now()}-${Math.random()}`, name });
                      currentNames.add(name);
                  }
              });
              setBrands([...brands, ...newBrands]);
              alert(`Importación finalizada. Se agregaron ${newBrands.length} marcas nuevas.`);
          } else if (inventoryTab === 'CATEGORIES') {
              const currentNames = new Set(categories.map(c => c.name));
              const newCats: Category[] = [];
              items.forEach(name => {
                  if (!currentNames.has(name)) {
                      newCats.push({ id: `c-${Date.now()}-${Math.random()}`, name });
                      currentNames.add(name);
                  }
              });
              setCategories([...categories, ...newCats]);
              alert(`Importación finalizada. Se agregaron ${newCats.length} categorías nuevas.`);
          }
      };
      reader.readAsText(file);
      // Resetear input para poder subir el mismo archivo si se limpia
      e.target.value = '';
  };

  const addComboComponent = (p: Product) => {
      if (p.id === formData.id) {
          alert("Un combo no puede contenerse a sí mismo.");
          return;
      }
      const newItem: ComboItem = {
          productId: p.id,
          productName: p.name,
          quantity: 1,
          unitCost: p.costAfterDiscounts || p.listCost
      };
      setFormData({
          ...formData,
          comboItems: [...(formData.comboItems || []), newItem]
      });
      setComboSearch('');
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.internalCodes.some(c => c.toLowerCase().includes(term)) ||
        p.brand.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const filteredBrands = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      return brands.filter(b => b.name.toLowerCase().includes(term)).sort((a,b) => a.name.localeCompare(b.name));
  }, [searchTerm, brands]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(c => c.name.toLowerCase().includes(term)).sort((a,b) => a.name.localeCompare(b.name));
  }, [searchTerm, categories]);

  const comboSearchResults = useMemo(() => {
      if (!comboSearch) return [];
      return products.filter(p => 
          p.name.toLowerCase().includes(comboSearch.toLowerCase()) || 
          p.internalCodes.some(c => c.toLowerCase().includes(comboSearch.toLowerCase()))
      ).slice(0, 5);
  }, [comboSearch, products]);

  const MultiCodeManager = ({ label, icon: Icon, codes, setCodes, placeholder, color }: { label: string, icon: any, codes: string[], setCodes: (c: string[]) => void, placeholder: string, color: string }) => {
    const [inputValue, setInputValue] = useState('');
    const addCode = () => {
        const clean = inputValue.trim().toUpperCase();
        if (clean && !codes.includes(clean)) setCodes([...codes, clean]);
        setInputValue('');
    };
    return (
        <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase mb-1 tracking-widest ${color}`}>{label}</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14}/>
                    <input className="w-full pl-9 p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 font-bold text-xs uppercase outline-none" placeholder={placeholder} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCode())}/>
                </div>
                <button onClick={addCode} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 min-h-[30px]">
                {codes.map(c => (
                    <span key={c} className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[9px] font-black text-slate-700 flex items-center gap-2 group shadow-sm">
                        {c} <button onClick={() => setCodes(codes.filter(x => x !== c))} className="text-gray-300 hover:text-red-500"><X size={10}/></button>
                    </span>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="p-4 h-full flex flex-col max-w-full mx-auto space-y-3 bg-slate-50 overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleImportFile} />

      <div className="flex justify-between items-end bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
          <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Database size={22} className="text-indigo-600"/> Inventario Maestro
              </h2>
              <div className="flex mt-3 bg-slate-100 p-1 rounded-xl gap-1">
                  <button onClick={() => { setInventoryTab('PRODUCTS'); setSearchTerm(''); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-slate-600'}`}>Artículos ({products.length})</button>
                  <button onClick={() => { setInventoryTab('BRANDS'); setSearchTerm(''); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-slate-600'}`}>Marcas ({brands.length})</button>
                  <button onClick={() => { setInventoryTab('CATEGORIES'); setSearchTerm(''); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'CATEGORIES' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-slate-600'}`}>Categorías ({categories.length})</button>
              </div>
          </div>
          
          <div className="flex gap-3">
              {(inventoryTab === 'BRANDS' || inventoryTab === 'CATEGORIES') && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-black flex items-center gap-3 transition-all border border-indigo-100 uppercase text-xs tracking-widest hover:bg-indigo-100">
                    <FileSpreadsheet size={18} /> Importar Excel/CSV
                  </button>
              )}
              {inventoryTab === 'PRODUCTS' && (
                  <button onClick={() => {setFormData({...initialProduct, profitMargin: getDefaultProfitMargin(), id: Date.now().toString(), stockDetails: branches.map(b => ({ branchId: b.id, branchName: b.name, quantity: 0 }))}); setModalTab('GENERAL'); setIsModalOpen(true);}} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-3 transition-all uppercase text-xs tracking-widest hover:bg-slate-800">
                      <Plus size={18} /> Nuevo Artículo
                  </button>
              )}
              {inventoryTab !== 'PRODUCTS' && (
                  <button onClick={() => setIsQuickAddOpen(inventoryTab === 'BRANDS' ? 'BRAND' : 'CATEGORY')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-3 transition-all uppercase text-xs tracking-widest hover:bg-slate-800">
                      <Plus size={18} /> Nueva {inventoryTab === 'BRANDS' ? 'Marca' : 'Categoría'}
                  </button>
              )}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 shrink-0">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="text" placeholder={`Buscar en ${inventoryTab === 'PRODUCTS' ? 'catálogo...' : inventoryTab === 'BRANDS' ? 'listado de marcas...' : 'categorías...'}`} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
            {inventoryTab === 'PRODUCTS' && (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                        <tr>
                            <th className="px-4 py-3 border-r border-slate-800">Cód. SKU</th>
                            <th className="px-4 py-3 border-r border-slate-800">Descripción / Marca</th>
                            <th className="px-4 py-3 border-r border-slate-800 text-center">Tipo</th>
                            <th className="px-4 py-3 text-right border-r border-slate-800">Stock Total</th>
                            <th className="px-4 py-3 text-right border-r border-slate-800">Venta Final</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px]">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-4 py-2.5 font-mono font-bold text-slate-500">
                                    {product.internalCodes[0] || 'S/C'}
                                </td>
                                <td className="px-4 py-2.5">
                                    <p className="font-black text-slate-800 uppercase leading-none mb-1">{product.name}</p>
                                    <p className="text-indigo-600 font-black uppercase text-[9px]">{product.brand}</p>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${product.isCombo ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{product.isCombo ? 'Combo' : 'Simple'}</span>
                                </td>
                                <td className={`px-4 py-2.5 text-right font-black ${product.stock <= product.reorderPoint ? 'text-red-600' : 'text-slate-700'}`}>
                                    {product.stock}
                                </td>
                                <td className="px-4 py-2.5 text-right font-black text-slate-900 bg-indigo-50/20">
                                    ${product.priceFinal.toLocaleString('es-AR')}
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setFormData(product); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-all"><Pen size={14} /></button>
                                        <button onClick={() => { if(confirm('¿Eliminar producto?')) setProducts(products.filter(p => p.id !== product.id)) }} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {inventoryTab === 'BRANDS' && (
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in">
                    {filteredBrands.map(brand => (
                        <div key={brand.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                            <span className="font-black text-[10px] uppercase text-slate-700 truncate mr-2">{brand.name}</span>
                            <button onClick={() => { if(confirm('¿Eliminar marca?')) setBrands(brands.filter(b => b.id !== brand.id)) }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                        </div>
                    ))}
                    {filteredBrands.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-300 uppercase font-black tracking-widest">Sin resultados en marcas</div>
                    )}
                </div>
            )}

            {inventoryTab === 'CATEGORIES' && (
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in">
                    {filteredCategories.map(cat => (
                        <div key={cat.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                            <span className="font-black text-[10px] uppercase text-slate-700 truncate mr-2">{cat.name}</span>
                            <button onClick={() => { if(confirm('¿Eliminar categoría?')) setCategories(categories.filter(c => c.id !== cat.id)) }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                        </div>
                    ))}
                    {filteredCategories.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-300 uppercase font-black tracking-widest">Sin resultados en categorías</div>
                    )}
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${formData.isCombo ? 'bg-purple-500' : 'bg-indigo-500'}`}><Package size={20}/></div>
                          <h3 className="text-sm font-black uppercase tracking-widest">{formData.internalCodes[0] || 'Nuevo Artículo'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={20} /></button>
                  </div>

                  <div className="flex bg-slate-100 p-1 gap-1 border-b border-gray-200 shrink-0">
                      {['GENERAL', 'PRICING', 'COMBO', 'STOCK'].map(tab => (
                          <button key={tab} onClick={() => setModalTab(tab as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === tab ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-gray-400 hover:text-slate-600'}`}>
                              {tab === 'GENERAL' ? <Settings2 size={14}/> : tab === 'PRICING' ? <DollarSign size={14}/> : tab === 'COMBO' ? <Boxes size={14}/> : <Store size={14}/>}
                              <span className="hidden sm:inline ml-2">{tab === 'GENERAL' ? 'Datos' : tab === 'PRICING' ? 'Venta' : tab === 'COMBO' ? 'Combo' : 'Stock'}</span>
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                      {modalTab === 'GENERAL' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                  <div>
                                      <label className="block text-[10px] font-black uppercase mb-2 tracking-widest text-indigo-600">Código SKU Principal *</label>
                                      <div className="relative">
                                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14}/>
                                          <input 
                                              className="w-full pl-9 p-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-black text-xs uppercase outline-none shadow-sm" 
                                              placeholder="OBLIGATORIO..." 
                                              value={formData.internalCodes[0] || ''} 
                                              onChange={e => {
                                                  const newCodes = [...formData.internalCodes];
                                                  newCodes[0] = e.target.value.toUpperCase();
                                                  setFormData({...formData, internalCodes: newCodes});
                                              }}
                                          />
                                      </div>
                                  </div>
                                  <MultiCodeManager label="Cód. Proveedor" icon={Truck} codes={formData.providerCodes} setCodes={(c) => setFormData({...formData, providerCodes: c})} placeholder="REF-..." color="text-blue-600"/>
                                  <MultiCodeManager label="Códigos de Barras" icon={QrCode} codes={formData.barcodes} setCodes={(c) => setFormData({...formData, barcodes: c})} placeholder="EAN-..." color="text-slate-600"/>
                              </div>

                              <div className="md:col-span-2">
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Descripción Comercial *</label>
                                  <input 
                                      className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 font-bold text-sm uppercase outline-none" 
                                      placeholder="NOMBRE DEL PRODUCTO..."
                                      value={formData.name} 
                                      onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                                  />
                              </div>
                              
                              <div className="space-y-1">
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Marca</label>
                                  <div className="flex gap-2">
                                      <select className="flex-1 p-3 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs outline-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                          <option value="">-- SELECCIONAR --</option>
                                          {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                      </select>
                                      <button onClick={() => setIsQuickAddOpen('BRAND')} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all" title="Añadir nueva marca a la lista"><Plus size={18}/></button>
                                  </div>
                              </div>

                              <div className="space-y-1">
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Categoría</label>
                                  <div className="flex gap-2">
                                      <select className="flex-1 p-3 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                          <option value="">-- SELECCIONAR --</option>
                                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                      </select>
                                      <button onClick={() => setIsQuickAddOpen('CATEGORY')} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all" title="Añadir nueva categoría a la lista"><Plus size={18}/></button>
                                  </div>
                              </div>

                              <div className="space-y-1 md:col-span-1">
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Proveedor Principal</label>
                                  <div className="flex gap-2">
                                      <select className="flex-1 p-3 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs outline-none" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                          <option value="">-- SELECCIONAR --</option>
                                          {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                      </select>
                                      <button onClick={() => setIsQuickAddOpen('PROVIDER')} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all" title="Añadir nuevo proveedor a la lista"><Plus size={18}/></button>
                                  </div>
                              </div>

                              <div className="md:col-span-1">
                                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 h-full">
                                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                          <Truck size={14}/> Historial de Compras
                                      </h4>
                                      <div className="space-y-2">
                                          {(!formData.lastProviders || formData.lastProviders.length === 0) ? (
                                              <p className="text-[9px] text-slate-400 italic uppercase">Sin compras registradas</p>
                                          ) : formData.lastProviders.map((hist, idx) => (
                                              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                  <div className="flex-1 min-w-0 mr-3">
                                                      <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-1">{hist.name}</p>
                                                      <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase">
                                                          <Calendar size={10}/> {hist.date}
                                                      </div>
                                                  </div>
                                                  <div className="text-right">
                                                      <p className="text-[10px] font-black text-indigo-600 tracking-tighter">${hist.price.toLocaleString('es-AR')}</p>
                                                      <p className="text-[7px] font-black text-slate-300 uppercase">COSTO</p>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-slate-50 p-8 rounded-3xl border border-gray-200 space-y-6">
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Costo Bruto</label>
                                          <div className="relative">
                                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                                              <input type="number" className="w-full pl-12 p-4 border-2 border-slate-200 rounded-2xl font-black text-3xl outline-none focus:border-indigo-500" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})}/>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Bonificaciones (%)</label>
                                          <div className="grid grid-cols-4 gap-3">
                                              {formData.discounts.map((d, i) => (
                                                  <div key={i} className="relative">
                                                      <input type="number" className="w-full p-3 border-2 border-slate-100 rounded-xl text-center font-black text-sm outline-none focus:border-indigo-400" value={d} onChange={e => {
                                                          const newDiscounts = [...formData.discounts] as [number, number, number, number];
                                                          newDiscounts[i] = parseFloat(e.target.value) || 0;
                                                          setFormData({...formData, discounts: newDiscounts});
                                                      }}/>
                                                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-200 text-[8px] font-black px-1 rounded">D{i+1}</div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                          <span className="text-xs font-black text-slate-400 uppercase">Costo Neto:</span>
                                          <span className="text-xl font-black text-indigo-600">${formData.costAfterDiscounts.toLocaleString('es-AR')}</span>
                                      </div>
                                  </div>
                                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Calculator size={160}/></div>
                                      <div className="relative z-10">
                                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2"><Percent size={14} className="text-green-400"/> Margen Utilidad</label>
                                          <input type="number" className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl font-black text-4xl text-white outline-none focus:border-green-500 transition-all" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})}/>
                                      </div>
                                      <div className="relative z-10 pt-6 border-t border-white/10 text-right">
                                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">PVP (IVA Inc.)</label>
                                          <p className="text-6xl font-black text-green-400 tracking-tighter leading-none">${formData.priceFinal.toLocaleString('es-AR')}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'COMBO' && (
                          <div className="space-y-6 animate-fade-in flex flex-col h-full">
                              <div className="bg-purple-50 border border-purple-100 p-6 rounded-[2rem] flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <button 
                                          onClick={() => setFormData({...formData, isCombo: !formData.isCombo, comboItems: []})}
                                          className={`w-14 h-7 rounded-full relative transition-all ${formData.isCombo ? 'bg-purple-600' : 'bg-slate-300'}`}>
                                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.isCombo ? 'right-1' : 'left-1'}`}></div>
                                      </button>
                                      <div>
                                          <h4 className="font-black text-purple-900 uppercase text-xs">Modo Artículo Compuesto</h4>
                                          <p className="text-[10px] text-purple-400 font-bold uppercase">Costo basado en suma de componentes.</p>
                                      </div>
                                  </div>
                              </div>

                              {formData.isCombo && (
                                  <div className="flex-1 flex flex-col gap-6 animate-fade-in">
                                      <div className="relative">
                                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Añadir componente al combo</label>
                                          <div className="flex items-center bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500">
                                              <Search className="text-gray-300 mr-3" size={20}/>
                                              <input 
                                                  type="text" 
                                                  className="bg-transparent flex-1 outline-none font-bold text-sm uppercase" 
                                                  placeholder="SKU o nombre..."
                                                  value={comboSearch}
                                                  onChange={e => setComboSearch(e.target.value)}
                                              />
                                          </div>
                                          {comboSearchResults.length > 0 && (
                                              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[50] p-2">
                                                  {comboSearchResults.map(p => (
                                                      <button key={p.id} onClick={() => addComboComponent(p)} className="w-full flex justify-between items-center p-3 hover:bg-purple-50 rounded-xl transition-all border-b last:border-0 border-gray-50">
                                                          <div className="text-left">
                                                              <p className="font-black text-xs uppercase">{p.name}</p>
                                                              <p className="text-[9px] text-gray-400 font-mono">{p.internalCodes[0]}</p>
                                                          </div>
                                                          <Plus size={18} className="text-purple-600"/>
                                                      </button>
                                                  ))}
                                              </div>
                                          )}
                                      </div>

                                      <div className="flex-1 bg-white border border-gray-200 rounded-[2rem] overflow-hidden">
                                          <table className="w-full text-left">
                                              <thead className="bg-slate-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                                                  <tr>
                                                      <th className="px-6 py-4">Componente</th>
                                                      <th className="px-6 py-4 text-center">Cantidad</th>
                                                      <th className="px-6 py-4 text-right">Costo Unit.</th>
                                                      <th className="px-6 py-4 text-right">Subtotal</th>
                                                      <th className="px-6 py-4"></th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100">
                                                  {formData.comboItems?.length === 0 ? (
                                                      <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase text-[10px]">Sin componentes</td></tr>
                                                  ) : formData.comboItems?.map((item, idx) => (
                                                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                          <td className="px-6 py-4 font-black text-slate-700 text-xs uppercase">{item.productName}</td>
                                                          <td className="px-6 py-4">
                                                              <div className="flex items-center justify-center gap-3 bg-slate-100 rounded-xl p-1 w-24 mx-auto">
                                                                  <button onClick={() => {
                                                                      const items = [...(formData.comboItems || [])];
                                                                      items[idx].quantity = Math.max(1, items[idx].quantity - 1);
                                                                      setFormData({...formData, comboItems: items});
                                                                  }} className="p-1 text-slate-400"><Minus size={12}/></button>
                                                                  <span className="font-black text-xs">{item.quantity}</span>
                                                                  <button onClick={() => {
                                                                      const items = [...(formData.comboItems || [])];
                                                                      items[idx].quantity += 1;
                                                                      setFormData({...formData, comboItems: items});
                                                                  }} className="p-1 text-slate-400"><Plus size={12}/></button>
                                                              </div>
                                                          </td>
                                                          <td className="px-6 py-4 text-right font-bold text-slate-400">${item.unitCost.toLocaleString('es-AR')}</td>
                                                          <td className="px-6 py-4 text-right font-black text-slate-900">${(item.unitCost * item.quantity).toLocaleString('es-AR')}</td>
                                                          <td className="px-6 py-4 text-right">
                                                              <button onClick={() => setFormData({...formData, comboItems: formData.comboItems?.filter((_, i) => i !== idx)})} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}

                      {modalTab === 'STOCK' && (
                          <div className="space-y-8 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-gray-200 space-y-6">
                                      <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><AlertTriangle size={20} className="text-orange-500"/> Reposición</h4>
                                      <div className="grid grid-cols-1 gap-6">
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Punto de Pedido</label>
                                              <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-xl outline-none" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})}/>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Mínimo</label>
                                                  <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-xl outline-none" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}/>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Deseado</label>
                                                  <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-xl outline-none" value={formData.desiredStock} onChange={e => setFormData({...formData, desiredStock: parseFloat(e.target.value) || 0})}/>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="bg-white border border-gray-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                                      <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                          <h4 className="font-black uppercase tracking-widest text-xs">Ubicación de Stock</h4>
                                          <span className="text-[10px] font-black text-indigo-400">Total: {formData.stockDetails.reduce((a,c) => a + (Number(c.quantity) || 0), 0)}</span>
                                      </div>
                                      <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                          {formData.stockDetails.map((sd, idx) => (
                                              <div key={sd.branchId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                  <div className="flex items-center gap-3">
                                                      <Store size={18} className="text-slate-400"/>
                                                      <span className="font-black text-slate-700 uppercase text-xs">{sd.branchName}</span>
                                                  </div>
                                                  <input 
                                                      type="number" 
                                                      className="w-24 p-2 bg-white border border-gray-200 rounded-xl text-center font-black text-lg" 
                                                      value={sd.quantity} 
                                                      onChange={e => {
                                                          const newDetails = [...formData.stockDetails];
                                                          newDetails[idx].quantity = parseFloat(e.target.value) || 0;
                                                          setFormData({...formData, stockDetails: newDetails});
                                                      }}
                                                  />
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase">Cancelar</button>
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-12 py-3 rounded-xl font-black uppercase text-[10px] shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all">
                          <Save size={18}/> {formData.id ? 'Guardar Cambios' : 'Confirmar Alta'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isQuickAddOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 space-y-6">
                  <div className="text-center">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Nueva {isQuickAddOpen === 'BRAND' ? 'Marca' : isQuickAddOpen === 'CATEGORY' ? 'Categoría' : 'Entidad'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Se añadirá a la lista maestra</p>
                  </div>
                  <input 
                      autoFocus
                      type="text" 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black text-slate-800 uppercase text-center"
                      placeholder="ESCRIBA EL NOMBRE..."
                      value={quickAddValue}
                      onChange={e => setQuickAddValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setIsQuickAddOpen(null)} className="flex-1 py-3 text-gray-400 font-black text-[10px] uppercase">Cerrar</button>
                      <button onClick={handleQuickAdd} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Confirmar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
