import { useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Delete,
  PauseCircle,
  Play,
  Printer,
  QrCode,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { CATEGORIES, CUSTOMERS, DISCOUNTS, TABLE_OPTIONS, formatRp } from '../data/posData';
import {
  CartItem,
  CategoryId,
  HeldOrder,
  OrderType,
  PaymentMethod,
  Product,
  StoreSettings,
  Transaction,
} from '../types/pos';
import { BarcodeSvg, ProductVisual, QrMatrixSvg } from './ProductVisual';

interface KasirScreenProps {
  products: Product[];
  cart: CartItem[];
  heldOrders: HeldOrder[];
  orderType: OrderType;
  tableOrCustomer: string;
  selectedCustomerId?: string;
  discountId: string;
  nextOrderNumber: string;
  settings: StoreSettings;
  onSelectOrderType: (type: OrderType) => void;
  onSelectTable: (table: string) => void;
  onSelectCustomer: (customerId?: string) => void;
  onSelectDiscount: (discountId: string) => void;
  onQuickAddProduct: (product: Product) => void;
  onOpenCustomizeNew: (product: Product) => void;
  onEditCartItem: (item: CartItem) => void;
  onUpdateQty: (lineId: string, delta: number) => void;
  onRemoveLine: (lineId: string) => void;
  onClearCart: () => void;
  onHoldOrder: () => void;
  onResumeHeldOrder: (heldId: string) => void;
  onVoidHeldOrder: (heldId: string) => void;
  onCompletePayment: (payload: {
    paymentMethod: PaymentMethod;
    paymentProvider?: string;
    referenceCode?: string;
    tenderedAmount: number;
    changeAmount: number;
  }) => Transaction;
}

const CARD_PROVIDERS = ['BCA Debit', 'Mandiri Debit', 'Visa / Mastercard', 'BRI EDC'];
const EWALLET_PROVIDERS = ['GoPay', 'OVO', 'Dana', 'ShopeePay'];

export function KasirScreen({
  products,
  cart,
  heldOrders,
  orderType,
  tableOrCustomer,
  selectedCustomerId,
  discountId,
  nextOrderNumber,
  settings,
  onSelectOrderType,
  onSelectTable,
  onSelectCustomer,
  onSelectDiscount,
  onQuickAddProduct,
  onOpenCustomizeNew,
  onEditCartItem,
  onUpdateQty,
  onRemoveLine,
  onClearCart,
  onHoldOrder,
  onResumeHeldOrder,
  onVoidHeldOrder,
  onCompletePayment,
}: KasirScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [showMobileSlip, setShowMobileSlip] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Integrated payment & numpad state directly inside Kasir right pane
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [cashInput, setCashInput] = useState<string>('0');
  const [cardProvider, setCardProvider] = useState<string>(CARD_PROVIDERS[0]);
  const [ewalletProvider, setEwalletProvider] = useState<string>(EWALLET_PROVIDERS[0]);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const selectedCustomer = CUSTOMERS.find((c) => c.id === selectedCustomerId);

  const cartQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
    }
    return map;
  }, [cart]);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeProducts.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [activeProducts, activeCategory, searchQuery]);

  const totalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );

  const activeDiscount = DISCOUNTS.find((d) => d.id === discountId) ?? DISCOUNTS[0];
  const discountAmount =
    activeDiscount.type === 'percent'
      ? Math.round((subtotal * activeDiscount.value) / 100)
      : Math.min(subtotal, activeDiscount.value);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = settings.taxEnabled ? settings.taxRate / 100 : 0;
  const taxAmount = settings.taxInclusive
    ? Math.round(taxableAmount - taxableAmount / (1 + taxRate))
    : Math.round(taxableAmount * taxRate);
  const rawTotal = settings.taxInclusive ? taxableAmount : taxableAmount + taxAmount;
  const grandTotal = settings.autoRound ? Math.round(rawTotal / 100) * 100 : rawTotal;

  const numericCash = Number(cashInput || '0');
  const changeAmount = numericCash - grandTotal;
  const canPayCash = cart.length > 0 && numericCash >= grandTotal;

  const appendNumpad = (val: string) => {
    setCashInput((prev) => {
      const next = prev === '0' ? val : `${prev}${val}`;
      if (next.length > 9) return prev;
      return next;
    });
  };

  const handleBackspace = () => {
    setCashInput((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const handleProcessCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Tunai') {
      if (numericCash < grandTotal) return;
      const tx = onCompletePayment({
        paymentMethod: 'Tunai',
        tenderedAmount: numericCash,
        changeAmount: Math.max(0, numericCash - grandTotal),
      });
      setCashInput('0');
      setShowMobileSlip(false);
      setCompletedTx(tx);
      return;
    }

    if (paymentMethod === 'QRIS') {
      const tx = onCompletePayment({
        paymentMethod: 'QRIS',
        paymentProvider: 'QRIS Dinamis',
        referenceCode: `QRS-${Date.now().toString().slice(-8)}`,
        tenderedAmount: grandTotal,
        changeAmount: 0,
      });
      setShowMobileSlip(false);
      setCompletedTx(tx);
      return;
    }

    if (paymentMethod === 'Debit') {
      const tx = onCompletePayment({
        paymentMethod: 'Debit',
        paymentProvider: cardProvider,
        referenceCode: `EDC-${Date.now().toString().slice(-6)}`,
        tenderedAmount: grandTotal,
        changeAmount: 0,
      });
      setShowMobileSlip(false);
      setCompletedTx(tx);
      return;
    }

    const tx = onCompletePayment({
      paymentMethod: 'E-Wallet',
      paymentProvider: ewalletProvider,
      referenceCode: `WAL-${Date.now().toString().slice(-6)}`,
      tenderedAmount: grandTotal,
      changeAmount: 0,
    });
    setShowMobileSlip(false);
    setCompletedTx(tx);
  };

  const renderOrderAndNumpadPane = (isDrawer = false) => (
    <div className="flex h-full flex-col bg-[#FFFFFF]">
      {/* Order Slip Header */}
      <div className="border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="tnum font-mono text-[11px] font-bold text-[#64748B]">
              {nextOrderNumber}
            </p>
            <h2 className="text-sm font-bold text-[#0F172A]">Keranjang Pesanan</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowHeldModal(true)}
              className="tnum flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-bold text-[#334155] hover:border-[#CBD5E1]"
            >
              <PauseCircle className="h-3.5 w-3.5 text-[#B45309]" />
              <span>Hold ({heldOrders.length})</span>
            </button>

            {isDrawer && (
              <button
                type="button"
                onClick={() => setShowMobileSlip(false)}
                aria-label="Tutup keranjang"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#334155]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Order Type & Table / Member */}
        <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-[#F1F5F9] p-1">
          {(['Dine In', 'Takeaway', 'Delivery'] as OrderType[]).map((type) => {
            const active = orderType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelectOrderType(type)}
                className={`h-8 rounded-md text-xs font-semibold transition-colors ${
                  active ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <select
            aria-label="Pilih meja atau kasir"
            value={tableOrCustomer}
            onChange={(e) => onSelectTable(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 text-xs font-semibold text-[#0F172A] focus:border-2 focus:border-[#10B981] focus:outline-none"
          >
            {TABLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowCustomerPicker((v) => !v)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold ${
              selectedCustomer
                ? 'border-[#6366F1]/40 bg-[#EEF2FF] text-[#4338CA]'
                : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155]'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span className="max-w-[96px] truncate">
              {selectedCustomer ? selectedCustomer.name : 'Member'}
            </span>
          </button>
        </div>

        {showCustomerPicker && (
          <div className="mt-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Pilih Member Loyalitas
              </span>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomer(undefined);
                    setShowCustomerPicker(false);
                  }}
                  className="text-[11px] font-bold text-[#DC2626]"
                >
                  Lepas
                </button>
              )}
            </div>
            <div className="space-y-1">
              {CUSTOMERS.map((cust) => (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => {
                    onSelectCustomer(cust.id);
                    setShowCustomerPicker(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs ${
                    cust.id === selectedCustomerId
                      ? 'bg-[#EEF2FF] font-bold text-[#4338CA]'
                      : 'bg-[#FFFFFF] text-[#334155] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span>
                    {cust.name} ({cust.tier})
                  </span>
                  <span className="tnum text-[#64748B]">{cust.points} poin</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Line Items */}
      <div className="pos-scroll flex-1 overflow-y-auto px-4 py-2.5">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center">
            <ShoppingBag className="mb-2 h-8 w-8 text-[#CBD5E1]" />
            <p className="text-xs font-bold text-[#334155]">Keranjang masih kosong</p>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              Klik kartu menu di kiri untuk menambah pesanan.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={item.lineId}
                  className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#0F172A]">{item.name}</p>
                      {item.modifiers.length > 0 && (
                        <p className="truncate text-[11px] text-[#64748B]">
                          {item.modifiers.map((m) => m.label).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="tnum shrink-0 text-xs font-extrabold text-[#0F172A]">
                      {formatRp(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.lineId, -1)}
                          aria-label={`Kurangi ${item.name}`}
                          className="flex h-7 w-7 items-center justify-center text-sm font-bold text-[#334155] hover:bg-[#E2E8F0]"
                        >
                          -
                        </button>
                        <span className="tnum w-7 text-center text-xs font-bold text-[#0F172A]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.lineId, 1)}
                          aria-label={`Tambah ${item.name}`}
                          className="flex h-7 w-7 items-center justify-center text-sm font-bold text-[#334155] hover:bg-[#E2E8F0]"
                        >
                          +
                        </button>
                      </div>
                      {product?.customizable && (
                        <button
                          type="button"
                          onClick={() => onEditCartItem(item)}
                          className="h-7 rounded-md border border-[#E2E8F0] px-2 text-[11px] font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                        >
                          Ubah
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveLine(item.lineId)}
                      aria-label={`Hapus ${item.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary + Inline Payment & Numpad Dock (KassaPOS Signature) */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        {/* Promo & Subtotal/Tax/Total */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#64748B]">Diskon</span>
            <select
              aria-label="Pilih promo atau diskon"
              value={discountId}
              onChange={(e) => onSelectDiscount(e.target.value)}
              className="h-7 rounded-md border border-[#CBD5E1] bg-[#FFFFFF] px-2 text-[11px] font-semibold text-[#334155]"
            >
              {DISCOUNTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between text-[#64748B]">
            <span>Subtotal ({totalItemsCount} item)</span>
            <span className="tnum font-semibold text-[#334155]">{formatRp(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[#B45309]">
              <span>Potongan</span>
              <span className="tnum font-semibold">-{formatRp(discountAmount)}</span>
            </div>
          )}
          {settings.taxEnabled && (
            <div className="flex justify-between text-[#64748B]">
              <span>PB1 ({settings.taxRate}%)</span>
              <span className="tnum font-semibold text-[#334155]">{formatRp(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-[#E2E8F0] pt-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Total Tagihan
            </span>
            <span className="tnum text-2xl font-extrabold tracking-tight text-[#0F172A]">
              {formatRp(grandTotal)}
            </span>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
          {(
            [
              { id: 'Tunai', Icon: Banknote },
              { id: 'QRIS', Icon: QrCode },
              { id: 'Debit', Icon: CreditCard },
              { id: 'E-Wallet', Icon: Smartphone },
            ] as const
          ).map(({ id, Icon }) => {
            const active = paymentMethod === id;
            const isDigital = id !== 'Tunai';
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPaymentMethod(id)}
                className={`flex h-9 items-center justify-center gap-1 rounded-lg border text-[11px] font-bold transition-colors ${
                  active
                    ? isDigital
                      ? 'border-[#6366F1] bg-[#EEF2FF] text-[#4338CA]'
                      : 'border-[#10B981] bg-[#D1FAE5] text-[#005236]'
                    : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{id}</span>
              </button>
            );
          })}
        </div>

        {/* Inline Numpad when Tunai is selected */}
        {paymentMethod === 'Tunai' && (
          <div className="mt-2.5 space-y-2">
            {/* Tendered & Change Strip */}
            <div className="flex items-center justify-between rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-1.5">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#64748B]">Uang Diterima</p>
                <p className="tnum text-base font-extrabold text-[#0F172A]">
                  {formatRp(numericCash)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-[#64748B]">
                  {changeAmount >= 0 ? 'Kembalian' : 'Kurang'}
                </p>
                <p
                  className={`tnum text-sm font-extrabold ${
                    changeAmount >= 0 ? 'text-[#006C49]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatRp(Math.abs(changeAmount))}
                </p>
              </div>
            </div>

            {/* Quick Cash Fast-Picks */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={grandTotal <= 0}
                onClick={() => setCashInput(String(grandTotal))}
                className="tnum h-8 rounded-lg bg-[#D1FAE5] text-[11px] font-bold text-[#005236] hover:bg-[#A7F3D0] disabled:opacity-50"
              >
                Uang Pas
              </button>
              <button
                type="button"
                onClick={() => setCashInput('50000')}
                className="tnum h-8 rounded-lg bg-[#E2E8F0]/70 text-[11px] font-bold text-[#334155] hover:bg-[#CBD5E1]"
              >
                Rp 50.000
              </button>
              <button
                type="button"
                onClick={() => setCashInput('100000')}
                className="tnum h-8 rounded-lg bg-[#E2E8F0]/70 text-[11px] font-bold text-[#334155] hover:bg-[#CBD5E1]"
              >
                Rp 100.000
              </button>
            </div>

            {/* Compact 3x4 Numpad */}
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => appendNumpad(key)}
                  className="tnum flex h-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-sm font-bold text-[#0F172A] transition-transform hover:border-[#CBD5E1] active:scale-[0.97]"
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Hapus digit"
                className="flex h-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] text-[#334155] active:scale-[0.97]"
              >
                <Delete className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Inline QRIS Preview */}
        {paymentMethod === 'QRIS' && (
          <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-3">
            <QrMatrixSvg seed={`${nextOrderNumber}-${grandTotal}`} sizePx={92} />
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4338CA]">
                QRIS Dinamis
              </span>
              <p className="mt-1 truncate text-xs font-bold text-[#0F172A]">
                {settings.storeName}
              </p>
              <p className="tnum mt-0.5 text-sm font-extrabold text-[#4338CA]">
                {formatRp(grandTotal)}
              </p>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                Scan kode lalu klik Bayar untuk konfirmasi.
              </p>
            </div>
          </div>
        )}

        {/* Inline Debit / E-Wallet Picker */}
        {(paymentMethod === 'Debit' || paymentMethod === 'E-Wallet') && (
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {(paymentMethod === 'Debit' ? CARD_PROVIDERS : EWALLET_PROVIDERS).map((prov) => {
              const active =
                paymentMethod === 'Debit' ? cardProvider === prov : ewalletProvider === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() =>
                    paymentMethod === 'Debit' ? setCardProvider(prov) : setEwalletProvider(prov)
                  }
                  className={`h-9 rounded-lg border px-2 text-xs font-semibold ${
                    active
                      ? 'border-[#6366F1] bg-[#EEF2FF] text-[#4338CA]'
                      : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155]'
                  }`}
                >
                  {prov}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              onClearCart();
              setCashInput('0');
            }}
            className="h-12 rounded-lg bg-[#FEE2E2] px-3 text-xs font-bold text-[#DC2626] hover:bg-[#FECACA] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onHoldOrder}
            className="h-12 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 text-xs font-bold text-[#334155] hover:bg-[#F1F5F9] disabled:text-[#94A3B8]"
          >
            Tahan
          </button>
          <button
            type="button"
            disabled={
              cart.length === 0 || (paymentMethod === 'Tunai' && !canPayCash)
            }
            onClick={handleProcessCheckout}
            className={`tnum flex h-12 flex-1 items-center justify-center rounded-lg px-4 text-sm font-bold text-[#FFFFFF] transition-colors disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B] ${
              paymentMethod === 'Tunai'
                ? 'bg-[#10B981] hover:bg-[#059669]'
                : 'bg-[#6366F1] hover:bg-[#4F46E5]'
            }`}
          >
            {cart.length === 0
              ? 'Keranjang Kosong'
              : paymentMethod === 'Tunai' && !canPayCash
                ? 'Masukkan Nominal'
                : `Bayar · ${formatRp(grandTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px]">
      {/* Left Column: Catalog Grid */}
      <section className="flex flex-col overflow-hidden px-4 pb-20 pt-4 sm:px-6 lg:pb-5">
        {/* Search & Category Bar */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu atau scan kode SKU..."
                aria-label="Cari produk kasir"
                className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] pl-10 pr-4 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-2 focus:border-[#10B981] focus:outline-none"
              />
            </div>
            <span className="tnum hidden text-xs font-semibold text-[#64748B] sm:block">
              {filteredProducts.length} menu tersedia
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Kategori menu"
            className="flex items-center gap-2 overflow-x-auto pb-1"
          >
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`h-10 shrink-0 whitespace-nowrap rounded-lg border px-4 text-xs font-bold transition-colors sm:text-sm ${
                    active
                      ? 'border-[#10B981] bg-[#10B981] text-[#FFFFFF]'
                      : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:border-[#CBD5E1]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Cards */}
        <div className="pos-scroll mt-4 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const countInCart = cartQtyByProduct.get(product.id) ?? 0;
              const isSoldOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= product.lowStockThreshold;
              const inCart = countInCart > 0;

              return (
                <div
                  key={product.id}
                  className={`elevation-1 elevation-interactive relative flex flex-col justify-between rounded-2xl bg-[#FFFFFF] p-3 transition-all ${
                    isSoldOut
                      ? 'border border-[#E2E8F0] opacity-65'
                      : inCart
                        ? 'border-2 border-[#10B981]'
                        : 'border border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  {inCart && (
                    <span className="tnum absolute -right-1.5 -top-1.5 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#10B981] px-2 text-xs font-extrabold text-[#FFFFFF] shadow-sm">
                      {countInCart}
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => onQuickAddProduct(product)}
                    className="group flex flex-1 flex-col text-left disabled:cursor-not-allowed"
                  >
                    <div className="relative w-full">
                      <ProductVisual
                        kind={product.visual}
                        alt={product.name}
                        soldOut={isSoldOut}
                        variant="card"
                      />
                      {product.promoLabel && !isSoldOut && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#B45309]">
                          {product.promoLabel}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-1">
                      <span className="tnum font-mono text-[10px] font-semibold text-[#64748B]">
                        {product.sku}
                      </span>
                      {isSoldOut ? (
                        <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#64748B]">
                          Habis
                        </span>
                      ) : isLow ? (
                        <span className="tnum rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
                          Sisa {product.stock}
                        </span>
                      ) : (
                        <span className="tnum rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-bold text-[#005236]">
                          Stok {product.stock}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-[#0F172A]">
                      {product.name}
                    </h3>
                  </button>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2.5">
                    <span className="tnum text-sm font-extrabold text-[#0F172A]">
                      {formatRp(product.price)}
                    </span>
                    {product.customizable && !isSoldOut && (
                      <button
                        type="button"
                        onClick={() => onOpenCustomizeNew(product)}
                        aria-label={`Opsi ${product.name}`}
                        className="flex h-7 items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-[11px] font-semibold text-[#334155] hover:border-[#CBD5E1]"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        <span>Opsi</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Right Column: Desktop Persistent Cart + Payment/Numpad */}
      <aside className="hidden overflow-hidden border-l border-[#E2E8F0] bg-[#FFFFFF] lg:block">
        {renderOrderAndNumpadPane(false)}
      </aside>

      {/* Mobile Compact Sticky Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#CBD5E1] bg-[#FFFFFF] px-4 py-2.5 shadow-lg lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowMobileSlip(true)}
            className="flex min-h-[44px] flex-1 items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-left"
          >
            <div>
              <p className="tnum text-[11px] font-semibold text-[#64748B]">
                {totalItemsCount} item · {tableOrCustomer}
              </p>
              <p className="tnum text-sm font-extrabold text-[#0F172A]">{formatRp(grandTotal)}</p>
            </div>
            <span className="text-xs font-bold text-[#006C49]">Lihat &amp; Bayar</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Up Order + Payment Drawer */}
      {showMobileSlip && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-[#0F172A]/45 backdrop-blur-[4px] lg:hidden">
          <div className="h-[92vh] w-full overflow-hidden rounded-t-3xl border-t border-[#CBD5E1] bg-[#FFFFFF]">
            {renderOrderAndNumpadPane(true)}
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {showHeldModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Daftar pesanan ditahan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[4px]"
        >
          <div className="elevation-3 flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#CBD5E1] bg-[#FFFFFF]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Pesanan Ditahan (Hold)</h2>
                <p className="text-xs text-[#64748B]">
                  Lanjutkan tiket meja atau takeaway kembali ke keranjang kasir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHeldModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#334155]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="pos-scroll flex-1 space-y-3 overflow-y-auto p-6">
              {heldOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#64748B]">
                  Tidak ada pesanan yang sedang ditahan.
                </p>
              ) : (
                heldOrders.map((h) => {
                  const sub = h.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="tnum font-mono text-xs font-bold text-[#64748B]">
                            {h.ticketNumber}
                          </span>
                          <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
                            {h.orderType}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-[#0F172A]">
                          {h.tableOrCustomer}
                        </p>
                        <p className="tnum text-xs text-[#64748B]">
                          {h.items.length} baris · {formatRp(sub)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onVoidHeldOrder(h.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626]"
                          aria-label={`Hapus ${h.ticketNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onResumeHeldOrder(h.id);
                            setShowHeldModal(false);
                          }}
                          className="flex h-10 items-center gap-1.5 rounded-lg bg-[#10B981] px-4 text-xs font-bold text-[#FFFFFF] hover:bg-[#059669]"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Lanjutkan
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Struk Pembayaran Modal */}
      {completedTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Struk Pembayaran Selesai"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[4px]"
        >
          <div className="elevation-3 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#CBD5E1] bg-[#FFFFFF]">
            <div className="border-b border-[#E2E8F0] bg-[#D1FAE5]/40 px-6 py-4 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#10B981] text-[#FFFFFF]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0F172A]">Pembayaran Berhasil</h2>
              <p className="tnum text-xs font-semibold text-[#005236]">
                {completedTx.orderNumber} · {completedTx.paymentMethod}
              </p>
            </div>

            <div className="pos-scroll flex-1 overflow-y-auto px-6 py-4">
              <div
                id="printable-receipt"
                className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-xs text-[#0F172A]"
              >
                <div className="border-b border-dashed border-[#CBD5E1] pb-3 text-center">
                  <p className="text-sm font-extrabold uppercase">{settings.storeName}</p>
                  <p className="text-[11px] text-[#64748B]">{settings.address}</p>
                  <p className="tnum mt-1 text-[11px] text-[#64748B]">
                    {new Date(completedTx.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                <div className="my-2.5 flex justify-between text-[11px] text-[#334155]">
                  <span>
                    {completedTx.orderType} · {completedTx.tableOrCustomer}
                  </span>
                  <span>Kasir: {completedTx.cashierName}</span>
                </div>

                <div className="space-y-1.5 border-y border-dashed border-[#CBD5E1] py-2.5">
                  {completedTx.items.map((item) => (
                    <div key={item.lineId}>
                      <div className="flex justify-between font-semibold">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="tnum">{formatRp(item.unitPrice * item.quantity)}</span>
                      </div>
                      {item.modifiers.length > 0 && (
                        <p className="text-[10px] text-[#64748B]">
                          {item.modifiers.map((m) => m.label).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[#334155]">
                    <span>Subtotal</span>
                    <span className="tnum font-semibold">{formatRp(completedTx.subtotal)}</span>
                  </div>
                  {completedTx.discountAmount > 0 && (
                    <div className="flex justify-between text-[#B45309]">
                      <span>Diskon ({completedTx.discountLabel})</span>
                      <span className="tnum font-semibold">
                        -{formatRp(completedTx.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#334155]">
                    <span>Pajak PB1</span>
                    <span className="tnum font-semibold">{formatRp(completedTx.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E2E8F0] pt-1.5 text-sm font-extrabold">
                    <span>Total</span>
                    <span className="tnum">{formatRp(completedTx.total)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[#334155]">
                    <span>Bayar ({completedTx.paymentMethod})</span>
                    <span className="tnum font-semibold">
                      {formatRp(completedTx.tenderedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[#006C49]">
                    <span>Kembalian</span>
                    <span className="tnum">{formatRp(completedTx.changeAmount)}</span>
                  </div>
                </div>

                {settings.showBarcodeOnReceipt && (
                  <div className="mt-4 border-t border-dashed border-[#CBD5E1] pt-3">
                    <BarcodeSvg code={completedTx.orderNumber} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-[#E2E8F0] px-6 py-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-4 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
              >
                <Printer className="h-4 w-4" />
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => setCompletedTx(null)}
                className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#10B981] px-5 text-sm font-bold text-[#FFFFFF] hover:bg-[#059669]"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
