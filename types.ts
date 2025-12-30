
export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  MASS_PRODUCT_UPDATE = 'MASS_PRODUCT_UPDATE',
  POS = 'POS',
  REMITOS = 'REMITOS',
  PRESUPUESTOS = 'PRESUPUESTOS',
  CLIENTS = 'CLIENTS',
  CLIENT_BALANCES = 'CLIENT_BALANCES',
  PROVIDER_BALANCES = 'PROVIDER_BALANCES',
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
  STOCK_TRANSFERS = 'STOCK_TRANSFERS',
  CONFIG_PANEL = 'CONFIG_PANEL',
  CURRENCIES = 'CURRENCIES',
  MARKETING = 'MARKETING',
  PRICE_AUDIT = 'PRICE_AUDIT',
  CREDIT_NOTES = 'CREDIT_NOTES',
  PUBLIC_PORTAL = 'PUBLIC_PORTAL',
  SHOP = 'SHOP',
  ECOMMERCE_ADMIN = 'ECOMMERCE_ADMIN',
  INITIAL_IMPORT = 'INITIAL_IMPORT'
}

export type TaxCondition = 'Consumidor Final' | 'Responsable Inscripto' | 'Monotributo' | 'Exento';

export interface Product {
  id: string;
  internalCodes: string[];
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
  purchaseCurrency: string;
  saleCurrency: string;
  vatRate: number;
  listCost: number;
  discounts: number[];
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
  ecommerce: {
    mercadoLibre?: boolean;
    tiendaNube?: boolean;
    webPropia?: boolean;
    isPublished?: boolean;
    isOffer?: boolean;
    offerPrice?: number | null;
    isFeatured?: boolean;
    imageUrl?: string;
  };
  isCombo: boolean;
  comboItems: ComboItem[];
  lastProviders?: { name: string; date: string; price: number }[];
}

export interface ProductStock {
  branchId: string;
  branchName: string;
  quantity: number;
}

export interface ComboItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  cuit: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  defaultDiscounts: [number, number, number];
  taxCondition?: TaxCondition;
  orderPhone?: string;
  orderEmail?: string;
}

export interface Client {
  id: string;
  name: string;
  cuit: string;
  dni?: string;
  phone: string;
  address: string;
  balance: number;
  limit: number;
  points: number;
  number?: string;
  razonSocial?: string;
  fantasyName?: string;
  taxCondition?: TaxCondition;
  locality?: string;
  email?: string;
  description?: string;
  specialDiscount?: number;
  currency?: string;
  contactName?: string;
  portalEnabled?: boolean;
  portalHash?: string;
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

export interface InvoiceItem {
  product: Product;
  quantity: number;
  appliedPrice: number;
  subtotal: number;
}

export interface Remito {
  id: string;
  clientId: string;
  clientName: string;
  items: RemitoItem[];
  date: string;
  status: 'PENDING' | 'BILLED';
}

export interface RemitoItem {
  product: Product;
  quantity: number;
  historicalPrice: number;
}

export interface Budget {
  id: string;
  clientName: string;
  date: string;
  validUntil: string;
  items: InvoiceItem[];
  total: number;
  status: 'OPEN' | 'CLOSED';
}

export interface CashRegister {
  id: string;
  name: string;
  balance: number;
  isOpen: boolean;
}

export interface Check {
  id: string;
  number: string;
  bank: string;
  issuer: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'DEPOSITED' | 'REJECTED';
  type: 'FISICO' | 'ECHEQ';
}

export interface TreasuryMovement {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  subtype: string;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO';
  amount: number;
  description: string;
  cashRegisterId: string;
}

export interface Purchase {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  type: string;
  items: number;
  total: number;
  status: 'PENDING' | 'COMPLETED';
}

export interface PurchaseItem {
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface CurrentAccountMovement {
  id: string;
  clientId?: string;
  providerId?: string;
  date: string;
  voucherType: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CompanyConfig {
  name: string;
  fantasyName: string;
  cuit: string;
  taxCondition: TaxCondition;
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
  whatsappNumber: string;
  defaultProfitMargin: number;
  paymentAccounts: PaymentAccount[];
  paymentMethods: string[];
  paymentSystems: PaymentSystem[];
  loyalty?: LoyaltyConfig;
  currencies?: CurrencyQuote[];
}

export interface PaymentAccount {
  id: string;
  type: 'BANK' | 'VIRTUAL_WALLET';
  bankName: string;
  alias: string;
  cbu: string;
  owner: string;
  active: boolean;
  qrImage?: string;
}

export interface PaymentSystem {
  id: string;
  name: string;
  debitSurcharge: number;
  ratesUrl: string;
  creditInstallments: CreditInstallment[];
}

export interface CreditInstallment {
  id: string;
  installments: number;
  surcharge: number;
  label: string;
}

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerPeso: number;
  minPointsToRedeem: number;
  valuePerPoint: number;
}

export interface CurrencyQuote {
  id: string;
  name: string;
  code: string;
  value: number;
  lastUpdate: string;
}

export interface PriceList {
  id: string;
  name: string;
  type: 'BASE' | 'CUSTOM';
  fixedMargin?: number;
  active: boolean;
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
  notes?: string;
}

export interface StockTransfer {
  id: string;
  date: string;
  sourceBranchId: string;
  sourceBranchName: string;
  destBranchId: string;
  destBranchName: string;
  items: StockTransferItem[];
  notes: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

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

export type SalesOrderStatus = 'PENDING' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface PrintTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  orientation: 'VERTICAL' | 'HORIZONTAL';
  positions: Record<string, Position>;
}

export interface Position {
  x: number;
  y: number;
  visible: boolean;
}

export type DocumentType = 'FACTURA' | 'REMITO' | 'PRESUPUESTO' | 'CLI_RESUMEN_CUENTA' | 'PROD_BARRAS';
export type PaperSize = 'A4' | 'A5' | 'TICKET_80MM' | 'ROLLO_62MM' | 'A4_QUARTER' | 'CUSTOM';

export interface TableColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width: number;
}

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
  shippingMethod: string;
  status: OnlineOrderStatus;
  labelPrinted: boolean;
  invoiced: boolean;
  trackingCode: string;
}

export type OnlinePlatform = 'MERCADOLIBRE' | 'TIENDANUBE' | 'WEB_PROPIA';
export type OnlineOrderStatus = 'NEW' | 'PACKING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DailyExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  paymentMethod: string;
  type: 'EXPENSE' | 'INCOME';
  cashRegisterId: string;
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
  type: 'SALARY' | 'ADVANCE' | 'BONUS' | 'DEDUCTION';
  amount: number;
  description: string;
  month: string;
  date: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FIXED';
  value: number;
  validUntil: string;
  usedCount: number;
  active: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  targetSegment: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  message: string;
  sentDate: string;
  reach: number;
}

export interface CreditNote {
  id: string;
  targetId: string;
  targetName: string;
  relatedVoucherId?: string;
  date: string;
  type: 'SALES' | 'PURCHASE';
  items: InvoiceItem[];
  reason: 'DEVOLUCION' | 'ERROR_PRECIO' | 'BONIFICACION' | 'OTROS';
  returnToStock: boolean;
  total: number;
}
