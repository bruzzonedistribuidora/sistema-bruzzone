import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, User, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, X, Save } from 'lucide-react';
import { Branch } from '../types';

const Branches: React.FC = () => {
  // --- PERSISTENCIA: SUCURSALES ---
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('ferrecloud_branches');
    return saved ? JSON.parse(saved) : [
        { id: '1', code: 'SUC-001', name: 'Sucursal Central', address: 'Av. Libertador 1200', phone: '11-4455-6677', manager: 'Roberto Gomez', type: 'SUCURSAL', active: true },
        { id: '2', code: 'SUC-002', name: 'Sucursal Norte', address: 'Calle 123, Local 4', phone: '11-9988-7766', manager: 'Maria Perez', type: 'SUCURSAL', active: true },
        { id: '3', code: 'DEP-001', name: 'Depósito General', address: 'Ruta 8 Km 45', phone: '11-2233-4455', manager: 'Carlos Ruiz', type: 'DEPOSITO', active: true },
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Branch>({
      id: '', code: '', name: '', address: '', phone: '', manager: '', type: 'SUCURSAL', active: true
  });

  // Guardar cada vez que cambie la lista
  useEffect(() => {
      localStorage.setItem('ferrecloud_branches', JSON.stringify(branches));
      window.dispatchEvent(new Event('ferrecloud_branches_updated')); // Disparar evento para sincronización
  }, [branches]);

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
      if (!formData.name || !formData.code) {
          alert("El nombre y código son obligatorios.");
          return;
      }

      setBranches(prev => {
          if (isEditing) {
              return prev.map(b => b.id === formData.id ? formData : b);
          } else {
              return [formData, ...prev];
          }
      });
      setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
      setBranches(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const deleteBranch = (id: string) => {
      if (confirm('¿Está seguro de eliminar esta sucursal permanentemente?')) {
          setBranches(prev => prev.filter(b => b.id !== id));
      }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Sucursales y Depósitos</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configuración de puntos de logística y venta</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all uppercase text-[10px] tracking-widest">
            <Plus size={16} /> Nueva Sucursal
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre, código o responsable..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map(branch => (
                  <div key={branch.id} className={`bg-white rounded-xl border ${branch.active ? 'border-gray-200' : 'border-red-100 bg-red-50/10'} shadow-sm hover:shadow-md transition-all p-5 relative group`}>
                      <div className="flex justify-between items-start mb-3">
                          <div className={`p-2 rounded-lg ${branch.type === 'SUCURSAL' ? 'bg-orange-50 text-ferre-orange' : 'bg-blue-50 text-blue-600'}`}>
                              <Store size={20} />
                          </div>
                          <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${branch.active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                  {branch.active ? 'En Línea' : 'Inactiva'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded uppercase">{branch.code}</span>
                          </div>
                      </div>

                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{branch.name}</h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{branch.type.replace('_', ' ')}</p>

                      <div className="space-y-2 text-[11px] font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-gray-300" />
                              <span className="truncate">{branch.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-300" />
                              <span>{branch.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-300" />
                              <span>Encargado: <strong className="text-slate-800 uppercase font-black">{branch.manager}</strong></span>
                          </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                          <button onClick={() => handleOpenModal(branch)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-slate-600 and font-bold text-[10px] uppercase hover:bg-slate-100 transition-colors">
                              <Edit3 size={12} /> Editar
                          </button>
                          <button onClick={() => toggleStatus(branch.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border rounded-lg font-bold text-[10px] uppercase transition-colors ${branch.active ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}>
                              {branch.active ? <XCircle size={12}/> : <CheckCircle size={12}/>} {branch.active ? 'Pausar' : 'Activar'}
                          </button>
                          <button onClick={() => deleteBranch(branch.id)} className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={12}/>
                          </button>
                      </div>
                  </div>
              ))}
              {filteredBranches.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
                      <Store size={40} className="mx-auto text-gray-200 mb-2 opacity-30" />
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No se encontraron registros</p>
                  </div>
              )}
          </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest">{isEditing ? 'Editar Registro' : 'Alta de Sucursal'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-4 bg-slate-50/30">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Código de Sucursal</label>
                              <input type="text" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 outline-none uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="EJ: SUC-001"/>
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Tipo de Punto</label>
                              <select className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                  <option value="SUCURSAL">Punto de Venta</option>
                                  <option value="DEPOSITO">Depósito / Almacén</option>
                                  <option value="VIRTUAL">Virtual / Web</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Nombre Comercial / Fantasía</label>
                          <input type="text" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 outline-none uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}/>
                      </div>
                      <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Dirección Geográfica</label>
                          <input type="text" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Teléfono de Contacto</label>
                              <input type="text" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Encargado Responsable</label>
                              <input type="text" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-slate-900 outline-none uppercase" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value.toUpperCase()})}/>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-400 font-black text-[10px] uppercase">Cancelar</button>
                      <button onClick={handleSave} className="bg-slate-900 text-white px-10 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all">
                          <Save size={14}/> Guardar Sucursal
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Branches;
