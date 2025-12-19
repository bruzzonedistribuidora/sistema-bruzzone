import React, { useState } from 'react';
import { Globe, ShoppingBag, Truck, Package, Printer, FileText, CheckCircle, X, ExternalLink, MapPin, User, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { OnlineOrder, OnlinePlatform, OnlineOrderStatus, Product } from '../types';

// Helper for Mock Data
const createMockItem = (desc: string, qty: number, price: number) => ({
    product: { 
        id: '1', internalCode: 'SKU-001', name: desc, priceFinal: price, stock: 10,
        // ... (dummy product fields)
    } as Product,
    quantity: qty,
    subtotal: qty * price
});

const OnlineSales: React.FC = () => {
  const [filterPlatform, setFilterPlatform] = useState<OnlinePlatform | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY_TO_SHIP' | 'HISTORY'>('PENDING');

  const [orders, setOrders] = useState<OnlineOrder[]>([
      {
          id: '1', platformId: '2000005544', platform: 'MERCADOLIBRE', date: '2023-10-27 10:30',
          customer: { name: 'Mario Rossi', nickname: 'SUPERMARIO88', address: 'Av. Corrientes 1234, 5A', city: 'CABA', zipCode: '1040', phone: '1155556666', dni: '30112233' },
          items: [ createMockItem('Taladro Percutor Bosch', 1, 85000) ],
          total: 85000, shippingCost: 0, shippingMethod: 'MERCADOENVIOS', status: 'NEW', labelPrinted: false, invoiced: false, trackingCode: '2774883922'
      },
      {
          id: '2', platformId: '#9942', platform: 'TIENDANUBE', date: '2023-10-27 11:15',
          customer: { name: 'Laura Gomez', address: 'Calle Falsa 123', city: 'Rosario', zipCode: '2000', phone: '3415555555', dni: '28999888' },
          items: [ createMockItem('Lija al agua 180', 10, 450), createMockItem('Rodillo Pintor', 2, 2500) ],
          total: 9500, shippingCost: 1500, shippingMethod: 'CORREO', status: 'PACKING', labelPrinted: true, invoiced: true, trackingCode: ''
      },
      {
          id: '3', platformId: 'WC-1022', platform: 'WOOCOMMERCE', date: '2023-10-26 18:00',
          customer: { name: 'Empresa Constructora SA', address: 'Ruta 8 Km 50', city: 'Pilar', zipCode: '1629', phone: '02304444444', dni: '30-55555555-1' },
          items: [ createMockItem('Cemento Loma Negra', 50, 9500) ],
          total: 475000, shippingCost: 0, shippingMethod: 'RETIRO_SUCURSAL', status: 'READY_TO_SHIP', labelPrinted: false, invoiced: true
      }
  ]);

  const updateStatus = (orderId: string, newStatus: OnlineOrderStatus) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
  };

  const toggleInvoice = (orderId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoiced: true } : o));
      alert('Factura generada y enviada al cliente (Simulación).');
  };

  const printLabel = (orderId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, labelPrinted: true } : o));
      alert('Etiqueta de envío enviada a impresora térmica.');
  };

  // --- FILTERS ---
  const filteredOrders = orders.filter(o => {
      const matchPlatform = filterPlatform === 'ALL' || o.platform === filterPlatform;
      const matchTab = activeTab === 'PENDING' ? ['NEW', 'PACKING'].includes(o.status) 
                     : activeTab === 'READY_TO_SHIP' ? o.status === 'READY_TO_SHIP'
                     : ['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(o.status);
      return matchPlatform && matchTab;
  });

  // --- UI HELPERS ---
  const getPlatformIcon = (platform: OnlinePlatform) => {
      switch(platform) {
          case 'MERCADOLIBRE': return <span className="bg-yellow-300 text-yellow-900 font-bold px-2 py-0.5 rounded text-[10px] border border-yellow-400">MeLi</span>;
          case 'TIENDANUBE': return <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200">Nube</span>;
          case 'WOOCOMMERCE': return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px] border border-purple-200">Web</span>;
      }
  };

  const getStatusBadge = (status: OnlineOrderStatus) => {
      switch(status) {
          case 'NEW': return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Nuevo</span>;
          case 'PACKING': return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">Empaquetando</span>;
          case 'READY_TO_SHIP': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Listo para Despacho</span>;
          case 'SHIPPED': return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">En Camino</span>;
          case 'DELIVERED': return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold">Entregado</span>;
          default: return <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-bold">Cancelado</span>;
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ventas Online (E-commerce)</h2>
          <p className="text-gray-500 text-sm">Gestiona pedidos de MercadoLibre, TiendaNube y Web Propia.</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            <RefreshCw size={16} /> Sincronizar Ahora
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><ShoppingBag size={24}/></div>
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'NEW').length}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full"><Package size={24}/></div>
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Para Despachar</p>
                  <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'READY_TO_SHIP').length}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-full"><Truck size={24}/></div>
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">En Camino</p>
                  <p className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === 'SHIPPED').length}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><AlertCircle size={24}/></div>
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Reclamos</p>
                  <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 h-full overflow-hidden">
          
          {/* Left Column: Order List */}
          <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Filters Toolbar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                  <div className="flex gap-2">
                      <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'PENDING' ? 'bg-white text-ferre-orange shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:bg-gray-200'}`}>Pendientes</button>
                      <button onClick={() => setActiveTab('READY_TO_SHIP')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'READY_TO_SHIP' ? 'bg-white text-ferre-orange shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:bg-gray-200'}`}>Listos para Envío</button>
                      <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'HISTORY' ? 'bg-white text-ferre-orange shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:bg-gray-200'}`}>Historial</button>
                  </div>
                  <div className="flex gap-2 items-center">
                      <Search className="text-gray-400" size={18}/>
                      <input type="text" placeholder="Buscar comprador, ID orden..." className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-ferre-orange"/>
                      <div className="h-6 w-px bg-gray-300 mx-2"></div>
                      <select 
                        className="text-sm bg-transparent font-medium text-gray-600 outline-none"
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value as any)}
                      >
                          <option value="ALL">Todas las Plataformas</option>
                          <option value="MERCADOLIBRE">MercadoLibre</option>
                          <option value="TIENDANUBE">TiendaNube</option>
                          <option value="WOOCOMMERCE">Web Propia</option>
                      </select>
                  </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                  {filteredOrders.length === 0 ? (
                      <div className="text-center p-10 text-gray-400">No hay pedidos en esta sección.</div>
                  ) : (
                      filteredOrders.map(order => (
                          <div 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex justify-between items-center bg-white ${selectedOrder?.id === order.id ? 'border-ferre-orange ring-1 ring-orange-100' : 'border-gray-200'}`}
                          >
                              <div className="flex items-start gap-4">
                                  <div className="mt-1">{getPlatformIcon(order.platform)}</div>
                                  <div>
                                      <h4 className="font-bold text-gray-800 text-sm">
                                          {order.customer.name} 
                                          {order.customer.nickname && <span className="text-gray-400 font-normal ml-1">({order.customer.nickname})</span>}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-0.5">ID: {order.platformId} • {order.date}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                          {getStatusBadge(order.status)}
                                          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{order.shippingMethod}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-gray-800">${order.total.toLocaleString('es-AR')}</p>
                                  <p className="text-xs text-gray-500">{order.items.length} items</p>
                                  <div className="flex gap-1 justify-end mt-2">
                                      {order.invoiced && <FileText size={14} className="text-green-500" title="Facturado"/>}
                                      {order.labelPrinted && <Printer size={14} className="text-blue-500" title="Etiqueta Impresa"/>}
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Right Column: Order Detail */}
          <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
              {selectedOrder ? (
                  <>
                    <div className="p-6 border-b border-gray-200 bg-slate-50 flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Orden #{selectedOrder.platformId}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Globe size={12}/> Venta {selectedOrder.platform}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Customer Info */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12}/> Cliente</h4>
                            <p className="font-medium text-sm text-gray-800">{selectedOrder.customer.name}</p>
                            <p className="text-sm text-gray-600">DNI/CUIT: {selectedOrder.customer.dni}</p>
                            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400"/>
                                <span>{selectedOrder.customer.address}, {selectedOrder.customer.city} (CP {selectedOrder.customer.zipCode})</span>
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => printLabel(selectedOrder.id)}
                                disabled={selectedOrder.status === 'NEW'}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${selectedOrder.labelPrinted ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>
                                <Printer size={16}/> {selectedOrder.labelPrinted ? 'Re-imprimir Etiqueta' : 'Imprimir Etiqueta'}
                            </button>
                            <button 
                                onClick={() => toggleInvoice(selectedOrder.id)}
                                disabled={selectedOrder.invoiced}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${selectedOrder.invoiced ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}>
                                <FileText size={16}/> {selectedOrder.invoiced ? 'Facturado' : 'Facturar (AFIP)'}
                            </button>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Package size={12}/> Productos</h4>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.quantity} x {item.product.name}</p>
                                            <p className="text-xs text-gray-500">{item.product.internalCode}</p>
                                        </div>
                                        <p className="font-bold text-gray-700">${item.subtotal.toLocaleString('es-AR')}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                                <span className="text-gray-500">Envío</span>
                                <span className="font-medium">${selectedOrder.shippingCost.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="font-bold text-gray-800">Total</span>
                                <span className="font-bold text-xl text-ferre-orange">${(selectedOrder.total + selectedOrder.shippingCost).toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        {selectedOrder.status === 'NEW' && (
                            <button 
                                onClick={() => updateStatus(selectedOrder.id, 'PACKING')}
                                className="w-full bg-ferre-orange text-white font-bold py-3 rounded-lg shadow hover:bg-orange-600 transition-colors">
                                Comenzar Preparación
                            </button>
                        )}
                        {selectedOrder.status === 'PACKING' && (
                            <button 
                                onClick={() => updateStatus(selectedOrder.id, 'READY_TO_SHIP')}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 transition-colors">
                                Marcar Listo para Envío
                            </button>
                        )}
                        {selectedOrder.status === 'READY_TO_SHIP' && (
                            <button 
                                onClick={() => updateStatus(selectedOrder.id, 'SHIPPED')}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow hover:bg-green-700 transition-colors">
                                Confirmar Despacho
                            </button>
                        )}
                        {(selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED') && (
                            <div className="text-center text-sm text-green-600 font-bold flex items-center justify-center gap-2">
                                <CheckCircle size={16}/> Pedido despachado
                            </div>
                        )}
                    </div>
                  </>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                      <Globe size={48} className="mb-4 opacity-20"/>
                      <p>Selecciona un pedido de la lista para ver el detalle y gestionarlo.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default OnlineSales;