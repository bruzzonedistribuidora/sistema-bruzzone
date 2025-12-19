
import React, { useState, useEffect } from 'react';
import { Bell, Search, User, Menu, HelpCircle, DollarSign, RefreshCw, AlertTriangle, Calendar, X, Store, ChevronDown, Plus, ShoppingCart, Package, FileText, UserPlus, Truck, Wallet, Globe, Settings, Star, CheckCircle, ClipboardList } from 'lucide-react';
import { ViewState } from '../types';

interface TopBarProps {
  currentView: ViewState;
  activeBranchName: string;
  onSwitchBranch: () => void;
  onNavigate: (view: ViewState) => void;
}

interface Alert {
    id: string;
    title: string;
    message: string;
    type: 'WARNING' | 'DANGER' | 'INFO';
    date: string;
}

// Definition of available shortcuts
const AVAILABLE_SHORTCUTS = [
    { id: 'NEW_SALE', label: 'Nueva Venta', view: ViewState.POS, icon: ShoppingCart, color: 'text-green-600 bg-green-50 border-green-200' },
    { id: 'CHECK_STOCK', label: 'Consultar Stock', view: ViewState.INVENTORY, icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'NEW_REMITO', label: 'Nuevo Remito', view: ViewState.REMITOS, icon: ClipboardList, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'NEW_BUDGET', label: 'Nuevo Presupuesto', view: ViewState.PRESUPUESTOS, icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'NEW_CLIENT', label: 'Nuevo Cliente', view: ViewState.CLIENTS, icon: UserPlus, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'NEW_PURCHASE', label: 'Cargar Compra', view: ViewState.PURCHASES, icon: Truck, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { id: 'TREASURY', label: 'Movimiento Caja', view: ViewState.TREASURY, icon: Wallet, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { id: 'ONLINE', label: 'Ventas Online', view: ViewState.ONLINE_SALES, icon: Globe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
];

const TopBar: React.FC<TopBarProps> = ({ currentView, activeBranchName, onSwitchBranch, onNavigate }) => {
  const [dollarRate, setDollarRate] = useState<number>(980.50);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString().slice(0, 5));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  
  // Shortcuts State
  const [activeShortcuts, setActiveShortcuts] = useState<string[]>(['NEW_SALE', 'CHECK_STOCK', 'NEW_REMITO', 'TREASURY']);
  const [isConfiguringShortcuts, setIsConfiguringShortcuts] = useState(false);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([
      { id: '1', title: 'Cheque por Vencer', message: 'Cheque Banco Galicia #5542 vence en 2 días.', type: 'WARNING', date: 'Vence: 30/10' },
      { id: '2', title: 'Pago Proveedor', message: 'Vencimiento factura "Herramientas Global" mañana.', type: 'DANGER', date: 'Vence: 29/10' },
      { id: '3', title: 'Cierre de Caja', message: 'La caja "Mostrador 1" no se ha cerrado en 24hs.', type: 'INFO', date: 'Hoy' }
  ]);

  // Simulate updating dollar rate
  const updateDollar = () => {
      setIsRefreshing(true);
      setTimeout(() => {
          // Simulate a small fluctuation
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
      {/* Upper Row: Title, Search, User */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 tracking-tight">{getTitle()}</h2>
        </div>

        <div className="flex items-center gap-6">
            {/* Dollar Rate Ticker */}
            <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                <div className="bg-green-100 p-1 rounded text-green-700">
                    <DollarSign size={14} strokeWidth={3} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Dólar Oficial</span>
                    <span className="text-sm font-bold text-gray-800">${dollarRate.toFixed(2)}</span>
                </div>
                <button 
                    onClick={updateDollar}
                    className={`ml-2 text-gray-400 hover:text-green-600 ${isRefreshing ? 'animate-spin' : ''}`} 
                    title={`Actualizado: ${lastUpdate}`}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Global Search */}
            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar en el sistema..." 
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ferre-orange w-64 transition-all"
                />
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-6 relative">
                {/* Notification Bell */}
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} />
                    {alerts.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm">Notificaciones</h3>
                            <button onClick={() => setShowNotifications(false)}><X size={16} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No hay alertas pendientes.</div>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3">
                                        <div className={`mt-1 ${alert.type === 'DANGER' ? 'text-red-500' : alert.type === 'WARNING' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold ${alert.type === 'DANGER' ? 'text-red-600' : 'text-gray-800'}`}>{alert.title}</h4>
                                            <p className="text-xs text-gray-600 mt-1 leading-snug">{alert.message}</p>
                                            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-bold uppercase">
                                                <Calendar size={10} /> {alert.date}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="bg-gray-50 p-2 text-center">
                            <button className="text-xs text-ferre-orange font-bold hover:underline">Ver todas las alertas</button>
                        </div>
                    </div>
                )}

                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <HelpCircle size={20} />
                </button>
                
                {/* Branch Switcher / User Profile */}
                <div 
                    className="flex items-center gap-3 ml-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors relative"
                    onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
                >
                    <div className="w-8 h-8 bg-ferre-dark text-white rounded-full flex items-center justify-center font-bold text-xs">
                        AD
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-gray-700">Admin</p>
                        <div className="flex items-center gap-1">
                            <p className="text-xs text-ferre-orange font-bold">{activeBranchName}</p>
                            <ChevronDown size={10} className="text-gray-400"/>
                        </div>
                    </div>

                    {isBranchMenuOpen && (
                        <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                                <p className="text-xs font-bold text-gray-500 uppercase">Cambiar Sucursal</p>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {/* In a real app, this list comes from the Branches state */}
                                <button onClick={onSwitchBranch} className="w-full text-left px-4 py-3 hover:bg-orange-50 hover:text-ferre-orange transition-colors flex items-center gap-2 border-b border-gray-50">
                                    <Store size={16} />
                                    <span className="text-sm font-medium">Sucursal Central</span>
                                </button>
                                <button onClick={onSwitchBranch} className="w-full text-left px-4 py-3 hover:bg-orange-50 hover:text-ferre-orange transition-colors flex items-center gap-2 border-b border-gray-50">
                                    <Store size={16} />
                                    <span className="text-sm font-medium">Sucursal Norte</span>
                                </button>
                                <button onClick={onSwitchBranch} className="w-full text-left px-4 py-3 hover:bg-orange-50 hover:text-ferre-orange transition-colors flex items-center gap-2 border-b border-gray-50">
                                    <Store size={16} />
                                    <span className="text-sm font-medium">Depósito General</span>
                                </button>
                            </div>
                            <div className="p-2 border-t border-gray-100 bg-gray-50">
                                <button className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-1">Cerrar Sesión</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Lower Row: Quick Shortcuts Bar */}
      <div className="bg-gray-50 px-6 py-2 flex items-center gap-3 overflow-x-auto border-b border-gray-200 min-h-[48px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1">
              <Star size={10} className="text-yellow-500 fill-yellow-500"/> Accesos Rápidos
          </span>
          
          {activeShortcuts.map(shortcutId => {
              const shortcut = AVAILABLE_SHORTCUTS.find(s => s.id === shortcutId);
              if (!shortcut) return null;
              return (
                  <button 
                    key={shortcut.id}
                    onClick={() => onNavigate(shortcut.view)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-bold transition-all hover:scale-105 hover:shadow-sm shrink-0 ${shortcut.color}`}
                  >
                      <shortcut.icon size={14}/>
                      {shortcut.label}
                  </button>
              );
          })}

          <button 
            onClick={() => setIsConfiguringShortcuts(true)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors ml-auto" title="Configurar Accesos">
              <Settings size={14}/>
          </button>
      </div>

      {/* Modal Configuration */}
      {isConfiguringShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white">
                      <h3 className="font-bold flex items-center gap-2"><Star size={16} className="text-yellow-400 fill-yellow-400"/> Personalizar Accesos</h3>
                      <button onClick={() => setIsConfiguringShortcuts(false)}><X size={20} className="hover:text-gray-300"/></button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-gray-500 mb-4">Selecciona las acciones que deseas ver en la barra superior para acceder rápidamente.</p>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                          {AVAILABLE_SHORTCUTS.map(shortcut => (
                              <div 
                                key={shortcut.id}
                                onClick={() => toggleShortcut(shortcut.id)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                    activeShortcuts.includes(shortcut.id) 
                                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${activeShortcuts.includes(shortcut.id) ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                          <shortcut.icon size={16}/>
                                      </div>
                                      <span className={`text-sm font-medium ${activeShortcuts.includes(shortcut.id) ? 'text-blue-900' : 'text-gray-700'}`}>
                                          {shortcut.label}
                                      </span>
                                  </div>
                                  {activeShortcuts.includes(shortcut.id) && <CheckCircle size={18} className="text-blue-600"/>}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
                      <button onClick={() => setIsConfiguringShortcuts(false)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 text-sm">Listo</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TopBar;
