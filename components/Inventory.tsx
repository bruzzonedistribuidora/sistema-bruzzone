import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Package, MoreVertical, X, Save, Globe, DollarSign, Archive, Barcode, ArrowRight, Layers, LayoutList, RefreshCcw, Truck, Edit3, Pen, Trash2, AlertTriangle, ShoppingBag, Store, Tag, Upload, FileSpreadsheet, Check, ChevronRight, Download, CheckCircle } from 'lucide-react';
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
      { ...initialProduct, id: '1', name: 'Tornillo T1', internalCode: 'TOR-001', brand: 'Fischer', category: 'Fijaciones', provider: 'Herramientas Global SA', stock: 1500, priceFinal: 150 },
      { ...initialProduct, id: '2', name: 'Taladro Percutor', internalCode: 'TAL-022', brand: 'Bosch', category: 'Herramientas', provider: 'Robert Bosch', stock: 15, priceFinal: 95000 },
      { ...initialProduct, id: '3', name: 'Lija al Agua 180', internalCode: 'LIJ-180', brand: 'Dob A', category: 'Pintureria', provider: 'Pinturas del Centro', stock: 500, priceFinal: 450 }
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

  // Mock Providers available (Should mirror Purchases.tsx)
  const availableProviders = [
    { name: 'Herramientas Global SA', defaultDiscounts: [10, 5, 0] },
    { name: 'Pinturas del Centro', defaultDiscounts: [25, 0, 0] },
    { name: 'Bulonera Industrial', defaultDiscounts: [15, 10, 5] },
    { name: 'Robert Bosch', defaultDiscounts: [30, 5, 5] }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'MASS_EDIT' | 'TRANSFERS' | 'DEPOSITS'>('LIST');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'ECOMMERCE'>('GENERAL');
  
  // Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Auxiliary states for inputs
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Derived Lists for Selects
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean).sort();
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();

  // --- PRICING LOGIC ---
  useEffect(() => {
    // 1. Calculate Cost After Discounts (Cascading)
    let cost = Number(formData.listCost) || 0;
    formData.discounts.forEach(d => { 
        if (d > 0) cost = cost * (1 - d / 100); 
    });
    
    // 2. Calculate Net Price (Cost + Margin)
    const priceNeto = cost * (1 + (Number(formData.profitMargin) || 0) / 100);
    
    // 3. Calculate Final Price (Net + VAT)
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
    setFormData({...initialProduct, id: Date.now().toString()}); // New ID for creation
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
            // Update existing
            const newProducts = [...prev];
            newProducts[existingIndex] = finalProduct;
            return newProducts;
        } else {
            // Create new
            return [finalProduct, ...prev];
        }
    });
    setIsModalOpen(false);
  };

  const handleAddNewAttribute = (field: 'brand' | 'category', label: string) => {
      const value = prompt(`Ingrese nueva ${label}:`);
      if (value) {
          setFormData(prev => ({ ...prev, [field]: value }));
      }
  };
  
  const handleProviderChange = (providerName: string) => {
      const providerData = availableProviders.find(p => p.name === providerName);
      let newDiscounts = [...formData.discounts] as [number, number, number, number];
      
      if (providerData) {
          newDiscounts[0] = providerData.defaultDiscounts[0] || 0;
          newDiscounts[1] = providerData.defaultDiscounts[1] || 0;
          newDiscounts[2] = providerData.defaultDiscounts[2] || 0;
      }

      setFormData(prev => ({ 
          ...prev, 
          provider: providerName,
          discounts: newDiscounts
      }));
  };

  const handleAddBarcode = () => {
      if (barcodeInput && !formData.barcodes.includes(barcodeInput)) {
          setFormData(prev => ({...prev, barcodes: [...prev.barcodes, barcodeInput]}));
          setBarcodeInput('');
      }
  };

  const removeBarcode = (code: string) => {
      setFormData(prev => ({...prev, barcodes: prev.barcodes.filter(b => b !== code)}));
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

  // --- IMPORT LOGIC ---
  const handleDownloadTemplate = () => {
      const headers = [
          'CodigoInterno', 'Nombre', 'CodigoProveedor', 'Proveedor', 
          'CostoLista', 'Marca', 'Moneda', 
          'StockCentral', 'StockDeposito', 
          'CodigoBarra1', 'CodigoBarra2', 'CodigoBarra3', 
          'PorcentajeGanancia', 'AlicuotaIVA', 
          'Descuento1', 'Descuento2', 'Descuento3'
      ];
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "plantilla_articulos_ferrecloud.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setImportFile(e.target.files[0]);
          setImportStep(2);
      }
  };

  const handleConfirmImport = () => {
      // Simulation of parsing and adding products
      // In a real implementation, this would parse the CSV and map fields
      const newProducts: Product[] = [
          { ...initialProduct, id: `IMP-${Date.now()}-1`, internalCode: 'NUEVO-001', name: 'Artículo Importado 1', brand: 'Generica', listCost: 100, stock: 50, priceFinal: 200 },
          { ...initialProduct, id: `IMP-${Date.now()}-2`, internalCode: 'NUEVO-002', name: 'Artículo Importado 2', brand: 'Generica', listCost: 500, stock: 20, priceFinal: 1000 },
          { ...initialProduct, id: `IMP-${Date.now()}-3`, internalCode: 'NUEVO-003', name: 'Artículo Importado 3', brand: 'Generica', listCost: 1200, stock: 10, priceFinal: 2400 },
      ];
      
      setProducts(prev => [...newProducts, ...prev]);
      setIsImportOpen(false);
      setImportStep(1);
      setImportFile(null);
      alert('Se han importado 3 artículos correctamente.');
  };

  // Mock data for step 2 preview based on the user's requested fields
  const MOCK_PREVIEW_ROWS = [
      ['TOR-HEX-5', 'Tornillo Hexagonal 5mm', 'HG-552', 'Herramientas Global', '50.00', 'Fischer', 'ARS', '1000', '5000', '779123456789', '', '', '40', '21', '10', '5', '0'],
      ['PINT-EXT-20', 'Latex Exterior 20L', 'SW-200', 'Pinturas del Centro', '45000.00', 'Sherwin', 'ARS', '10', '50', '779987654321', '123123', '', '30', '21', '25', '0', '0']
  ];

  const MAPPING_FIELDS = [
      'Código Interno', 'Nombre', 'Cód. Proveedor', 'Proveedor', 
      'Costo Lista', 'Marca', 'Moneda', 
      'Stock Central', 'Stock Depósito', 
      'Cód. Barra 1', 'Cód. Barra 2', 'Cód. Barra 3', 
      'Ganancia %', 'IVA %', 
      'Desc. 1 %', 'Desc. 2 %', 'Desc. 3 %'
  ];

  // --- RENDER ---
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
                <button 
                    onClick={() => setIsImportOpen(true)}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
                    <FileSpreadsheet size={16} />
                    Importar Excel
                </button>
                <button 
                    onClick={handleOpenModal}
                    className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} />
                    Nuevo Producto
                </button>
            </div>
        </div>

        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-fit">
             <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <LayoutList size={16}/> Listado
             </button>
             <button onClick={() => setViewMode('MASS_EDIT')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'MASS_EDIT' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Edit3 size={16}/> Modif. Masiva
             </button>
             <button onClick={() => setViewMode('TRANSFERS')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'TRANSFERS' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <RefreshCcw size={16}/> Ajustes y Transf.
             </button>
             <button onClick={() => setViewMode('DEPOSITS')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'DEPOSITS' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Truck size={16}/> Depósitos
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
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-ferre-orange focus:border-ferre-orange outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="p-2 border border-gray-300 bg-white rounded-lg text-gray-600 hover:bg-gray-50">
                <Filter size={18} />
            </button>
        </div>

        <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <tr>
                        <th className="px-6 py-3 border-b border-gray-200">Cód. Interno</th>
                        <th className="px-6 py-3 border-b border-gray-200">Producto</th>
                        <th className="px-6 py-3 border-b border-gray-200">Marca / Categoría</th>
                        <th className="px-6 py-3 border-b border-gray-200 text-right">Costo Real</th>
                        <th className="px-6 py-3 border-b border-gray-200 text-right">Precio Final</th>
                        <th className="px-6 py-3 border-b border-gray-200 text-right">Stock Total</th>
                        <th className="px-6 py-3 border-b border-gray-200 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {products
                        .filter(p => 
                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.brand.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((product) => (
                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 text-sm font-mono text-gray-600">{product.internalCode}</td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-ferre-orange" onClick={() => handleEditProduct(product)}>{product.name}</div>
                                <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-800 font-bold">{product.brand}</div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                                    {product.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-gray-500">
                                ${product.costAfterDiscounts.toLocaleString('es-AR')}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                                ${product.priceFinal.toLocaleString('es-AR')}
                            </td>
                            <td className={`px-6 py-4 text-sm text-right font-medium ${product.stock < product.minStock ? 'text-red-600' : 'text-gray-700'}`}>
                                {product.stock}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button 
                                    onClick={() => handleEditProduct(product)}
                                    className="text-gray-400 hover:text-ferre-orange p-2 rounded-full hover:bg-orange-50 transition-colors"
                                    title="Modificar Artículo"
                                >
                                    <Pen size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      )}

      {/* --- MASS EDIT VIEW (Existing) --- */}
      {viewMode === 'MASS_EDIT' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden animate-fade-in">
             <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                <Edit3 size={16}/>
                Edición rápida: Los cambios se guardan automáticamente al perder el foco del campo.
             </div>
             <div className="flex-1 overflow-auto">
                 <div className="p-8 text-center text-gray-500">Funcionalidad de edición masiva (Vista simplificada)</div>
             </div>
        </div>
      )}

      {/* --- TRANSFERS VIEW (Existing) --- */}
      {viewMode === 'TRANSFERS' && (
           <div className="grid grid-cols-2 gap-6 animate-fade-in h-full">
              <div className="p-8 text-center text-gray-500 col-span-2">Funcionalidad de Transferencias</div>
           </div>
      )}

      {/* --- WAREHOUSE VIEW (Existing) --- */}
      {viewMode === 'DEPOSITS' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in text-center py-20">
              <Truck size={48} className="mx-auto text-gray-300 mb-4"/>
              <h3 className="text-xl font-bold text-gray-700">Gestión de Depósitos y Sucursales</h3>
          </div>
      )}

      {/* --- IMPORT EXCEL MODAL --- */}
      {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in">
                  <div className="p-6 border-b border-gray-200 bg-slate-900 text-white flex justify-between items-center">
                      <div>
                          <h3 className="text-xl font-bold flex items-center gap-2"><FileSpreadsheet size={24} className="text-green-400"/> Importación Masiva</h3>
                          <p className="text-sm text-gray-400">Carga inicial o actualización de inventario</p>
                      </div>
                      <button onClick={() => setIsImportOpen(false)}><X size={24} className="text-gray-400 hover:text-white"/></button>
                  </div>

                  <div className="flex-1 flex flex-col p-8 overflow-hidden bg-slate-50">
                      {/* Stepper */}
                      <div className="flex items-center justify-center mb-8">
                          <div className={`flex items-center gap-2 ${importStep >= 1 ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${importStep >= 1 ? 'border-ferre-orange bg-ferre-orange text-white' : 'border-gray-300'}`}>1</span>
                              Carga
                          </div>
                          <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
                          <div className={`flex items-center gap-2 ${importStep >= 2 ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${importStep >= 2 ? 'border-ferre-orange bg-ferre-orange text-white' : 'border-gray-300'}`}>2</span>
                              Mapeo
                          </div>
                          <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
                          <div className={`flex items-center gap-2 ${importStep >= 3 ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${importStep >= 3 ? 'border-ferre-orange bg-ferre-orange text-white' : 'border-gray-300'}`}>3</span>
                              Confirmación
                          </div>
                      </div>

                      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
                          
                          {importStep === 1 && (
                              <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                                  <div className="w-full max-w-lg border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors relative">
                                      <Upload size={48} className="text-gray-300 mb-4"/>
                                      <p className="text-lg font-medium text-gray-700">Arrastra tu archivo Excel o CSV aquí</p>
                                      <p className="text-sm text-gray-500 mb-4">Soporta .xlsx, .xls, .csv</p>
                                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportFile} accept=".csv,.xlsx,.xls"/>
                                      <button className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm hover:bg-slate-700">Seleccionar Archivo</button>
                                  </div>
                                  <button onClick={handleDownloadTemplate} className="text-ferre-orange font-bold text-sm hover:underline flex items-center gap-1">
                                      <Download size={16}/> Descargar Plantilla de Ejemplo
                                  </button>
                                  <div className="text-xs text-gray-400 mt-2 max-w-md">
                                      La plantilla incluye: Código Interno, Nombre, Cód. Proveedor, Proveedor, Costo Lista, Marca, Moneda, Stocks (Central/Deposito), 3 Códigos de Barra, Ganancia, IVA, Descuentos 1, 2 y 3.
                                  </div>
                              </div>
                          )}

                          {importStep === 2 && (
                              <div className="flex flex-col h-full">
                                  <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
                                      <CheckCircle size={18} className="shrink-0"/>
                                      <p>Archivo <strong>{importFile?.name}</strong> cargado. Por favor, verifica que las columnas coincidan con los campos del sistema.</p>
                                  </div>
                                  
                                  <div className="flex-1 overflow-auto border border-gray-300 rounded-lg">
                                      <table className="w-full text-left border-collapse">
                                          <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase sticky top-0 z-10">
                                              <tr>
                                                  {MOCK_PREVIEW_ROWS[0].map((_, idx) => (
                                                      <th key={idx} className="p-2 border-r border-b border-gray-300 min-w-[120px]">
                                                          <div className="mb-2">Columna {String.fromCharCode(65 + idx)}</div>
                                                          <select className="w-full border border-gray-300 rounded p-1 text-xs font-normal" defaultValue={MAPPING_FIELDS[idx] || ""}>
                                                              <option value="">Ignorar</option>
                                                              {MAPPING_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                                                          </select>
                                                      </th>
                                                  ))}
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                              {MOCK_PREVIEW_ROWS.map((row, rIdx) => (
                                                  <tr key={rIdx}>
                                                      {row.map((cell, cIdx) => (
                                                          <td key={cIdx} className="p-2 border-r text-xs text-gray-700 font-mono truncate max-w-[120px]" title={cell}>
                                                              {cell}
                                                          </td>
                                                      ))}
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}

                          {importStep === 3 && (
                              <div className="flex flex-col items-center justify-center h-full gap-4">
                                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                      <Check size={40}/>
                                  </div>
                                  <h4 className="text-2xl font-bold text-gray-800">¡Todo Listo!</h4>
                                  <p className="text-gray-600 text-center max-w-md">
                                      Se han detectado <strong>3 artículos nuevos</strong> para importar. 
                                      <br/>Se asignarán las categorías y marcas detectadas o se crearán nuevas si no existen.
                                  </p>
                                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-md mt-4 text-sm space-y-2">
                                      <div className="flex justify-between"><span>Registros leídos:</span> <strong>3</strong></div>
                                      <div className="flex justify-between"><span>Errores detectados:</span> <strong className="text-green-600">0</strong></div>
                                      <div className="flex justify-between border-t pt-2 mt-2"><span>Acción:</span> <strong>Crear Nuevos / Actualizar Existentes</strong></div>
                                  </div>
                              </div>
                          )}

                      </div>
                  </div>

                  <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
                      {importStep > 1 && <button onClick={() => setImportStep(prev => prev - 1 as any)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Atrás</button>}
                      {importStep < 3 && <button onClick={() => setImportStep(prev => prev + 1 as any)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2">Siguiente <ChevronRight size={16}/></button>}
                      {importStep === 3 && <button onClick={handleConfirmImport} className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-900/20">Confirmar Importación</button>}
                  </div>
              </div>
          </div>
      )}

      {/* --- ADD/EDIT PRODUCT MODAL (COMPLETE OVERHAUL) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                           <Layers className="text-ferre-orange"/> {formData.id && products.some(p => p.id === formData.id) ? 'Modificar Artículo' : 'Alta de Artículo'}
                        </h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto">
                    <button onClick={() => setModalTab('GENERAL')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'GENERAL' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-500'}`}>General y Códigos</button>
                    <button onClick={() => setModalTab('PRICING')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'PRICING' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-500'}`}>Precios y Costos</button>
                    <button onClick={() => setModalTab('STOCK')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'STOCK' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-500'}`}>Inventario y Alertas</button>
                    <button onClick={() => setModalTab('ECOMMERCE')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'ECOMMERCE' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-500'}`}>Ecommerce</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    
                    {/* --- TAB GENERAL --- */}
                    {modalTab === 'GENERAL' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-12 gap-6">
                                {/* Basic Info */}
                                <div className="col-span-8 space-y-4">
                                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Información Principal</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Código Interno</label>
                                                <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-ferre-orange outline-none" value={formData.internalCode} onChange={e => setFormData({...formData, internalCode: e.target.value})}/>
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Cód. Referencia Proveedor</label>
                                                <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-ferre-orange outline-none" placeholder="Para actualización precios..." value={formData.providerCodes[0] || ''} onChange={e => setFormData({...formData, providerCodes: [e.target.value]})}/>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre / Descripción</label>
                                                <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-ferre-orange outline-none font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Descripción Detallada</label>
                                                <textarea className="w-full p-2 border rounded focus:ring-1 focus:ring-ferre-orange outline-none h-20 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Classification */}
                                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Clasificación</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Marca</label>
                                                <div className="flex gap-1">
                                                    <select className="w-full p-2 border rounded text-sm bg-white" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                                        <option value="">Seleccionar...</option>
                                                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                                        {formData.brand && !uniqueBrands.includes(formData.brand) && <option value={formData.brand}>{formData.brand}</option>}
                                                    </select>
                                                    <button onClick={() => handleAddNewAttribute('brand', 'Marca')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Plus size={16}/></button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Rubro</label>
                                                <div className="flex gap-1">
                                                    <select className="w-full p-2 border rounded text-sm bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                        <option value="">Seleccionar...</option>
                                                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                        {formData.category && !uniqueCategories.includes(formData.category) && <option value={formData.category}>{formData.category}</option>}
                                                    </select>
                                                    <button onClick={() => handleAddNewAttribute('category', 'Rubro')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Plus size={16}/></button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Proveedor</label>
                                                <div className="flex gap-1">
                                                    <select className="w-full p-2 border rounded text-sm bg-white" value={formData.provider} onChange={e => handleProviderChange(e.target.value)}>
                                                        <option value="">Seleccionar...</option>
                                                        {availableProviders.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    *Al cambiar proveedor se actualizarán los descuentos en "Precios".
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Barcodes & Units */}
                                <div className="col-span-4 space-y-4">
                                     <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2"><Barcode size={18}/> Códigos de Barra</h4>
                                        <div className="flex gap-2 mb-3">
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-ferre-orange outline-none" 
                                                placeholder="Escanear o escribir..."
                                                value={barcodeInput}
                                                onChange={e => setBarcodeInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddBarcode()}
                                            />
                                            <button onClick={handleAddBarcode} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900"><Plus size={16}/></button>
                                        </div>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {formData.barcodes.map(code => (
                                                <div key={code} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm border border-gray-100">
                                                    <span className="font-mono text-gray-600">{code}</span>
                                                    <button onClick={() => removeBarcode(code)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                            {formData.barcodes.length === 0 && <div className="text-xs text-gray-400 text-center italic">Sin códigos asignados</div>}
                                        </div>
                                     </div>

                                     <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Unidades de Medida</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Unidad de Compra</label>
                                                <select className="w-full p-2 border rounded text-sm bg-white" value={formData.measureUnitPurchase} onChange={e => setFormData({...formData, measureUnitPurchase: e.target.value})}>
                                                    <option value="Unidad">Unidad</option>
                                                    <option value="Caja">Caja</option>
                                                    <option value="Bulto">Bulto</option>
                                                    <option value="Metro">Metro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Unidad de Venta</label>
                                                <select className="w-full p-2 border rounded text-sm bg-white" value={formData.measureUnitSale} onChange={e => setFormData({...formData, measureUnitSale: e.target.value})}>
                                                    <option value="Unidad">Unidad</option>
                                                    <option value="Metro">Metro</option>
                                                    <option value="Litro">Litro</option>
                                                    <option value="Kg">Kg</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Factor Conversión</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" className="w-full p-2 border rounded text-sm" value={formData.conversionFactor} onChange={e => setFormData({...formData, conversionFactor: parseFloat(e.target.value)})}/>
                                                    <span className="text-xs text-gray-400">1 Compra = X Venta</span>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB PRICING --- */}
                    {modalTab === 'PRICING' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-6">
                                <h4 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2"><DollarSign size={18}/> Definición de Costos</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Moneda Compra</label>
                                        <select className="w-full p-2 border rounded text-sm bg-white" value={formData.purchaseCurrency} onChange={e => setFormData({...formData, purchaseCurrency: e.target.value as any})}>
                                            <option value="ARS">Pesos (ARS)</option>
                                            <option value="USD">Dólares (USD)</option>
                                        </select>
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Tasa IVA</label>
                                        <select className="w-full p-2 border rounded text-sm bg-white" value={formData.vatRate} onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value) as any})}>
                                            <option value={21.0}>21.0%</option>
                                            <option value={10.5}>10.5%</option>
                                            <option value={27.0}>27.0%</option>
                                            <option value={0}>0% (Exento)</option>
                                        </select>
                                     </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Costo de Lista (Sin IVA)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input type="number" className="w-full pl-8 p-2 border rounded font-mono text-lg" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value)})}/>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Descuentos en Cascada (%)</label>
                                    <p className="text-[10px] text-gray-400 mb-2">
                                        {formData.provider ? `Heredados de ${formData.provider}` : 'Defina descuentos manuales'}
                                    </p>
                                    <div className="flex gap-2">
                                        {[0,1,2,3].map(i => (
                                            <input 
                                                key={i}
                                                type="number" 
                                                placeholder={`D${i+1}`} 
                                                className="w-full p-2 border rounded text-center text-sm"
                                                value={formData.discounts[i] || ''}
                                                onChange={e => updateDiscount(i, parseFloat(e.target.value) || 0)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded border border-gray-100 mt-auto">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Costo Real (Neto)</span>
                                        <span className="font-bold text-lg">${formData.costAfterDiscounts.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Costo Real (+IVA)</span>
                                        <span className="font-bold text-sm text-gray-500">${(formData.costAfterDiscounts * (1 + formData.vatRate/100)).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-6">
                                <h4 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2"><Tag size={18}/> Definición de Precios de Venta</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Moneda Venta</label>
                                        <select className="w-full p-2 border rounded text-sm bg-white" value={formData.saleCurrency} onChange={e => setFormData({...formData, saleCurrency: e.target.value as any})}>
                                            <option value="ARS">Pesos (ARS)</option>
                                            <option value="USD">Dólares (USD)</option>
                                        </select>
                                     </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Margen de Ganancia (%)</label>
                                    <input type="number" className="w-full p-2 border rounded text-lg font-bold text-green-600" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value)})}/>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                         <span className="block text-xs text-blue-800 mb-1">Precio Neto (S/IVA)</span>
                                         <span className="block text-xl font-bold text-blue-900">${formData.priceNeto.toLocaleString('es-AR')}</span>
                                     </div>
                                     <div className="bg-ferre-orange/10 p-4 rounded border border-orange-200">
                                         <span className="block text-xs text-orange-800 mb-1">Precio Final (C/IVA)</span>
                                         <span className="block text-xl font-bold text-ferre-orange">${formData.priceFinal.toLocaleString('es-AR')}</span>
                                     </div>
                                </div>
                            </div>
                         </div>
                    )}

                    {/* --- TAB STOCK --- */}
                    {modalTab === 'STOCK' && (
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2"><Store size={18}/> Stock por Sucursal</h4>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-2">Sucursal / Depósito</th>
                                            <th className="px-4 py-2 text-right">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formData.stockDetails.map((detail, idx) => (
                                            <tr key={detail.branchId}>
                                                <td className="px-4 py-3 text-sm">{detail.branchName}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <input 
                                                        type="number" 
                                                        className="w-24 p-1 border rounded text-right"
                                                        value={detail.quantity}
                                                        onChange={(e) => updateStockDetail(detail.branchId, parseFloat(e.target.value))}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-gray-200 bg-gray-50">
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-gray-700">Stock Total Global</td>
                                            <td className="px-4 py-3 font-bold text-right text-gray-900">
                                                {formData.stockDetails.reduce((a,b) => a + b.quantity, 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-fit">
                                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2"><AlertTriangle size={18}/> Alertas de Stock</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Stock Mínimo (Critico)</label>
                                        <input type="number" className="w-full p-2 border border-red-200 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})}/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Punto de Pedido</label>
                                        <input type="number" className="w-full p-2 border border-yellow-200 rounded text-sm focus:ring-1 focus:ring-yellow-500 outline-none" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value)})}/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Stock Ideal (Máximo)</label>
                                        <input type="number" className="w-full p-2 border border-green-200 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none" value={formData.desiredStock} onChange={e => setFormData({...formData, desiredStock: parseFloat(e.target.value)})}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB ECOMMERCE --- */}
                    {modalTab === 'ECOMMERCE' && (
                        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-3xl mx-auto">
                            <h4 className="font-bold text-gray-700 mb-6 border-b pb-2 flex items-center gap-2"><Globe size={18}/> Integraciones Ecommerce</h4>
                            
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-yellow-400 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">ML</div>
                                        <div>
                                            <h5 className="font-bold text-gray-800">MercadoLibre</h5>
                                            <p className="text-sm text-gray-500">Sincronizar precio y stock automáticamente.</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="toggle-ml" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={formData.ecommerce.mercadoLibre} onChange={e => setFormData({...formData, ecommerce: {...formData.ecommerce, mercadoLibre: e.target.checked}})}/>
                                        <label htmlFor="toggle-ml" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.ecommerce.mercadoLibre ? 'bg-green-400' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">TN</div>
                                        <div>
                                            <h5 className="font-bold text-gray-800">TiendaNube</h5>
                                            <p className="text-sm text-gray-500">Publicar producto en catálogo online.</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="toggle-tn" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={formData.ecommerce.tiendaNube} onChange={e => setFormData({...formData, ecommerce: {...formData.ecommerce, tiendaNube: e.target.checked}})}/>
                                        <label htmlFor="toggle-tn" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.ecommerce.tiendaNube ? 'bg-green-400' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-400 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">WP</div>
                                        <div>
                                            <h5 className="font-bold text-gray-800">Web Propia (Woocommerce)</h5>
                                            <p className="text-sm text-gray-500">Disponible para venta en sitio web institucional.</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="toggle-wp" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={formData.ecommerce.webPropia} onChange={e => setFormData({...formData, ecommerce: {...formData.ecommerce, webPropia: e.target.checked}})}/>
                                        <label htmlFor="toggle-wp" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.ecommerce.webPropia ? 'bg-green-400' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSaveProduct} className="px-6 py-2 bg-ferre-dark text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"><Save size={18} /> Guardar Artículo</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Simple Tag Icon component for internal use
const Check = ({size}: {size:number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default Inventory;