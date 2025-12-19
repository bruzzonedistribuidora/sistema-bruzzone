import React, { useState } from 'react';
import { Store, MapPin, Phone, User, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, X, Save } from 'lucide-react';
import { Branch } from '../types';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([
    { id: '1', code: 'SUC-001', name: 'Sucursal Central', address: 'Av. Libertador 1200', phone: '11-4455-6677', manager: 'Roberto Gomez', type: 'SUCURSAL', active: true },
    { id: '2', code: 'SUC-002', name: 'Sucursal Norte', address: 'Calle 123, Local 4', phone: '11-9988-7766', manager: 'Maria Perez', type: 'SUCURSAL', active: true },
    { id: '3', code: 'DEP-001', name: 'Depósito General', address: 'Ruta 8 Km 45', phone: '11-2233-4455', manager: 'Carlos Ruiz', type: 'DEPOSITO', active: true },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Branch>({
      id: '', code: '', name: '', address: '', phone: '', manager: '', type: 'SUCURSAL', active: true
  });

  const handleOpenModal = (branch?: Branch) => {
      if (branch) {
          setFormData({...branch});
          setIsEditing(true);
      } else {
          setFormData({
             id: Date.now().toString(), code: '', name: '', address: '', phone: '', manager: '', type: 'SUCURSAL', active: true
          });
          setIsEditing(false);
      }
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!formData.name || !formData.code) return;

      setBranches(prev => {
          if (isEditing) {
              return prev.map(b => b.id === formData.id ? formData : b);
          } else {
              return [...prev, formData];
          }
      });
      setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
      setBranches(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sucursales y Depósitos</h2>
          <p className="text-gray-500 text-sm">Administra los puntos de venta y almacenamiento de la empresa.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium">
            <Plus size={16} /> Nueva Sucursal
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar por nombre, código o encargado..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-ferre-orange outline-none" />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map(branch => (
                    <div key={branch.id} className={`bg-white rounded-xl border ${branch.active ? 'border-gray-200' : 'border-red-100 bg-red-50/30'} shadow-sm hover:shadow-md transition-all p-6 relative group`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${branch.type === 'SUCURSAL' ? 'bg-orange-50 text-ferre-orange' : 'bg-blue-50 text-blue-600'}`}>
                                <Store size={24} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${branch.active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    {branch.active ? 'ACTIVA' : 'INACTIVA'}
                                </span>
                                <span className="text-xs font-mono text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">{branch.code}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{branch.name}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{branch.type}</p>

                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className="text-gray-400" />
                                <span>{branch.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-400" />
                                <span>{branch.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <User size={16} className="text-gray-400" />
                                <span>Encargado: <strong className="text-gray-700">{branch.manager}</strong></span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(branch)} className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 text-sm">
                                <Edit3 size={14} /> Editar
                            </button>
                            <button onClick={() => toggleStatus(branch.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded text-sm ${branch.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                {branch.active ? <XCircle size={14}/> : <CheckCircle size={14}/>} {branch.active ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">{isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
                      <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Código</label>
                              <input type="text" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-ferre-orange outline-none" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="EJ: SUC-001"/>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                              <select className="w-full p-2 border rounded text-sm bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                  <option value="SUCURSAL">Punto de Venta</option>
                                  <option value="DEPOSITO">Depósito</option>
                                  <option value="VIRTUAL">Virtual / Web</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Nombre de Fantasía</label>
                          <input type="text" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-ferre-orange outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Dirección Física</label>
                          <input type="text" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-ferre-orange outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                              <input type="text" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-ferre-orange outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Encargado / Responsable</label>
                              <input type="text" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-ferre-orange outline-none" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})}/>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white">Cancelar</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-ferre-dark text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                          <Save size={16}/> Guardar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Branches;