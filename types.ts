
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  REMITOS = 'REMITOS',
  PRESUPUESTOS = 'PRESUPUESTOS',
  CLIENTS = 'CLIENTS',
  PURCHASES = 'PURCHASES',
  PROVIDERS = 'PROVIDERS',
  TREASURY = 'TREASURY',
  ACCOUNTING = 'ACCOUNTING',
  STATISTICS = 'STATISTICS',
  REPORTS = 'REPORTS', // New View
  BACKUP = 'BACKUP',
  BRANCHES = 'BRANCHES',
  AI_ASSISTANT = 'AI_ASSISTANT',
  PRICE_UPDATES = 'PRICE_UPDATES',
  USERS = 'USERS',
  REPLENISHMENT = 'REPLENISHMENT',
  SHORTAGES = 'SHORTAGES',
  SALES_ORDERS = 'SALES_ORDERS',
  ONLINE_SALES = 'ONLINE_SALES',
  PRINT_CONFIG = 'PRINT_CONFIG',
  LABEL_PRINTING = 'LABEL_PRINTING', // New Module
  COMPANY_SETTINGS = 'COMPANY_SETTINGS',
  AFIP_CONFIG = 'AFIP_CONFIG',
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL'
}

export interface CompanyConfig {
    name: string; // Razón Social
    fantasyName: string; // Nombre Fantasía
    cuit: string;
    taxCondition: string; // Resp Inscripto, Monotributo, etc.
    iibb: string; // Ingresos Brutos
    startDate: string; // Inicio de Actividades
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    email: string;
    web: string;
    logo: string | null; // Base64 string for preview
    slogan: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  type: 'SUCURSAL' | 'DEPOSITO' | 'VIRTUAL';
  active: boolean;
}

export interface ProductStock {
  branchId: string;
  branchName: string;
  quantity: number;
}

export interface EcommerceConfig {
  mercadoLibre: boolean;
  tiendaNube: boolean;
  webPropia: boolean;
}

export interface Product {
  id: string;
  internalCode: string;
  barcodes: string[];
  providerCodes: string[];
  name: string;
  brand: string;
  provider: string;
  description: string;
  category: string;
  measureUnitSale: string;
  measureUnitPurchase: string;
  conversionFactor: number;
  purchaseCurrency: 'ARS' | 'USD';
  saleCurrency: 'ARS' | 'USD';
  vatRate: 10.5 | 21.0 | 27.0 | 0;
  listCost: number;
  discounts: [number, number, number, number];
  costAfterDiscounts: number;
  profitMargin: number;
  priceNeto: number;
  priceFinal: number;
  stock: number;
  stockDetails: ProductStock[];
  minStock: number;
  desiredStock: number;
  reorderPoint: number;
  location: string;
  ecommerce: EcommerceConfig;
}

// --- NUEVO: Listas de Precios ---
export interface PriceList {
    id: string;
    name: string;
    type: 'BASE' | 'CUSTOM'; // BASE usa el margen del producto, CUSTOM usa fixedMargin
    fixedMargin?: number; // Porcentaje de ganancia fijo sobre el costo
    active: boolean;
}

export enum TaxCondition {
  RESPONSABLE_INSCRIPTO = 'Responsable Inscripto',
  MONOTRIBUTO = 'Monotributo',
  CONSUMIDOR_FINAL = 'Consumidor Final',
  EXENTO = 'Exento'
}

export interface InvoiceItem {
  product: Product;
  quantity: number;
  subtotal: number;
  appliedPrice: number; // Precio unitario final aplicado
  priceListId?: string; // ID de la lista usada
}

export interface Invoice {
  customerName: string;
  customerCuit: string;
  taxCondition: TaxCondition;
  items: InvoiceItem[];
  total: number;
  cae?: string;
  date: string;
}

export interface RemitoItem {
  product: Product;
  quantity: number;
  historicalPrice: number;
}

export interface Remito {
  id: string;
  clientId: string;
  clientName: string;
  items: RemitoItem[];
  date: string;
  status: 'PENDING' | 'BILLED' | 'PAID_INTERNAL';
}

export interface Budget {
  id: string;
  clientName: string;
  date: string;
  validUntil: string;
  items: InvoiceItem[];
  total: number;
  status: 'OPEN' | 'CONVERTED' | 'EXPIRED';
}

// --- NUEVO: Ordenes de Pedido (Clientes) ---
export type SalesOrderStatus = 'PENDING' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface SalesOrder {
    id: string;
    clientName: string;
    date: string;
    priority: 'NORMAL' | 'URGENTE';
    items: InvoiceItem[];
    status: SalesOrderStatus;
    notes: string;
    total: number;
}

