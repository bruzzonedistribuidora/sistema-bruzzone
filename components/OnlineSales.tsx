import React, { useState } from 'react';
import { Globe, ShoppingBag, Truck, Package, Printer, FileText, CheckCircle, X, ExternalLink, MapPin, User, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { OnlineOrder, OnlinePlatform, OnlineOrderStatus, Product, InvoiceItem } from '../types';

// Helper for Mock Data
const createMockItem = (desc: string, qty: number, price: number): InvoiceItem => ({
    product: { 
        // Fix: Removed duplicate properties priceFinal and stock that were redefined below
        id: '1', internalCode: 'SKU-001', name: desc,
        brand: 'Generico', provider: 'Proveedor Demo', category: 'General', description: '',
        measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
        vatRate: 21, listCost: price * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: price * 0.6, profitMargin: 40,
        priceNeto: price / 1.21, priceFinal: price, stock: 10, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
        location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
    } as Product,
    quantity: qty,
    subtotal: qty * price,
    appliedPrice: price
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

  const filteredOrders = orders.filter(o => {
      const matchPlatform = filterPlatform === 'ALL' || o.platform === filterPlatform;
      const matchTab = activeTab === 'PENDING' ? ['NEW', 'PACKING'].includes(o.status) 
                     : activeTab === 'READY_TO_SHIP' ? o.status === 'READY_TO_SHIP'
                     : ['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(o.status);
      return matchPlatform && matchTab;
  });

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
          case 'READY_TO_SHIP': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Listo despacho</span>;
          case 'SHIPPED': return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">En camino</span>;
          case 'DELIVERED': return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold">Entregado</span>;
          default: return <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-bold">Cancelado</span>;
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ventas Online</h2>
          <p className="text-gray-500 text-sm">Gestiona pedidos de múltiples canales de e-commerce.</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            <RefreshCw size={16} /> Sincronizar
        </button>
      </div>

      <div className="flex gap-6 h-full overflow-hidden">
          <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                  <div className="flex gap-2">
                      <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'PENDING' ? 'bg-white text-ferre-orange shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:bg-gray-200'}`}>Pendientes</button>
                      <button onClick={() => setActiveTab('READY_TO_SHIP')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'READY_TO_SHIP' ? 'bg-white text-ferre-orange shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:bg-gray-200'}`}>Para Despacho</button>
                      <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'HISTORY' ? 'bg-white text-ferre-orange shadow-sm ring-1 ring-orange-100' : 'text-gray-500 hover:bg-gray-200'}`}>Historial</button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                  {filteredOrders.map(order => (
                      <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex justify-between items-center bg-white ${selectedOrder?.id === order.id ? 'border-ferre-orange ring-1 ring-orange-100' : 'border-gray-200'}`}>
                          <div className="flex items-start gap-4">
                              <div className="mt-1">{getPlatformIcon(order.platform)}</div>
                              <div>
                                  <h4 className="font-bold text-gray-800 text-sm">{order.customer.name}</h4>
                                  <p className="text-xs text-gray-500">{order.date}</p>
                                  <div className="flex items-center gap-2 mt-2">{getStatusBadge(order.status)}</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-gray-800">${order.total.toLocaleString('es-AR')}</p>
                              <p className="text-xs text-gray-500">{order.items.length} items</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
              {selectedOrder ? (
                  <>
                    <div className="p-6 border-b border-gray-200 bg-slate-50 flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Orden #{selectedOrder.platformId}</h3>
                            <p className="text-xs text-gray-500">{selectedOrder.platform}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)}><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12}/> Cliente</h4>
                            <p className="font-medium text-sm text-gray-800">{selectedOrder.customer.name}</p>
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                                <MapPin size={16} className="inline mr-1 text-gray-400"/>
                                {selectedOrder.customer.address}, {selectedOrder.customer.city}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => printLabel(selectedOrder.id)} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                <Printer size={16}/> Etiqueta
                            </button>
                            <button onClick={() => toggleInvoice(selectedOrder.id)} disabled={selectedOrder.invoiced} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
                                <FileText size={16}/> {selectedOrder.invoiced ? 'Facturado' : 'Facturar'}
                            </button>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Productos</h4>
                            {selectedOrder.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 py-2">
                                    <span>{item.quantity}x {item.product.name}</span>
                                    <span className="font-bold">${item.subtotal.toLocaleString('es-AR')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        {selectedOrder.status === 'NEW' && (
                            <button onClick={() => updateStatus(selectedOrder.id, 'PACKING')} className="w-full bg-ferre-orange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors">
                                Comenzar Preparación
                            </button>
                        )}
                        {selectedOrder.status === 'PACKING' && (
                            <button onClick={() => updateStatus(selectedOrder.id, 'READY_TO_SHIP')} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                Marcar Listo para Despacho
                            </button>
                        )}
                        {selectedOrder.status === 'READY_TO_SHIP' && (
                            <button onClick={() => updateStatus(selectedOrder.id, 'SHIPPED')} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
                                Despachar / Enviar
                            </button>
                        )}
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20"/>
                      <p className="text-lg">Selecciona un pedido para procesar.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default OnlineSales;