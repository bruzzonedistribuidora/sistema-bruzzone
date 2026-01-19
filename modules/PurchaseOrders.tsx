
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Search, Truck, 
  AlertTriangle, CheckCircle2, X, 
  ChevronRight, ArrowRight, Printer,
  FileText, History, MoreHorizontal,
  PlusCircle, Trash2, Send, PackageCheck,
  Timer, Calculator, Package, Info, Save
} from 'lucide-react';

interface OrderSuggestion {
  id: string;
  sku: string;
  name: string;
  supplier: string;
  currentStock: number;
  reorderPoint: number;
  targetStock: number;
  suggestedQty: number;
  cost: number;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  status: 'borrador' | 'enviado' | 'recibido';
  total: number;
  items: any[];
}

const PurchaseOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sugerencias' | 'historial'>('sugerencias');
  const [search, setSearch] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // Mock Data: Artículos que llegaron al punto de pedido
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([
    { id: '1', sku: 'CEM-AVE', name: 'Cemento Avellaneda 50kg', supplier: 'Avellaneda', currentStock: 8, reorderPoint: 20, targetStock: 50, suggestedQty: 42, cost: 2800 },
    { id: '2', sku: 'TAL-650', name: 'Taladro Bosch GSB 650', supplier: 'Bosch', currentStock: 2, reorderPoint: 5, targetStock: 10, suggestedQty: 8, cost: 12500 },
    { id: '3', sku: 'MART-001', name: 'Martillo Stanley 20oz', supplier: 'Stanley', currentStock: 3, reorderPoint: 10, targetStock: 20, suggestedQty: 17, cost: 3200 },
    { id: '4', sku: 'PIN-LAT', name: 'Pintura Latex Alba 20L', supplier: 'Alba', currentStock: 1, reorderPoint: 5, targetStock: 12, suggestedQty: 11, cost: 35000 },
  ]);

  // Mock Products for manual search
  const mockAllProducts = [
    { id: '10', sku: 'PIN-001', name: 'Pincel N°10 Cerda Blanca', supplier: 'Alba', cost: 1200, stock: 45 },
    { id: '11', sku: 'DIS-045', name: 'Disco de Corte 4.5"', supplier: 'Stanley', cost: 850, stock: 120 },
    { id: '12', sku: 'LIJ-080', name: 'Lija de Agua 80', supplier: 'Sia Abrasivos', cost: 45, stock: 500 },
  ];

  const [orders, setOrders] = useState<PurchaseOrder[]>([
    { id: 'OC-4821', supplier: 'Stanley Argentina', date: '2024-05-20', status: 'enviado', total: 124500, items: [] },
    { id: 'OC-4820', supplier: 'Bosch', date: '2024-05-18', status: 'recibido', total: 450200, items: [] },
  ]);

  const filteredManualProducts = mockAllProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addToReplenishment = (product: any) => {
    const existing = suggestions.find(s => s.id === product.id);
    if (existing) {
      setSuggestions(suggestions.map(s => s.id === product.id ? { ...s, suggestedQty: s.suggestedQty + 1 } : s));
    } else {
      setSuggestions([...suggestions, {
        id: product.id,
        sku: product.sku,
        name: product.name,
        supplier: product.supplier,
        currentStock: product.stock,
        reorderPoint: 10,
        targetStock: 50,
        suggestedQty: 10,
        cost: product.cost
      }]);
    }
    setShowManualModal(false);
    setProductSearch('');
  };

  // Grouping suggestions by supplier
  const groupedSuggestions = suggestions.reduce((acc, curr) => {
    if (!acc[curr.supplier]) acc[curr.supplier] = [];
    acc[curr.supplier].push(curr);
    return acc;
  }, {} as { [key: string]: OrderSuggestion[] });

  const totalReplenishmentCost = suggestions.reduce((acc, curr) => acc + (curr.suggestedQty * curr.cost), 0);

  const handleGenerateOrder = (supplier: string) => {
    alert(`Generando orden de compra para ${supplier}... Se enviará por email automáticamente.`);
  };

  const removeFromOrder = (id: string) => {
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos de Compra (Reposición)</h1>
          <p className="text-slate-500">Detección automática de faltantes y generación de órdenes a proveedores.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-left">
            <History className="w-5 h-5 shrink-0" /> <span className="truncate">Ver Recepciones</span>
          </button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-600/20 text-left"
          >
            <Plus className="w-5 h-5 shrink-0" /> <span className="truncate">Nuevo Pedido Manual</span>
          </button>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sugerencias')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'sugerencias' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-5 h-5" /> Sugerencias de Reposición
          <span className="ml-1 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px]">{suggestions.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'historial' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-5 h-5" /> Órdenes Activas
        </button>
      </div>

      {activeTab === 'sugerencias' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Summary Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex items-center gap-6">
              <div className="p-5 bg-orange-600 rounded-3xl shadow-xl shadow-orange-600/30">
                <Truck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Abastecimiento Necesario</h3>
                <p className="text-slate-400 text-sm">Hay {suggestions.length} artículos críticos requiriendo reposición hoy.</p>
              </div>
            </div>
            <div className="relative z-10 text-center md:text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Estimada</p>
              <h3 className="text-4xl font-black text-orange-500">${totalReplenishmentCost.toLocaleString()}</h3>
            </div>
            <ShoppingCart className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
          </div>

          {/* Grouped Suggestions */}
          <div className="space-y-6">
            {Object.keys(groupedSuggestions).map(supplier => (
              <div key={supplier} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom duration-500">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Truck className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">Proveedor: {supplier}</h4>
                    <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase">
                      {groupedSuggestions[supplier].length} Artículos
                    </span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleGenerateOrder(supplier)}
                       className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                     >
                       <Send className="w-4 h-4" /> Generar Pedido
                     </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="px-8 py-4">Artículo / SKU</th>
                        <th className="px-8 py-4 text-center">Stock Actual</th>
                        <th className="px-8 py-4 text-center">Punto Pedido</th>
                        <th className="px-8 py-4 text-center">Stock Deseado</th>
                        <th className="px-8 py-4 text-center">A Pedir</th>
                        <th className="px-8 py-4 text-right">Costo Est.</th>
                        <th className="px-8 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedSuggestions[supplier].map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="text-sm font-black text-red-600">{item.currentStock}</span>
                          </td>
                          <td className="px-8 py-5 text-center text-sm font-bold text-slate-400">
                            {item.reorderPoint}
                          </td>
                          <td className="px-8 py-5 text-center text-sm font-black text-slate-700">
                            {item.targetStock}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="inline-flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                              <span className="text-sm font-black text-orange-600">{item.suggestedQty}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">
                            ${(item.suggestedQty * item.cost).toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                               <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><PlusCircle className="w-4 h-4" /></button>
                               <button onClick={() => removeFromOrder(item.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
               <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                 <History className="w-5 h-5 text-orange-600" /> Órdenes de Compra Activas
               </h4>
               <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="Buscar OC..." />
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-4">Orden #</th>
                    <th className="px-8 py-4">Proveedor</th>
                    <th className="px-8 py-4">Fecha Emisión</th>
                    <th className="px-8 py-4">Estado</th>
                    <th className="px-8 py-4 text-right">Monto Total</th>
                    <th className="px-8 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="px-8 py-6 font-black text-slate-900">{order.id}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-300" />
                          <span className="font-bold text-slate-700">{order.supplier}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-500 font-medium">{order.date}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          order.status === 'enviado' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                        ${order.total.toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="Recibir Mercadería"><PackageCheck className="w-4 h-4" /></button>
                           <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl" title="Imprimir OC"><Printer className="w-4 h-4" /></button>
                        </div>
                        <MoreHorizontal className="w-5 h-5 mx-auto text-slate-200 group-hover:hidden" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex items-center gap-6">
            <div className="p-4 bg-orange-600 text-white rounded-2xl shadow-xl shadow-orange-600/20">
              <Timer className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-orange-900 uppercase tracking-tight">Control de Entregas</h4>
              <p className="text-sm text-orange-700 font-medium">Tienes 2 pedidos marcados como 'Enviado' que superan los 5 días sin recepción. ¿Deseas reclamar a los proveedores?</p>
            </div>
            <button className="ml-auto px-6 py-3 bg-white border border-orange-200 text-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Ver Demoras</button>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PEDIDO MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Agregar Pedido Manual</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Busca artículos para reponer</p>
                </div>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por SKU, nombre o marca..."
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50/50 shadow-sm"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {productSearch.length > 0 ? (
                  filteredManualProducts.length > 0 ? (
                    filteredManualProducts.map(p => (
                      <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group" onClick={() => addToReplenishment(p)}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 transition-colors">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.sku} • Proveedor: {p.supplier}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-xs font-black text-slate-400 uppercase">Stock: {p.stock}</p>
                             <p className="text-sm font-black text-slate-900">${p.cost.toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                            <Plus className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-widest italic">No hay resultados para "{productSearch}"</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10">
                    <Info className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Escribe para buscar productos del catálogo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
               <button 
                 onClick={() => setShowManualModal(false)}
                 className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-white transition-all uppercase text-xs tracking-widest"
               >
                 Cancelar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
