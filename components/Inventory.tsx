
import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Filter, Package, X, Save, Globe, DollarSign, 
    Barcode, LayoutList, RefreshCcw, Edit3, Pen, Trash2, 
    CheckCircle, ArrowRightLeft, PackagePlus, Settings2, Eye, 
    EyeOff, Tag, Truck, Layers, ShoppingBag, AlertCircle, Info,
    Percent, Building2, Store, Monitor, TrendingDown, ArrowUpRight
} from 'lucide-react';
import { Product, ProductStock } from '../types';

const Inventory: React.FC = () => {
  const initialProduct: Product = {
    id: '', internalCode: '', barcodes: [], providerCodes: [],
    name: '', brand: '', provider: '', description: '', category: 'General',
    measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1,
    purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21.0,
    listCost: 0, discounts: [0,0,0,0], costAfterDiscounts: 0, profitMargin: 30,
    priceNeto: 0, priceFinal: 0, stock: 0, 
    stockDetails: [
        { branchId: '1', branchName: 'Casa Central', quantity: 0 },
        { branchId: '2', branchName: 'Depósito Norte', quantity: 0 }
    ],
    minStock: 0, desiredStock: 0, reorderPoint: 0, location: '',
    ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
  };

  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [visibleColumns, setVisibleColumns] = useState(() => {
      const saved = localStorage.getItem('ferrecloud_inventory_columns');
      return saved ? JSON.parse(saved) : {
          brand: true, category: true, provider: false,
          listCost: false, priceNeto: false, priceFinal: true, stock: true
      };
  });

  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'MASS_EDIT' | 'TRANSFERS'>('LIST');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'ECOMMERCE'>('GENERAL');
  
  // Persistence
  useEffect(() => { localStorage.setItem('ferrecloud_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('ferrecloud_inventory_columns', JSON.stringify(visibleColumns)); }, [visibleColumns]);

  // --- LÓGICA DE CÁLCULO DE PRECIOS EN TIEMPO REAL ---
  useEffect(() => {
    let cost = Number(formData.listCost) || 0;
    // Aplicar descuentos en cascada
    formData.discounts.forEach(d => { if (d > 0) cost = cost * (1 - d / 100); });
    
    const priceNeto = cost * (1 + (Number(formData.profitMargin) || 0) / 100);
    const priceFinal = priceNeto * (1 + (Number(formData.vatRate) || 0) / 100);

    setFormData(prev => ({
        ...prev,
        costAfterDiscounts: parseFloat(cost.toFixed(2)),
        priceNeto: parseFloat(priceNeto.toFixed(2)),
        priceFinal: parseFloat(priceFinal.toFixed(2))
    }));
  }, [formData.listCost, formData.discounts, formData.profitMargin, formData.vatRate]);

  // --- HANDLERS ---
  const handleOpenModal = () => {
    setFormData({...initialProduct, id: Date.now().toString()});
    setIsModalOpen(true);
    setModalTab('GENERAL');
  };

  const handleEditProduct = (product: Product) => {
      setFormData({ ...product });
      setIsModalOpen(true);
      setModalTab('GENERAL');
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.internalCode) {
        alert("El nombre y el código interno son obligatorios.");
        return;
    }
    const totalStock = formData.stockDetails.reduce((acc, curr) => acc + curr.quantity, 0);
    const finalProduct = { ...formData, stock: totalStock };

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

  const updateDiscount = (index: number, value: number) => {
      const newDiscounts = [...formData.discounts] as [number, number, number, number];
      newDiscounts[index] = value;
      setFormData({ ...formData, discounts: newDiscounts });
  };

  const updateBranchStock = (branchId: string, qty: number) => {
      const newDetails = formData.stockDetails.map(s => s.branchId === branchId ? { ...s, quantity: qty } : s);
      setFormData({ ...formData, stockDetails: newDetails });
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto space-y-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestión de Inventario</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">{products.length} Artículos en total</span>
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={handleOpenModal} className="bg-ferre-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95 uppercase text-xs tracking-widest">
                  <Plus size={18} /> Nuevo Producto
              </button>
          </div>
      </div>

      {/* TABS DE VISTA */}
      <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-fit">
            <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'LIST' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Listado</button>
            <button onClick={() => setViewMode('TRANSFERS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'TRANSFERS' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Transferencias</button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 flex gap-4 bg-gray-50/50">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por código, nombre, marca o categoría..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-ferre-orange outline-none shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
                    <tr>
                        <th className="px-8 py-5">Código / SKU</th>
                        <th className="px-8 py-5">Descripción</th>
                        <th className="px-8 py-5">Marca / Cat.</th>
                        <th className="px-8 py-5 text-right">Stock Total</th>
                        <th className="px-8 py-5 text-right">Precio Final</th>
                        <th className="px-8 py-5 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalCode.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6 font-mono font-bold text-slate-400 text-xs uppercase">{product.internalCode}</td>
                            <td className="px-8 py-6">
                                <div className="font-black text-slate-800 uppercase tracking-tight hover:text-ferre-orange cursor-pointer" onClick={() => handleEditProduct(product)}>{product.name}</div>
                            </td>
                            <td className="px-8 py-6">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{product.brand}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{product.category}</p>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <span className={`font-black text-sm px-3 py-1 rounded-lg ${product.stock <= product.minStock ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                    {product.stock}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-900 text-lg tracking-tighter">
                                ${product.priceFinal.toLocaleString('es-AR')}
                            </td>
                            <td className="px-8 py-6 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditProduct(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pen size={18} /></button>
                                    <button onClick={() => { if(confirm('¿Eliminar producto?')) setProducts(products.filter(p => p.id !== product.id)) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                    <Package size={80} strokeWidth={1} className="opacity-10 mb-4"/>
                    <p className="text-xl font-black uppercase tracking-tighter">Inventario Vacío</p>
                    <p className="text-sm">Empieza cargando tu primer artículo.</p>
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL DE CARGA / EDICIÓN --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-8 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/20">
                              <Package size={28}/>
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                  {formData.id === '' ? 'Nuevo Artículo' : 'Editar Producto'}
                              </h3>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ficha técnica y financiera</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={28} /></button>
                  </div>

                  {/* Tabs del Modal */}
                  <div className="flex bg-slate-100/50 p-2 gap-2 border-b border-gray-100">
                      {[
                          { id: 'GENERAL', label: 'General', icon: Info },
                          { id: 'PRICING', label: 'Precios y Márgenes', icon: DollarSign },
                          { id: 'STOCK', label: 'Stock y Alertas', icon: Layers },
                          { id: 'ECOMMERCE', label: 'E-commerce', icon: Globe }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setModalTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:bg-white/50'}`}
                          >
                              <tab.icon size={16}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                      
                      {/* --- TAB: GENERAL --- */}
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-8 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Código Interno / SKU</label>
                                          <div className="relative group">
                                              <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-ferre-orange transition-colors"/>
                                              <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-slate-700 transition-all uppercase" placeholder="EJ: TOR-001" value={formData.internalCode} onChange={e => setFormData({...formData, internalCode: e.target.value.toUpperCase()})}/>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Nombre del Producto</label>
                                          <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-black text-slate-800 text-lg transition-all uppercase" placeholder="TORNILLO AUTOPERFORANTE T1 2 PULGADAS" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}/>
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Marca</label>
                                              <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-slate-700 transition-all" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}/>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Categoría</label>
                                              <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-slate-700 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}/>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Proveedor Principal</label>
                                          <div className="relative group">
                                              <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-ferre-orange transition-colors"/>
                                              <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-slate-700 transition-all" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})}/>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Descripción Detallada</label>
                                  <textarea className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-medium text-slate-600 transition-all h-32 resize-none" placeholder="Especificaciones técnicas, medidas, material..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                              </div>
                          </div>
                      )}

                      {/* --- TAB: PRICING --- */}
                      {modalTab === 'PRICING' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                  {/* Columna Costos */}
                                  <div className="space-y-6">
                                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                          {/* Fix: Added missing icon TrendingDown from lucide-react */}
                                          <TrendingDown size={18} className="text-red-500"/> Costo de Adquisición
                                      </h4>
                                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 space-y-6">
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Costo Lista (Bruto)</label>
                                              <div className="relative group">
                                                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" size={24}/>
                                                  <input type="number" className="w-full pl-12 pr-4 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-red-500 outline-none font-black text-3xl text-red-600 transition-all" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})}/>
                                              </div>
                                          </div>
                                          
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Descuentos en Cascada (%)</label>
                                              <div className="grid grid-cols-4 gap-3">
                                                  {formData.discounts.map((d, i) => (
                                                      <div key={i} className="relative group">
                                                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500" size={12}/>
                                                          <input type="number" className="w-full p-3 pr-8 bg-white border border-gray-200 rounded-xl focus:border-red-500 outline-none font-bold text-center" value={d} onChange={e => updateDiscount(i, parseFloat(e.target.value) || 0)}/>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Neto de Reposición</span>
                                              <span className="text-xl font-black text-red-700">${formData.costAfterDiscounts.toLocaleString('es-AR')}</span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Columna Venta */}
                                  <div className="space-y-6">
                                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                          {/* Fix: Added missing icon ArrowUpRight from lucide-react */}
                                          <ArrowUpRight size={18} className="text-green-600"/> Margen y Venta
                                      </h4>
                                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 space-y-6">
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Margen Utilidad (%)</label>
                                                  <div className="relative group">
                                                      <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-600" size={18}/>
                                                      <input type="number" className="w-full p-4 pr-12 bg-white border-2 border-transparent rounded-2xl focus:border-green-600 outline-none font-black text-2xl text-green-600 transition-all" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})}/>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Alícuota IVA</label>
                                                  <select className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 outline-none font-black text-xl text-slate-700 transition-all" value={formData.vatRate} onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value) as any})}>
                                                      <option value={21.0}>21.0%</option>
                                                      <option value={10.5}>10.5%</option>
                                                      <option value={27.0}>27.0%</option>
                                                      <option value={0}>Exento (0%)</option>
                                                  </select>
                                              </div>
                                          </div>

                                          <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                                              <div className="flex justify-between items-center">
                                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio Neto Venta</span>
                                                  <span className="text-lg font-bold text-slate-700">${formData.priceNeto.toLocaleString('es-AR')}</span>
                                              </div>
                                              <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-900/20 text-center">
                                                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Precio de Venta Final</p>
                                                  <p className="text-5xl font-black tracking-tighter leading-none">${formData.priceFinal.toLocaleString('es-AR')}</p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- TAB: STOCK --- */}
                      {modalTab === 'STOCK' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                  <div className="space-y-6">
                                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                          <Building2 size={18} className="text-blue-600"/> Distribución por Sucursal
                                      </h4>
                                      <div className="space-y-3">
                                          {formData.stockDetails.map(branch => (
                                              <div key={branch.branchId} className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                                                  <div className="flex items-center gap-4">
                                                      <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm"><Store size={20}/></div>
                                                      <span className="font-black text-slate-800 uppercase tracking-tight">{branch.branchName}</span>
                                                  </div>
                                                  <div className="w-32">
                                                      <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-blue-600 outline-none font-black text-center text-lg" value={branch.quantity} onChange={e => updateBranchStock(branch.branchId, parseInt(e.target.value) || 0)}/>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="space-y-6">
                                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                          <AlertCircle size={18} className="text-orange-500"/> Alertas de Reposición
                                      </h4>
                                      <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 grid grid-cols-2 gap-8">
                                          <div>
                                              <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-2">Stock Mínimo (Crítico)</label>
                                              <input type="number" className="w-full p-4 bg-white border border-orange-200 rounded-2xl focus:border-orange-500 outline-none font-black text-xl text-orange-600 transition-all" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}/>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-2">Punto de Reorden</label>
                                              <input type="number" className="w-full p-4 bg-white border border-orange-200 rounded-2xl focus:border-orange-500 outline-none font-black text-xl text-orange-600 transition-all" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value) || 0})}/>
                                          </div>
                                          <div className="col-span-2">
                                              <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-2">Stock Ideal (Deseado)</label>
                                              <input type="number" className="w-full p-4 bg-white border border-orange-200 rounded-2xl focus:border-orange-500 outline-none font-black text-2xl text-orange-700 transition-all" value={formData.desiredStock} onChange={e => setFormData({...formData, desiredStock: parseInt(e.target.value) || 0})}/>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- TAB: ECOMMERCE --- */}
                      {modalTab === 'ECOMMERCE' && (
                          <div className="space-y-6 animate-fade-in">
                               <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Canales de Venta Digital</h4>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   {[
                                       { id: 'mercadoLibre', label: 'Mercado Libre', icon: ShoppingBag, color: 'bg-[#FFF159] text-gray-800' },
                                       { id: 'tiendaNube', label: 'Tienda Nube', icon: Globe, color: 'bg-[#00AEEF] text-white' },
                                       { id: 'webPropia', label: 'Web Propia', icon: Monitor, color: 'bg-slate-900 text-white' }
                                   ].map(channel => (
                                       <button 
                                        key={channel.id}
                                        onClick={() => setFormData({...formData, ecommerce: {...formData.ecommerce, [channel.id]: !formData.ecommerce[channel.id]}})}
                                        className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${formData.ecommerce[channel.id] ? 'border-indigo-600 bg-white shadow-xl ring-4 ring-indigo-50' : 'border-gray-50 opacity-40 hover:opacity-100'}`}>
                                           <div className={`p-4 rounded-2xl ${channel.color}`}><channel.icon size={32}/></div>
                                           <span className="font-black text-lg uppercase tracking-tighter">{channel.label}</span>
                                           <div className={`w-14 h-7 rounded-full relative transition-all ${formData.ecommerce[channel.id] ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                               <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.ecommerce[channel.id] ? 'right-1' : 'left-1'}`}></div>
                                           </div>
                                       </button>
                                   ))}
                               </div>
                          </div>
                      )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-4">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-all">Cancelar</button>
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                          <Save size={18}/> Guardar Producto
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
