
import React, { useState, useMemo, useEffect } from 'react';
import { 
    LayoutDashboard, PackageSearch, Receipt, Bot, Settings, LogOut, Wrench, 
    ChevronDown, Users, ClipboardList, FileSpreadsheet, 
    Truck, Wallet, Calculator, PieChart, Database, Store, FileUp, ShieldCheck, 
    ShoppingCart, ListOrdered, Printer, Globe, CloudCog, AlertTriangle, 
    FileBarChart2, Tag, CalendarDays, Landmark, Shield, ArrowLeftRight, Layers,
    Bell, DollarSign, RefreshCw, Star, HardDrive, LayoutTemplate, Building2,
    BarChart3, BrainCircuit, Sparkles, ShieldAlert, RotateCcw
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
  }, [currentView, syncKey]); 

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
        <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${openMenu === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icon size={18} />
            <span className="hidden lg:inline">{label}</span>
            <ChevronDown size={14} className={`transition-transform ${openMenu === id ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === id && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 z-[100] animate-fade-in">
                {children}
            </div>
        )}
    </div>
  );

  const DropdownItem = ({ view, label, icon: Icon, perm }: { view: ViewState, label: string, icon: any, perm?: string }) => {
    if (perm && !hasPermission(perm)) return null;
    return (
        <button
            onClick={() => { onNavigate(view); setOpenMenu(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${currentView === view ? 'bg-ferre-orange text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Icon size={16} />
            <span className="font-medium">{label}</span>
        </button>
    );
  };

  return (
    <header className="h-16 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-2xl shrink-0">
      <div className="flex items-center gap-6">
        <div 
            onClick={() => onNavigate(ViewState.DASHBOARD)}
            className="flex items-center gap-3 cursor-pointer group"
        >
            {companyConfig.logo ? (
                <div className="h-10 flex items-center max-w-[200px]">
                    <img 
                        src={companyConfig.logo} 
                        alt={companyConfig.fantasyName || 'Logo'} 
                        className="h-full w-auto object-contain transition-transform group-hover:scale-105"
                    />
                    <span className="font-black text-sm tracking-tighter uppercase ml-3 hidden xl:block border-l border-slate-700 pl-3">
                        {companyConfig.fantasyName || 'Bruzzone'}
                    </span>
                </div>
            ) : (
                <>
                    <div className="bg-ferre-orange p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Wrench size={20} className="text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tighter uppercase hidden xl:block">
                        {companyConfig.fantasyName || 'FerreCloud'}
                    </span>
                </>
            )}
        </div>

        <nav className="flex items-center gap-1">
            <button 
                onClick={() => onNavigate(ViewState.DASHBOARD)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentView === ViewState.DASHBOARD ? 'bg-ferre-orange text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <LayoutDashboard size={18} />
                <span className="hidden xl:inline">Escritorio</span>
            </button>

            <NavDropdown id="inteligencia" label="Analítica" icon={BrainCircuit}>
                <DropdownItem view={ViewState.REPORTS} label="Reportes Avanzados" icon={BarChart3} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.PRICE_AUDIT} label="Auditoría de Precios" icon={ShieldAlert} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.MARKETING} label="Marketing & Fidelidad" icon={Sparkles} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.ECOMMERCE_ADMIN} label="Gestionar Tienda Web" icon={Globe} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.AI_ASSISTANT} label="FerreBot IA" icon={Bot} perm="DASHBOARD_VIEW" />
                <DropdownItem view={ViewState.STATISTICS} label="Estadísticas Rápidas" icon={PieChart} perm="ACCOUNTING_VIEW" />
            </NavDropdown>

            <NavDropdown id="ventas" label="Ventas" icon={Receipt}>
                <DropdownItem view={ViewState.POS} label="Punto de Venta" icon={Receipt} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.SALES_ORDERS} label="Órdenes de Pedido" icon={ListOrdered} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.CREDIT_NOTES} label="Notas de Crédito" icon={RotateCcw} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.ONLINE_SALES} label="Ventas Online" icon={Globe} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.REMITOS} label="Remitos / Cta Cte" icon={ClipboardList} perm="REMITOS_VIEW" />
                <DropdownItem view={ViewState.CLIENT_BALANCES} label="Saldos Clientes" icon={Landmark} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.CLIENTS} label="Fichero Clientes" icon={Users} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} perm="POS_ACCESS" />
            </NavDropdown>

            <NavDropdown id="compras" label="Compras" icon={Truck}>
                <DropdownItem view={ViewState.PURCHASES} label="Cargar Compras" icon={Truck} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.PRICE_UPDATES} label="Listas de Precios" icon={Layers} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.PROVIDER_BALANCES} label="Saldos Prov." icon={Landmark} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.PROVIDERS} label="Fichero Prov." icon={Users} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.REPLENISHMENT} label="Pedidos" icon={ShoppingCart} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.SHORTAGES} label="Faltantes" icon={AlertTriangle} perm="STOCK_VIEW" />
            </NavDropdown>

            <NavDropdown id="stock" label="Stock" icon={PackageSearch}>
                <DropdownItem view={ViewState.INVENTORY} label="Artículos" icon={PackageSearch} perm="STOCK_VIEW" />
                <DropdownItem view={ViewState.MASS_PRODUCT_UPDATE} label="Cambios Masivos" icon={Layers} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.STOCK_TRANSFERS} label="Traslados" icon={ArrowLeftRight} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.LABEL_PRINTING} label="Etiquetas" icon={Tag} perm="STOCK_VIEW" />
            </NavDropdown>

            <NavDropdown id="finanzas" label="Finanzas" icon={Wallet}>
                <DropdownItem view={ViewState.TREASURY} label="Tesoreria" icon={Wallet} perm="TREASURY_VIEW" />
                <DropdownItem view={ViewState.DAILY_MOVEMENTS} label="Gastos Diarios" icon={CalendarDays} perm="TREASURY_VIEW" />
                <DropdownItem view={ViewState.CURRENCIES} label="Monedas / Divisas" icon={DollarSign} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.ACCOUNTING} label="Contabilidad" icon={Calculator} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.EMPLOYEES} label="Personal" icon={Users} perm="TREASURY_EDIT" />
            </NavDropdown>

            <NavDropdown id="config" label="Configuración" icon={Settings}>
                <DropdownItem view={ViewState.CONFIG_PANEL} label="Panel Maestro" icon={Settings} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.COMPANY_SETTINGS} label="Mi Empresa" icon={Building2} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.AFIP_CONFIG} label="Enlace ARCA/AFIP" icon={ShieldCheck} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.USERS} label="Usuarios y Roles" icon={Shield} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.BRANCHES} label="Sucursales" icon={Store} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.PRINT_CONFIG} label="Formatos Impresión" icon={LayoutTemplate} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.BACKUP} label="Base de Datos" icon={HardDrive} perm="CONFIG_ACCESS" />
            </NavDropdown>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-4 bg-slate-900 px-4 py-1.5 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Dólar ARCA</span>
                <span className="text-xs font-black text-green-400">$980.50</span>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Sucursal</span>
                <span className="text-xs font-black text-indigo-400">Central</span>
            </div>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase tracking-tight leading-none">{user?.name || 'Usuario'}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                    {user?.roleId === 'admin' ? 'Administrador' : 'Vendedor'}
                </p>
            </div>
            <button 
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title="Cerrar Sesión"
            >
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
