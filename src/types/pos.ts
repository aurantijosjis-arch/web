export type CategoryId = 'all' | 'kopi' | 'non-kopi' | 'makanan' | 'snack' | 'botolan';

export type OrderType = 'Dine In' | 'Takeaway' | 'Delivery';

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Debit' | 'E-Wallet';

export type ScreenView = 'kasir' | 'produk' | 'riwayat' | 'shift' | 'laporan' | 'pengaturan';

export type ProductVisualKind =
  | 'espresso'
  | 'latte'
  | 'caramel-latte'
  | 'coldbrew'
  | 'concentrate'
  | 'matcha'
  | 'hojicha'
  | 'tea'
  | 'croissant'
  | 'pain-au-chocolat'
  | 'morning-bun'
  | 'pastry'
  | 'bowl'
  | 'sandwich'
  | 'beef-melt'
  | 'beans'
  | 'bottle';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Exclude<CategoryId, 'all'>;
  unit: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  taxable: boolean;
  active: boolean;
  customizable: boolean;
  visual: ProductVisualKind;
  promoLabel?: string;
  description?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'Restock' | 'Penjualan' | 'Penyesuaian' | 'Void';
  delta: number;
  resultingStock: number;
  note: string;
  createdAt: string;
  actor: string;
}

export interface ModifierChoice {
  group: string;
  label: string;
  priceDelta: number;
}

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  modifiers: ModifierChoice[];
  note?: string;
}

export interface DiscountOption {
  id: string;
  label: string;
  type: 'percent' | 'fixed';
  value: number;
}

export interface CustomerMember {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: 'Silver' | 'Gold';
}

export interface HeldOrder {
  id: string;
  ticketNumber: string;
  orderType: OrderType;
  tableOrCustomer: string;
  customerId?: string;
  items: CartItem[];
  discountId: string;
  createdAt: string;
  note?: string;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderType: OrderType;
  tableOrCustomer: string;
  customerName?: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  discountLabel?: string;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentProvider?: string;
  referenceCode?: string;
  tenderedAmount: number;
  changeAmount: number;
  status: 'Selesai' | 'Void';
}

export interface PettyCashEntry {
  id: string;
  label: string;
  type: 'in' | 'out';
  amount: number;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  address: string;
  phone: string;
  npwp: string;
  taxEnabled: boolean;
  taxRate: number;
  taxInclusive: boolean;
  autoRound: boolean;
  receiptHeader: string;
  receiptFooter: string;
  showLogoOnReceipt: boolean;
  showBarcodeOnReceipt: boolean;
  printerName: string;
  paperWidth: '58mm' | '80mm';
  autoPrint: boolean;
  openCashDrawer: boolean;
  requirePinForVoid: boolean;
  cashierName: string;
}
