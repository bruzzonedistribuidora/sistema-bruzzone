import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Truck, Plus, Search, FileText, X, Save, RefreshCw, 
    Trash2, ShoppingBag, Package, AlertTriangle, Eye, Upload, 
    CheckCircle, Wand2, Sparkles, PlusCircle, Calculator,
    Receipt, Tag, Store, DollarSign, ArrowRight, History, Info, Minus
} from 'lucide-react';
import { Purchase, Provider, Product, PurchaseItem, CompanyConfig, ViewState } from '../types';
import { analyzeInvoice, searchVirtualInventory } from '../services/geminiService';

interface PurchasesProps {
  defaultTab?: string;
  onNavigate?: (view: ViewState) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES', onNavigate }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<'IA' | 'MANUAL'>('IA');
  const [productSearch, setProductSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [products] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
  const [purchases, setPurchases] = useState<Purchase[]>(() => JSON.parse(localStorage.getItem('ferrecloud_purchases') || '[]'));
  
  const [aiResult, setAiResult] = useState<any>(null);
  const [manualItems, setManualItems] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
      window.dispatchEvent(new Event('ferrecloud_purchases_updated')); // Disparar evento para sincronización
  }, [purchases]);

  // Lógica de búsqueda mejorada
  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase().trim();
    if (!term) return [];
    return products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.internalCodes.some(c => c.toLowerCase().includes(term)) ||
        p.providerCodes.some(c => c.toLowerCase().includes(term)) ||
        p.barcodes.some(c => c.toLowerCase().includes(term))
    ).slice(0, 10);
  }, [productSearch, products]);

  const handleAiInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsAiProcessing(true);
      try {
          const reader = new FileReader();
          reader.onload = async (event) => {
              const base64 = event.target?.result as string;
              const analysis = await analyzeInvoice(base64, file.type);
              setAiResult(analysis);
              setPurchaseMode('IA');
              setIsNewPurchaseModalOpen(true);
              setIsAiProcessing(false);
          };
          reader.readAsDataURL(file);
      } catch (err) {
          alert("Error al analizar la factura.");
          setIsAiProcessing(false);
      }
  };

  const handleAddManualItem = () => {
      setManualItems([...manualItems, { descripcion: '', cantidad: 1, costoUnitario: 0, subtotal: 0 }]);
  };

  const addExistingProductToPurchase = (p: Product) => {
    setManualItems(prev => [...prev, {
        productId: p.id,
        descripcion: p.name,
        cantidad: 1,
        costoUnitario: p.listCost,
        subtotal: p.listCost
    }]);
    setProductSearch('');
    setShowSearchResults(false);
  };

  const handleSavePurchase = () => {
      const itemsToProcess = purchaseMode === 'IA' ? aiResult.items : manualItems;
      const total = itemsToProcess.reduce((acc: number, i: any) => acc + (parseFloat(i.subtotal) || 0), 0);
      
      const newPurchase: Purchase = {
          id: purchaseMode === 'IA' ? aiResult.numeroFactura : `MAN-${Date.now()}`,
          providerId: selectedProvider || '1',
          providerName: providers.find(p => p.id === selectedProvider)?.name || aiResult?.nombreEmisor || 'Proveedor',
          date: new Date().toISOString().split('T')[0],
          type: 'Factura Compra',
          items: itemsToProcess.length,
          total: total,
          status: 'PENDING'
      };

      setPurchases([newPurchase, ...purchases]);
      setIsNewPurchaseModalOpen(false);
      setAiResult(null);
      setManualItems([]);
      alert("Compra cargada exitosamente.");
  };

  const deletePurchase = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este comprobante de compra? Esta acción no se puede rehacer.')) {
        setPurchases(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      <div className="bg-white border-b border-gray-200 px-6 shrink-0 z-20">
        <div className="flex gap-2 h-14 items-end">
            {[
                { id: 'PURCHASES', label: 'Libro Compras', icon: Receipt },
                { id: 'MANUAL_ENTRY', label: 'Carga Manual', icon: PlusCircle },
                { id: 'HISTORY', label: 'Historial', icon: History }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => {
                        if (tab.id === 'MANUAL_ENTRY') {
                            setPurchaseMode('MANUAL');
                            setManualItems([]);
                            setIsNewPurchaseModalOpen(true);
                        } else {
                            setActiveTab(tab.id);
                        }
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all border-x border-t ${
                        activeTab === tab.id 
                        ? 'bg-slate-50 border-gray-200 text-indigo-600 -mb-px shadow-[0_-5px_15px_rgba(0,0,0,0.03)]' 
                        : 'bg-white border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Wand2 size={120}/>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Carga con IA</h3>
                    <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">Sincroniza costos escaneando la factura del proveedor.</p>
                    <input type="file" ref={invoiceFileRef} className="hidden" accept="image/*,application/pdf" onChange={handleAiInvoiceUpload} />
                    <button 
                        onClick={() => invoiceFileRef.current?.click()}
                        disabled={isAiProcessing}
                        className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                        {isAiProcessing ? <RefreshCw className="animate-spin"/> : <><Upload size={18}/> Escanear Factura</>}
                    </button>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compras del Mes</p>
                        <h4 className="text-3xl font-black text-slate-800">${purchases.reduce((a,c) => a + c.total, 0).toLocaleString()}</h4>
                    </div>
                    <div className="pt-4 border-t mt-4 flex justify-between items-center text-indigo-600 font-black text-[9px] uppercase tracking-widest">
                        <span>Reporte Analítico</span>
                        <ArrowRight size={14}/>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500 rounded-2xl"><Truck size={24}/></div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Proveedores</p>
                            <p className="text-lg font-black">{providers.length} Entidades</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onNavigate?.(ViewState.PROVIDERS)}
                        className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Administrar Fichero
                    </button>
                </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      <tr>
                          <th className="px-8 py-5">Comprobante</th>
                          <th className="px-8 py-5">Proveedor</th>
                          <th className="px-8 py-5">Fecha</th>
                          <th className="px-8 py-5 text-right">Total</th>
                          <th className="px-8 py-5 text-center">Estado</th>
                          <th className="px-8 py-5 text-center">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px]">
                      {purchases.length === 0 ? (
                          <tr><td colSpan={6} className="py-20 text-center text-slate-300 uppercase font-black tracking-widest">Sin compras registradas</td></tr>
                      ) : purchases.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5 font-black text-slate-800">{p.id}</td>
                              <td className="px-8 py-5 font-black text-slate-500 uppercase">{p.providerName}</td>
                              <td className="px-8 py-5 font-bold text-slate-400">{p.date}</td>
                              <td className="px-8 py-5 text-right font-black text-slate-900">${p.total.toLocaleString()}</td>
                              <td className="px-8 py-5 text-center">
                                  <span className="px-3 py-1 rounded-full text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">Cargado</span>
                              </td>
                              <td className="px-8 py-5">
                                  <div className="flex justify-center gap-2">
                                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Eye size={18}/></button>
                                      <button onClick={() => deletePurchase(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {isNewPurchaseModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><PlusCircle size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{purchaseMode === 'IA' ? 'Confirmación de Factura IA' : 'Nueva Carga Manual'}</h3>
                              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Suministro de Inventario</p>
                          </div>
                      </div>
                      <button onClick={() => setIsNewPurchaseModalOpen(false)}><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-2">Proveedor</label>
                              <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold uppercase text-xs" value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
                                  <option value="">{purchaseMode === 'IA' ? aiResult?.nombreEmisor : '-- SELECCIONE PROVEEDOR --'}</option>
                                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                          </div>
                          
                          {purchaseMode === 'MANUAL' && (
                              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative">
                                  <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-2">Añadir Artículos por SKU / Prov / EAN</label>
                                  <div className="relative">
                                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                      <input 
                                          type="text" 
                                          placeholder="Buscar producto a ingresar..."
                                          className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold uppercase text-xs"
                                          value={productSearch}
                                          onFocus={() => setShowSearchResults(true)}
                                          onChange={e => setProductSearch(e.target.value)}
                                      />
                                      {showSearchResults && productSearch.length > 0 && (
                                          <div className="absolute top-full left-0 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] mt-2 overflow-hidden">
                                              {filteredProducts.map(p => (
                                                  <button key={p.id} onClick={() => addExistingProductToPurchase(p)} className="w-full p-4 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center group">
                                                      <div className="text-left">
                                                          <p className="font-black text-slate-800 uppercase text-xs">{p.name}</p>
                                                          <div className="flex gap-2 text-[8px] font-bold text-slate-400 uppercase">
                                                              <span>INT: {p.internalCodes[0]}</span>
                                                              <span>PROV: {p.providerCodes[0] || 'S/D'}</span>
                                                          </div>
                                                      </div>
                                                      <Plus size={16} className="text-indigo-400 group-hover:scale-125 transition-transform"/>
                                                  </button>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}

                          {purchaseMode === 'IA' && (
                              <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col justify-center">
                                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Detectado</p>
                                  <p className="text-5xl font-black tracking-tighter leading-none">${aiResult.total?.toLocaleString()}</p>
                              </div>
                          )}
                      </div>

                      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalle de Comprobante</h4>
                              {purchaseMode === 'MANUAL' && (
                                <button onClick={handleAddManualItem} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                                    <PlusCircle size={14}/> Nuevo Ítem Libre
                                </button>
                              )}
                          </div>
                          <table className="w-full text-left">
                              <thead className="bg-white text-[8px] font-black text-gray-400 uppercase border-b">
                                  <tr>
                                      <th className="px-6 py-4">Descripción del Artículo</th>
                                      <th className="px-6 py-4 text-center">Cant.</th>
                                      <th className="px-6 py-4 text-right">Costo Unit.</th>
                                      <th className="px-6 py-4 text-right">Subtotal</th>
                                      <th className="px-6 py-4 w-10"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-[10px]">
                                  {(purchaseMode === 'IA' ? aiResult.items : manualItems).map((item: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-indigo-50/20 transition-all">
                                          <td className="px-6 py-3">
                                              <input 
                                                type="text" 
                                                className="w-full bg-transparent font-black text-slate-800 uppercase outline-none focus:text-indigo-600" 
                                                value={item.descripcion}
                                                onChange={e => {
                                                    const newItems = purchaseMode === 'IA' ? [...aiResult.items] : [...manualItems];
                                                    newItems[idx].descripcion = e.target.value;
                                                    purchaseMode === 'IA' ? setAiResult({...aiResult, items: newItems}) : setManualItems(newItems);
                                                }}
                                              />
                                          </td>
                                          <td className="px-6 py-3">
                                              <input 
                                                type="number" 
                                                className="w-16 mx-auto bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-black" 
                                                value={item.cantidad}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newItems = purchaseMode === 'IA' ? [...aiResult.items] : [...manualItems];
                                                    newItems[idx].cantidad = val;
                                                    newItems[idx].subtotal = val * newItems[idx].costoUnitario;
                                                    purchaseMode === 'IA' ? setAiResult({...aiResult, items: newItems}) : setManualItems(newItems);
                                                }}
                                              />
                                          </td>
                                          <td className="px-6 py-3 text-right">
                                              <input 
                                                type="number" 
                                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-1 text-right font-black" 
                                                value={item.costoUnitario}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newItems = purchaseMode === 'IA' ? [...aiResult.items] : [...manualItems];
                                                    newItems[idx].costoUnitario = val;
                                                    newItems[idx].subtotal = val * newItems[idx].cantidad;
                                                    purchaseMode === 'IA' ? setAiResult({...aiResult, items: newItems}) : setManualItems(newItems);
                                                }}
                                              />
                                          </td>
                                          <td className="px-6 py-3 text-right font-black text-slate-900">${(item.subtotal || 0).toLocaleString()}</td>
                                          <td className="px-6 py-3">
                                              <button onClick={() => {
                                                  const newItems = (purchaseMode === 'IA' ? aiResult.items : manualItems).filter((_:any, i:number) => i !== idx);
                                                  purchaseMode === 'IA' ? setAiResult({...aiResult, items: newItems}) : setManualItems(newItems);
                                              }} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                      <div className="text-left">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Comprobante</p>
                          <p className="text-3xl font-black text-slate-900">${(purchaseMode === 'IA' ? aiResult.total : manualItems.reduce((a,c) => a + (parseFloat(c.subtotal) || 0), 0)).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setIsNewPurchaseModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                        <button onClick={handleSavePurchase} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                            <CheckCircle size={18}/> Procesar Ingreso
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
