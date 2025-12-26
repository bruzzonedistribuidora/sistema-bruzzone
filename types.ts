
import React, { useState, useEffect } from 'react';
import { Lock, X, Minus, Square } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MassProductUpdate from './components/MassProductUpdate';
import POS from './components/POS';
import Remitos from './components/Remitos';
import Presupuestos from './components/Presupuestos';
import Assistant from './components/Assistant';
import Treasury from './components/Treasury';
import Purchases from './components/Purchases';
import Clients from './components/Clients';
import ClientBalances from './components/ClientBalances';
import Accounting from './components/Accounting';
import Statistics from './components/Statistics';
import Backup from './components/Backup';
import Branches from './components/Branches';
import UsersComponent from './components/Users';
import PriceUpdates from './components/PriceUpdates';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';
import SalesOrders from './components/SalesOrders';
import PrintSettings from './components/PrintSettings';
import CompanySettings from './components/CompanySettings';
import OnlineSales from './components/OnlineSales';
import AfipConfig from './components/AfipConfig';
import Reports from './components/Reports';
import LabelPrinting from './components/LabelPrinting';
import DailyMovements from './components/DailyMovements';
import Employees from './components/Employees';
import Login from './components/Login';
import CustomerPortal from './components/CustomerPortal';
import StockTransfers from './components/StockTransfers';
import ConfigPanel from './components/ConfigPanel';
import Currencies from './components/Currencies';
import Marketing from './components/Marketing';
import PriceAudit from './components/PriceAudit';
import CreditNotes from './components/CreditNotes';
import PublicPortal from './components/PublicPortal';
import { ViewState, User, Role, Client, InvoiceItem } from './types';

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  
  // Soporte para vista pública de clientes (por ejemplo, vía URL o botón especial)
  const [isPublicMode, setIsPublicMode] = useState(() => {
      return window.location.search.includes('view=fidelidad');
  });

  const [openViews, setOpenViews] = useState<ViewState[]>([ViewState.DASHBOARD]);
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  
  const [targetClientId, setTargetClientId] = useState<string | undefined>(undefined);
  const [portalPreviewClient, setPortalPreviewClient] = useState<Client | null>(null);
  const [itemsToBill, setItemsToBill] = useState<InvoiceItem[] | null>(null);

  const getRoles = (): Role[] => {
    const saved = localStorage.getItem('ferrecloud_roles');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      { id: 'admin', name: 'Administrador Total', color: 'bg-purple-100 text-purple-800', permissions: ['ALL'] },
      { id: 'seller', name: 'Vendedor', color: 'bg-green-100 text-green-800', permissions: ['DASHBOARD_VIEW', 'POS_ACCESS', 'CLIENTS_VIEW', 'STOCK_VIEW', 'REMITOS_VIEW'] }
    ];
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('ferrecloud_session');
    if (savedSession) {
        setLoggedInUser(JSON.parse(savedSession));
    }
  }, []);

  const handleNavigate = (view: ViewState) => {
    if (!openViews.includes(view)) {
      setOpenViews([...openViews, view]);
    }
    setActiveView(view);
  };

  const closeView = (view: ViewState, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (view === ViewState.DASHBOARD) return; 
    
    const newViews = openViews.filter(v => v !== view);
    setOpenViews(newViews);
    if (activeView === view) {
      setActiveView(newViews[newViews.length - 1]);
    }
  };

  const handleLogin = (user: User) => {
    setLoggedInUser(user);
    localStorage.setItem('ferrecloud_session', JSON.stringify(user));
    setActiveView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setPortalPreviewClient(null);
    localStorage.removeItem('ferrecloud_session');
    setOpenViews([ViewState.DASHBOARD]);
    setActiveView(ViewState.DASHBOARD);
  };

  const handleConvertToSale = (items: InvoiceItem[]) => {
  // ... (tus interfaces y tipos anteriores deben seguir igual arriba)

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  REMITOS = 'REMITOS',
  PRESUPUESTOS = 'PRESUPUESTOS',
  TREASURY = 'TREASURY',
  PURCHASES = 'PURCHASES',
  PROVIDERS = 'PROVIDERS',
  CLIENTS = 'CLIENTS',
  CLIENT_BALANCES = 'CLIENT_BALANCES',
  ACCOUNTING = 'ACCOUNTING',
  STATISTICS = 'STATISTICS',
  REPORTS = 'REPORTS',
  BACKUP = 'BACKUP',
  BRANCHES = 'BRANCHES',
  USERS = 'USERS',
  REPLENISHMENT = 'REPLENISHMENT',
  SHORTAGES = 'SHORTAGES',
  PRINT_CONFIG = 'PRINT_CONFIG',
  LABEL_PRINTING = 'LABEL_PRINTING',
  COMPANY_SETTINGS = 'COMPANY_SETTINGS',
  AFIP_CONFIG = 'AFIP_CONFIG',
  DAILY_MOVEMENTS = 'DAILY_MOVEMENTS',
  EMPLOYEES = 'EMPLOYEES',
  SALES_ORDERS = 'SALES_ORDERS',
  ONLINE_SALES = 'ONLINE_SALES',
  PRICE_UPDATES = 'PRICE_UPDATES',
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL'
}

// BORRÁ CUALQUIER COSA QUE DIGA "const renderViewContent" O TENGA <DASHBOARD /> AQUÍ ABAJO.
};


