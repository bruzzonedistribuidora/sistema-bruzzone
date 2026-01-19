import React, { useState } from 'react';
import { Truck, Plus, Search, Percent, DollarSign, ChevronRight, Edit2, X, Trash2, Loader2 } from 'lucide-react';
import { Supplier } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { fetchArcaDataByCuit } from '../lib/arcaService'; // Import the ARCA service

const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useFirebase(); // Use Firebase context
  const [showModal, setShowModal] = useState(false);
  
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null); // State for supplier being edited
  const [newSupplierData, setNewSupplierData] = useState<Partial<Supplier>>({ // State for new/edited supplier form
    name: '',
    cuit: '',
    discounts: [],
    balance: 0,
    phone: '',
    email: '',
  });

  const [currentDiscount, setCurrentDiscount] = useState<number>(0); // State for adding new discounts
  const [isCuitLoading, setIsCuitLoading] = useState(false);

  const handleCuitLookup = async () => {
    if (!newSupplierData.cuit) {
      alert('Por favor, ingrese un CUIT para buscar.');
      return;
    }
    setIsCuitLoading(true);
    try {
      const arcaData = await fetchArcaDataByCuit(newSupplierData.cuit, 'supplier');
      setNewSupplierData(prev => ({
        ...prev,
        name: arcaData.name,
        email: arcaData.email,
        phone: arcaData.phone,
      }));
      alert('Datos de ARCA encontrados y cargados.');
    } catch (error: any) {
      alert(`Error al buscar CUIT en ARCA: ${error.message}`);
      console.error("ARCA CUIT Lookup Error:", error);
    } finally {
      setIsCuitLoading(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!newSupplierData.name || !newSupplierData.cuit) {
      alert("La Razón Social y CUIT son obligatorios.");
      return;
    }
    
    try {
      if (activeSupplier?.id) {
        await updateSupplier(activeSupplier.id, newSupplierData);
        alert('Proveedor actualizado con éxito!');
      } else {
        // Fix: Added type assertion to ensure newSupplierData has required properties 'name' and 'cuit'
        // before passing to addSupplier, as validated by the check above.
        await addSupplier(newSupplierData as Supplier);
        alert('Proveedor creado con éxito!');
      }
      setShowModal(false);
      setActiveSupplier(null);
      setNewSupplierData({ // Reset form
        name: '', cuit: '', discounts: [], balance: 0, phone: '', email: ''
      });
      setCurrentDiscount(0);
    } catch (error) {
      alert('Error al guardar el proveedor.');
      console.error(error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor? Esta acción es irreversible.')) {
      try {
        await deleteSupplier(id);
        alert('Proveedor eliminado con éxito.');
      } catch (error) {
        alert('Error al eliminar el proveedor.');
        console.error(error);
      }
    }
  };

  const openSupplierModal = (supplier: Supplier | null) => {
    setActiveSupplier(supplier);
    if (supplier) {
      setNewSupplierData(supplier);
    } else {
      setNewSupplierData({
        name: '', cuit: '', discounts: [], balance: 0, phone: '', email: ''
      });
    }
    setShowModal(true);
  };

  const addDiscount = () => {
    if (currentDiscount > 0) {
      setNewSupplierData(prev => ({
        ...prev,
        discounts: [...(prev.discounts || []), currentDiscount]
      }));
      setCurrentDiscount(0);
    }
  };

  const removeDiscount = (index: number) => {
    setNewSupplierData(prev => ({
      ...prev,
      discounts: (prev.discounts || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500">Gestión de compras, descuentos en cascada y saldos.</p>
        </div>
        <button 
          onClick={() => openSupplierModal(null)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o CUIT..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Proveedor / CUIT</th>
              <th className="px-6 py-4">Descuentos Aplicables</th>
              <th className="px-6 py-4">Saldo Pendiente</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map(sup => (
              <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{sup.name}</p>
                  <p className="text-xs text-slate-500">{sup.cuit}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {sup.discounts.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                        -{d}%
                      </span>
                    ))}
                    {sup.discounts.length === 0 && <span className="text-slate-400 text-xs italic">Sin descuentos</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sup.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {sup.balance < 0 ? `DEBEMOS $${Math.abs(sup.balance).toLocaleString()}` : `A FAVOR $${sup.balance.toLocaleString()}`}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openSupplierModal(sup)}
                    className="p-2 text-slate-400 hover:text-orange-600"
                    title="Editar Proveedor"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSupplier(sup.id)}
                    className="p-2 text-slate-400 hover:text-red-600"
                    title="Eliminar Proveedor"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-orange-600">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h2 className="text-xl font-bold">{activeSupplier ? 'Editar Proveedor' : 'Registro de Proveedor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CUIT</label>
                  <div className="flex gap-2">
                    <input 
                      value={newSupplierData.cuit || ''}
                      onChange={e => setNewSupplierData({...newSupplierData, cuit: e.target.value})}
                      placeholder="30-XXXXXXXX-X" 
                      className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                    <button 
                      onClick={handleCuitLookup} 
                      disabled={isCuitLoading}
                      className="bg-slate-800 text-white px-6 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isCuitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Razón Social</label>
                  <input 
                    value={newSupplierData.name || ''}
                    onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input 
                    type="email"
                    value={newSupplierData.email || ''}
                    onChange={e => setNewSupplierData({...newSupplierData, email: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                  <input 
                    type="tel"
                    value={newSupplierData.phone || ''}
                    onChange={e => setNewSupplierData({...newSupplierData, phone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Descuentos en Cascada (se aplican a artículos)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(newSupplierData.discounts || []).map((d, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full flex items-center gap-1">
                      -{d}%
                      <button onClick={() => removeDiscount(i)} className="ml-1 text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="%" 
                    className="w-24 px-4 py-2 border rounded-lg"
                    value={currentDiscount || ''}
                    onChange={e => setCurrentDiscount(Number(e.target.value))}
                  />
                  <button onClick={addDiscount} className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-600 hover:bg-slate-200">+ Agregar</button>
                </div>
                <p className="text-[10px] text-slate-400 italic">Ejemplo: 10% + 5% + 2%. Estos descuentos afectan automáticamente el costo de los productos de este proveedor.</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Saldo Inicial</label>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">Pasivo</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" 
                    placeholder="0.00"
                    value={newSupplierData.balance || ''}
                    onChange={e => setNewSupplierData({...newSupplierData, balance: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-xl font-bold hover:bg-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSaveSupplier}
                className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                {activeSupplier ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;