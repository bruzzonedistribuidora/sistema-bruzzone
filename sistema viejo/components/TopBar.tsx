
import React, { useState, useEffect } from 'react';
import { Bell, Search, User, Menu, HelpCircle, DollarSign, RefreshCw, AlertTriangle, Calendar, X, Store, ChevronDown, Plus, ShoppingCart, Package, FileText, UserPlus, Truck, Wallet, Globe, Settings, Star, CheckCircle, ClipboardList, CalendarDays } from 'lucide-react';
import { ViewState, User as UserType, Role } from '../types';

interface TopBarProps {
  currentView: ViewState;
  activeBranchName: string;
  onSwitchBranch: () => void;
  onNavigate: (view: ViewState) => void;
  user?: UserType | null;
}

interface Alert {
    id: string;
    title: string;
    message: string;
    type: 'WARNING' | 'DANGER' | 'INFO';
    date: string;
}

const AVAILABLE_SHORTCUTS = [
    { id: 'NEW_SALE', label: 'Nueva Venta', view: ViewState.POS, icon: ShoppingCart, color: 'text-green-600 bg-green-50 border-green-200', perm: 'POS_ACCESS' },
    { id: 'CHECK_STOCK', label: 'Consultar Stock', view: ViewState.INVENTORY, icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-200', perm: 'STOCK_VIEW' },
    { id: 'NEW_REMITO', label: 'Nuevo Remito', view: ViewState.REMITOS, icon: ClipboardList, color: 'text-teal-600 bg-teal-50 border-teal-200', perm: 'REMITOS_VIEW' },
    { id: 'DAILY_MOVEMENTS', label: 'Gastos Diarios', view: ViewState.DAILY_MOVEMENTS, icon: CalendarDays, color: 'text-red-600 bg-red-50 border-red-200', perm: 'TREASURY_VIEW' },
    { id: 'NEW_BUDGET', label: 'Nuevo Presupuesto', view: ViewState.PRESUPUESTOS, icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200', perm: 'POS_ACCESS' },
    { id: 'NEW_CLIENT', label: 'Nuevo Cliente', view: ViewState.CLIENTS, icon: UserPlus, color: 'text-orange-600 bg-orange-50 border-orange-200', perm: 'CLIENTS_EDIT' },
    { id: 'NEW_PURCHASE', label: 'Cargar Compra', view: ViewState.PURCHASES, icon: Truck, color: 'text-slate-600 bg-slate-50 border-slate-200', perm: 'PURCHASES_VIEW' },
    { id: 'TREASURY', label: 'Movimiento Caja', view: ViewState.TREASURY, icon: Wallet, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', perm: 'TREASURY_VIEW' },
    { id: 'ONLINE', label: 'Ventas Online', view: ViewState.ONLINE_SALES, icon: Globe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', perm: 'POS_ACCESS' },
];

const TopBar: React.FC<TopBarProps> = ({ currentView, activeBranchName, onSwitchBranch, onNavigate, user }) => {
  const [dollarRate, setDollarRate] = useState<number>(980.50);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString().slice(0, 5));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  
  // Persistencia de atajos seleccionados
  const [activeShortcuts, setActiveShortcuts] = useState<string[]>(() => {
      const saved = localStorage.getItem('ferrecloud_active_shortcuts');
      return saved ? JSON.parse(saved) : ['NEW_SALE', 'CHECK_STOCK', 'NEW_REMITO', 'DAILY_MOVEMENTS'];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_active_shortcuts', JSON.stringify(activeShortcuts));
  }, [activeShortcuts]);

  const [isConfiguringShortcuts, setIsConfiguringShortcuts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Helper de permisos corregido para reconocer Administrador
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Bypass total para Administrador (ID 1 o rol admin)
    if (user.id === '1' || user.roleId === 'admin') return true;

    const savedRoles = localStorage.getItem('ferrecloud_roles');
    const roles: Role[] = savedRoles ? JSON.parse(savedRoles) : [];
    const userRole = roles.find(r => r.id === user.roleId);
    
    if (!userRole) return false;
    
    return userRole.permissions.includes('ALL') || userRole.permissions.includes(permission);
  };

  const [alerts] = useState<Alert[]>([
      { id: '1', title: 'Cheque por Vencer', message: 'Cheque Banco Galicia #5542 vence en 2 días.', type: 'WARNING', date: 'Vence: 30/10' },
      { id: '2', title: 'Pago Proveedor', message: 'Vencimiento factura "Herramientas Global" mañana.', type: 'DANGER', date: 'Vence: 29/10' },
      { id: '3', title: 'Cierre de Caja', message: 'La caja "Mostrador 1" no se ha cerrado en 24hs.', type: 'INFO', date: 'Hoy' }
  ]);

  const updateDollar = () => {
      setIsRefreshing(true);
      setTimeout(() => {
          const variation = (Math.random() - 0.5) * 5; 
          setDollarRate(prev => parseFloat((prev + variation).toFixed(2)));
          setLastUpdate(new Date().toLocaleTimeString().slice(0, 5));
          setIsRefreshing(false);
      }, 1000);
  };

  const getTitle = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: return 'Tablero de Control';
      case ViewState.INVENTORY: return 'Gestión de Artículos e Inventario';
      case ViewState.POS: return 'Punto de Venta (POS)';
      case ViewState.REMITOS: return 'Remitos y Cta. Cte.';
      case ViewState.SALES_ORDERS: return 'Órdenes de Pedido (Clientes)';
      case ViewState.ONLINE_SALES: return 'Ventas Online y E-commerce';
      case ViewState.PRESUPUESTOS: return 'Presupuestos y Cotizaciones';
      case ViewState.CLIENTS: return 'Directorio de Clientes';
      case ViewState.TREASURY: return 'Tesorería y Cajas';
      case ViewState.PURCHASES: return 'Compras y Proveedores';
      case ViewState.PROVIDERS: return 'Gestión de Proveedores';
      case ViewState.ACCOUNTING: return 'Contabilidad e Impuestos';
      case ViewState.STATISTICS: return 'Centro de Estadísticas';
      case ViewState.BACKUP: return 'Copias de Seguridad y Sistema';
      case ViewState.BRANCHES: return 'Gestión de Sucursales';
      case ViewState.USERS: return 'Gestión de Usuarios y Roles';
      case ViewState.AI_ASSISTANT: return 'Centro de Ayuda IA';
      case ViewState.PRICE_UPDATES: return 'Actualización Masiva de Listas';
      case ViewState.REPLENISHMENT: return 'Pedidos de Reposición a Proveedores';
      case ViewState.SHORTAGES: return 'Análisis de Faltantes y Stock Crítico';
      case ViewState.PRINT_CONFIG: return 'Diseño y Configuración de Impresión';
      case ViewState.COMPANY_SETTINGS: return 'Datos de la Empresa';
      case ViewState.AFIP_CONFIG: return 'Configuración AFIP';
      case ViewState.DAILY_MOVEMENTS: return 'Gastos y Movimientos Diarios';
      case ViewState.EMPLOYEES: return 'Gestión de Personal y Sueldos';
      default: return 'FerreCloud';
    }
  };

  const toggleShortcut = (id: string) => {
      setActiveShortcuts(prev => 
          prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm shrink-0 flex flex-col">
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 tracking-tighter uppercase leading-none">{getTitle()}</h2>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                <div className="bg-green-100 p-1 rounded text-green-700">
                    <DollarSign size={14} strokeWidth={3} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[9px] text-green-600 font-black uppercase tracking-widest">Dólar ARCA</span>
                    <span className="text-sm font-black text-slate-900">${dollarRate.toFixed(2)}</span>
                </div>
                <button 
                    onClick={updateDollar}
                    className={`ml-2 text-slate-300 hover:text-green-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} 
                    title={`Actualizado: ${lastUpdate}`}>
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="relative hidden md:block group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-ferre-orange transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar artículos..." 
                    className="pl-12 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ferre-orange w-64 transition-all font-bold"
                />
            </div>

            <div className="flex items-center gap-3 border-l border-slate-100 pl-6 relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div 
                    className="flex items-center gap-3 ml-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition-all relative group"
                    onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
                >
                    <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-105 transition-transform">
                        {user?.name.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none">{user?.name || 'Administrador'}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <p className="text-[10px] text-ferre-orange font-black uppercase tracking-widest leading-none">{activeBranchName}</p>
                            <ChevronDown size={12} className="text-slate-300"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-slate-50 px-6 py-2 flex items-center gap-3 overflow-x-auto border-b border-slate-100 min-h-[48px] custom-scrollbar shadow-inner">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4 shrink-0 flex items-center gap-2">
              <Star size={12} className="text-ferre-orange fill-ferre-orange"/> Atajos Rápidos
          </span>
          
          <div className="flex items-center gap-2 flex-1">
            {activeShortcuts.map(shortcutId => {
                const shortcut = AVAILABLE_SHORTCUTS.find(s => s.id === shortcutId);
                if (!shortcut || (shortcut.perm && !hasPermission(shortcut.perm))) return null;
                
                return (
                    <button 
                        key={shortcut.id}
                        onClick={() => onNavigate(shortcut.view)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-tighter transition-all hover:scale-105 hover:shadow-md shrink-0 animate-fade-in ${shortcut.color}`}
                    >
                        <shortcut.icon size={14}/>
                        {shortcut.label}
                    </button>
                );
            })}
          </div>

          {/* Botón de configuración accesible siempre para admin o quienes tengan permiso de config */}
          {(user?.roleId === 'admin' || hasPermission('CONFIG_ACCESS')) && (
            <button 
              onClick={() => setIsConfiguringShortcuts(true)}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all ml-4 border border-slate-200 bg-white" title="Configurar Accesos Rápidos">
                <Settings size={16}/>
            </button>
          )}
      </div>

      {isConfiguringShortcuts && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                      <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Star size={16} className="text-ferre-orange fill-ferre-orange"/> Personalizar Atajos</h3>
                      <button onClick={() => setIsConfiguringShortcuts(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  <div className="p-8">
                      <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Selecciona las acciones que más utilizas</p>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                          {AVAILABLE_SHORTCUTS.filter(s => !s.perm || hasPermission(s.perm)).map(shortcut => (
                              <div 
                                key={shortcut.id}
                                onClick={() => toggleShortcut(shortcut.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    activeShortcuts.includes(shortcut.id) 
                                    ? 'border-ferre-orange bg-orange-50 shadow-sm ring-1 ring-orange-50' 
                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`p-2.5 rounded-xl ${activeShortcuts.includes(shortcut.id) ? 'bg-ferre-orange text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                                          <shortcut.icon size={18}/>
                                      </div>
                                      <span className={`text-xs font-black uppercase tracking-tighter ${activeShortcuts.includes(shortcut.id) ? 'text-slate-900' : 'text-slate-500'}`}>
                                          {shortcut.label}
                                      </span>
                                  </div>
                                  {activeShortcuts.includes(shortcut.id) && <CheckCircle size={20} className="text-ferre-orange"/>}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 text-right">
                      <button onClick={() => setIsConfiguringShortcuts(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95">Listo, guardar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TopBar;
