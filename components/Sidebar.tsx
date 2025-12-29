import React, { useState, useMemo, useEffect } from 'react';
import { 
    LayoutDashboard, PackageSearch, Receipt, Bot, Settings, LogOut, Wrench, 
    ChevronDown, Users, ClipboardList, FileSpreadsheet, 
    Truck, Wallet, Calculator, PieChart, Database, Store, FileUp, ShieldCheck, 
    ShoppingCart, ListOrdered, Printer, Globe, CloudCog, AlertTriangle, 
    FileBarChart2, Tag, CalendarDays, Landmark, Shield, ArrowLeftRight, Layers,
    Bell, DollarSign, RefreshCw, Star, HardDrive, LayoutTemplate, Building2,
    BarChart3, BrainCircuit, Sparkles, ShieldAlert, RotateCcw, Zap, Box, UserCheck,
    Calendar, BadgeAlert
} from 'lucide-react';
import { ViewState, User, Role, CompanyConfig } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user?: User | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, user, onLogout }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [syncKey, setSyncKey] = useState(0); 

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, [syncKey]); 

  useEffect(() => {
    const handleConfigUpdate = () => {
        setSyncKey(prev => prev + 1);
    };

    window.addEventListener('company_config_updated', handleConfigUpdate);
    window.addEventListener('storage', handleConfigUpdate); 

    return () => {
        window.removeEventListener('company_config_updated', handleConfigUpdate);
        window.removeEventListener('storage', handleConfigUpdate);
    };
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.id === '1' || user.roleId === 'admin') return true;
    const savedRoles = localStorage.getItem('ferrecloud_roles');
    if (!savedRoles) return false;
    const roles: Role[] = JSON.parse(savedRoles);
    const userRole = roles.find(r => r.id === user.roleId);
    if (!userRole) return false;
    return userRole.permissions.includes('ALL') || userRole.permissions.includes(permission);
  };

  const NavDropdown = ({ label, icon: Icon, children, id }: { label: string, icon: any, children?: React.ReactNode, id: string }) => (
    <div 
        className="relative group"
        onMouseEnter={() => setOpenMenu(id)}
        onMouseLeave={() => setOpenMenu(null)}
    >
        <button className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${openMenu === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icon size={16} />
            <span className="hidden lg:inline">{label}</span>
            <ChevronDown size={12} className={`transition-transform ${openMenu === id ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === id && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 z-[100] animate-fade-in overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        )}
    </div>
  );

  const DropdownItem = ({ view, label, icon: Icon, perm }: { view: ViewState, label: string, icon: any, perm?: string }) => {
    if (perm && !hasPermission(perm)) return null;
    return (
        <button
            onClick={() => { onNavigate(view); setOpenMenu(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight transition-colors ${currentView === view ? 'bg-ferre-orange text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Icon size={14} className={currentView === view ? 'text-white' : 'text-slate-500'} />
            <span className="truncate">{label}</span>
        </button>
    );
  };

  return (
    <header className="h-16 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-2xl shrink-0">
      <div className="flex items-center gap-6 h-full">
        <div 
            onClick={() => onNavigate(ViewState.DASHBOARD)}
            className="flex items-center gap-3 cursor-pointer group"
        >
            {companyConfig.logo ? (
                <div className="h-10 flex items-center max-w-[180px]">
                    <img 
                        src={companyConfig.logo} 
                        alt={companyConfig.fantasyName || 'Logo'} 
                        className="h-full w-auto object-contain transition-transform group-hover:scale-105"
                    />
                </div>
            ) : (
                <div className="bg-ferre-orange p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                    <Wrench size={20} className="text-white" />
                </div>
            )}
            <span className="font-black text-sm tracking-tighter uppercase hidden xl:block border-l border-slate-700 pl-3 ml-1">
                {companyConfig.fantasyName || 'Bruzzone Cloud'}
            </span>
        </div>

        <nav className="flex items-center gap-1 h-full">
            <button 
                onClick={() => onNavigate(ViewState.DASHBOARD)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${currentView === ViewState.DASHBOARD ? 'bg-ferre-orange text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <LayoutDashboard size={16} />
                <span className="hidden xl:inline">Escritorio</span>
            </button>

            <NavDropdown id="ventas" label="Ventas" icon={Receipt}>
                <DropdownItem view={ViewState.POS} label="Punto de Venta (Caja)" icon={Receipt} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.SALES_ORDERS} label="Pedidos de Clientes" icon={ListOrdered} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.CREDIT_NOTES} label="Notas de Crédito" icon={RotateCcw} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.ONLINE_SALES} label="Ventas E-commerce" icon={Globe} perm="POS_ACCESS" />
                <div className="h-px bg-slate-800 my-1 mx-4 opacity-50"></div>
                <DropdownItem view={ViewState.REMITOS} label="Remitos y Cta Cte" icon={ClipboardList} perm="REMITOS_VIEW" />
                <DropdownItem view={ViewState.CLIENT_BALANCES} label="Saldos de Clientes" icon={Landmark} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.CLIENTS} label="Fichero Clientes" icon={Users} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} perm="POS_ACCESS" />
            </NavDropdown>

            <NavDropdown id="stock" label="Stock" icon={Database}>
                <DropdownItem view={ViewState.INVENTORY} label="Maestro de Artículos" icon={Database} perm="STOCK_VIEW" />
                <DropdownItem view={ViewState.PRICE_UPDATES} label="Listas de Precios" icon={Layers} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.MASS_PRODUCT_UPDATE} label="Cambios Masivos" icon={Zap} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.STOCK_TRANSFERS} label="Traslados de Stock" icon={ArrowLeftRight} perm="STOCK_EDIT" />
                <div className="h-px bg-slate-800 my-1 mx-4 opacity-50"></div>
                <DropdownItem view={ViewState.PURCHASES} label="Libro de Compras" icon={Truck} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.PROVIDERS} label="Fichero Proveedores" icon={Users} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.PROVIDER_BALANCES} label="Saldos Proveedores" icon={Landmark} perm="PURCHASES_VIEW" />
                <div className="h-px bg-slate-800 my-1 mx-4 opacity-50"></div>
                <DropdownItem view={ViewState.REPLENISHMENT} label="Pedidos a Proveedor" icon={ShoppingCart} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.SHORTAGES} label="Faltantes Críticos" icon={AlertTriangle} perm="STOCK_VIEW" />
                <DropdownItem view={ViewState.LABEL_PRINTING} label="Imprenta Etiquetas" icon={Tag} perm="STOCK_VIEW" />
            </NavDropdown>

            <NavDropdown id="finanzas" label="Finanzas" icon={Wallet}>
                <DropdownItem view={ViewState.TREASURY} label="Control de Cajas" icon={Wallet} perm="TREASURY_VIEW" />
                <DropdownItem view={ViewState.DAILY_MOVEMENTS} label="Gastos Diarios" icon={CalendarDays} perm="TREASURY_EDIT" />
                <DropdownItem view={ViewState.ACCOUNTING} label="Contabilidad Fiscal" icon={Calculator} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.EMPLOYEES} label="Gestión de Personal" icon={UserCheck} perm="ACCOUNTING_VIEW" />
            </NavDropdown>

            <NavDropdown id="inteligencia" label="IA & Reportes" icon={BarChart3}>
                <DropdownItem view={ViewState.REPORTS} label="Reportes de Negocio" icon={BarChart3} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.PRICE_AUDIT} label="Auditoría Precios" icon={ShieldAlert} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.MARKETING} label="Marketing & Fidelidad" icon={Sparkles} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.AI_ASSISTANT} label="Asistente FerreBot" icon={Bot} perm="DASHBOARD_VIEW" />
                <DropdownItem view={ViewState.STATISTICS} label="Dashboard Estadístico" icon={PieChart} perm="ACCOUNTING_VIEW" />
            </NavDropdown>

            <NavDropdown id="sistema" label="Sistema" icon={Settings}>
                <DropdownItem view={ViewState.CONFIG_PANEL} label="Panel de Control" icon={Settings} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.COMPANY_SETTINGS} label="Mi Empresa" icon={Building2} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.AFIP_CONFIG} label="Enlace ARCA / AFIP" icon={ShieldCheck} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.USERS} label="Usuarios y Roles" icon={Shield} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.BRANCHES} label="Sucursales" icon={Store} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.PRINT_CONFIG} label="Formatos Comprobante" icon={LayoutTemplate} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.BACKUP} label="Base de Datos" icon={HardDrive} perm="CONFIG_ACCESS" />
            </NavDropdown>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-tight leading-none text-white">{user?.name || 'Usuario'}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                    {user?.roleId === 'admin' ? 'Administrador' : 'Vendedor'}
                </p>
            </div>
            <button 
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title="Cerrar Sesión"
            >
                <LogOut size={16} />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
