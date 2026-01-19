
export type Role = 'admin' | 'vendedor' | 'contador' | 'deposito';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  activeModules: string[];
  assignedBranchId?: string;
  assignedBranchName?: string;
}

export interface PriceList {
  id: string;
  name: string;
  description: string;
  modifierType: 'margin' | 'percentage_over_base';
  value: number; // Porcentaje de margen o modificador sobre la base
  isBase: boolean;
}

export interface Client {
  id: string;
  name: string;
  cuit: string;
  whatsapp: string;
  email: string;
  specialDiscount: number;
  priceListId: string;
  authorizedPersons: string[];
  balance: number;
  accumulatedPoints?: number; // New: Puntos acumulados
  pointsEnabled?: boolean; // New: Habilitar sistema de puntos para este cliente
}

export interface Supplier {
  id: string;
  name: string;
  cuit: string;
  discounts: number[];
  balance: number;
  phone?: string; // Add phone
  email?: string; // Add email
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  supplierId?: string; // Make optional
  costPrice: number;
  salePrice: number;
  stock: number;
  category: string;
  brand: string;
  reorderPoint?: number; // New field for inventory
  targetStock?: number;  // New field for inventory
  packQuantity?: number; // New: Cantidad por bulto
  purchaseCurrency?: string; // New: Moneda de compra
  saleCurrency?: string; // New: Moneda de venta
  supplierProductCode?: string; // New: Código del producto en el proveedor
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  manager: string;
  status: 'online' | 'offline';
  dailySales: number;
  staffCount: number;
  phone?: string; // Added phone field
  email?: string; // Added email field
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'ingreso' | 'egreso';
  method: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  description: string;
}

export interface Check {
  id: string;
  number: string;
  bank: string;
  amount: number;
  dueDate: string;
  type: 'fisico' | 'echeq';
  status: 'pendiente' | 'cobrado' | 'vencido';
}

export interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

// New Andreani configuration interface
export interface AndreaniConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  accountNumber: string;
  branchCode: string; // For origin branch of shipments
  connected: boolean; // Runtime status
  nickname?: string; // Andreani user nickname if connected
}