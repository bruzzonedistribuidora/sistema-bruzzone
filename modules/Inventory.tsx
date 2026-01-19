
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit3, Trash2, ShoppingCart, 
  Filter, MoreHorizontal, Package, AlertTriangle,
  ArrowUpRight, BarChart3, Tag, Boxes, X, 
  CheckCircle2, Download, Info, Trash,
  FileText, DollarSign, Warehouse, Link, Globe,
  Camera, Save, Layers, Scale, Truck, Loader2,
  ListOrdered, Percent, LayoutGrid,
  // Fix: Import ImageIcon and Upload from lucide-react
  ImageIcon, Upload
} from 'lucide-react';
import { Product } from '../types';
import { useFirebase } from '../context/FirebaseContext';

type ModalTab = 'general' | 'costs' | 'inventory' | 'fractioned' | 'ecommerce';

const Inventory: React.FC = () => {
  const { products, loading, addProduct, updateProduct, suppliers } = useFirebase();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('general'); // Renamed to avoid clash with main activeTab

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Lógica de Formulario ---
  const [activeProduct, setActiveProduct] = useState<Product | null>(null); // Product being edited
  const [formData, setFormData] = useState<Partial<Product>>({
    // New fields added to formData
    name: '',
    sku: '',
    category: '',
    brand: '',
    saleCurrency: 'ARS', // Default to ARS
    supplierProductCode: '',
  }); // General product data
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // For product image

  // Cost data specific for calculations
  const [costData, setCostData] = useState({
    baseCost: 0,
    ivaRate: 21,
    discounts: [0, 0, 0], // Up to 3 cascade discounts
    markup: 30, // Percentage markup over net cost
    supplierId: '',
    purchaseCurrency: 'ARS', // New: Default to ARS
  });

  const [inventoryData, setInventoryData] = useState({
    stock: 0,
    minStock: 5,
    location: '',
    reorderPoint: 0, // New field
    targetStock: 0, // New field
    packQuantity: 1, // New: Default to 1
  });

  const [fractionedData, setFractionedData] = useState({
    isFractionable: false,
    unitName: '',
    unitsPerParent: 1,
  });

  const [ecommerceData, setEcommerceData] = useState({
    isOnline: false,
    onlinePriceAdjustment: 0,
    mlSync: false,
  });


  // Calculate costs and prices dynamically
  const calcResults = React.useMemo(() => {
    let currentNet = costData.baseCost;
    costData.discounts.forEach(d => {
      if (d > 0) currentNet = currentNet * (1 - d / 100);
    });
    const priceWithoutIva = currentNet * (1 + costData.markup / 100);
    const finalPrice = priceWithoutIva * (1 + costData.ivaRate / 100);
    return { netCost: currentNet, priceWithoutIva, finalPrice };
  }, [costData]);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const dataToSave: Omit<Product, 'id'> = {
      sku: formData.sku || '',
      name: formData.name || '',
      supplierId: costData.supplierId || '',
      costPrice: calcResults.netCost,
      salePrice: calcResults.finalPrice,
      stock: inventoryData.stock,
      category: formData.category || 'General',
      brand: formData.brand || 'N/A',
      reorderPoint: inventoryData.reorderPoint, // Save new field
      targetStock: inventoryData.targetStock,   // Save new field
      packQuantity: inventoryData.packQuantity, // New field
      purchaseCurrency: costData.purchaseCurrency, // New field
      saleCurrency: formData.saleCurrency, // New field
      supplierProductCode: formData.supplierProductCode, // New field
      // Add other relevant fields from states
      // Assuming `image` might be added later or handled separately
    };

    try {
      if (activeProduct) {
        await updateProduct(activeProduct.id, dataToSave);
      } else {
        await addProduct(dataToSave);
      }
      setShowModal(false);
      resetModalStates(); // Reset states after saving
    } catch (e) {
      alert("Error al guardar en la nube");
      console.error("Save product error:", e);
    }
  };

  const resetModalStates = () => {
    setActiveProduct(null);
    setFormData({
      name: '', sku: '', category: '', brand: '', 
      saleCurrency: 'ARS', // Reset new field
      supplierProductCode: '', // Reset new field
    });
    setSelectedImage(null);
    setCostData({ 
      baseCost: 0, ivaRate: 21, discounts: [0, 0, 0], markup: 30, supplierId: '',
      purchaseCurrency: 'ARS', // Reset new field
    });
    setInventoryData({ 
      stock: 0, minStock: 5, location: '', reorderPoint: 0, targetStock: 0,
      packQuantity: 1, // Reset new field
    });
    setFractionedData({ isFractionable: false, unitName: '', unitsPerParent: 1 });
    setEcommerceData({ isOnline: false, onlinePriceAdjustment: 0, mlSync: false });
    setActiveModalTab('general');
  };

  const openModal = (product: Product | null) => {
    setActiveProduct(product);
    if (product) {
      setFormData({ 
        sku: product.sku, 
        name: product.name, 
        category: product.category, 
        brand: product.brand,
        saleCurrency: product.saleCurrency || 'ARS', // Load new field
        supplierProductCode: product.supplierProductCode || '', // Load new field
      });
      setCostData(prev => ({ 
        ...prev, 
        baseCost: product.costPrice || 0,
        supplierId: product.supplierId || '',
        purchaseCurrency: product.purchaseCurrency || 'ARS', // Load new field
        // Discounts, markup, ivaRate might need to be loaded from product if they are stored there.
      }));
      setInventoryData({
        stock: product.stock,
        minStock: 5, // Default or load from product if available
        location: '', // Load from product if available
        reorderPoint: product.reorderPoint || 0, // Load new field
        targetStock: product.targetStock || 0,   // Load new field
        packQuantity: product.packQuantity || 1, // Load new field
      });
      // Load other states if they were stored in the product object
    } else {
      resetModalStates(); // Reset for new product
    }
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Sincronizando con la nube...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Inventario Real-Time <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </h1>
          <p className="text-slate-500">Los cambios se reflejan al instante en todas las sucursales.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => openModal(null)}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
          >
            <Plus className="w-5 h-5" /> Nuevo Producto
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar producto sincronizado..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Producto / SKU</th>
                <th className="px-8 py-5 text-center">Stock Nube</th>
                <th className="px-8 py-5 text-right">Precio</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openModal(product)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-lg font-black ${product.stock < (product.reorderPoint || 0) ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                    ${product.salePrice?.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <MoreHorizontal className="group-hover:hidden w-5 h-5 mx-auto text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
              <h2 className="text-lg font-black uppercase tracking-tight">{activeProduct ? 'Editar Ficha Sincronizada' : 'Nuevo Producto'}</h2>
              <button onClick={() => { setShowModal(false); resetModalStates(); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex h-[600px]"> {/* Fixed height for modal content */}
              {/* Left Sidebar for Tabs */}
              <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                {[
                  { id: 'general', label: 'Datos Generales', icon: FileText },
                  { id: 'costs', label: 'Costos y Precios', icon: DollarSign },
                  { id: 'inventory', label: 'Inventario Físico', icon: Warehouse },
                  { id: 'fractioned', label: 'Unidades Fraccionadas', icon: Scale },
                  { id: 'ecommerce', label: 'E-Commerce', icon: Globe },
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveModalTab(tab.id as ModalTab)}
                    className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                  >
                    <tab.icon className="w-4 h-4 inline-block mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Main Content Area for Tabs */}
              <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                {/* General Data Tab */}
                {activeModalTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-600" /> Información Básica
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción del Producto</label>
                        <input 
                          value={formData.name || ''} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="Ej: Martillo Stanley 20oz"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código SKU / Interno</label>
                        <input 
                          value={formData.sku || ''}
                          onChange={e => setFormData({...formData, sku: e.target.value})}
                          placeholder="MART-001"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold uppercase" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                        <input 
                          value={formData.brand || ''}
                          onChange={e => setFormData({...formData, brand: e.target.value})}
                          placeholder="Ej: Stanley"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría / Rubro</label>
                        <input 
                          value={formData.category || ''}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          placeholder="Ej: Herramientas Manuales"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        />
                      </div>
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moneda de Venta</label>
                        <select
                          value={formData.saleCurrency || 'ARS'}
                          onChange={e => setFormData({...formData, saleCurrency: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                        >
                          <option value="ARS">ARS - Pesos Argentinos</option>
                          <option value="USD">USD - Dólares Estadounidenses</option>
                          {/* Add more currencies as needed */}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Producto del Proveedor</label>
                        <input
                          value={formData.supplierProductCode || ''}
                          onChange={e => setFormData({...formData, supplierProductCode: e.target.value})}
                          placeholder="Código que usa el proveedor para este artículo"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" /> Imagen del Producto
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 flex-shrink-0 group">
                          {selectedImage ? (
                            <img src={selectedImage} alt="Producto" className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                              {/* Fix: Use the imported ImageIcon */}
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="absolute -bottom-2 -right-2 p-3 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-500 transition-all"
                            title="Subir Imagen"
                          >
                            {/* Fix: Use the imported Upload icon */}
                            <Upload className="w-5 h-5" />
                          </button>
                          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                        <p className="text-sm text-slate-500">
                          Sube una imagen clara del producto. Se optimizará automáticamente para la web y facturación.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Costs and Prices Tab */}
                {activeModalTab === 'costs' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" /> Calculadora de Costos
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Bruto Proveedor ($)</label>
                        <input 
                          type="number" 
                          value={costData.baseCost}
                          onChange={e => setCostData({...costData, baseCost: Number(e.target.value) || 0})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor Principal</label>
                        <select 
                          value={costData.supplierId}
                          onChange={e => setCostData({...costData, supplierId: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                        >
                          <option value="">Seleccione Proveedor</option>
                          {suppliers.map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moneda de Compra</label>
                        <select
                          value={costData.purchaseCurrency || 'ARS'}
                          onChange={e => setCostData({...costData, purchaseCurrency: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                        >
                          <option value="ARS">ARS - Pesos Argentinos</option>
                          <option value="USD">USD - Dólares Estadounidenses</option>
                          {/* Add more currencies as needed */}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600" /> Descuentos en Cascada
                      </h4>
                      <p className="text-slate-500 text-sm">Aplica hasta 3 descuentos al costo bruto para obtener el costo neto.</p>
                      <div className="grid grid-cols-3 gap-4">
                        {costData.discounts.map((d, i) => (
                          <div key={i} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desc. {i + 1} (%)</label>
                            <input 
                              type="number" 
                              value={d}
                              onChange={e => {
                                const newDiscounts = [...costData.discounts];
                                newDiscounts[i] = Number(e.target.value) || 0;
                                setCostData({...costData, discounts: newDiscounts});
                              }}
                              className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center text-blue-600" 
                              min="0" max="100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-purple-600" /> Márgenes y Listas de Venta
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Margen de Ganancia (%)</label>
                          <input 
                            type="number" 
                            value={costData.markup}
                            onChange={e => setCostData({...costData, markup: Number(e.target.value) || 0})}
                            className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-center text-purple-600" 
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IVA (%)</label>
                          <input 
                            type="number" 
                            value={costData.ivaRate}
                            onChange={e => setCostData({...costData, ivaRate: Number(e.target.value) || 0})}
                            className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-center text-red-600" 
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resumen de Precios</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Costo Neto</p>
                          <p className="text-xl font-black text-blue-800">${calcResults.netCost.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Precio s/ IVA</p>
                          <p className="text-xl font-black text-purple-800">${calcResults.priceWithoutIva.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center">
                          <p className="text-[9px] font-black text-orange-900 uppercase">Precio Final</p>
                          <p className="text-2xl font-black text-orange-600">${calcResults.finalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventory Tab */}
                {activeModalTab === 'inventory' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-blue-600" /> Control de Stock
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Actual (Unidades)</label>
                        <input 
                          type="number" 
                          value={inventoryData.stock}
                          onChange={e => setInventoryData({...inventoryData, stock: Number(e.target.value) || 0})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600 text-center text-xl" 
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Mínimo / Alerta</label>
                        <input 
                          type="number" 
                          value={inventoryData.minStock}
                          onChange={e => setInventoryData({...inventoryData, minStock: Number(e.target.value) || 0})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600 text-center text-xl" 
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Punto de Pedido</label>
                        <input 
                          type="number" 
                          value={inventoryData.reorderPoint} // New field
                          onChange={e => setInventoryData({...inventoryData, reorderPoint: Number(e.target.value) || 0})}
                          placeholder="Ej: 10"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center text-xl" 
                          min="0"
                        />
                         <p className="text-[10px] text-slate-400 italic">Cantidad para disparar orden de compra.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Deseado</label>
                        <input 
                          type="number" 
                          value={inventoryData.targetStock} // New field
                          onChange={e => setInventoryData({...inventoryData, targetStock: Number(e.target.value) || 0})}
                          placeholder="Ej: 50"
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-center text-xl" 
                          min="0"
                        />
                        <p className="text-[10px] text-slate-400 italic">Stock óptimo después de reponer.</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación en Depósito (Opcional)</label>
                      <input 
                        value={inventoryData.location}
                        onChange={e => setInventoryData({...inventoryData, location: e.target.value})}
                        placeholder="Ej: Estante A3, Pasillo 2"
                        className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                      />
                      <p className="text-[10px] text-slate-400 italic">Ayuda a encontrar el producto rápidamente en tu almacén.</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad por Bulto / Pack</label>
                      <input 
                        type="number" 
                        value={inventoryData.packQuantity} // New field
                        onChange={e => setInventoryData({...inventoryData, packQuantity: Number(e.target.value) || 1})}
                        placeholder="Ej: 6 (si se vende por unidad pero se compra en packs de 6)"
                        className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-center text-xl" 
                        min="1"
                      />
                      <p className="text-[10px] text-slate-400 italic">Unidades de venta contenidas en una unidad de compra/almacenamiento.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 bg-blue-50 p-6 rounded-[2rem] border-blue-100 flex items-start gap-4">
                      <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">Alerta Automática</p>
                        <p className="text-xs text-blue-700 mt-1">El sistema te notificará cuando el stock de este producto caiga por debajo de tu nivel mínimo.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fractioned Units Tab */}
                {activeModalTab === 'fractioned' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" /> Gestión de Unidades Fraccionadas
                    </h3>
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <input 
                        type="checkbox" 
                        checked={fractionedData.isFractionable}
                        onChange={e => setFractionedData({...fractionedData, isFractionable: e.target.checked})}
                        className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer flex-shrink-0" 
                        id="isFractionable"
                      />
                      <label htmlFor="isFractionable" className="flex-1 cursor-pointer">
                        <p className="text-sm font-black text-slate-800 uppercase">Habilitar Venta Fraccionada</p>
                        <p className="text-xs text-slate-500 mt-1">Permite vender este producto en unidades más pequeñas que la unidad de compra/almacenamiento.</p>
                      </label>
                    </div>

                    {fractionedData.isFractionable && (
                      <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Unidad Fraccionada</label>
                            <input 
                              value={fractionedData.unitName}
                              onChange={e => setFractionedData({...fractionedData, unitName: e.target.value})}
                              placeholder="Ej: Metro, Kilo, Unidad"
                              className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidades Fraccionadas por Unidad Principal</label>
                            <input 
                              type="number" 
                              value={fractionedData.unitsPerParent}
                              onChange={e => setFractionedData({...fractionedData, unitsPerParent: Number(e.target.value) || 1})}
                              className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-center text-xl" 
                              min="1"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Ejemplo: si vendes cable por "Metro" y compras por "Rollo de 100 metros", entonces la unidad principal es "Rollo" y la fraccionada "Metro", con 100 unidades por principal.
                        </p>
                        <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex items-center gap-4">
                          <Info className="w-6 h-6 text-purple-600 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-purple-900">Impacto en Precios y Stock</p>
                            <p className="text-xs text-purple-700 mt-1">El sistema ajustará automáticamente los precios de venta y las cantidades de stock al vender en unidades fraccionadas.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* E-commerce Tab */}
                {activeModalTab === 'ecommerce' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-600" /> Publicación Online
                    </h3>
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <input 
                        type="checkbox" 
                        checked={ecommerceData.isOnline}
                        onChange={e => setEcommerceData({...ecommerceData, isOnline: e.target.checked})}
                        className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer flex-shrink-0" 
                        id="isOnline"
                      />
                      <label htmlFor="isOnline" className="flex-1 cursor-pointer">
                        <p className="text-sm font-black text-slate-800 uppercase">Habilitar en Tienda Web Propia</p>
                        <p className="text-xs text-slate-500 mt-1">Este producto estará visible y disponible para la compra en tu tienda Fort (E-commerce propio).</p>
                      </label>
                    </div>

                    {ecommerceData.isOnline && (
                      <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ajuste de Precio Online (%)</label>
                          <input 
                            type="number" 
                            value={ecommerceData.onlinePriceAdjustment}
                            onChange={e => setEcommerceData({...ecommerceData, onlinePriceAdjustment: Number(e.target.value) || 0})}
                            className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-center text-green-600 text-xl" 
                          />
                          <p className="text-[10px] text-slate-400 italic">
                            Aplica un recargo o descuento adicional al precio final para este canal de venta.
                          </p>
                        </div>
                        
                        <div className="p-6 bg-yellow-50 rounded-[2rem] border border-yellow-100 flex items-start gap-4">
                          <input 
                            type="checkbox" 
                            checked={ecommerceData.mlSync}
                            onChange={e => setEcommerceData({...ecommerceData, mlSync: e.target.checked})}
                            className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer flex-shrink-0" 
                            id="mlSync"
                          />
                          <label htmlFor="mlSync" className="flex-1 cursor-pointer">
                            <p className="text-sm font-black text-yellow-900 uppercase">Sincronizar con MercadoLibre</p>
                            <p className="text-xs text-yellow-700 mt-1">Mantiene stock y precios actualizados con tu publicación en MercadoLibre (requiere configuración de la API en el módulo E-commerce).</p>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
               <button onClick={() => { setShowModal(false); resetModalStates(); }} className="text-slate-400 font-bold uppercase text-xs">Cancelar</button>
               <button onClick={handleSave} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                 <Save className="w-5 h-5 text-blue-400" /> Guardar en Nube
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
