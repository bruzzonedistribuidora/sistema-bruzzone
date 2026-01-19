
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Truck, Wallet, 
  ShoppingCart, RefreshCcw, Gift, Globe, 
  BarChart3, Settings as SettingsIcon, TrendingUp,
  Tags, UserCog, BadgeDollarSign, ClipboardList,
  Store, Warehouse, Boxes, FileUp, ListChecks,
  Scale, PackagePlus, DollarSign, Cloud, Home,
  ChevronDown, LogOut, PlusCircle, Layers, // Import new icons
  Archive // Import Archive icon
} from 'lucide-react';
import { CompanyInfo } from '../App';
import { Role } from '../types'; // Import Role type

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companyInfo: CompanyInfo;
  currentUser: { name: string; role: Role; }; // Add currentUser to props
  onLogout: () => void; // Add onLogout prop
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, companyInfo, currentUser, onLogout }) => { // Destructure currentUser and onLogout
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]); // State to manage expanded groups

  // Initialize all groups as expanded by default
  React.useEffect(() => {
    setExpandedGroups(menuGroups.map(group => group.name));
  }, []);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const menuGroups = [
    {
      name: 'Principal',
      icon: Home,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      name: 'Comercial',
      icon: BadgeDollarSign,
      items: [
        { id: 'sales', label: 'Ventas', icon: BadgeDollarSign },
        { id: 'remitos', label: 'Remitos', icon: ClipboardList },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'loyalty', label: 'Fidelización', icon: Gift },
        { id: 'ecommerce', label: 'E-Commerce', icon: Globe },
      ]
    },
    {
      name: 'Productos & Abastecimiento',
      icon: Boxes,
      items: [
        { id: 'inventory', label: 'Inventario', icon: Boxes },
        { id: 'stock-adjustment', label: 'Ajuste de Stock', icon: PlusCircle }, // New menu item
        { id: 'bulk-modification', label: 'Modificación Masiva', icon: Layers }, // New menu item
        { id: 'warehouse', label: 'Depósito', icon: Warehouse },
        { id: 'purchase-orders', label: 'Pedidos Compra', icon: ListChecks },
        { id: 'suppliers', label: 'Proveedores', icon: Truck },
        { id: 'prices', label: 'Lista Precios', icon: RefreshCcw },
        { id: 'bulk-import', label: 'Importar Datos', icon: FileUp },
      ]
    },
    {
      name: 'Administración & Finanzas',
      icon: Wallet,
      items: [
        { id: 'cashier', label: 'Cajas y Pagos', icon: Wallet },
        { id: 'purchases', label: 'Compras & IA', icon: ShoppingCart },
        { id: 'balances', label: 'Saldos y Deudas', icon: Scale },
        { id: 'finance', label: 'Finanzas', icon: TrendingUp },
        { id: 'reports', label: 'Informes e IVA', icon: BarChart3 },
      ]
    },
    {
      name: 'Configuración',
      icon: SettingsIcon,
      items: [
        { id: 'branches', label: 'Sucursales', icon: Store },
        { id: 'users', label: 'Usuarios', icon: UserCog },
        { id: 'settings', label: 'Configuración', icon: SettingsIcon },
        { id: 'data', label: 'Gestión de Datos', icon: Archive }, // New menu item for data management
      ]
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3">
          {companyInfo.logo && companyInfo.showLogoInSidebar ? (
            <img 
              src={companyInfo.logo} 
              className="w-10 h-10 rounded-lg object-cover bg-white" 
              alt="Logo Empresa" 
            />
          ) : (
            <div className="p-2 bg-orange-500 rounded-lg">
              <Tags className="w-6 h-6 text-white" />
            </div>
          )}
          <span className="text-xl font-bold tracking-tight truncate">{companyInfo.name}</span>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar text-left">
        {menuGroups.map((group) => (
          <div key={group.name} className="space-y-1">
            <button 
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <group.icon className="w-4 h-4" />
                {group.name}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedGroups.includes(group.name) ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {expandedGroups.includes(group.name) && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top duration-200">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl mb-4"> {/* Added mb-4 for spacing */}
          <img src="https://picsum.photos/40/40" className="w-10 h-10 rounded-full border border-slate-700" alt="User" />
          <div className="overflow-hidden text-left">
            <p className="text-sm font-semibold truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{currentUser.role}</p>
          </div>
        </div>
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all text-red-400 hover:bg-red-900 hover:text-white bg-red-950/50"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="truncate">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;