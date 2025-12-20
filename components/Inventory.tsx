import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Package, MoreVertical, X, Save, Globe, DollarSign, Archive, Barcode, ArrowRight, Layers, LayoutList, RefreshCcw, Truck, Edit3, Pen, Trash2, AlertTriangle, ShoppingBag, Store, Tag, Upload, FileSpreadsheet, Check, ChevronRight, Download, CheckCircle, ArrowRightLeft, MoveHorizontal } from 'lucide-react';
import { Product, ProductStock } from '../types';

const Inventory: React.FC = () => {
  // --- MOCK INITIAL DATA ---
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

  const defaultProducts: Product[] = [
      { ...initialProduct, id: '1', name: 'Tornillo T1', internalCode: 'TOR-001', brand: 'Fischer', category: 'Fijaciones', provider: 'Herramientas Global SA', stock: 1500, priceFinal: 150, stockDetails: [{ branchId: '1', branchName: 'Casa Central', quantity: 1000 }, { branchId: '2', branchName: 'Depósito Norte', quantity: 500 }] },
      { ...initialProduct, id: '2', name: 'Taladro Percutor', internalCode: 'TAL-022', brand: 'Bosch', category: 'Herramientas', provider: 'Robert Bosch', stock: 15, priceFinal: 95000, stockDetails: [{ branchId: '1', branchName: 'Casa Central', quantity: 10 }, { branchId: '2', branchName: 'Depósito Norte', quantity: 5 }] },
      { ...initialProduct, id: '3', name: 'Lija al Agua 180', internalCode: 'LIJ-180', brand: 'Dob A', category: 'Pintureria', provider: 'Pinturas del Centro', stock: 500, priceFinal: 450, stockDetails: [{ branchId: '1', branchName: 'Casa Central', quantity: 200 }, { branchId: '2', branchName: 'Depósito Norte', quantity: 300 }] }
  ];

  // --- STATE WITH PERSISTENCE ---
  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : defaultProducts;
  });

  // Save to LocalStorage whenever products change
  useEffect(() => {
      localStorage.setItem('ferrecloud_products', JSON.stringify(products));
  }, [products]);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'MASS_EDIT' | 'TRANSFERS' | 'DEPOSITS'>('LIST');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'ECOMMERCE'>('GENERAL');
  
  // --- TRANSFER STATE ---
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferQty, setTransferQty] = useState(0);

  // --- PRICING LOGIC ---
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

  const handleDeleteProduct = (id: string) => {
      if (window.confirm("¿Está seguro de que desea eliminar este artículo? Esta acción no se puede deshacer.")) {
          setProducts(prev => prev.filter(p => p.id !== id));
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

  const updateDiscount = (index: number, value: number) => {
      const newDiscounts = [...formData.discounts] as [number, number, number, number];
      newDiscounts[index] = value;
      setFormData({...formData, discounts: newDiscounts});
  };

  const updateStockDetail = (branchId: string, quantity: number) => {
      const newDetails = formData.stockDetails.map(d => d.branchId === branchId ? {...d, quantity} : d);
      setFormData({...formData, stockDetails: newDetails});
  };

  // --- TRANSFER ACTIONS ---
  const handleExecuteTransfer = () => {
      if (!transferProduct || !transferFromId || !transferToId || transferQty <= 0) {
          alert("Complete todos los campos de transferencia.");
          return;
      }
      if (transferFromId === transferToId) {
          alert("La sucursal de origen y destino no pueden ser la misma.");
          return;
      }

      const sourceStock = transferProduct.stockDetails.find(s => s.branchId === transferFromId)?.quantity || 0;
      if (transferQty > sourceStock) {
          alert("Stock insuficiente en la sucursal de origen.");
          return;
      }

      const updatedProducts = products.map(p => {
          if (p.id === transferProduct.id) {
              const newDetails = p.stockDetails.map(s => {
                  if (s.branchId === transferFromId) return { ...s, quantity: s.quantity - transferQty };
                  if (s.branchId === transferToId) return { ...s, quantity: s.quantity + transferQty };
                  return s;
              });
              // Recalculamos stock total para mantener consistencia
              const newTotal = newDetails.reduce((acc, curr) => acc + curr.quantity, 0);
              return { ...p, stockDetails: newDetails, stock: newTotal };
          }
          return p;
      });

      setProducts(updatedProducts);
      setTransferProduct(null);
      setTransferQty(0);
      alert("Transferencia realizada con éxito.");
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto relative space-y-4">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{products.length} Artículos</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle size={12}/> Guardado Automático Local</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
                    <FileSpreadsheet size={16} /> Importar Excel
                </button>
                <button onClick={handleOpenModal} className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} /> Nuevo Producto
                </button>
            </div>
        </div>

        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-fit">
             <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                <LayoutList size={16}/> Listado
             </button>
             <button onClick={() => setViewMode('TRANSFERS')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'TRANSFERS' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                <ArrowRightLeft size={16}/> Transferencias
             </button>
             <button onClick={() => setViewMode('MASS_EDIT')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'MASS_EDIT' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Edit3 size={16}/> Modif. Masiva
             </button>
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      {viewMode === 'LIST' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por código, nombre o marca..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4 border-b border-gray-200">Cód. Interno</th>
                        <th className="px-6 py-4 border-b border-gray-200">Producto</th>
                        <th className="px-6 py-4 border-b border-gray-200">Marca</th>
                        <th className="px-6 py-4 border-b border-gray-200 text-right">Precio Final</th>
                        <th className="px-6 py-4 border-b border-gray-200 text-right">Stock</th>
                        <th className="px-6 py-4 border-b border-gray-200 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {products
                        .filter(p => 
                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{product.internalCode}</td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-800 cursor-pointer hover:text-ferre-orange" onClick={() => handleEditProduct(product)}>{product.name}</div>
                                <div className="text-xs text-gray-400">{product.category}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{product.brand}</td>
                            <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">${product.priceFinal.toLocaleString('es-AR')}</td>
                            <td className={`px-6 py-4 text-sm text-right font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-green-700'}`}>{product.stock}</td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => handleEditProduct(product)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"><Pen size={16} /></button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      )}

      {/* --- TRANSFERS VIEW --- */}
      {viewMode === 'TRANSFERS' && (
           <div className="flex gap-6 animate-fade-in flex-1 overflow-hidden">
                <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-slate-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Search size={18}/> Buscar Producto</h3>
                        <input 
                            type="text" 
                            placeholder="Código o nombre..." 
                            className="mt-2 w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-ferre-orange"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {products
                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalCode.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(p => (
                                <button key={p.id} onClick={() => setTransferProduct(p)} className={`w-full text-left p-4 border-b hover:bg-orange-50 ${transferProduct?.id === p.id ? 'bg-orange-100 border-l-4 border-l-ferre-orange' : ''}`}>
                                    <div className="font-bold text-sm text-gray-800">{p.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{p.internalCode} (Stock: {p.stock})</div>
                                </button>
                            ))}
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 p-8 overflow-y-auto">
                    {transferProduct ? (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="flex items-center gap-4 pb-6 border-b">
                                <div className="p-4 bg-orange-50 text-ferre-orange rounded-xl"><Package size={32}/></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{transferProduct.name}</h3>
                                    <p className="text-gray-500 font-mono">Stock Global: {transferProduct.stock} un.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-700 uppercase text-xs">Stock por Sucursal</h4>
                                    {transferProduct.stockDetails.map(s => (
                                        <div key={s.branchId} className="flex justify-between p-3 bg-slate-50 rounded-lg border">
                                            <span className="text-sm font-medium">{s.branchName}</span>
                                            <span className="font-bold">{s.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <h4 className="font-bold text-gray-700 uppercase text-xs">Nueva Transferencia</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Origen</label>
                                        <select className="w-full p-2 border rounded bg-white text-sm" value={transferFromId} onChange={e => setTransferFromId(e.target.value)}>
                                            <option value="">Seleccionar...</option>
                                            {transferProduct.stockDetails.map(s => <option key={s.branchId} value={s.branchId}>{s.branchName} ({s.quantity})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Destino</label>
                                        <select className="w-full p-2 border rounded bg-white text-sm" value={transferToId} onChange={e => setTransferToId(e.target.value)}>
                                            <option value="">Seleccionar...</option>
                                            {transferProduct.stockDetails.map(s => <option key={s.branchId} value={s.branchId}>{s.branchName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Cantidad</label>
                                        <input type="number" className="w-full p-2 border rounded font-bold text-center" value={transferQty} onChange={e => setTransferQty(parseInt(e.target.value) || 0)} min="1"/>
                                    </div>
                                    <button onClick={handleExecuteTransfer} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2"><ArrowRightLeft size={20}/> Ejecutar Movimiento</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <ArrowRightLeft size={64} className="opacity-20"/>
                            <p className="text-lg">Seleccione un producto para transferir stock entre sucursales.</p>
                        </div>
                    )}
                </div>
           </div>
      )}

      {/* --- ADD/EDIT MODAL OMITTED FOR BREVITY --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              {/* Contenido del modal similar al anterior pero con los hooks de persistencia */}
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Carga de Producto</h3>
                      <button onClick={() => setIsModalOpen(false)}><X/></button>
                  </div>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <input className="p-2 border rounded" placeholder="Código Interno" value={formData.internalCode} onChange={e => setFormData({...formData, internalCode: e.target.value})}/>
                          <input className="p-2 border rounded" placeholder="Nombre del Producto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      </div>
                      <button onClick={handleSaveProduct} className="w-full bg-ferre-dark text-white p-3 rounded font-bold">Guardar Cambios</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;