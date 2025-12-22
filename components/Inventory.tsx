
import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Package, X, Save, Globe, DollarSign, 
    Barcode, Pen, Trash2, Tag, Truck, Layers, ShoppingBag, 
    ShoppingCart, AlertCircle, Info, Percent, Building2, 
    Store, Monitor, TrendingDown, ArrowUpRight, ListPlus, 
    Ruler, Hash, BookmarkPlus, ChevronRight, Settings2,
    CheckCircle, PackagePlus
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

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'ECOMMERCE'>('GENERAL');
  
  // Estados auxiliares para entradas múltiples
  const [newBarcode, setNewBarcode] = useState('');
  const [newProvCode, setNewProvCode] = useState('');
  
  // Persistencia
  useEffect(() => { localStorage.setItem('ferrecloud_products', JSON.stringify(products)); }, [products]);

  // Lógica de Precios
  useEffect(() => {
    let cost = Number(formData.listCost) || 0;
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

  // Handlers
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

  const handleManualOrder = (product: Product) => {
    const savedManual = localStorage.getItem('ferrecloud_manual_shortages');
    const manualIds: string[] = savedManual ? JSON.parse(savedManual) : [];
    
    if (!manualIds.includes(product.id)) {
        const newManualIds = [...manualIds, product.id];
        localStorage.setItem('ferrecloud_manual_shortages', JSON.stringify(newManualIds));
        alert(`Articulo "${product.name}" agregado a la lista de Faltantes para reposición.`);
    } else {
        alert(`El artículo "${product.name}" ya se encuentra en la lista de pedidos pendientes.`);
    }
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

  const addBarcode = () => {
    if (!newBarcode.trim() || formData.barcodes.includes(newBarcode)) return;
    setFormData({ ...formData, barcodes: [...formData.barcodes, newBarcode.trim()] });
    setNewBarcode('');
  };

  const addProvCode = () => {
    if (!newProvCode.trim() || formData.providerCodes.includes(newProvCode)) return;
    setFormData({ ...formData, providerCodes: [...formData.providerCodes, newProvCode.trim()] });
    setNewProvCode('');
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-end">
          <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Inventario Maestro</h2>
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2 mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-widest">{products.length} Artículos Registrados</span>
              </p>
          </div>
          <button onClick={handleOpenModal} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-2xl flex items-center gap-2 transition-all hover:bg-slate-800 active:scale-95 uppercase text-xs tracking-widest">
              <Plus size={20} /> Nuevo Producto
          </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-6 flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por código, descripción, proveedor o barras..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-ferre-orange focus:bg-white rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col animate-fade-in">
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-gray-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                        <th className="px-8 py-5">Identificación / SKU</th>
                        <th className="px-8 py-5">Descripción</th>
                        <th className="px-8 py-5">Proveedor / Marca</th>
                        <th className="px-8 py-5 text-right">Stock</th>
                        <th className="px-8 py-5 text-right">P. Final</th>
                        <th className="px-8 py-5 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products
                        .filter(p => 
                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.provider.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                                <p className="font-mono font-bold text-slate-900 text-xs">{product.internalCode}</p>
                                <div className="flex gap-1 mt-1">
                                    {product.providerCodes.slice(0,1).map(c => (
                                        <span key={c} className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-1 rounded">Prov: {c}</span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="font-black text-slate-800 uppercase tracking-tight hover:text-ferre-orange cursor-pointer leading-tight" onClick={() => handleEditProduct(product)}>{product.name}</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{product.category}</p>
                            </td>
                            <td className="px-8 py-6">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">{product.provider}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{product.brand}</p>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-700">
                                <span className={product.stock <= product.minStock ? 'text-red-600' : 'text-green-700'}>{product.stock}</span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">${product.priceFinal.toLocaleString('es-AR')}</td>
                            <td className="px-8 py-6 text-center">
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleManualOrder(product)}
                                        title="Pedir / Agregar a Faltantes"
                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                    >
                                        <PackagePlus size={18} />
                                    </button>
                                    <button onClick={() => handleEditProduct(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pen size={18} /></button>
                                    <button onClick={() => { if(confirm('¿Eliminar?')) setProducts(products.filter(p => p.id !== product.id)) }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL DE CARGA (PRO-DESIGN) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10">
                  
                  {/* Header del Modal */}
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/20">
                              <Package size={32}/>
                          </div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Ficha Técnica de Artículo</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                  <CheckCircle size={12} className="text-green-400"/> Datos sincronizados para actualización masiva
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={32} /></button>
                  </div>

                  {/* Solapas (Tabs) */}
                  <div className="flex bg-slate-100 p-2 gap-2 border-b border-gray-200 shrink-0">
                      {[
                          { id: 'GENERAL', label: 'Identidad y Proveedor', icon: Info },
                          { id: 'PRICING', label: 'Costos y Márgenes', icon: DollarSign },
                          { id: 'STOCK', label: 'Logística y Sucursales', icon: Layers },
                          { id: 'ECOMMERCE', label: 'Canales Digitales', icon: Globe }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setModalTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-slate-900 shadow-xl shadow-slate-200 border border-gray-100' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
                          >
                              <tab.icon size={18} className={modalTab === tab.id ? 'text-indigo-600' : ''}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  {/* Cuerpo del Modal */}
                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/30">
                      
                      {/* --- TAB: GENERAL --- */}
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                  {/* Columna Identidad */}
                                  <div className="space-y-6">
                                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3 border-indigo-100"><Tag size={16}/> Identidad del Producto</h4>
                                      <div className="space-y-4">
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Descripción Completa</label>
                                              <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-black text-slate-800 text-lg transition-all uppercase placeholder:font-normal" placeholder="EJ: MARTILLO DE UÑA STANLEY 16OZ" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}/>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Código Interno (SKU)</label>
                                                  <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-mono font-bold text-slate-700 transition-all uppercase" placeholder="BRU-1234" value={formData.internalCode} onChange={e => setFormData({...formData, internalCode: e.target.value.toUpperCase()})}/>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Categoría</label>
                                                  <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-bold text-slate-700 transition-all uppercase" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value.toUpperCase()})}/>
                                              </div>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Especificaciones Técnicas</label>
                                              <textarea className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-medium text-slate-600 transition-all h-24 resize-none" placeholder="Medidas, peso, composición..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Columna Proveedor (CLAVE PARA ACTUALIZACIONES) */}
                                  <div className="space-y-6">
                                      <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3 border-orange-100"><Truck size={16}/> Vínculo con el Proveedor</h4>
                                      <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 space-y-6">
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Proveedor Principal</label>
                                              <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-orange-500 shadow-sm outline-none font-black text-slate-800 transition-all uppercase" placeholder="BUSCAR O CREAR PROVEEDOR..." value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value.toUpperCase()})}/>
                                          </div>

                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Códigos de Referencia (Proveedor)</label>
                                              <div className="flex gap-2 mb-3">
                                                  <input className="flex-1 p-4 bg-white border-2 border-transparent rounded-2xl focus:border-orange-500 shadow-sm outline-none font-mono text-sm uppercase" placeholder="Código de fábrica..." value={newProvCode} onChange={e => setNewProvCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && addProvCode()}/>
                                                  <button onClick={addProvCode} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg"><BookmarkPlus size={20}/></button>
                                              </div>
                                              <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-white/50 rounded-2xl border border-dashed border-orange-200">
                                                  {formData.providerCodes.map(c => (
                                                      <span key={c} className="bg-orange-100 text-orange-800 border border-orange-200 pl-3 pr-1 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-2">
                                                          {c} <button onClick={() => setFormData({...formData, providerCodes: formData.providerCodes.filter(x => x !== c)})}><X size={12} className="text-orange-400 hover:text-red-500"/></button>
                                                      </span>
                                                  ))}
                                                  {formData.providerCodes.length === 0 && <span className="text-[10px] text-orange-300 font-bold uppercase italic self-center">Sin códigos de proveedor asociados</span>}
                                              </div>
                                          </div>
                                      </div>

                                      {/* Barcodes */}
                                      <div className="space-y-4">
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2 flex items-center gap-2"><Barcode size={14}/> Códigos de Barra (EAN/GTIN)</label>
                                          <div className="flex gap-2">
                                              <input className="flex-1 p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-mono" placeholder="Escanear código..." value={newBarcode} onChange={e => setNewBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBarcode()}/>
                                              <button onClick={addBarcode} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800"><ListPlus size={20}/></button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                              {formData.barcodes.map(b => (
                                                  <span key={b} className="bg-white border border-gray-200 pl-3 pr-1 py-1 rounded-lg text-xs font-mono flex items-center gap-2 shadow-sm">
                                                      {b} <button onClick={() => setFormData({...formData, barcodes: formData.barcodes.filter(x => x !== b)})}><X size={12} className="text-red-400"/></button>
                                                  </span>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- TAB: PRICING --- */}
                      {modalTab === 'PRICING' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                  <div className="space-y-6">
                                      <h4 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3 border-red-100"><TrendingDown size={16}/> Estructura de Costos</h4>
                                      <div className="bg-slate-50 p-10 rounded-[3rem] border border-gray-100 space-y-8">
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Costo Lista Bruto (Sin IVA)</label>
                                              <div className="relative">
                                                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={32}/>
                                                  <input type="number" className="w-full pl-16 pr-8 py-8 bg-white border-2 border-transparent rounded-[2rem] focus:border-red-500 shadow-sm outline-none font-black text-5xl text-red-600 transition-all tracking-tighter" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})}/>
                                              </div>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-4 text-center">Bonificaciones / Descuentos en Cascada (%)</label>
                                              <div className="grid grid-cols-4 gap-4">
                                                  {formData.discounts.map((d, i) => (
                                                      <div key={i} className="relative group">
                                                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500" size={14}/>
                                                          <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:border-red-500 outline-none font-black text-center text-lg" value={d} onChange={e => {
                                                              const dCopy = [...formData.discounts] as [number, number, number, number];
                                                              dCopy[i] = parseFloat(e.target.value) || 0;
                                                              setFormData({...formData, discounts: dCopy});
                                                          }}/>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                          <div className="pt-6 border-t border-dashed border-gray-300 flex justify-between items-center px-4">
                                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Neto de Reposición</span>
                                              <span className="text-3xl font-black text-red-700 tracking-tighter">${formData.costAfterDiscounts.toLocaleString('es-AR')}</span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-6">
                                      <h4 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3 border-green-100"><ArrowUpRight size={16}/> Determinación de Venta</h4>
                                      <div className="bg-slate-50 p-10 rounded-[3rem] border border-gray-100 space-y-8">
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Margen Ganancia (%)</label>
                                                  <div className="relative group">
                                                      <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-600" size={24}/>
                                                      <input type="number" className="w-full p-6 pr-14 bg-white border-2 border-transparent rounded-[2rem] focus:border-green-600 shadow-sm outline-none font-black text-4xl text-green-600 transition-all tracking-tighter" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})}/>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Alícuota IVA</label>
                                                  <select className="w-full p-7 bg-white border-2 border-transparent rounded-[2rem] focus:border-indigo-600 shadow-sm outline-none font-black text-2xl text-slate-700 transition-all" value={formData.vatRate} onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value) as any})}>
                                                      <option value={21.0}>21.0%</option>
                                                      <option value={10.5}>10.5%</option>
                                                      <option value={0}>Exento</option>
                                                  </select>
                                              </div>
                                          </div>
                                          <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-900/20 text-center relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><DollarSign size={80}/></div>
                                              <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-60">Precio de Venta Final</p>
                                              <p className="text-6xl font-black tracking-tighter leading-none">${formData.priceFinal.toLocaleString('es-AR')}</p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- TAB: STOCK --- */}
                      {modalTab === 'STOCK' && (
                          <div className="space-y-12 animate-fade-in">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                  <div className="space-y-6">
                                      <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3 border-blue-100"><Building2 size={16}/> Stock Físico por Sucursal</h4>
                                      <div className="space-y-4">
                                          {formData.stockDetails.map(branch => (
                                              <div key={branch.branchId} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                                                  <div className="flex items-center gap-6">
                                                      <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl group-hover:scale-110 transition-transform"><Store size={28}/></div>
                                                      <div>
                                                        <span className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">{branch.branchName}</span>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Existencia Real</p>
                                                      </div>
                                                  </div>
                                                  <div className="w-40 flex items-center gap-3">
                                                      <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-black text-right text-2xl text-slate-800 transition-all" value={branch.quantity} onChange={e => {
                                                          const sCopy = formData.stockDetails.map(s => s.branchId === branch.branchId ? {...s, quantity: parseInt(e.target.value) || 0} : s);
                                                          setFormData({...formData, stockDetails: sCopy});
                                                      }}/>
                                                      <span className="text-xs font-black text-slate-400 uppercase">{formData.measureUnitSale}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="space-y-10">
                                      <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 space-y-8">
                                          <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Ruler size={16}/> Configuración de Unidades</h4>
                                          <div className="grid grid-cols-2 gap-8">
                                              <div>
                                                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 ml-4">U. Compra</label>
                                                  <select className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-black text-indigo-900" value={formData.measureUnitPurchase} onChange={e => setFormData({...formData, measureUnitPurchase: e.target.value})}>
                                                      <option value="Unidad">Unidad</option><option value="Caja">Caja</option><option value="Pack">Pack</option><option value="Kg">Kg</option><option value="Metro">Metro</option>
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 ml-4">U. Venta</label>
                                                  <select className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-black text-indigo-900" value={formData.measureUnitSale} onChange={e => setFormData({...formData, measureUnitSale: e.target.value})}>
                                                      <option value="Unidad">Unidad</option><option value="Kg">Kg</option><option value="Metro">Metro</option><option value="Fracción">Fracción</option>
                                                  </select>
                                              </div>
                                              <div className="col-span-2 bg-white p-6 rounded-3xl border border-indigo-200">
                                                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">Factor de Conversión</label>
                                                  <div className="flex items-center justify-center gap-4">
                                                      <div className="text-lg font-black text-indigo-600">1 {formData.measureUnitPurchase} =</div>
                                                      <input type="number" className="w-24 p-3 bg-indigo-50 rounded-xl font-black text-center text-indigo-700 border border-indigo-200 outline-none" value={formData.conversionFactor} onChange={e => setFormData({...formData, conversionFactor: parseFloat(e.target.value) || 1})}/>
                                                      <div className="text-lg font-black text-indigo-600">{formData.measureUnitSale}</div>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="bg-orange-50/50 p-10 rounded-[3.5rem] border border-orange-100 space-y-8">
                                          <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><AlertCircle size={16}/> Inteligencia de Reposición</h4>
                                          <div className="grid grid-cols-2 gap-6">
                                              <div className="bg-white p-6 rounded-3xl border border-orange-100">
                                                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 text-center">Stock Mínimo</label>
                                                  <input type="number" className="w-full p-2 bg-transparent text-center font-black text-3xl text-orange-600 outline-none" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}/>
                                              </div>
                                              <div className="bg-white p-6 rounded-3xl border border-orange-100">
                                                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 text-center">Punto Pedido</label>
                                                  <input type="number" className="w-full p-2 bg-transparent text-center font-black text-3xl text-orange-600 outline-none" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value) || 0})}/>
                                              </div>
                                          </div>
                                          <div className="pt-6 border-t border-orange-200">
                                              <label className="block text-[10px] font-black text-orange-700 uppercase tracking-widest mb-3 ml-4">Stock Deseado (Ideal para Pedido Automático)</label>
                                              <div className="relative">
                                                  <ShoppingCart className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-300" size={32}/>
                                                  <input type="number" className="w-full pl-20 pr-8 py-8 bg-white border-2 border-transparent rounded-[2.5rem] focus:border-orange-500 shadow-sm outline-none font-black text-5xl text-orange-700 transition-all tracking-tighter" value={formData.desiredStock} onChange={e => setFormData({...formData, desiredStock: parseInt(e.target.value) || 0})}/>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- TAB: ECOMMERCE --- */}
                      {modalTab === 'ECOMMERCE' && (
                          <div className="space-y-10 animate-fade-in">
                               <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 text-center max-w-4xl mx-auto">
                                   <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><Globe size={48}/></div>
                                   <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">Canales de Venta Sincronizados</h4>
                                   <p className="text-gray-500 font-medium mb-12">Habilita la publicación y sincronización automática de stock para este artículo.</p>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                       {[
                                           { id: 'mercadoLibre', label: 'Mercado Libre', icon: ShoppingBag, color: 'bg-[#FFF159] text-gray-800' },
                                           { id: 'tiendaNube', label: 'Tienda Nube', icon: Globe, color: 'bg-[#00AEEF] text-white' },
                                           { id: 'webPropia', label: 'Web Oficial', icon: Monitor, color: 'bg-slate-900 text-white' }
                                       ].map(channel => (
                                           <button 
                                            key={channel.id}
                                            onClick={() => setFormData({...formData, ecommerce: {...formData.ecommerce, [channel.id]: !formData.ecommerce[channel.id]}})}
                                            className={`p-10 rounded-[3rem] border-2 flex flex-col items-center gap-4 transition-all ${formData.ecommerce[channel.id] ? 'border-indigo-600 bg-white shadow-2xl ring-8 ring-indigo-50' : 'border-slate-50 opacity-40 hover:opacity-100'}`}>
                                               <div className={`p-5 rounded-[1.5rem] ${channel.color}`}><channel.icon size={40}/></div>
                                               <span className="font-black text-xl uppercase tracking-tighter">{channel.label}</span>
                                               <div className={`w-16 h-8 rounded-full relative transition-all ${formData.ecommerce[channel.id] ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                                   <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.ecommerce[channel.id] ? 'right-1' : 'left-1'}`}></div>
                                               </div>
                                           </button>
                                       ))}
                                   </div>
                               </div>
                          </div>
                      )}
                  </div>

                  {/* Footer del Modal */}
                  <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-5 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-all">Descartar Cambios</button>
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-16 py-4 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3">
                          <Save size={24}/> Guardar Producto
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
