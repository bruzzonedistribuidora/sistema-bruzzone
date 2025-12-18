import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X, Save, Clock, Package, CheckCircle } from 'lucide-react';
import { SalesOrder } from '../types';

const SalesOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'MANAGEMENT'>('NEW_ORDER');

  // --- PERSISTENCE ---
  const [orders, setOrders] = useState<SalesOrder[]>(() => {
      const saved = localStorage.getItem('ferrecloud_sales_orders');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_sales_orders', JSON.stringify(orders));
  }, [orders]);

  const [clientName, setClientName] = useState('');

  const handleCreateOrder = () => {
      if (!clientName) return;
      const newOrder: SalesOrder = {
          id: `PED-${Math.floor(Date.now() / 1000)}`,
          clientName,
          date: new Date().toISOString().split('T')[0],
          priority: 'NORMAL',
          status: 'PENDING',
          items: [],
          notes: '',
          total: 0
      };
      setOrders([newOrder, ...orders]);
      setClientName('');
      setActiveTab('MANAGEMENT');
      alert("Pedido registrado localmente.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pedidos de Clientes</h2>
          <p className="text-gray-500 text-sm">Órdenes de preparación con persistencia automática.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          <button onClick={() => setActiveTab('NEW_ORDER')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'NEW_ORDER' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('MANAGEMENT')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'MANAGEMENT' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Gestión</button>
        </div>
      </div>

      {activeTab === 'NEW_ORDER' && (
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-4 animate-fade-in">
            <h3 className="font-bold">Datos del Pedido</h3>
            <input type="text" placeholder="Nombre del Cliente" className="w-full p-3 border rounded-lg" value={clientName} onChange={e => setClientName(e.target.value)} />
            <button onClick={handleCreateOrder} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md">Confirmar Pedido</button>
        </div>
      )}

      {activeTab === 'MANAGEMENT' && (
        <div className="bg-white rounded-xl border overflow-hidden flex-1 animate-fade-in">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr><th className="px-6 py-4">Nro Pedido</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {orders.map(o => (
                        <tr key={o.id}>
                            <td className="px-6 py-4 font-mono text-sm">{o.id}</td>
                            <td className="px-6 py-4 text-sm font-bold">{o.clientName}</td>
                            <td className="px-6 py-4"><span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold uppercase">PENDIENTE</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;