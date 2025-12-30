import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Smartphone, ShoppingBag, Plus, LayoutDashboard, Database, 
    Receipt, Truck, Wallet, Bot, Settings, FileUp, Layers, Zap, 
    Search as SearchIcon, ChevronRight, Package, ListOrdered,
    RotateCcw, Landmark, FileSpreadsheet, Tag, Clock, Users,
    Calculator, TrendingUp, FileBarChart2, Building2, ShieldCheck,
    LayoutTemplate, HardDrive, Sparkles, ShieldAlert, Globe, Heart
} from 'lucide-react';

// TODOS ESTOS DEBEN IR SIN "./components/"
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import POS from './POS';
import Purchases from './Purchases';
import Clients from './Clients';
import Providers from './Providers';
import Treasury from './Treasury';
import Accounting from './Accounting';
import Statistics from './Statistics';
import Reports from './Reports';
import Backup from './Backup';
import Branches from './Branches';
import UsersComponent from './Users';
import PriceUpdates from './PriceUpdates';
import Assistant from './Assistant';
import CompanySettings from './CompanySettings';
import AfipConfig from './AfipConfig';
import DailyMovements from './DailyMovements';
import Employees from './Employees';
import ConfigPanel from './ConfigPanel';
import Marketing from './Marketing';
import PriceAudit from './PriceAudit';
import OnlineSales from './OnlineSales';
import EcommerceAdmin from './EcommerceAdmin';
import Shop from './Shop';
import InitialImport from './InitialImport';
import CustomerPortal from './CustomerPortal';
import Remitos from './Remitos';
import Presupuestos from './Presupuestos';
import SalesOrders from './SalesOrders';
import CreditNotes from './CreditNotes';
import MassProductUpdate from './MassProductUpdate';
import StockTransfers from './StockTransfers';
import Login from './Login';

// ESTE LLEVA LOS DOS PUNTOS PORQUE ESTÁ AFUERA
import { ViewState, User, Client, InvoiceItem } from '../types';
