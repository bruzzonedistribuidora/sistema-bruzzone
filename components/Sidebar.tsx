import React, { useState, useMemo, useEffect } from 'react';
import { 
    LayoutDashboard, Receipt, Bot, Settings, LogOut, Wrench, 
    ChevronDown, Users, ClipboardList, FileSpreadsheet, 
    Truck, Wallet, Calculator, PieChart, Database, Store, FileUp, ShieldCheck, 
    ShoppingCart, ListOrdered, Globe, AlertTriangle, 
    Tag, CalendarDays, Landmark, Shield, ArrowLeftRight, Layers,
    HardDrive, LayoutTemplate, Building2,
    BarChart3, Sparkles, ShieldAlert, RotateCcw, Zap, UserCheck
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
    const handleConfigUpdate = () => setSyncKey(prev => prev + 1);
    window.addEventListener('company_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('company_config_updated', handleConfigUpdate);
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
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight transition-colors text-slate-400 hover:bg-slate-800 hover:text-white"
        >
            <Icon size={14} className="text-slate-500" />
            <span className="truncate">{label}</span>
        </button>
    );
  };

  return (
    <header className="h-16 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-2xl shrink-0">
      <div className="flex items-center gap-6 h-full">
        <div onClick={() => onNavigate(ViewState.DASHBOARD)} className="flex items-center gap-3 cursor-pointer group">
            {companyConfig.logo ? (
                <img src={companyConfig.logo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
                <div className="bg-ferre-orange p-1.5 rounded-lg text-white"><Wrench size={20}/></div>
            )}
            <span className="font-black text-sm tracking-tighter uppercase hidden xl:block">FerreCloud</span>
        </div>

        <nav className="flex items-center gap-1 h-full">
            <button 
                onClick={() => onNavigate(ViewState.DASHBOARD)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${currentView === ViewState.DASHBOARD ? 'bg-ferre-orange text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <LayoutDashboard size={16} />
                <span className="hidden xl:inline">Dashboard</span>
            </button>

            <NavDropdown id="ventas" label="Ventas" icon={Receipt}>
                <DropdownItem view={ViewState.POS} label="Punto de Venta" icon={Receipt} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.SALES_ORDERS} label="Pedidos" icon={ListOrdered} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.CREDIT_NOTES} label="Notas Crédito" icon={RotateCcw} perm="POS_ACCESS" />
                <DropdownItem view={ViewState.REMITOS} label="Remitos" icon={ClipboardList} perm="REMITOS_VIEW" />
                <DropdownItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} perm="POS_ACCESS" />
                <div className="h-px bg-slate-800 my-1 mx-4"></div>
                <DropdownItem view={ViewState.CLIENTS} label="Clientes" icon={Users} perm="CLIENTS_VIEW" />
                <DropdownItem view={ViewState.ONLINE_SALES} label="E-commerce" icon={Globe} perm="POS_ACCESS" />
            </NavDropdown>

            <NavDropdown id="compras" label="Compras" icon={Truck}>
                <DropdownItem view={ViewState.PURCHASES} label="Libro Compras" icon={Receipt} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.PROVIDERS} label="Proveedores" icon={Users} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.REPLENISHMENT} label="Pedidos Prov." icon={ShoppingCart} perm="PURCHASES_VIEW" />
                <DropdownItem view={ViewState.SHORTAGES} label="Faltantes" icon={AlertTriangle} perm="STOCK_VIEW" />
            </NavDropdown>

            <NavDropdown id="inventario" label="Stock" icon={Database}>
                <DropdownItem view={ViewState.INVENTORY} label="Maestro Artículos" icon={Database} perm="STOCK_VIEW" />
                <DropdownItem view={ViewState.PRICE_UPDATES} label="Listas de Precios" icon={Layers} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.MASS_PRODUCT_UPDATE} label="Cambios Masivos" icon={Zap} perm="STOCK_EDIT" />
                <DropdownItem view={ViewState.STOCK_TRANSFERS} label="Traslados" icon={ArrowLeftRight} perm="STOCK_EDIT" />
            </NavDropdown>

            <NavDropdown id="finanzas" label="Finanzas" icon={Wallet}>
                <DropdownItem view={ViewState.TREASURY} label="Tesorería" icon={Wallet} perm="TREASURY_VIEW" />
                <DropdownItem view={ViewState.DAILY_MOVEMENTS} label="Gastos" icon={CalendarDays} perm="TREASURY_EDIT" />
                <DropdownItem view={ViewState.ACCOUNTING} label="Contabilidad" icon={Calculator} perm="ACCOUNTING_VIEW" />
                <DropdownItem view={ViewState.EMPLOYEES} label="Personal" icon={UserCheck} perm="ACCOUNTING_VIEW" />
            </NavDropdown>

            <NavDropdown id="config" label="Sistema" icon={Settings}>
                <DropdownItem view={ViewState.CONFIG_PANEL} label="Panel Maestro" icon={Settings} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.COMPANY_SETTINGS} label="Mi Empresa" icon={Building2} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.AFIP_CONFIG} label="Enlace ARCA" icon={ShieldCheck} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.USERS} label="Seguridad" icon={Shield} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.PRINT_CONFIG} label="Imprenta" icon={LayoutTemplate} perm="CONFIG_ACCESS" />
                <DropdownItem view={ViewState.BACKUP} label="Backup" icon={HardDrive} perm="CONFIG_ACCESS" />
            </NavDropdown>
        </nav>
      </div>

      <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-white">{user?.name}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase">{user?.roleId === 'admin' ? 'Administrador' : 'Vendedor'}</p>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
      </div>
    </header>
  );
};

export default Sidebar;
