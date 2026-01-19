
import React, { useState, useEffect } from 'react';
import { 
  Store, MapPin, Plus, MoreVertical, 
  TrendingUp, Users, Clock, Phone,
  ChevronRight, ArrowUpRight, X, CheckCircle2,
  Save, Mail,
  // Added missing imports for error fixes
  Loader2, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { Branch } from '../types';
import { useFirebase } from '../context/FirebaseContext'; // Import useFirebase

const Branches: React.FC = () => {
  const { branches, loading, error, addBranch, updateBranch, deleteBranch } = useFirebase();
  const [showAddModal, setShowAddModal] = useState(false); // Changed name to avoid confusion
  const [showManageBranchModal, setShowManageBranchModal] = useState(false); // New state for manage modal
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  
  // State for new/edited branch form data
  const [branchFormData, setBranchFormData] = useState<Partial<Branch>>({
    name: '',
    address: '',
    manager: '',
    phone: '',
    email: '',
    status: 'online', // Default status for new branch
    dailySales: 0,
    staffCount: 0,
  });

  // Set form data when activeBranch changes (for editing)
  useEffect(() => {
    if (activeBranch) {
      setBranchFormData(activeBranch);
    } else {
      // Reset for new branch creation
      setBranchFormData({
        name: '', address: '', manager: '', phone: '', email: '', 
        status: 'online', dailySales: 0, staffCount: 0,
      });
    }
  }, [activeBranch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setBranchFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveBranch = async () => {
    if (!branchFormData.name || !branchFormData.address || !branchFormData.manager) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }

    try {
      if (activeBranch) {
        await updateBranch(activeBranch.id, branchFormData);
        alert('Sucursal actualizada con éxito!');
      } else {
        await addBranch(branchFormData as Omit<Branch, 'id'>);
        alert('Nueva sucursal creada con éxito!');
      }
      setShowAddModal(false);
      setShowManageBranchModal(false);
      setActiveBranch(null);
      // Reset form data implicitly handled by useEffect on activeBranch change
    } catch (e) {
      alert('Error al guardar la sucursal.');
      console.error("Error saving branch:", e);
    }
  };

  const handleOpenManageModal = (branch: Branch) => {
    setActiveBranch(branch);
    setShowManageBranchModal(true);
  };

  const handleOpenAddModal = () => {
    setActiveBranch(null); // Ensure form is clear for new branch
    setShowAddModal(true);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      {/* Fix: Added Loader2 import */}
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Cargando sucursales...</p>
    </div>
  );

  if (error) return (
    <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top duration-300">
      <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
        {/* Fix: Added AlertCircle import */}
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-red-900 font-black uppercase text-xs tracking-widest">Error de Sincronización Nube</p>
        <p className="text-red-700 text-sm font-medium">{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs uppercase hover:bg-red-50 transition-all flex items-center gap-2"
      >
        {/* Fix: Added RefreshCw import */}
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );


  const totalGlobalSales = branches.reduce((acc, b) => acc + b.dailySales, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sucursales y Puntos de Venta</h1>
          <p className="text-slate-500">Administra la operatividad de tus locales y depósitos físicos.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5" /> Nueva Sucursal
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${branch.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${branch.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{branch.status}</span>
                   <button className="ml-2 p-1 hover:bg-slate-50 rounded-lg text-slate-300">
                     <MoreVertical className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800">{branch.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{branch.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ventas Hoy</p>
                  <p className="font-black text-slate-900">${branch.dailySales.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Personal</p>
                  <p className="font-black text-slate-900">{branch.staffCount} personas</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>Responsable: <span className="font-bold text-slate-700">{branch.manager}</span></span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleOpenManageModal(branch)} // Added onClick handler
              className="w-full py-4 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all"
            >
              Gestionar Local <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button 
          onClick={handleOpenAddModal} // Use the new handler for adding
          className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-3 text-slate-400 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
        >
          <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white">
            <Plus className="w-8 h-8" />
          </div>
          <span className="font-black uppercase text-[10px] tracking-[0.2em]">Añadir Nueva Ubicación</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-orange-600" /> Rendimiento Comparativo
          </h3>
          <div className="space-y-6">
            {branches.filter(b => b.dailySales > 0).map(b => (
              <div key={b.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700">{b.name}</span>
                  <span className="font-black text-slate-900">${b.dailySales.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${(b.dailySales / totalGlobalSales) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">Resumen Operativo</h3>
            <p className="text-slate-400 text-sm mb-6">Estado global de la red de sucursales.</p>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Total Sucursales</p>
                <p className="text-4xl font-black">{branches.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Total Ventas Global</p>
                <p className="text-4xl font-black">${totalGlobalSales.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">Crecimiento Mensual</p>
                <p className="text-xl font-black text-white">+18.4% de operatividad</p>
              </div>
            </div>
          </div>
          <Store className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>
      </div>

      {/* MODAL: ADD NEW BRANCH */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center">
                   <Store className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nueva Sucursal</h2>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Registrar punto físico</p>
                 </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="p-8 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                 <input 
                   name="name"
                   value={branchFormData.name || ''}
                   onChange={handleInputChange}
                   className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                   placeholder="Ej: Sucursal Oeste" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
                 <input 
                   name="address"
                   value={branchFormData.address || ''}
                   onChange={handleInputChange}
                   className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                   placeholder="Av. Principal 1234" 
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsable</label>
                   <input 
                     name="manager"
                     value={branchFormData.manager || ''}
                     onChange={handleInputChange}
                     className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                     placeholder="Nombre completo" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                   <input 
                     name="phone"
                     value={branchFormData.phone || ''}
                     onChange={handleInputChange}
                     className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                     placeholder="+54 9..." 
                   />
                 </div>
               </div>
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
               <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
               <button 
                 onClick={handleSaveBranch}
                 className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
               >
                 Guardar Sucursal <CheckCircle2 className="w-5 h-5" />
               </button>
             </div>
           </div>
        </div>
      )}

      {/* MODAL: MANAGE BRANCH DETAILS */}
      {showManageBranchModal && activeBranch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Gestionar Sucursal</h2>
                  <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-1">{activeBranch.name}</p>
                </div>
              </div>
              <button onClick={() => setShowManageBranchModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <section className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  {/* Fix: Added FileText import */}
                  <FileText className="w-4 h-4 text-orange-600" /> Información General
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                    <input 
                      name="name"
                      value={branchFormData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                      placeholder="Ej: Sucursal Oeste" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
                    <input 
                      name="address"
                      value={branchFormData.address || ''}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                      placeholder="Av. Principal 1234" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsable</label>
                    <input 
                      name="manager"
                      value={branchFormData.manager || ''}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                      placeholder="Nombre completo" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <input 
                      name="phone"
                      value={branchFormData.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                      placeholder="+54 9..." 
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Contacto</label>
                    <input 
                      name="email"
                      type="email"
                      value={branchFormData.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                      placeholder="contacto@sucursal.com" 
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Estado Operativo
                </h3>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="status"
                      checked={branchFormData.status === 'online'} 
                      onChange={(e) => setBranchFormData(prev => ({ ...prev, status: e.target.checked ? 'online' : 'offline' }))}
                      className="sr-only peer" 
                      id="branchStatusToggle"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <label htmlFor="branchStatusToggle" className="flex-1 cursor-pointer">
                    <p className="text-sm font-black text-slate-800 uppercase">Sucursal {branchFormData.status === 'online' ? 'Online' : 'Offline'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Define si la sucursal está activa para operar con ventas, stock y caja.
                    </p>
                  </label>
                </div>
              </section>
              
              <section className="space-y-6 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" /> Estadísticas Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Ventas Hoy</p>
                    <p className="text-xl font-black text-purple-900">${activeBranch.dailySales.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Personal Activo</p>
                    <p className="text-xl font-black text-blue-900">{activeBranch.staffCount}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowManageBranchModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveBranch}
                className="flex-[1.5] py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                <Save className="w-5 h-5" /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;