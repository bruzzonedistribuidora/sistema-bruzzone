import React, { useState, useEffect } from 'react';
import { Search, Save, FileText, Printer, X, Plus } from 'lucide-react';
import { InvoiceItem, Product, Budget } from '../types';

const Presupuestos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');

  // --- PERSISTENCE ---
  const [budgets, setBudgets] = useState<Budget[]>(() => {
      const saved = localStorage.getItem('ferrecloud_budgets');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');

  const handleSaveBudget = () => {
    if (cart.length === 0 || !clientName) return;
    const newBudget: Budget = {
        id: `P-${Math.floor(Math.random() * 10000)}`,
        clientName: clientName,
        date: new Date().toISOString().split('T')[0],
        validUntil: 'N/A',
        items: [...cart],
        total: cart.reduce((a, b) => a + b.subtotal, 0),
        status: 'OPEN'
    };
    setBudgets([newBudget, ...budgets]);
    setCart([]);
    setClientName('');
    alert("Presupuesto guardado con éxito.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Presupuestos</h2>
          <p className="text-gray-500 text-sm">Cotizaciones rápidas con memoria persistente.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'NEW' ? 'bg-ferre-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-ferre-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-4 animate-fade-in flex-1 flex flex-col">
            <input type="text" placeholder="Cliente..." className="w-full p-2 border rounded" value={clientName} onChange={e => setClientName(e.target.value)} />
            <div className="flex-1 border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                Simulación de carga de items (POS mejorado gestiona esto)
            </div>
            <button onClick={handleSaveBudget} className="bg-ferre-orange text-white py-3 rounded-lg font-bold shadow-lg">Guardar Presupuesto</button>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl border overflow-hidden flex-1 animate-fade-in">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500">
                    <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {budgets.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-mono">{b.id}</td>
                            <td className="px-6 py-4 text-sm font-bold">{b.clientName}</td>
                            <td className="px-6 py-4 text-sm text-right font-bold">${b.total.toLocaleString('es-AR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;