// --- NUEVO: Ventas Online ---
export type OnlinePlatform = 'MERCADOLIBRE' | 'TIENDANUBE' | 'WOOCOMMERCE';
export type ShippingMethod = 'MERCADOENVIOS' | 'FLEX' | 'CORREO' | 'RETIRO_SUCURSAL';
export type OnlineOrderStatus = 'NEW' | 'PACKING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OnlineOrder {
    id: string; // ID interno
    platformId: string; // ID en la plataforma (ej: ML 20000...)
    platform: OnlinePlatform;
    date: string;
    customer: {
        name: string;
        nickname?: string;
        address: string;
        city: string;
        zipCode: string;
        phone: string;
        dni: string;
    };
    items: InvoiceItem[];
    total: number;
    shippingCost: number;
    shippingMethod: ShippingMethod;
    status: OnlineOrderStatus;
    trackingCode?: string;
    labelPrinted: boolean;
    invoiced: boolean;
}

// --- NUEVO: Configuración de Impresión ---
export type DocumentType = 'FACTURA' | 'TICKET_INTERNO' | 'REMITO' | 'PRESUPUESTO' | 'ORDEN_PEDIDO';
export type PaperSize = 'A4' | 'TICKET_80MM' | 'A4_QUARTER' | 'CUSTOM';

export interface Position {
    x: number; // mm
    y: number; // mm
    visible: boolean;
}

export interface PrintTemplate {
    id: DocumentType;
    name: string;
    paperSize: PaperSize;
    customWidth?: number; // mm
    customHeight?: number; // mm
    
    // Content
    headerText: string; // Nombre Fantasía
    subHeaderText: string; // Dirección / Tel
    footerText: string; // Gracias por su compra / Condicines
    showLogo: boolean;
    showPrice: boolean;
    showTotal: boolean;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';

    // Layout Positions (Coordinates in mm)
    positions: {
        logo: Position;
        header: Position; // Company Info
        docInfo: Position; // Date, Invoice Type, Number
        client: Position; // Client Info
        table: Position; // Items Table
        totals: Position; // Totals Section
        footer: Position; // Footer Text / Legal
        qr: Position; // QR AFIP
    }
}

export interface DashboardStats {
  totalSales: number;
  lowStockCount: number;
  dailyRevenue: number;
  pendingShipments: number;
}

export interface Client {
  id: string;
  name: string;
  cuit: string;
  phone: string;
  address: string;
  balance: number; // Saldo Cta Cte
  limit: number; // Límite de crédito
  // Portal Fields
  portalEnabled?: boolean;
  portalHash?: string;
  email?: string;
}

export interface Provider {
  id: string;
  name: string;
  cuit: string;
  contact: string;
  balance: number; // Deuda con el proveedor
  defaultDiscounts: [number, number, number]; 
}

// --- NUEVO: Detalle de Items de Compra ---
export interface PurchaseItem {
    id: string;
    productCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Purchase {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  type: 'FACTURA_A' | 'FACTURA_B' | 'PRESUPUESTO_X';
  items: number; // Cantidad de items resumen
  details?: PurchaseItem[]; // Detalle real de productos
  total: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface CashRegister {
  id: string;
  name: string;
  balance: number; // Saldo actual
  isOpen: boolean;
}

export interface Check {
  id: string;
  bank: string;
  number: string;
  amount: number;
  paymentDate: string; // Fecha pago
  status: 'CARTERA' | 'DEPOSITADO' | 'ENTREGADO' | 'RECHAZADO';
  origin: string; // De quien vino
}

export interface TreasuryMovement {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; // Ingreso (Recibo), Egreso (Orden Pago), Transferencia
  subtype: 'VENTA' | 'COBRO_CTACTE' | 'PAGO_PROVEEDOR' | 'GASTO_VARIO' | 'RETIRO_SOCIO';
  paymentMethod: 'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CHEQUE' | 'ECHEQ' | 'TARJETA';
  amount: number;
  description: string;
  cashRegisterId: string;
}

// --- NUEVO: Movimiento de Cuenta Corriente ---
export interface CurrentAccountMovement {
    id: string;
    date: string;
    voucherType: string; // Ej: FC-A 0001-0000001, REC-X 0001, ND, NC
    debit: number; // Debe (Suma saldo deudor)
    credit: number; // Haber (Resta saldo deudor)
    balance: number; // Saldo acumulado
    description: string;
}

// --- TIPOS CONTABILIDAD ---
export interface AccountingAccount {
  code: string;
  name: string;
  type: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'RESULTADO_POS' | 'RESULTADO_NEG';
  level: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  concept: string;
  debit: number;
  credit: number;
  details: { account: string, debit: number, credit: number }[];
}

// --- USUARIOS Y ROLES DINAMICOS ---
export interface Role {
  id: string;
  name: string;
  color: string; // Tailwind color class e.g. 'bg-red-100 text-red-800'
  permissions: string[]; // IDs of permissions enabled
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string; // Reference to Role ID
  active: boolean;
  lastLogin?: string;
  branchId?: string; // Sucursal asignada
}

// --- MODULO PEDIDOS (REPLENISHMENT) ---
export interface ReplenishmentItem {
  product: Product;
  quantity: number;
  selectedProviderId: string; // Allows changing from default provider
  selectedProviderName: string;
}

export interface ReplenishmentOrder {
  id: string;
  date: string;
  providerId: string;
  providerName: string;
  items: ReplenishmentItem[];
  status: 'DRAFT' | 'SENT' | 'RECEIVED';
  totalItems: number;
  estimatedCost: number;
}
