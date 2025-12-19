import React, { useState } from 'react';
import { Users, UserPlus, Edit, Trash2, Shield, Search, X, Check, CheckCircle, ShieldCheck, Mail, Store, Settings, Lock, CheckSquare, Square } from 'lucide-react';
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

  // --- ROLES STATE ---
  const [roles, setRoles] = useState<Role[]>([
      { 
          id: 'admin', 
          name: 'Administrador Total', 
          color: 'bg-purple-100 text-purple-800 border-purple-200', 
          permissions: ['ALL'] 
      },
      { 
          id: 'seller', 
          name: 'Vendedor', 
          color: 'bg-green-100 text-green-800 border-green-200', 
          permissions: ['POS_ACCESS', 'CLIENTS_VIEW', 'CLIENTS_EDIT', 'STOCK_VIEW', 'REMITOS_VIEW'] 
      },
      { 
          id: 'stock', 
          name: 'Encargado de Depósito', 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          permissions: ['STOCK_VIEW', 'STOCK_EDIT', 'PURCHASES_VIEW', 'REMITOS_VIEW'] 
      },
      { 
          id: 'accountant', 
          name: 'Administrativo', 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          permissions: ['TREASURY_VIEW', 'TREASURY_EDIT', 'ACCOUNTING_VIEW', 'CLIENTS_VIEW'] 
      },
  ]);

  // --- USERS STATE ---
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Administrador Principal', email: 'admin@ferrecloud.com', roleId: 'admin', active: true, lastLogin: 'Hace 5 min', branchId: 'SUC-001' },
    { id: '2', name: 'Juan Vendedor', email: 'juan@ferrecloud.com', roleId: 'seller', active: true, lastLogin: 'Hace 2 horas', branchId: 'SUC-001' },
    { id: '3', name: 'Carlos Depósito', email: 'carlos@ferrecloud.com', roleId: 'stock', active: true, lastLogin: 'Ayer', branchId: 'DEP-001' },
    { id: '4', name: 'Ana Contadora', email: 'ana@ferrecloud.com', roleId: 'accountant', active: true, lastLogin: 'Hace 3 días', branchId: 'SUC-001' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // --- USER MODAL STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    name: '', email: '', roleId: 'seller', active: true, branchId: 'SUC-001'
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
      setUserFormData(user);
    } else {
      setEditingUser(null);
      setUserFormData({
        id: Date.now().toString(),
        name: '',
        email: '',
        roleId: roles[1]?.id || '',
        active: true,
        branchId: 'SUC-001'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userFormData.name || !userFormData.email) return;

    setUsers(prev => {
      if (editingUser) {
        return prev.map(u => u.id === editingUser.id ? { ...u, ...userFormData } as User : u);
      } else {
        return [...prev, { ...userFormData, id: Date.now().toString(), lastLogin: 'Nunca' } as User];
      }
    });
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // --- HANDLERS: ROLE ---
  const handleOpenRoleModal = (role?: Role) => {
      if (role) {
          setEditingRole(role);
          setRoleFormData(role);
      } else {
          setEditingRole(null);
          setRoleFormData({
              id: Date.now().toString(),
              name: '',
              color: 'bg-gray-100 text-gray-800 border-gray-200',
              permissions: []
          });
      }
      setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
      if (!roleFormData.name) return;
      setRoles(prev => {
          if (editingRole) {
              return prev.map(r => r.id === editingRole.id ? {...r, ...roleFormData} as Role : r);
          } else {
              return [...prev, {...roleFormData, id: `role-${Date.now()}`} as Role];
          }
      });
      setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
      if (id === 'admin') {
          alert("No se puede eliminar el rol de Administrador Total.");
          return;
      }
      // Check if users are using this role
      const usersWithRole = users.filter(u => u.roleId === id);
      if (usersWithRole.length > 0) {
          alert(`No se puede eliminar este rol porque hay ${usersWithRole.length} usuarios asignados a él.`);
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

  // --- RENDER ---
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
        
        {/* TAB SWITCHER */}
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'USERS' ? 'bg-ferre-dark text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Usuarios
            </button>
            <button 
                onClick={() => setActiveTab('ROLES')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ROLES' ? 'bg-ferre-dark text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Roles y Permisos
            </button>
        </div>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'USERS' && (
          <>
            <div className="flex justify-end mb-4">
                <button 
                    onClick={() => handleOpenUserModal()}
                    className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm font-medium">
                    <UserPlus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                    type="text" 
                    placeholder="Buscar usuario por nombre o email..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-ferre-orange outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-4">Usuario</th>
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
                        <tr key={user.id} className="hover:bg-gray-50 group transition-colors">
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                <div className="font-bold text-gray-800 text-sm">{user.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10}/> {user.email}</div>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                                {role ? (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${role.color}`}>
                                        {role.name}
                                    </span>
                                ) : <span className="text-xs text-red-500">Rol no encontrado</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                {user.branchId === 'SUC-001' ? 'Casa Central' : user.branchId === 'SUC-002' ? 'Sucursal Norte' : 'Depósito'}
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm text-gray-600">{user.active ? 'Activo' : 'Inactivo'}</span>
                                <span className="text-xs text-gray-400 ml-1">({user.lastLogin})</span>
                            </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => handleOpenUserModal(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                                </button>
                            </div>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            </div>
          </>
      )}

      {/* --- ROLES TAB --- */}
      {activeTab === 'ROLES' && (
          <>
            <div className="flex justify-end mb-4">
                <button 
                    onClick={() => handleOpenRoleModal()}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm font-medium">
                    <Shield size={18} /> Crear Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {roles.map(role => (
                    <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                                <p className="text-xs text-gray-500">ID: {role.id}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role.color.split(' ')[0]}`}>
                                <ShieldCheck size={16} className={role.color.split(' ')[1]}/>
                            </div>
                        </div>

                        <div className="flex-1 mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Permisos Habilitados</p>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.includes('ALL') ? (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold border border-purple-200 w-full text-center">
                                        ACCESO TOTAL
                                    </span>
                                ) : (
                                    role.permissions.slice(0, 5).map(p => {
                                        const permLabel = SYSTEM_PERMISSIONS.find(sp => sp.id === p)?.label || p;
                                        return (
                                            <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                                {permLabel}
                                            </span>
                                        )
                                    })
                                )}
                                {!role.permissions.includes('ALL') && role.permissions.length > 5 && (
                                    <span className="text-[10px] text-gray-400 self-center">+ {role.permissions.length - 5} más</span>
                                )}
                                {role.permissions.length === 0 && <span className="text-xs text-red-400 italic">Sin permisos asignados</span>}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                            <button 
                                onClick={() => handleOpenRoleModal(role)}
                                className="flex-1 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                                <Settings size={14}/> Configurar
                            </button>
                            {role.id !== 'admin' && (
                                <button 
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="p-2 border border-red-200 rounded text-red-600 hover:bg-red-50">
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </>
      )}

      {/* --- MODAL USER (ADD/EDIT) --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-ferre-orange"/> {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ferre-orange outline-none"
                    value={userFormData.name}
                    onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ferre-orange outline-none"
                    value={userFormData.email}
                    onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    placeholder={editingUser ? '••••••••' : ''}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ferre-orange outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sucursal Asignada</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-ferre-orange outline-none"
                    value={userFormData.branchId}
                    onChange={e => setUserFormData({...userFormData, branchId: e.target.value})}
                  >
                    <option value="SUC-001">Casa Central</option>
                    <option value="SUC-002">Sucursal Norte</option>
                    <option value="DEP-001">Depósito General</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Role Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Rol del Usuario</label>
                <div className="grid grid-cols-2 gap-4">
                  {roles.map(role => (
                    <div 
                      key={role.id}
                      onClick={() => setUserFormData({...userFormData, roleId: role.id})}
                      className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between ${
                        userFormData.roleId === role.id 
                        ? 'border-ferre-orange bg-orange-50 shadow-sm ring-1 ring-ferre-orange' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${role.color.replace('text-', 'bg-').split(' ')[0]}`}></div>
                        <span className="font-bold text-gray-800">{role.name}</span>
                      </div>
                      {userFormData.roleId === role.id && <CheckCircle size={18} className="text-ferre-orange"/>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input 
                  type="checkbox" 
                  id="activeUser"
                  checked={userFormData.active}
                  onChange={e => setUserFormData({...userFormData, active: e.target.checked})}
                  className="w-5 h-5 text-ferre-orange rounded focus:ring-ferre-orange"
                />
                <label htmlFor="activeUser" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  Usuario Activo (Permitir acceso al sistema)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveUser} className="px-6 py-2 bg-ferre-dark text-white rounded-lg hover:bg-slate-800 font-bold">Guardar Usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ROLE (ADD/EDIT) --- */}
      {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <Shield size={20}/> {editingRole ? 'Configurar Rol' : 'Crear Nuevo Rol'}
                      </h3>
                      <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
                      
                      {/* Role Basic Info */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Información Básica</h4>
                          <div className="grid grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-bold text-gray-600 mb-1">Nombre del Rol</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej: Auditor de Stock"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ferre-orange outline-none"
                                    value={roleFormData.name}
                                    onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-600 mb-1">Color Identificativo</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded bg-white"
                                    value={roleFormData.color}
                                    onChange={e => setRoleFormData({...roleFormData, color: e.target.value})}
                                  >
                                      <option value="bg-gray-100 text-gray-800 border-gray-200">Gris (Default)</option>
                                      <option value="bg-red-100 text-red-800 border-red-200">Rojo (Admin/Peligro)</option>
                                      <option value="bg-green-100 text-green-800 border-green-200">Verde (Ventas)</option>
                                      <option value="bg-blue-100 text-blue-800 border-blue-200">Azul (Finanzas)</option>
                                      <option value="bg-orange-100 text-orange-800 border-orange-200">Naranja (Stock)</option>
                                      <option value="bg-purple-100 text-purple-800 border-purple-200">Violeta (Gerencia)</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      {/* Permissions Matrix */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Matriz de Permisos</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Group Permissions by Group */}
                              {['Sistema', 'General', 'Ventas', 'Stock', 'Finanzas'].map(group => (
                                  <div key={group} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                                      <h5 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">{group}</h5>
                                      <div className="space-y-2">
                                          {SYSTEM_PERMISSIONS.filter(p => p.group === group).map(perm => (
                                              <label key={perm.id} className="flex items-start gap-2 cursor-pointer group/item">
                                                  <div className="mt-0.5 text-ferre-orange">
                                                      {(roleFormData.permissions || []).includes(perm.id) ? <CheckSquare size={18}/> : <Square size={18} className="text-gray-400 group-hover/item:text-gray-600"/>}
                                                  </div>
                                                  <input 
                                                    type="checkbox" 
                                                    className="hidden"
                                                    checked={(roleFormData.permissions || []).includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                  />
                                                  <span className={`text-sm ${(roleFormData.permissions || []).includes(perm.id) ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                      {perm.label}
                                                  </span>
                                              </label>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
                      <button onClick={() => setIsRoleModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                      <button onClick={handleSaveRole} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center gap-2">
                          <ShieldCheck size={18}/> Guardar Configuración
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default UsersComponent;