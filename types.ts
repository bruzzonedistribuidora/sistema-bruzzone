
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
  PUBLIC_PORTAL = 'PUBLIC_PORTAL'
}

export interface CreditInstallment {
  id: string;
  installments: number;
  surcharge: number; // Porcentaje de recargo
  label: string;
}

export interface PaymentSystem {
  id: string;
  name: string; // Ej: Mercado Pago, Galicia Nave, Fiserv
  debitSurcharge: number;
  creditInstallments: CreditInstallment[];
  ratesUrl?: string; // URL opcional para que la IA lea las tasas
}

export interface CompanyConfig {
  name: string;
  fantasyName?: string;
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
  paymentMethods?: string[]; 
  currencies?: CurrencyQuote[];
  loyalty?: LoyaltyConfig;
  paymentSystems?: PaymentSystem[]; // Lista de sistemas con sus cuotas
}

export type TaxCondition = 'Responsable Inscripto' | 'Monotributo' | 'Exento';

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

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ComboItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface Check {
  id: string;
  number: string;
  bank: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'DEPOSITED' | 'REJECTED';
}

export interface Purchase {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  type: string;
  items: number;
  total: number;
  status: 'PENDING' | 'PAID';
}

export interface PurchaseItem {
  productId?: string;
  descripcion: string;
  cantidad: number;
  costoUnitarioNeto: number;
  bonificacion: number;
  subtotal: number;
  matched: boolean;
}

export interface ProductProviderHistory {
  id: string;
  name: string;
  date: string;
  price: number;
}

// Fixed Product interface adding missing members used in Inventory.tsx and Purchases.tsx
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
  purchaseCurrency: 'ARS' | 'USD';
  saleCurrency: 'ARS' | 'USD';
  vatRate: 21.0 | 10.5 | 0 | 27.0;
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
  ecommerce: {
    mercadoLibre?: boolean;
    tiendaNube?: boolean;
    webPropia?: boolean;
  };
  lastProviders?: ProductProviderHistory[];
  isCombo: boolean;
  comboItems: ComboItem[];
}

export interface ProductStock { branchId: string; branchName: string; quantity: number; }
export interface Provider { id: string; name: string; cuit: string; contact: string; balance: number; defaultDiscounts: [number, number, number]; orderPhone?: string; orderEmail?: string; address?: string; currencyQuoteId?: string; }
export interface Branch { id: string; code: string; name: string; address: string; phone: string; manager: string; type: 'SUCURSAL' | 'DEPOSITO' | 'VIRTUAL'; active: boolean; }
export interface InvoiceItem { product: Product; quantity: number; appliedPrice: number; subtotal: number; priceListId?: string; }
export interface Client { id: string; name: string; cuit: string; phone: string; address: string; balance: number; limit: number; points: number; email?: string; portalHash?: string; portalEnabled?: boolean; nickname?: string; dni?: string; }
export interface PriceList { id: string; name: string; type: 'BASE' | 'CUSTOM'; fixedMargin?: number; active: boolean; }
export interface Budget { id: string; clientName: string; date: string; validUntil: string; items: InvoiceItem[]; total: number; status: 'OPEN' | 'CLOSED' | 'EXPIRED'; }
export interface Remito { id: string; clientId: string; clientName: string; items: RemitoItem[]; date: string; status: 'PENDING' | 'BILLED'; }
export interface RemitoItem { product: Product; quantity: number; historicalPrice: number; }
export interface CashRegister { id: string; name: string; balance: number; isOpen: boolean; }
export interface TreasuryMovement { id: string; date: string; type: 'INCOME' | 'EXPENSE'; subtype: string; paymentMethod: string; amount: number; description: string; cashRegisterId: string; }
export interface CurrencyQuote { id: string; name: string; code: string; value: number; lastUpdate: string; }
export interface CurrentAccountMovement { id: string; clientId: string; date: string; voucherType: string; description: string; debit: number; credit: number; balance: number; }
export interface PaymentAccount { id: string; type: 'BANK' | 'VIRTUAL_WALLET'; bankName: string; alias: string; cbu: string; owner: string; active: boolean; qrImage?: string | null; }
export interface LoyaltyConfig { enabled: boolean; pointsPerPeso: number; minPointsToRedeem: number; valuePerPoint: number; }

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

export type DocumentType = 'FACTURA' | 'REMITO' | 'PRESUPUESTO' | 'CLI_RESUMEN_CUENTA' | 'PROD_BARRAS';
export type PaperSize = 'A4' | 'A5' | 'TICKET_80MM' | 'ROLLO_62MM' | 'A4_QUARTER' | 'CUSTOM';

export interface Position {
  x: number;
  y: number;
  visible: boolean;
}

export interface TableColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width: number;
}

export interface PrintTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  orientation: 'VERTICAL' | 'HORIZONTAL';
  titleText: string;
  docLetterText: string;
  docCodeText: string;
  headerText: string;
  subHeaderText: string;
  footerText: string;
  totalsLabel: string;
  voucherPointOfSale: string;
  voucherNumber: string;
  voucherCuitEmisor: string;
  voucherIIBBEmisor: string;
  showPrices: boolean;
  showSkus: boolean;
  showBrands: boolean;
  showIvaColumn: boolean;
  positions: Record<string, Position>;
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
  shippingMethod: string;
  status: OnlineOrderStatus;
  labelPrinted: boolean;
  invoiced: boolean;
  trackingCode: string;
}

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

export interface EmployeeMovement {
  id: string;
  type: 'ADVANCE' | 'BONUS' | 'DEDUCTION' | 'SALARY';
  amount: number;
  description: string;
  month: string;
  date: string;
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
  notes: string;
  status: 'COMPLETED' | 'PENDING';
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
  targetSegment: 'ALL' | 'VIP' | 'INACTIVE';
  channel: 'WHATSAPP' | 'EMAIL';
  message: string;
  sentDate: string;
  reach: number;
}

export interface CreditNote {
  id: string;
  type: 'SALES' | 'PURCHASE';
  targetId: string;
  targetName: string;
  relatedVoucherId?: string;
  date: string;
  items: InvoiceItem[];
  reason: 'DEVOLUCION' | 'ERROR_PRECIO' | 'BONIFICACION' | 'OTROS';
  returnToStock: boolean;
  total: number;
}
