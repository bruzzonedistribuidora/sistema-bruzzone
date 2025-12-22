
import React, { useState } from 'react';
import { 
    LayoutDashboard, PackageSearch, Receipt, Bot, Settings, LogOut, Wrench, 
    ChevronRight, ChevronDown, Users, ClipboardList, FileSpreadsheet, 
    Truck, Wallet, Calculator, PieChart, Database, Store, FileUp, ShieldCheck, 
    ShoppingCart, ListOrdered, Printer, Globe, CloudCog, AlertTriangle, 
    FileBarChart2, Tag, CalendarDays, Landmark, Shield
} from 'lucide-react';
import { ViewState, User, Role } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user?: User | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, user, onLogout }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ventas: true,
    compras: true,
    inventario: true,
    finanzas: false,
    config: false
  });

  // Función de verificación de permisos interna para el sidebar
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin maestro siempre tiene todo
    if (user.id === '1' || user.roleId === 'admin') return true;

    const savedRoles = localStorage.getItem('ferrecloud_roles');
    if (!savedRoles) return false;
    
    const roles: Role[] = JSON.parse(savedRoles);
    const userRole = roles.find(r => r.id === user.roleId);
    if (!userRole) return false;
    
    return userRole.permissions.includes('ALL') || userRole.permissions.includes(permission);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const NavItem = ({ view, label, icon: Icon, perm }: { view: ViewState, label: string, icon: any, perm?: string }) => {
    // Si se requiere un permiso y el usuario no lo tiene, no renderizar nada
    if (perm && !hasPermission(perm)) return null;

    return (
      <button
          onClick={() => onNavigate(view)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group mb-1 ${
              currentView === view 
              ? 'bg-ferre-orange text-white shadow-md' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
      >
          <div className="flex items-center gap-3">
              <Icon size={18} />
              <span className="font-medium text-sm">{label}</span>
          </div>
          {currentView === view && <ChevronRight size={14} />}
      </button>
    );
  };

  const SectionHeader = ({ id, label, color, perm }: { id: string, label: string, color: string, perm?: string }) => {
    if (perm && !hasPermission(perm)) return null;
    
    return (
      <button 
          onClick={() => toggleSection(id)}
          className="w-full text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2 flex items-center justify-between group cursor-pointer hover:text-slate-300 transition-colors"
      >
          <div className="flex items-center gap-2">
              <span className={`w-1 h-3 ${color} rounded-full`}></span> 
              {label}
          </div>
          {openSections[id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    );
  };

  const getRoleLabel = () => {
      if (user?.roleId === 'admin') return 'Administrador';
      if (user?.roleId === 'seller') return 'Vendedor';
      return 'Usuario';
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50 overflow-y-auto custom-scrollbar">
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="bg-ferre-orange p-1.5 rounded-md">
                <Wrench size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight truncate">Ferretería Bruzzone</span>
        </div>
      </div>

      <div className="p-4 space-y-2 pb-20">
        {/* DASHBOARD AHORA TIENE PERMISO DASHBOARD_VIEW */}
        <NavItem view={ViewState.DASHBOARD} label="Tablero Principal" icon={LayoutDashboard} perm="DASHBOARD_VIEW" />
        
        <NavItem view={ViewState.REPORTS} label="Informes y Reportes" icon={FileBarChart2} perm="ACCOUNTING_VIEW" />

        <SectionHeader id="ventas" label="Ventas" color="bg-green-500" />
        {openSections.ventas && (
            <nav className="animate-fade-in space-y-1">
                <NavItem view={ViewState.POS} label="Facturación (POS)" icon={Receipt} perm="POS_ACCESS" />
                <NavItem view={ViewState.ONLINE_SALES} label="Ventas Online" icon={Globe} perm="POS_ACCESS" />
                <NavItem view={ViewState.SALES_ORDERS} label="Órdenes de Pedido" icon={ListOrdered} perm="POS_ACCESS" />
                <NavItem view={ViewState.REMITOS} label="Remitos / Cta. Cte." icon={ClipboardList} perm="REMITOS_VIEW" />
                <NavItem view={ViewState.CLIENT_BALANCES} label="Saldos de Clientes" icon={Landmark} perm="CLIENTS_VIEW" />
                <NavItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} perm="POS_ACCESS" />
                <NavItem view={ViewState.CLIENTS} label="Clientes" icon={Users} perm="CLIENTS_VIEW" />
            </nav>
        )}

        <SectionHeader id="compras" label="Compras" color="bg-blue-500" perm="PURCHASES_VIEW" />
        {openSections.compras && (
            <nav className="animate-fade-in space-y-1">
                <NavItem view={ViewState.SHORTAGES} label="Faltantes / Reposición" icon={AlertTriangle} perm="STOCK_VIEW" />
                <NavItem view={ViewState.REPLENISHMENT} label="Armado de Pedidos" icon={ShoppingCart} perm="PURCHASES_VIEW" />
                <NavItem view={ViewState.PURCHASES} label="Gestión Compras" icon={Truck} perm="PURCHASES_VIEW" />
                <NavItem view={ViewState.PROVIDERS} label="Proveedores" icon={Users} perm="PURCHASES_VIEW" />
                <NavItem view={ViewState.PRICE_UPDATES} label="Listas y Precios" icon={FileUp} perm="STOCK_EDIT" />
            </nav>
        )}

        <SectionHeader id="inventario" label="Inventario" color="bg-purple-500" />
        {openSections.inventario && (
            <nav className="animate-fade-in space-y-1">
                <NavItem view={ViewState.INVENTORY} label="Gestión Artículos" icon={PackageSearch} perm="STOCK_VIEW" />
                <NavItem view={ViewState.LABEL_PRINTING} label="Imprimir Etiquetas" icon={Tag} perm="STOCK_VIEW" />
                <NavItem view={ViewState.AI_ASSISTANT} label="Asistente IA" icon={Bot} />
            </nav>
        )}

        <SectionHeader id="finanzas" label="Finanzas" color="bg-yellow-500" perm="TREASURY_VIEW" />
        {openSections.finanzas && (
            <nav className="animate-fade-in space-y-1">
                <NavItem view={ViewState.DAILY_MOVEMENTS} label="Gastos Diarios" icon={CalendarDays} perm="TREASURY_VIEW" />
                <NavItem view={ViewState.EMPLOYEES} label="Empleados" icon={Users} perm="TREASURY_EDIT" />
                <NavItem view={ViewState.TREASURY} label="Tesoreria (Cajas)" icon={Wallet} perm="TREASURY_VIEW" />
                <NavItem view={ViewState.ACCOUNTING} label="Contabilidad" icon={Calculator} perm="ACCOUNTING_VIEW" />
                <NavItem view={ViewState.STATISTICS} label="Estadísticas" icon={PieChart} perm="ACCOUNTING_VIEW" />
            </nav>
        )}

        <SectionHeader id="config" label="Configuración" color="bg-slate-400" perm="CONFIG_ACCESS" />
        {openSections.config && (
            <nav className="animate-fade-in space-y-1">
                <NavItem view={ViewState.COMPANY_SETTINGS} label="Datos de Empresa" icon={Settings} perm="CONFIG_ACCESS" />
                <NavItem view={ViewState.AFIP_CONFIG} label="Conexión AFIP" icon={CloudCog} perm="CONFIG_ACCESS" />
                <NavItem view={ViewState.PRINT_CONFIG} label="Diseño Impresión" icon={Printer} perm="CONFIG_ACCESS" />
                <NavItem view={ViewState.BRANCHES} label="Sucursales" icon={Store} perm="CONFIG_ACCESS" />
                <NavItem view={ViewState.USERS} label="Usuarios y Permisos" icon={ShieldCheck} perm="CONFIG_ACCESS" />
                <NavItem view={ViewState.BACKUP} label="Backup y Sistema" icon={Database} perm="CONFIG_ACCESS" />
            </nav>
        )}
      </div>

      <div className="mt-auto p-4 bg-slate-950 border-t border-slate-800 shrink-0 sticky bottom-0 z-10">
        <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-slate-900 rounded-xl border border-slate-800">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase ${user?.roleId === 'admin' ? 'bg-purple-600 text-white' : 'bg-ferre-orange text-slate-950'}`}>
                {user?.roleId === 'admin' ? <Shield size={14}/> : (user?.name.substring(0, 2) || 'US')}
            </div>
            <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate uppercase tracking-tighter leading-none">{user?.name || 'Usuario'}</p>
                <p className={`text-[9px] font-black truncate uppercase tracking-widest mt-1 ${user?.roleId === 'admin' ? 'text-purple-400' : 'text-slate-500'}`}>{getRoleLabel()}</p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest">
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
