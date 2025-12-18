import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, X, ClipboardList, Package, Trash2, CheckCircle } from 'lucide-react';
import { Product, Remito, RemitoItem } from '../types';

const Remitos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');

  // --- PERSISTENCE ---
  const [existingRemitos, setExistingRemitos] = useState<Remito[]>(() => {
      const saved = localStorage.getItem('ferrecloud_remitos');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_remitos', JSON.stringify(existingRemitos));
  }, [existingRemitos]);

  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreate = () => {
    if (!selectedClient || cart.length === 0) return;
    const newRemito: Remito = {
      id: `R-${Math.floor(Math.random() * 10000)}`,
      clientId: selectedClient,
      clientName: selectedClient,
      items: [...cart],
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING'
    };
    setExistingRemitos([newRemito, ...existingRemitos]);
    setCart([]);
    alert("Remito generado y guardado.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Remitos</h2>
          <p className="text-gray-500 text-sm">Control de entregas con persistencia de datos.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'NEW' ? 'bg-ferre-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-ferre-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
            <div className="p-6 bg-slate-50 border-b space-y-4">
                <input type="text" placeholder="Nombre del Cliente..." className="w-full p-2 border rounded" value={selectedClient} onChange={e => setSelectedClient(e.target.value)} />
                <div className="flex gap-2">
                    <input type="text" placeholder="Agregar producto (ej: Tornillos)" className="flex-1 p-2 border rounded" onChange={e => setSearchTerm(e.target.value)} />
                    <button onClick={() => setCart([...cart, { product: { name: searchTerm } as any, quantity: 1, historicalPrice: 0 }])} className="bg-slate-800 text-white px-4 rounded font-bold">Agregar</button>
                </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b py-2">
                        <span className="font-bold">{item.product.name}</span>
                        <span>{item.quantity} un.</span>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button onClick={handleCreate} className="bg-ferre-orange text-white px-8 py-3 rounded-lg font-bold shadow-lg">Generar y Guardar</button>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 animate-fade-in">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                      <tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Nro</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {existingRemitos.map(r => (
                          <tr key={r.id}>
                              <td className="px-6 py-4 text-sm">{r.date}</td>
                              <td className="px-6 py-4 text-sm font-mono">{r.id}</td>
                              <td className="px-6 py-4 text-sm font-bold">{r.clientName}</td>
                              <td className="px-6 py-4"><span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded font-bold">PENDIENTE</span></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};

export default Remitos;