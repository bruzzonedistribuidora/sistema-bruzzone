// Definiciones de tipos para Sistema Bruzzone

export interface User {
  id: string;
  name: string;
  roleId: string;
  branchId?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

export interface Client {
  id: string;
  name: string;
  cuit: string;
  phone: string;
  address: string;
  balance: number;
  limit: number;
}

export interface Product {
  id: string;
  name: string;
  internalCode: string;
  priceFinal: number;
  listCost: number;
  costAfterDiscounts?: number;
  vatRate?: number;
  stock?: number;
}

export interface InvoiceItem {
  product: Product;
  quantity: number;
  appliedPrice: number;
  subtotal: number;
  priceListId: string;
}

export interface ReplenishmentItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: 'PENDING' | 'ORDERED' | 'RECEIVED';
}

export interface PriceList {
  id: string;
  name: string;
  type: 'BASE' | 'CUSTOM';
  fixedMargin?: number;
  active: boolean;
}

export interface Remito {
  id: string;
  date: string;
  clientId: string;
  items: any[];
  status: 'PENDING' | 'DELIVERED';
}

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
