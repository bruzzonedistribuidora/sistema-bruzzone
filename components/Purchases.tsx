import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, FileText, User, X, Save, Eye, Trash2, ShoppingCart, Calculator, Edit, Printer } from 'lucide-react';
import { Purchase, Provider, Product } from '../types';

interface PurchasesProps {
    defaultTab?: 'PURCHASES' | 'PROVIDERS';
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES' }) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'PROVIDERS'>(defaultTab);

  // --- PERSISTENCE ---
  const defaultProviders: Provider[] = [
    { id: '1', name: 'Herramientas Global SA', cuit: '30-11223344-5', contact: 'Roberto', balance: 150000, defaultDiscounts: [10, 5, 0] },
    { id: '2', name: 'Pinturas del Centro', cuit: '30-55667788-9', contact: 'Maria', balance: 0, defaultDiscounts: [25, 0, 0] },
  ];

  const [providers, setProviders] = useState<Provider[]>(() => {
      const saved = localStorage.getItem('ferrecloud_providers');
      return saved ? JSON.parse(saved) : defaultProviders;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('ferrecloud_providers', JSON.stringify(providers)); }, [providers]);
  useEffect(() => { localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases)); }, [purchases]);

  // --- UI STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [newPurchaseHeader, setNewPurchaseHeader] = useState({ providerId: '', date: new Date().toISOString().split('T')[0], type: 'FACTURA_A', number: '' });
  const [newPurchaseItems, setNewPurchaseItems] = useState<any[]>([]);
  const [newItemLine, setNewItemLine] = useState({ code: '', description: '', quantity: 1, cost: 0 });

  const totalPurchase = newPurchaseItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSaveItem = () => {
      if (!newItemLine.description || newItemLine.cost <= 0) return;
      const newItem = { id: Date.now().toString(), productCode: newItemLine.code, description: newItemLine.description, quantity: newItemLine.quantity, unitPrice: newItemLine.cost, subtotal: newItemLine.quantity * newItemLine.cost };
      setNewPurchaseItems([...newPurchaseItems, newItem]);
      setNewItemLine({ code: '', description: '', quantity: 1, cost: 0 });
  };

  const handleFinalize = () => {
      if (!newPurchaseHeader.providerId) return;
      const provider = providers.find(p => p.id === newPurchaseHeader.providerId);
      const newPurchase: Purchase = {
          id: newPurchaseHeader.number || `INT-${Date.now()}`,
          providerId: newPurchaseHeader.providerId,
          providerName: provider?.name || 'Desconocido',
          date: newPurchaseHeader.date,
          type: newPurchaseHeader.type as any,
          items: newPurchaseItems.length,
          total: totalPurchase,
          status: 'PENDING',
          details: newPurchaseItems
      };
      setPurchases([newPurchase, ...purchases]);
      setIsNewPurchaseOpen(false);
      setNewPurchaseItems([]);
      alert("Compra registrada y guardada localmente.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Compras</h2>
          <p className="text-gray-500 text-sm">Registro de facturas de proveedores con guardado persistente.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button onClick={() => setActiveTab('PURCHASES')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'PURCHASES' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Comprobantes</button>
            <button onClick={() => setActiveTab('PROVIDERS')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'PROVIDERS' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Proveedores</button>
        </div>
      </div>

      {activeTab === 'PURCHASES' && (
          <div className="animate-fade-in flex flex-col flex-1">
            <div className="flex justify-between mb-4">
                <input type="text" placeholder="Buscar compra..." className="px-4 py-2 border rounded-lg text-sm w-64" onChange={e => setSearchTerm(e.target.value)} />
                <button onClick={() => setIsNewPurchaseOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"><Plus size={18} /> Cargar Compra</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Nro</th><th className="px-6 py-4">Proveedor</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {purchases.filter(p => p.providerName.includes(searchTerm)).map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm">{p.date}</td>
                                <td className="px-6 py-4 text-sm font-mono">{p.id}</td>
                                <td className="px-6 py-4 text-sm font-bold">{p.providerName}</td>
                                <td className="px-6 py-4 text-sm text-right font-bold">${p.total.toLocaleString('es-AR')}</td>
                                <td className="px-6 py-4 text-center"><span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">PENDIENTE</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {isNewPurchaseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-900 text-white flex justify-between">
                      <h3 className="font-bold">Nueva Factura de Compra</h3>
                      <button onClick={() => setIsNewPurchaseOpen(false)}><X/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                          <select className="p-2 border rounded" value={newPurchaseHeader.providerId} onChange={e => setNewPurchaseHeader({...newPurchaseHeader, providerId: e.target.value})}>
                              <option value="">Proveedor...</option>
                              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="text" className="p-2 border rounded" placeholder="Número" value={newPurchaseHeader.number} onChange={e => setNewPurchaseHeader({...newPurchaseHeader, number: e.target.value})}/>
                      </div>
                      <div className="border p-4 rounded space-y-2">
                          <input type="text" className="w-full p-2 border rounded" placeholder="Descripción del producto" value={newItemLine.description} onChange={e => setNewItemLine({...newItemLine, description: e.target.value})}/>
                          <div className="flex gap-2">
                            <input type="number" className="flex-1 p-2 border rounded" placeholder="Cant" value={newItemLine.quantity} onChange={e => setNewItemLine({...newItemLine, quantity: parseFloat(e.target.value)})}/>
                            <input type="number" className="flex-1 p-2 border rounded" placeholder="Costo $" value={newItemLine.cost} onChange={e => setNewItemLine({...newItemLine, cost: parseFloat(e.target.value)})}/>
                            <button onClick={handleSaveItem} className="bg-blue-600 text-white px-4 rounded font-bold">Sumar</button>
                          </div>
                      </div>
                      <table className="w-full text-sm">
                          <thead><tr className="bg-gray-100"><th>Item</th><th className="text-right">Cant</th><th className="text-right">Subtotal</th></tr></thead>
                          <tbody>
                              {newPurchaseItems.map(i => <tr key={i.id}><td className="py-2">{i.description}</td><td className="text-right">{i.quantity}</td><td className="text-right font-bold">${i.subtotal}</td></tr>)}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-4 border-t flex justify-between items-center">
                      <span className="text-xl font-bold">Total: ${totalPurchase}</span>
                      <button onClick={handleFinalize} className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow-lg">Guardar Compra</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;