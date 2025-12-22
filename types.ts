
export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  REMITOS = 'REMITOS',
  PRESUPUESTOS = 'PRESUPUESTOS',
  CLIENTS = 'CLIENTS',
  CLIENT_BALANCES = 'CLIENT_BALANCES',
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
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',
  DAILY_MOVEMENTS = 'DAILY_MOVEMENTS',
  EMPLOYEES = 'EMPLOYEES',
  STOCK_TRANSFERS = 'STOCK_TRANSFERS'
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  date: string;
  sourceBranchId: string;
  sourceBranchName: string;
  destBranchId: string;
  destBranchName: string;
  items: StockTransferItem[];
  notes?: string;
  status: 'COMPLETED' | 'CANCELLED';
}

export interface Check {
  id: string;
  type: 'FISICO' | 'ECHEQ';
  bank: string;
  number: string;
  amount: number;
  paymentDate: string; // Vencimiento
  entryDate: string;   // Ingreso
  status: 'CARTERA' | 'DEPOSITADO' | 'RECHAZADO' | 'ENTREGADO';
  origin: string;      // Cliente que lo dio
  destination?: string; // Proveedor a quien se le pagó
  issuerCuit?: string;
}

export interface DailyExpense {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: 'FIXED' | 'VARIABLE';
    paymentMethod: string;
    type: 'EXPENSE' | 'INCOME';
}

export interface Employee {
    id: string;
    name: string;
    position: string;
    baseSalary: number;
    dni: string;
    startDate: string;
    active: boolean;
    movements: EmployeeMovement[];
}

export interface EmployeeMovement {
    id: string;
    date: string;
    type: 'SALARY' | 'ADVANCE' | 'BONUS' | 'DEDUCTION';
    amount: number;
    description: string;
    month: string; // e.g., "2023-10"
}

export interface PaymentAccount {
    id: string;
    type: 'BANK' | 'VIRTUAL_WALLET';
    bankName: string; 
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
    // SMTP Config
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPassword?: string;
    smtpSSL?: boolean;
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

export interface CurrentAccountMovement {
    id: string;
    date: string;
    voucherType: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    clientId?: string;
    providerId?: string;
}

export interface ProductStock {
    branchId: string;
    branchName: string;
    quantity: number;
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
  ecommerce: any;
}

export interface InvoiceItem {
  product: Product;
  quantity: number;
  subtotal: number;
  appliedPrice: number;
  priceListId?: string;
}

export enum TaxCondition {
  RESPONSABLE_INSCRIPTO = 'Responsable Inscripto',
  MONOTRIBUTO = 'Monotributo',
  CONSUMIDOR_FINAL = 'Consumidor Final',
  EXENTO = 'Exento'
}

export interface DashboardStats {}

export interface PriceList {
  id: string;
  name: string;
  type: 'BASE' | 'CUSTOM';
  fixedMargin?: number;
  active: boolean;
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
  date: string;
  status: 'PENDING' | 'BILLED';
  items: RemitoItem[];
  relatedInvoice?: string;
}

export interface Provider {
  id: string;
  name: string;
  cuit: string;
  contact: string;
  balance: number;
  defaultDiscounts: [number, number, number];
  address?: string;
  authorizedPersonnel?: string[];
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
  status: 'DRAFT' | 'SENT';
  totalItems: number;
  estimatedCost: number;
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
  type: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'LIQUIDACION';
  items: number;
  total: number;
  status: 'PAID' | 'PENDING';
  details?: PurchaseItem[];
}

export interface Budget {
  id: string;
  clientName: string;
  date: string;
  validUntil: string;
  items: InvoiceItem[];
  total: number;
  status: 'OPEN' | 'EXPIRED' | 'BILLED';
}

export interface CashRegister {
  id: string;
  name: string;
  balance: number;
  isOpen: boolean;
}

export interface TreasuryMovement {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  subtype: 'VENTA' | 'COBRO_CTACTE' | 'PAGO_PROVEEDOR' | 'GASTO_VARIO' | 'RETIRO_SOCIO';
  paymentMethod: 'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CHEQUE' | 'ECHEQ' | 'CTACTE';
  amount: number;
  description: string;
  cashRegisterId: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  concept: string;
  debit: number;
  credit: number;
  details: any[];
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

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
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

export type SalesOrderStatus = 'PENDING' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface SalesOrder {
  id: string;
  clientName: string;
  date: string;
  priority: 'NORMAL' | 'URGENTE';
  status: SalesOrderStatus;
  items: InvoiceItem[];
  notes: string;
  total: number;
}

export type DocumentType = 'FACTURA' | 'TICKET_INTERNO' | 'REMITO' | 'PRESUPUESTO' | 'ORDEN_PEDIDO';
export type PaperSize = 'A4' | 'TICKET_80MM' | 'A4_QUARTER' | 'CUSTOM';

export interface Position {
  x: number;
  y: number;
  visible: boolean;
}

export interface PrintTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  customWidth?: number;
  customHeight?: number;
  showLogo: boolean;
  headerText: string;
  subHeaderText: string;
  footerText: string;
  showPrice: boolean;
  showTotal: boolean;
  fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  positions: {
    logo: Position;
    header: Position;
    docInfo: Position;
    client: Position;
    table: Position;
    footer: Position;
    totals: Position;
    qr: Position;
  };
}

export type OnlinePlatform = 'MERCADOLIBRE' | 'TIENDANUBE' | 'WOOCOMMERCE';
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
  shippingMethod: 'MERCADOENVIOS' | 'CORREO' | 'RETIRO_SUCURSAL';
  status: OnlineOrderStatus;
  labelPrinted: boolean;
  invoiced: boolean;
  trackingCode?: string;
}
