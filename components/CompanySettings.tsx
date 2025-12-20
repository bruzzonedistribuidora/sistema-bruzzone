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
  REPORTS = 'REPORTS',
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
  LABEL_PRINTING = 'LABEL_PRINTING',
  COMPANY_SETTINGS = 'COMPANY_SETTINGS',
  AFIP_CONFIG = 'AFIP_CONFIG',
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL'
}

export interface PaymentAccount {
    id: string;
    type: 'BANK' | 'VIRTUAL_WALLET';
    bankName: string; // Ej: Mercado Pago, Galicia
    alias: string;
    cbu: string;
    owner: string;
    qrImage?: string | null;
    active: boolean;
}

export interface CompanyConfig {
    name: string;
    fantasyName: string;
    cuit: string;
    taxCondition: string;
    iibb: string;
    startDate: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    email: string;
    web: string;
    logo: string | null;
    slogan: string;
    paymentAccounts: PaymentAccount[];
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

export interface PriceList {
    id: string;
    name: string;
    type: 'BASE' | 'CUSTOM';
    fixedMargin?: number;
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
  appliedPrice: number;
  priceListId?: string;
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
  relatedInvoice?: string;
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

export type OnlinePlatform = 'MERCADOLIBRE' | 'TIENDANUBE' | 'WOOCOMMERCE';
export type ShippingMethod = 'MERCADOENVIOS' | 'FLEX' | 'CORREO' | 'RETIRO_SUCURSAL';
export type OnlineOrderStatus = 'NEW' | 'PACKING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OnlineOrder {
    id: string;
    platformId: string;
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

export type DocumentType = 'FACTURA' | 'TICKET_INTERNO' | 'REMITO' | 'PRESUPUESTO' | 'ORDEN_PEDIDO';
export type PaperSize = 'A4' | 'TICKET_80MM' | 'A4_QUARTER' | 'CUSTOM';

export interface Position {
    x: number;
    y: number;
    visible: boolean;
}

export interface PrintTemplate {
    id: DocumentType;
    name: string;
    paperSize: PaperSize;
    customWidth?: number;
    customHeight?: number;
    headerText: string;
    subHeaderText: string;
    footerText: string;
    showLogo: boolean;
    showPrice: boolean;
    showTotal: boolean;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    positions: {
        logo: Position;
        header: Position;
        docInfo: Position;
        client: Position;
        table: Position;
        totals: Position;
        footer: Position;
        qr: Position;
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
  balance: number;
  limit: number;
  portalEnabled?: boolean;
  portalHash?: string;
  email?: string;
}

export interface Provider {
  id: string;
  name: string;
  cuit: string;
  contact: string;
  balance: number;
  defaultDiscounts: [number, number, number]; 
}

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
  items: number;
  details?: PurchaseItem[];
  total: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface CashRegister {
  id: string;
  name: string;
  balance: number;
  isOpen: boolean;
}

export interface Check {
  id: string;
  bank: string;
  number: string;
  amount: number;
  paymentDate: string;
  status: 'CARTERA' | 'DEPOSITADO' | 'RECHAZADO' | 'ENTREGADO';
  origin: string;
}

export interface TreasuryMovement {
    id: string;
    date: string;
    type: 'INCOME' | 'EXPENSE';
    subtype: 'VENTA' | 'COBRO_CTACTE' | 'PAGO_PROVEEDOR' | 'GASTO_VARIO' | 'RETIRO_SOCIO';
    paymentMethod: 'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CHEQUE' | 'ECHEQ';
    amount: number;
    description: string;
    cashRegisterId: string;
}

export interface CurrentAccountMovement {
    id: string;
    date: string;
    voucherType: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

export interface ReplenishmentItem {
    product: Product;
    quantity: number;
    selectedProviderId: string;
    selectedProviderName: string;
}

export interface ReplenishmentOrder {
    id: string;
    date: string;
    providerId: string;
    providerName: string;
    items: ReplenishmentItem[];
    status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
    totalItems: number;
    estimatedCost: number;
}

export interface JournalEntry {
    id: string;
    date: string;
    concept: string;
    debit: number;
    credit: number;
    details: {
        account: string;
        debit: number;
        credit: number;
    }[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    active: boolean;
    lastLogin: string;
    branchId: string;
}

export interface Role {
    id: string;
    name: string;
    color: string;
    permissions: string[];
}
