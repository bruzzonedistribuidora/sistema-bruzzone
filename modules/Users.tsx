
import React, { useState, useMemo } from 'react';
import { 
  UserPlus, Search, Shield, ShieldCheck, Mail, Edit3, Trash2, Layout, CheckCircle2, X, Store, MapPin,
  DollarSign, Calendar, History, ListOrdered, Loader2, // Added new icons
  // Added FileText import
  FileText
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'Administrador' | 'Vendedor' | 'Contador' | 'Depósito';
  status: 'Activo' | 'Inactivo';
  branchName: string;
  modules: string[];
  salary: number; // New: Sueldo Bruto Mensual
  advances: { date: string; amount: number; }[]; // New: Adelantos
  joiningDate: string; // New: Fecha de ingreso
}

const UsersModule: React.FC = () => {
  const allModules = [
    { id: 'sales', name: 'Ventas' },
    { id: 'inventory', name: 'Inventario' },
    { id: 'cashier', name: 'Cajas' },
    { id: 'purchases', name: 'Compras' },
    { id: 'finance', name: 'Finanzas' },
    { id: 'ecommerce', name: 'E-Commerce' },
    { id: 'reports', name: 'Informes' }
  ];

  const branches = [
    { id: 'b1', name: 'Sucursal Central' },
    { id: 'b2', name: 'Sucursal Norte' },
    { id: 'b3', name: 'Depósito Logístico' }
  ];

  const [users, setUsers] = useState<UserData[]>([
    { id: 1, name: 'Admin Ferro', email: 'admin@ferrogest.com', role: 'Administrador', status: 'Activo', branchName: 'Sucursal Central', modules: allModules.map(m => m.id), salary: 800000, advances: [], joiningDate: '2022-01-01' },
    { id: 2, name: 'Carlos Vendedor', email: 'carlos@ferrogest.com', role: 'Vendedor', status: 'Activo', branchName: 'Sucursal Norte', modules: ['sales', 'inventory'], salary: 250000, advances: [{ date: '2024-05-10', amount: 20000 }], joiningDate: '2023-03-15' },
    { id: 3, name: 'Ana Contador', email: 'ana@ferrogest.com', role: 'Contador', status: 'Inactivo', branchName: 'Sucursal Central', modules: ['finance', 'reports'], salary: 300000, advances: [{ date: '2024-05-01', amount: 30000 }, { date: '2024-05-15', amount: 15000 }], joiningDate: '2022-08-01' },
  ]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [activeUser, setActiveUser] = useState<UserData | null>(null); // User currently being edited
  const [userFormData, setUserFormData] = useState<Partial<UserData>>({}); // Data for the form
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'financial' | 'modules'>('general'); // Tabs within the user modal
  const [newAdvance, setNewAdvance] = useState(''); // Input for new advance amount
  const [isSaving, setIsSaving] = useState(false);

  const toggleModule = (userId: number, moduleId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const hasModule = u.modules.includes(moduleId);
        return {
          ...u,
          modules: hasModule ? u.modules.filter(m => m !== moduleId) : [...u.modules, moduleId]
        };
      }
      return u;
    }));
  };

  const calculateTotalPaidLastMonth = (user: UserData) => {
    const today = new Date();
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const advancesThisMonth = user.advances.filter(advance => {
      const advanceDate = new Date(advance.date);
      return advanceDate >= lastMonthStart && advanceDate <= lastMonthEnd;
    }).reduce((sum, adv) => sum + adv.amount, 0);

    return user.salary + advancesThisMonth;
  };

  const openUserModal = (user: UserData | null) => {
    setActiveUser(user);
    if (user) {
      setUserFormData(user); // Pre-fill form for editing
    } else {
      // Reset form for new user
      setUserFormData({ 
        name: '', 
        email: '', 
        role: 'Vendedor', 
        status: 'Activo', 
        branchName: branches[0].name, 
        modules: ['sales'],
        salary: 0,
        advances: [],
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }
    setNewAdvance('');
    setActiveModalTab('general');
    setShowUserModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAdvance = () => {
    const amount = parseFloat(newAdvance);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, ingrese un monto válido para el adelanto.");
      return;
    }
    setUserFormData(prev => ({
      ...prev,
      advances: [...(prev.advances || []), { date: new Date().toISOString().split('T')[0], amount: amount }]
    }));
    setNewAdvance('');
  };

  const handleRemoveAdvance = (indexToRemove: number) => {
    setUserFormData(prev => ({
      ...prev,
      advances: (prev.advances || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleToggleModuleInModal = (moduleId: string) => {
    setUserFormData(prev => {
      const currentModules = prev.modules || [];
      const hasModule = currentModules.includes(moduleId);
      return {
        ...prev,
        modules: hasModule ? currentModules.filter(m => m !== moduleId) : [...currentModules, moduleId]
      };
    });
  };

  const handleSaveUser = async () => {
    setIsSaving(true); // Start loading

    // Initial validation check
    if (!userFormData.name || !userFormData.email || !userFormData.role || !userFormData.branchName) {
      alert("Por favor, complete todos los campos obligatorios (Nombre, Email, Rol, Sucursal).");
      setIsSaving(false); // Re-enable the button immediately if validation fails
      return;
    }

    try {
      if (activeUser) {
        // Update existing user
        setUsers(users.map(u => u.id === activeUser.id ? { ...activeUser, ...userFormData as UserData } : u));
        alert('Usuario actualizado con éxito!');
      } else {
        // Add new user
        const newUser: UserData = {
          id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
          name: userFormData.name,
          email: userFormData.email,
          role: userFormData.role as 'Administrador' | 'Vendedor' | 'Contador' | 'Depósito',
          status: userFormData.status || 'Activo',
          branchName: userFormData.branchName,
          modules: userFormData.modules || [],
          salary: userFormData.salary || 0,
          advances: userFormData.advances || [],
          joiningDate: userFormData.joiningDate || new Date().toISOString().split('T')[0]
        };
        setUsers([...users, newUser]);
        alert('Usuario creado con éxito!');
      }
      setShowUserModal(false);
      setActiveUser(null);
      setUserFormData({});
      setNewAdvance('');
    } catch (error) {
      alert('Error al guardar el usuario.');
      console.error(error);
    } finally {
      setIsSaving(false); // This will always run after the try/catch block
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Usuarios y Permisos</h1>
          <p className="text-slate-500">Configura accesos por módulo y asigna sucursales para control de stock/caja.</p>
        </div>
        <button 
          onClick={() => openUserModal(null)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
        >
          <UserPlus className="w-5 h-5" /> Invitar Colaborador
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar usuarios o sucursales..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Colaborador</th>
              <th className="px-8 py-5">Rol Principal</th>
              <th className="px-8 py-5">Sucursal Asignada</th>
              <th className="px-8 py-5">Módulos Activos</th>
              <th className="px-8 py-5 text-right">Total Pagado Último Mes</th> {/* New column */}
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg border border-slate-200 uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {user.role === 'Administrador' ? (
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Shield className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">{user.role}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Store className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold">{user.branchName}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {allModules.map(m => (
                      <span
                        key={m.id}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter transition-all border ${
                          user.modules.includes(m.id) 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-slate-50 text-slate-300 border-slate-100 opacity-50 grayscale'
                        }`}
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                  ${calculateTotalPaidLastMonth(user).toLocaleString()}
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openUserModal(user)}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                      title="Editar Usuario"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar Usuario"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{activeUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                  <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Configurar perfil y accesos</p>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex h-[600px]"> {/* Fixed height for modal content */}
               <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                  {[
                     // Fix: Used imported FileText icon
                     { id: 'general', label: 'Datos Generales', icon: FileText },
                     { id: 'financial', label: 'Historial Financiero', icon: DollarSign },
                     { id: 'modules', label: 'Módulos & Accesos', icon: Layout },
                  ].map((tab) => (
                     <button 
                        key={tab.id} 
                        onClick={() => setActiveModalTab(tab.id as any)}
                        className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                     >
                        <tab.icon className="w-4 h-4 inline-block mr-2" />
                        {tab.label}
                     </button>
                  ))}
               </div>
               <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                  {activeModalTab === 'general' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                              <input 
                                 name="name"
                                 value={userFormData.name || ''}
                                 onChange={handleInputChange}
                                 className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                              <input 
                                 name="email"
                                 type="email" 
                                 value={userFormData.email || ''}
                                 onChange={handleInputChange}
                                 className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Operativo</label>
                              <select 
                                 name="role"
                                 value={userFormData.role || 'Vendedor'}
                                 onChange={handleInputChange}
                                 className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                              >
                                 <option value="Vendedor">Vendedor</option>
                                 <option value="Depósito">Depósito</option>
                                 <option value="Administrador">Administrador</option>
                                 <option value="Contador">Contador</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                 <MapPin className="w-3 h-3 text-orange-600" /> Sucursal de Operación
                              </label>
                              <select 
                                 name="branchName"
                                 value={userFormData.branchName || branches[0].name}
                                 onChange={handleInputChange}
                                 className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                              >
                                 {branches.map(b => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeModalTab === 'financial' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                           <DollarSign className="w-4 h-4 text-green-600" /> Información Salarial
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sueldo Bruto Mensual ($)</label>
                              <input 
                                 name="salary"
                                 type="number" 
                                 value={userFormData.salary || ''}
                                 onChange={handleInputChange}
                                 className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-600" 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                 <Calendar className="w-3 h-3 text-blue-600" /> Fecha de Ingreso
                              </label>
                              <input 
                                 name="joiningDate"
                                 type="date" 
                                 value={userFormData.joiningDate || ''}
                                 onChange={handleInputChange}
                                 className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                              />
                           </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-slate-100">
                           <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                              <ListOrdered className="w-4 h-4 text-purple-600" /> Adelantos Recibidos
                           </h4>
                           <p className="text-slate-500 text-sm">Registra cualquier adelanto de sueldo del empleado.</p>
                           <div className="flex gap-3">
                              <input 
                                 type="number"
                                 placeholder="Monto del adelanto ($)" 
                                 className="flex-1 px-5 py-3 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-purple-500" 
                                 value={newAdvance}
                                 onChange={e => setNewAdvance(e.target.value)}
                                 onKeyPress={e => { if (e.key === 'Enter') handleAddAdvance(); }}
                              />
                              <button 
                                 onClick={handleAddAdvance}
                                 className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                              >
                                 Añadir
                              </button>
                           </div>

                           <div className="space-y-3">
                              {(userFormData.advances || []).length > 0 ? (
                                 (userFormData.advances || []).map((advance, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                       <span className="font-bold text-slate-800 flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-slate-400" />
                                          {advance.date}: ${advance.amount.toLocaleString()}
                                       </span>
                                       <button 
                                          onClick={() => handleRemoveAdvance(index)}
                                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                          title="Eliminar adelanto"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                 ))
                              ) : (
                                 <div className="text-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 font-medium">
                                    No hay adelantos registrados.
                                 </div>
                              )}
                           </div>
                        </div>

                        {userFormData.salary !== undefined && (userFormData.advances !== undefined) && (
                           <div className="pt-6 border-t border-slate-100">
                              <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex items-center justify-between">
                                 <div>
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Total Pagado Proyectado (este mes)</p>
                                    <p className="text-2xl font-black text-orange-900">
                                      ${((userFormData.salary || 0) + (userFormData.advances || []).reduce((sum, adv) => sum + adv.amount, 0)).toLocaleString()}
                                    </p>
                                 </div>
                                 <History className="w-8 h-8 text-orange-300 opacity-50" />
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {activeModalTab === 'modules' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                           <Layout className="w-4 h-4 text-blue-600" /> Asignación de Módulos (Plan Activo)
                        </h3>
                        <p className="text-slate-500 text-sm">Selecciona a qué módulos tendrá acceso este colaborador.</p>
                        <div className="grid grid-cols-2 gap-3">
                           {allModules.map(m => (
                              <div key={m.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded accent-orange-600" 
                                    checked={(userFormData.modules || []).includes(m.id)}
                                    onChange={() => handleToggleModuleInModal(m.id)}
                                 />
                                 <span className="text-xs font-bold text-slate-700">{m.name}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowUserModal(false)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:text-slate-600">Cancelar</button>
              <button 
                onClick={handleSaveUser}
                disabled={isSaving}
                className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-orange-600/20 hover:bg-orange-500 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (activeUser ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                {isSaving ? 'Guardando...' : (activeUser ? 'Guardar Cambios' : 'Habilitar Usuario')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
