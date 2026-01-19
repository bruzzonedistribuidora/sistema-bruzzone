
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, FileUp, List, Sparkles, Loader2, 
  CheckCircle2, AlertCircle, Plus, Trash2, 
  Keyboard, Calculator, Save, X, Package,
  DollarSign, Percent, Info, Search, RefreshCw,
  TrendingUp, PackagePlus
} from 'lucide-react';
import { analyzeInvoice } from '../geminiService';
import { useFirebase } from '../context/FirebaseContext';
import { Product } from '../types';

interface PurchaseItem {
  id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const Purchases: React.FC = () => {
  const { products, updateProduct, addProduct } = useFirebase();
  const [purchaseMode, setPurchaseMode] = useState<'ia' | 'manual'>('ia');
  const [loading, setLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Opciones de Carga
  const [updateCosts, setUpdateCosts] = useState(true);
  const [extraDiscountCtaCte, setExtraDiscountCtaCte] = useState<number>(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  
  const [purchaseData, setPurchaseData] = useState<{
    invoiceNumber: string;
    supplierName: string;
    supplierCuit: string;
    items: PurchaseItem[];
  }>({
    invoiceNumber: '',
    supplierName: '',
    supplierCuit: '',
    items: []
  });

  // Estado para la búsqueda y el ítem manual
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [newItem, setNewItem] = useState<PurchaseItem>({
    sku: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtrado de productos para el buscador manual
  const filteredProducts = searchQuery.length > 1 
    ? products.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectProduct = (p: Product) => {
    setNewItem({
      id: p.id,
      sku: p.sku,
      description: p.name,
      quantity: 1,
      unitPrice: p.costPrice || 0,
      total: p.costPrice || 0
    });
    setSearchQuery(p.name);
    setShowResults(false);
  };

  const handleQuickCreate = async () => {
    if (!searchQuery) {
      alert("Ingrese un nombre en el buscador para el nuevo producto");
      return;
    }
    
    const sku = prompt("Ingrese SKU / Código para el nuevo producto", "SKU-" + Math.floor(Math.random()*10000));
    if (sku === null) return; // Cancelado

    const newProd = {
      sku: sku || "S/K",
      name: searchQuery,
      costPrice: newItem.unitPrice || 0,
      salePrice: (newItem.unitPrice || 0) * 1.4, // Margen sugerido 40%
      stock: 0,
      category: 'General',
      brand: 'S/M'
    };

    try {
      setLoading(true);
      await addProduct(newProd);
      
      const itemParaTabla: PurchaseItem = {
        sku: newProd.sku,
        description: newProd.name,
        quantity: newItem.quantity || 1,
        unitPrice: newProd.costPrice,
        total: (newItem.quantity || 1) * newProd.costPrice
      };

      setPurchaseData(prev => ({
        ...prev,
        items: [...prev.items, itemParaTabla]
      }));

      alert("Producto creado y añadido a la lista de compra.");
      setSearchQuery('');
      setNewItem({ sku: '', description: '', quantity: 1, unitPrice: 0, total: 0 });
    } catch (e) {
      alert("Error al crear el producto en la nube");
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales
  const subtotal = purchaseData.items.reduce((acc, item) => acc + item.total, 0);
  const subtotalWithDiscount = subtotal * (1 - invoiceDiscount / 100);
  const iva = subtotalWithDiscount * 0.21;
  const totalFiscal = subtotalWithDiscount + iva;
  const totalCtaCte = totalFiscal - extraDiscountCtaCte;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const data = await analyzeInvoice(base64);
        setPurchaseData({
          invoiceNumber: data.invoiceNumber || '',
          supplierName: data.supplierName || '',
          supplierCuit: data.supplierCuit || '',
          items: data.items.map((it: any) => {
            const match = products.find(p => p.name.toLowerCase() === it.description.toLowerCase());
            return { 
              ...it, 
              id: match?.id,
              sku: match?.sku || 'IA-SCAN' 
            };
          }) || []
        });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Error al procesar la factura con IA');
      setLoading(false);
    }
  };

  const addManualItem = () => {
    if (!newItem.description || newItem.quantity <= 0) {
      alert("Complete los datos del artículo");
      return;
    }
    setPurchaseData(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem, total: newItem.quantity * newItem.unitPrice }]
    }));
    setNewItem({ sku: '', description: '', quantity: 1, unitPrice: 0, total: 0 });
    setSearchQuery('');
  };

  const updateItemInTable = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseData.items];
    const item = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = Number(item.quantity) * Number(item.unitPrice);
    }
    
    updatedItems[index] = item;
    setPurchaseData({ ...purchaseData, items: updatedItems });
  };

  const removeItem = (index: number) => {
    setPurchaseData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleFinishPurchase = async () => {
    if (purchaseData.items.length === 0) return;
    setIsFinishing(true);
    try {
      if (updateCosts) {
        for (const item of purchaseData.items) {
          if (item.id) {
            await updateProduct(item.id, { costPrice: Number(item.unitPrice) });
          }
        }
      }

      alert(`Compra registrada exitosamente.\n\n` + 
            `- Total Factura: $${totalFiscal.toLocaleString()}\n` +
            `- Saldo Cta Cte: $${totalCtaCte.toLocaleString()}\n` +
            (updateCosts ? `- Costos de productos actualizados.` : `- Los costos originales no fueron modificados.`));
      
      setPurchaseData({ invoiceNumber: '', supplierName: '', supplierCuit: '', items: [] });
      setExtraDiscountCtaCte(0);
      setInvoiceDiscount(0);
    } catch (e) {
      alert("Error al finalizar la compra. Verifique su conexión.");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Módulo de Compras</h1>
          <p className="text-slate-500 font-medium">Procesamiento de facturas y actualización de márgenes.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          <button 
            onClick={() => setPurchaseMode('ia')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${purchaseMode === 'ia' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" /> Escaneo IA
          </button>
          <button 
            onClick={() => setPurchaseMode('manual')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${purchaseMode === 'manual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Keyboard className="w-4 h-4 inline mr-2" /> Carga Manual
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-600" /> Cabecera del Comprobante
            </h3>
            <div className="space-y-4">
              <input 
                value={purchaseData.invoiceNumber}
                onChange={e => setPurchaseData({...purchaseData, invoiceNumber: e.target.value})}
                placeholder="N° de Factura / Remito"
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input 
                value={purchaseData.supplierName}
                onChange={e => setPurchaseData({...purchaseData, supplierName: e.target.value})}
                placeholder="Proveedor / Razón Social"
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </section>

          {purchaseMode === 'ia' && (
            <section className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-orange-400">Escaneo de Factura</h3>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-white/5 transition-all group"
              >
                <div className="p-4 bg-orange-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-600/20">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="font-bold text-center">Subir foto o PDF de factura</p>
                <p className="text-xs text-slate-500 mt-1">La IA extraerá items y precios.</p>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
              </div>
              {loading && (
                <div className="flex items-center gap-3 text-orange-400 font-bold animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" /> Procesando con IA...
                </div>
              )}
            </section>
          )}

          {purchaseMode === 'manual' && (
            <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Añadir Item</h3>
                <button 
                  onClick={handleQuickCreate}
                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                >
                  <PackagePlus className="w-3 h-3" /> ¿Producto Nuevo?
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    placeholder="Buscar en catálogo..."
                    className="w-full pl-10 pr-4 py-2 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                      setNewItem(prev => ({ ...prev, description: e.target.value }));
                    }}
                    onFocus={() => setShowResults(true)}
                  />
                  {showResults && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id} 
                          className="p-3 hover:bg-orange-50 cursor-pointer border-b border-slate-50 last:border-0"
                          onClick={() => selectProduct(p)}
                        >
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase">{p.sku}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cantidad</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 border rounded-xl font-bold"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Costo Unit.</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 border rounded-xl font-bold text-green-600"
                      value={newItem.unitPrice || ''}
                      placeholder="0.00"
                      onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <button 
                  onClick={addManualItem}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Agregar a la Lista
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                <List className="w-5 h-5 text-orange-600" /> Detalle de Compra
              </h3>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 cursor-pointer uppercase tracking-widest">
                  <input 
                    type="checkbox" 
                    checked={updateCosts} 
                    onChange={e => setUpdateCosts(e.target.checked)}
                    className="w-4 h-4 rounded accent-orange-600"
                  />
                  Actualizar costos en catálogo
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Producto / SKU</th>
                    <th className="px-6 py-4 text-center">Cant.</th>
                    <th className="px-6 py-4 text-right">Costo Unit.</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                    <th className="px-6 py-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-800">{item.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number" 
                          className="w-16 text-center border-slate-200 border rounded-lg font-bold p-1 outline-none focus:ring-1 focus:ring-orange-500"
                          value={item.quantity}
                          onChange={(e) => updateItemInTable(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number" 
                          className="w-24 text-right border-slate-200 border rounded-lg font-bold p-1 outline-none focus:ring-1 focus:ring-orange-500 text-green-600"
                          value={item.unitPrice}
                          onChange={(e) => updateItemInTable(index, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        ${item.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => removeItem(index)} className="text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {purchaseData.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                        No hay artículos cargados para esta compra
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-900 text-white rounded-b-[2rem]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal Neto</p>
                  <p className="text-2xl font-black">${subtotal.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IVA (21%)</p>
                  <p className="text-2xl font-black text-blue-400">${iva.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desc. Factura (%)</p>
                  <input 
                    type="number" 
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-1 text-xl font-black w-24 outline-none focus:ring-2 focus:ring-orange-500"
                    value={invoiceDiscount}
                    onChange={(e) => setInvoiceDiscount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Total Fiscal</p>
                  <p className="text-4xl font-black text-orange-500">${totalFiscal.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desc. Extra Cta.Cte ($)</p>
                    <input 
                      type="number" 
                      className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-lg font-black w-40 outline-none focus:ring-2 focus:ring-orange-500 text-orange-400"
                      value={extraDiscountCtaCte}
                      onChange={(e) => setExtraDiscountCtaCte(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neto a Deuda Cta.Cte</p>
                     <p className="text-2xl font-black text-green-400">${totalCtaCte.toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  disabled={purchaseData.items.length === 0 || isFinishing}
                  onClick={handleFinishPurchase}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isFinishing ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                  FINALIZAR CARGA
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Purchases;