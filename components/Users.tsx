
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Shield, Search, X, Check, CheckCircle, ShieldCheck, Mail, Store, Settings, Lock, CheckSquare, Square, Save, RotateCcw } from 'lucide-react';
import { User, Role } from '../types';

// --- SYSTEM PERMISSIONS DEFINITION ---
const SYSTEM_PERMISSIONS = [
    { id: 'ALL', label: 'Acceso Total (Admin)', group: 'Sistema' },
    { id: 'DASHBOARD_VIEW', label: 'Ver Tablero Principal', group: 'General' },
    { id: 'POS_ACCESS', label: 'Acceso a Punto de Venta', group: 'Ventas' },
    { id: 'CLIENTS_VIEW', label: 'Ver Clientes', group: 'Ventas' },
    { id: 'CLIENTS_EDIT', label: 'Crear/Editar Clientes', group: 'Ventas' },
    { id: 'REMITOS_VIEW', label: 'Gestionar Remitos', group: 'Ventas' },
    { id: 'STOCK_VIEW', label: 'Ver Inventario', group: 'Stock' },
    { id: 'STOCK_EDIT', label: 'Modificar Stock/Precios', group: 'Stock' },
    { id: 'PURCHASES_VIEW', label: 'Ver Compras', group: 'Stock' },
    { id: 'TREASURY_VIEW', label: 'Ver Tesorería', group: 'Finanzas' },
    { id: 'TREASURY_EDIT', label: 'Mover Fondos/Cajas', group: 'Finanzas' },
    { id: 'ACCOUNTING_VIEW', label: 'Ver Contabilidad', group: 'Finanzas' },
    { id: 'CONFIG_ACCESS', label: 'Acceso a Configuración', group: 'Sistema' },
];

const UsersComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');

  // --- ROLES STATE WITH PERSISTENCE ---
  const [roles, setRoles] = useState<Role[]>(() => {
      const saved = localStorage.getItem('ferrecloud_roles');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
      return [
          { id: 'admin', name: 'Administrador Total', color: 'bg-purple-100 text-purple-800 border-purple-200', permissions: ['ALL'] },
          { id: 'seller', name: 'Vendedor', color: 'bg-green-100 text-green-800 border-green-200', permissions: ['POS_ACCESS', 'CLIENTS_VIEW', 'STOCK_VIEW', 'REMITOS_VIEW'] },
          { id: 'stock', name: 'Encargado de Depósito', color: 'bg-orange-100 text-orange-800 border-orange-200', permissions: ['STOCK_VIEW', 'STOCK_EDIT', 'REMITOS_VIEW'] },
          { id: 'accountant', name: 'Administrativo', color: 'bg-blue-100 text-blue-800 border-blue-200', permissions: ['TREASURY_VIEW', 'ACCOUNTING_VIEW', 'CLIENTS_VIEW'] },
      ];
  });

  // --- USERS STATE WITH PERSISTENCE ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ferrecloud_users');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: '1', name: 'Admin', email: 'admin@ferrebruzzone.com.ar', password: 'admin123', roleId: 'admin', active: true, lastLogin: 'Hace 5 min', branchId: 'SUC-001' },
      { id: '2', name: 'Juan', email: 'juan@ferrebruzzone.com.ar', password: 'ventas123', roleId: 'seller', active: true, lastLogin: 'Hace 2 horas', branchId: 'SUC-001' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ferrecloud_roles', JSON.stringify(roles));
  }, [roles]);

  const [searchTerm, setSearchTerm] = useState('');

  // --- USER MODAL STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    name: '', email: '', password: '', roleId: 'seller', active: true, branchId: 'SUC-001'
  });

  // --- ROLE MODAL STATE ---
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState<Partial<Role>>({
      name: '', color: 'bg-gray-100 text-gray-800 border-gray-200', permissions: []
  });

  // --- HANDLERS: USER ---
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({ ...user });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        roleId: 'seller',
        active: true,
        branchId: 'SUC-001'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    // Validaciones estrictas
    if (!userFormData.name?.trim()) {
        alert("El nombre de usuario es obligatorio.");
        return;
    }
    if (!userFormData.email?.trim()) {
        alert("El email de acceso es obligatorio.");
        return;
    }
    if (!editingUser && !userFormData.password?.trim()) {
        alert("Debe asignar una contraseña para el nuevo usuario.");
        return;
    }

    setUsers(prev => {
        let newUsers;
        if (editingUser) {
            newUsers = prev.map(u => u.id === editingUser.id ? { ...u, ...userFormData } as User : u);
        } else {
            const newUser: User = {
                ...userFormData as User,
                id: Date.now().toString(),
                lastLogin: 'Nunca',
                active: userFormData.active ?? true,
                branchId: userFormData.branchId ?? 'SUC-001',
                roleId: userFormData.roleId ?? 'seller'
            };
            newUsers = [newUser, ...prev];
        }
        // Persistencia inmediata
        localStorage.setItem('ferrecloud_users', JSON.stringify(newUsers));
        return newUsers;
    });
    
    setIsUserModalOpen(false);
    alert(`Usuario ${userFormData.name} guardado correctamente.`);
  };

  const handleDeleteUser = (id: string) => {
    if (id === '1') {
        alert("No se puede eliminar al administrador principal del sistema.");
        return;
    }
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // --- HANDLERS: ROLE ---
  const handleOpenRoleModal = (role?: Role) => {
      if (role) {
          setEditingRole(role);
          setRoleFormData({ ...role });
      } else {
          setEditingRole(null);
          setRoleFormData({
              name: '',
              color: 'bg-gray-100 text-gray-800 border-gray-200',
              permissions: []
          });
      }
      setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
      if (!roleFormData.name?.trim()) {
          alert("El nombre del rol es obligatorio.");
          return;
      }
      
      setRoles(prev => {
          let newRoles;
          if (editingRole) {
              newRoles = prev.map(r => r.id === editingRole.id ? { ...r, ...roleFormData } as Role : r);
          } else {
              newRoles = [...prev, { ...roleFormData, id: `role-${Date.now()}` } as Role];
          }
          localStorage.setItem('ferrecloud_roles', JSON.stringify(newRoles));
          return newRoles;
      });
      setIsRoleModalOpen(false);
      alert("Rol actualizado. Los cambios afectarán a los usuarios en su próximo inicio de sesión.");
  };

  const handleDeleteRole = (id: string) => {
      if (id === 'admin') {
          alert("No se puede eliminar el rol de Administrador Total.");
          return;
      }
      if (users.some(u => u.roleId === id)) {
          alert("No se puede eliminar este rol porque tiene usuarios asignados.");
          return;
      }
      if (confirm("¿Estás seguro de eliminar este rol?")) {
          setRoles(prev => prev.filter(r => r.id !== id));
      }
  };

  const togglePermission = (permId: string) => {
      setRoleFormData(prev => {
          const current = prev.permissions || [];
          if (current.includes(permId)) {
              return { ...prev, permissions: current.filter(p => p !== permId) };
          } else {
              return { ...prev, permissions: [...current, permId] };
          }
      });
  };

  const resetSecurityToFactory = () => {
      if (confirm("¿Deseas restaurar todos los roles y permisos a su estado original? Esto no borrará tus artículos.")) {
          localStorage.removeItem('ferrecloud_roles');
          localStorage.removeItem('ferrecloud_users');
          window.location.reload();
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleById = (id: string) => roles.find(r => r.id === id);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Acceso</h2>
          <p className="text-gray-500 text-sm">Configuración de usuarios, roles y permisos del sistema.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={resetSecurityToFactory}
                className="text-gray-400 hover:text-red-500 flex items-center gap-2 text-xs font-bold uppercase transition-colors"
                title="Restaurar valores de fábrica para seguridad">
                <RotateCcw size={14}/> Reset Seguridad
            </button>
            <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'USERS' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Usuarios
                </button>
                <button 
                    onClick={() => setActiveTab('ROLES')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ROLES' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Roles y Permisos
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'USERS' && (
          <div className="flex flex-col flex-1 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div className="relative max-w-md flex-1 mr-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar usuario..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => handleOpenUserModal()}
                    className="bg-ferre-orange text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-all font-bold shadow-md">
                    <UserPlus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Nombre de Usuario</th>
                        <th className="px-6 py-4">Rol Asignado</th>
                        <th className="px-6 py-4">Sucursal</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(user => {
                        const role = getRoleById(user.roleId);
                        return (
                        <tr key={user.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                                {user.name.substring(0, 2)}
                                </div>
                                <div>
                                <div className="font-bold text-gray-800 text-sm">{user.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Mail size={10}/> {user.email}</div>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                                {role ? (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${role.color}`}>
                                        {role.name}
                                    </span>
                                ) : <span className="text-xs text-red-500 font-bold">Sin Rol</span>}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                                {user.branchId === 'SUC-001' ? 'Casa Central' : user.branchId === 'SUC-002' ? 'Sucursal Norte' : 'Depósito'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xs font-bold text-gray-600 uppercase">{user.active ? 'Activo' : 'Inactivo'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenUserModal(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            </td>
                        </tr>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No se encontraron usuarios.</td></tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'ROLES' && (
          <div className="animate-fade-in flex flex-col flex-1">
            <div className="flex justify-end mb-6">
                <button 
                    onClick={() => handleOpenRoleModal()}
                    className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all font-bold shadow-md">
                    <Shield size={18} /> Crear Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col hover:shadow-xl transition-all relative group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{role.name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">ID: {role.id}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${role.color.split(' ')[0]}`}>
                                <ShieldCheck size={20} className={role.color.split(' ')[1]}/>
                            </div>
                        </div>

                        <div className="flex-1 mb-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Permisos Principales</p>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.includes('ALL') ? (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-black border border-purple-100 w-full text-center tracking-widest uppercase">
                                        ACCESO TOTAL AL SISTEMA
                                    </span>
                                ) : (
                                    role.permissions.slice(0, 5).map(p => (
                                        <span key={p} className="text-[9px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded-lg border border-slate-100 uppercase tracking-tighter">
                                            {SYSTEM_PERMISSIONS.find(sp => sp.id === p)?.label || p}
                                        </span>
                                    ))
                                )}
                                {role.permissions.length === 0 && <span className="text-xs text-red-400 italic">Sin permisos</span>}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-6 border-t border-gray-50">
                            <button 
                                onClick={() => handleOpenRoleModal(role)}
                                className="flex-1 py-3 bg-gray-50 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all uppercase tracking-widest">
                                <Settings size={14}/> Configurar
                            </button>
                            {role.id !== 'admin' && (
                                <button 
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="p-3 bg-red-50 rounded-2xl text-red-500 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* --- MODAL USER (ADD/EDIT) --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-ferre-orange text-white rounded-2xl shadow-lg shadow-orange-200">
                      <Users size={24}/>
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none">
                        {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                      </h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Credenciales de Acceso</p>
                  </div>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre / Usuario</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700 transition-all"
                    value={userFormData.name}
                    onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email de acceso</label>
                  <input 
                    type="email" 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700 transition-all"
                    value={userFormData.email}
                    onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contraseña</label>
                  <div className="relative">
                      <input 
                        type="password" 
                        placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Asignar contraseña'}
                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700 transition-all"
                        value={userFormData.password || ''}
                        onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sucursal</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700 transition-all"
                    value={userFormData.branchId}
                    onChange={e => setUserFormData({...userFormData, branchId: e.target.value})}
                  >
                    <option value="SUC-001">Casa Central</option>
                    <option value="SUC-002">Sucursal Norte</option>
                    <option value="DEP-001">Depósito General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Rol Asignado (Permisos)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => (
                    <div 
                      key={role.id}
                      onClick={() => setUserFormData({...userFormData, roleId: role.id})}
                      className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group ${
                        userFormData.roleId === role.id 
                        ? 'border-ferre-orange bg-orange-50 shadow-md ring-4 ring-orange-50' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${role.color.replace('text-', 'bg-').split(' ')[0]}`}></div>
                        <span className="font-black text-gray-800 uppercase text-xs tracking-tight">{role.name}</span>
                      </div>
                      {userFormData.roleId === role.id && <CheckCircle size={20} className="text-ferre-orange"/>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div 
                    onClick={() => setUserFormData({...userFormData, active: !userFormData.active})}
                    className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${userFormData.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userFormData.active ? 'right-1' : 'left-1'}`}></div>
                </div>
                <div>
                    <label className="text-sm font-black text-slate-800 uppercase tracking-tight cursor-pointer">Usuario Habilitado</label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Permite acceso al sistema en la nube</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-4">
              <button onClick={() => setIsUserModalOpen(false)} className="px-8 py-3 font-black text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancelar</button>
              <button onClick={handleSaveUser} className="px-12 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <Save size={16}/> Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ROLE (ADD/EDIT) --- */}
      {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl"><Shield size={24}/></div>
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{editingRole ? 'Configurar Rol' : 'Crear Rol'}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">Matriz de Permisos</p>
                          </div>
                      </div>
                      <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"><X size={28} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/50">
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-black text-gray-500 mb-2 uppercase">Nombre del Rol</label>
                                <input 
                                  type="text" 
                                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold transition-all"
                                  value={roleFormData.name}
                                  onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 mb-2 uppercase">Color de Badge</label>
                                <select 
                                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold transition-all"
                                  value={roleFormData.color}
                                  onChange={e => setRoleFormData({...roleFormData, color: e.target.value})}
                                >
                                    <option value="bg-gray-100 text-gray-800 border-gray-200">Gris</option>
                                    <option value="bg-red-100 text-red-800 border-red-200">Rojo</option>
                                    <option value="bg-green-100 text-green-800 border-green-200">Verde</option>
                                    <option value="bg-blue-100 text-blue-800 border-blue-200">Azul</option>
                                    <option value="bg-orange-100 text-orange-800 border-orange-200">Naranja</option>
                                    <option value="bg-purple-100 text-purple-800 border-purple-200">Violeta</option>
                                </select>
                            </div>
                      </div>

                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Permisos Granulares</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {['Sistema', 'General', 'Ventas', 'Stock', 'Finanzas'].map(group => (
                                  <div key={group} className="space-y-4">
                                      <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b pb-2">{group}</h5>
                                      <div className="space-y-3">
                                          {SYSTEM_PERMISSIONS.filter(p => p.group === group).map(perm => (
                                              <label key={perm.id} className="flex items-start gap-3 cursor-pointer select-none">
                                                  <div className="mt-0.5">
                                                      {(roleFormData.permissions || []).includes(perm.id) ? (
                                                          <div className="text-indigo-600 bg-indigo-50 p-0.5 rounded shadow-sm"><CheckSquare size={18}/></div>
                                                      ) : (
                                                          <div className="text-gray-300 hover:text-gray-400"><Square size={18}/></div>
                                                      )}
                                                  </div>
                                                  <input type="checkbox" className="hidden" checked={(roleFormData.permissions || []).includes(perm.id)} onChange={() => togglePermission(perm.id)}/>
                                                  <span className={`text-xs uppercase font-bold ${(roleFormData.permissions || []).includes(perm.id) ? 'text-indigo-900' : 'text-gray-400'}`}>{perm.label}</span>
                                              </label>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-4">
                      <button onClick={() => setIsRoleModalOpen(false)} className="px-8 py-3 font-black text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSaveRole} className="px-12 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-2">
                          <ShieldCheck size={18}/> Guardar Rol
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UsersComponent;
