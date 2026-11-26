import { useEffect, useMemo, useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { KasirScreen } from './components/KasirScreen';
import { LaporanScreen } from './components/LaporanScreen';
import { ModifierModal } from './components/ModifierModal';
import { PengaturanScreen } from './components/PengaturanScreen';
import { ProductModal } from './components/ProductModal';
import { ProdukScreen } from './components/ProdukScreen';
import { RiwayatScreen } from './components/RiwayatScreen';
import { ShiftScreen } from './components/ShiftScreen';
import { Sidebar } from './components/Sidebar';
import {
  CUSTOMERS,
  DEFAULT_SETTINGS,
  DISCOUNTS,
  INITIAL_HELD_ORDERS,
  INITIAL_PETTY_CASH,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_TRANSACTIONS,
} from './data/posData';
import {
  CartItem,
  HeldOrder,
  ModifierChoice,
  OrderType,
  PaymentMethod,
  PettyCashEntry,
  Product,
  ScreenView,
  StockMovement,
  StoreSettings,
  Transaction,
} from './types/pos';

const STORAGE_KEYS = {
  products: 'kassapos_products_v3',
  movements: 'kassapos_movements_v2',
  held: 'kassapos_held_v2',
  transactions: 'kassapos_tx_v2',
  cart: 'kassapos_cart_v2',
  pettyCash: 'kassapos_petty_v2',
  settings: 'kasir_settings_v3',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenView>('kasir');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS),
  );
  const [movements, setMovements] = useState<StockMovement[]>(() =>
    readStorage<StockMovement[]>(STORAGE_KEYS.movements, INITIAL_STOCK_MOVEMENTS),
  );
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() =>
    readStorage<HeldOrder[]>(STORAGE_KEYS.held, INITIAL_HELD_ORDERS),
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    readStorage<Transaction[]>(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS),
  );
  const [pettyCash, setPettyCash] = useState<PettyCashEntry[]>(() =>
    readStorage<PettyCashEntry[]>(STORAGE_KEYS.pettyCash, INITIAL_PETTY_CASH),
  );
  const [settings, setSettings] = useState<StoreSettings>(() =>
    readStorage<StoreSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  );

  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [
      {
        lineId: 'init-line-1',
        productId: 'prd-1',
        name: 'Kopi Susu Gula Aren',
        basePrice: 28000,
        unitPrice: 28000,
        quantity: 2,
        modifiers: [{ group: 'Suhu', label: 'Iced', priceDelta: 0 }],
      },
      {
        lineId: 'init-line-2',
        productId: 'prd-8',
        name: 'French Butter Croissant',
        basePrice: 29000,
        unitPrice: 29000,
        quantity: 1,
        modifiers: [],
      },
    ]),
  );

  const [orderType, setOrderType] = useState<OrderType>('Dine In');
  const [tableOrCustomer, setTableOrCustomer] = useState<string>('Meja 03');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [discountId, setDiscountId] = useState<string>('none');

  // Modals
  const [modifierModalState, setModifierModalState] = useState<
    | { mode: 'add'; product: Product }
    | { mode: 'edit'; product: Product; cartItem: CartItem }
    | null
  >(null);
  const [productModalState, setProductModalState] = useState<
    { open: true; product: Product | null } | { open: false }
  >({ open: false });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.movements, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.held, JSON.stringify(heldOrders));
  }, [heldOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pettyCash, JSON.stringify(pettyCash));
  }, [pettyCash]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.lowStockThreshold).length,
    [products],
  );

  const getProductCartQty = (productId: string) =>
    cart
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

  const handleQuickAddProduct = (product: Product) => {
    if (product.stock <= 0) return;
    const currentInCart = getProductCartQty(product.id);
    if (currentInCart >= product.stock) {
      showToast(`Stok tersisa ${product.stock} untuk ${product.name}`);
      return;
    }

    const defaultModifiers: ModifierChoice[] = product.customizable
      ? [{ group: 'Suhu', label: 'Iced', priceDelta: 0 }]
      : [];

    setCart((prev) => {
      const matchIndex = prev.findIndex(
        (line) =>
          line.productId === product.id &&
          !line.note &&
          JSON.stringify(line.modifiers) === JSON.stringify(defaultModifiers),
      );
      if (matchIndex >= 0) {
        return prev.map((line, idx) =>
          idx === matchIndex ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          name: product.name,
          basePrice: product.price,
          unitPrice: product.price,
          quantity: 1,
          modifiers: defaultModifiers,
        },
      ];
    });
  };

  const handleConfirmModifiers = (
    modifiers: ModifierChoice[],
    note: string,
    quantity: number,
  ) => {
    if (!modifierModalState) return;
    const { product } = modifierModalState;
    const delta = modifiers.reduce((s, m) => s + m.priceDelta, 0);
    const unitPrice = product.price + delta;

    if (modifierModalState.mode === 'add') {
      const currentQty = getProductCartQty(product.id);
      const allowedQty = Math.min(quantity, Math.max(0, product.stock - currentQty));
      if (allowedQty <= 0) {
        showToast(`Batas stok tercapai untuk ${product.name}`);
        setModifierModalState(null);
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          name: product.name,
          basePrice: product.price,
          unitPrice,
          quantity: allowedQty,
          modifiers,
          note: note || undefined,
        },
      ]);
    } else {
      const targetId = modifierModalState.cartItem.lineId;
      setCart((prev) =>
        prev.map((line) =>
          line.lineId === targetId
            ? {
                ...line,
                unitPrice,
                quantity,
                modifiers,
                note: note || undefined,
              }
            : line,
        ),
      );
    }

    setModifierModalState(null);
  };

  const handleUpdateQty = (lineId: string, delta: number) => {
    const target = cart.find((l) => l.lineId === lineId);
    if (!target) return;
    const prod = products.find((p) => p.id === target.productId);
    if (delta > 0 && prod && getProductCartQty(prod.id) >= prod.stock) {
      showToast(`Maksimal stok (${prod.stock}) untuk ${prod.name}`);
      return;
    }

    setCart((prev) =>
      prev
        .map((line) =>
          line.lineId === lineId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const handleRemoveLine = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.lineId !== lineId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountId('none');
    setSelectedCustomerId(undefined);
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const nextTicketNum = `HLD-${String(heldOrders.length + 16).padStart(3, '0')}`;
    const newHold: HeldOrder = {
      id: `hold-${Date.now()}`,
      ticketNumber: nextTicketNum,
      orderType,
      tableOrCustomer,
      customerId: selectedCustomerId,
      items: cart,
      discountId,
      createdAt: new Date().toISOString(),
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    handleClearCart();
    showToast(`Pesanan ditahan sebagai ${nextTicketNum}`);
  };

  const handleResumeHeldOrder = (heldId: string) => {
    const target = heldOrders.find((h) => h.id === heldId);
    if (!target) return;

    if (cart.length > 0) {
      const autoHold: HeldOrder = {
        id: `hold-${Date.now()}`,
        ticketNumber: `HLD-${String(heldOrders.length + 16).padStart(3, '0')}`,
        orderType,
        tableOrCustomer,
        customerId: selectedCustomerId,
        items: cart,
        discountId,
        createdAt: new Date().toISOString(),
      };
      setHeldOrders((prev) => [autoHold, ...prev.filter((h) => h.id !== heldId)]);
    } else {
      setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
    }

    setCart(target.items);
    setOrderType(target.orderType);
    setTableOrCustomer(target.tableOrCustomer);
    setSelectedCustomerId(target.customerId);
    setDiscountId(target.discountId);
    showToast(`${target.ticketNumber} dilanjutkan ke keranjang`);
  };

  const handleVoidHeldOrder = (heldId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
    showToast('Pesanan ditahan dihapus');
  };

  const nextOrderNumber = useMemo(() => {
    const highest = transactions.reduce((max, t) => {
      const num = parseInt(t.orderNumber.replace('ORD-', ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 2044);
    return `ORD-${highest + 1}`;
  }, [transactions]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const activeDiscount = DISCOUNTS.find((d) => d.id === discountId) ?? DISCOUNTS[0];
    const discountAmount =
      activeDiscount.type === 'percent'
        ? Math.round((subtotal * activeDiscount.value) / 100)
        : Math.min(subtotal, activeDiscount.value);
    const taxable = Math.max(0, subtotal - discountAmount);
    const rate = settings.taxEnabled ? settings.taxRate / 100 : 0;
    const taxAmount = settings.taxInclusive
      ? Math.round(taxable - taxable / (1 + rate))
      : Math.round(taxable * rate);
    const rawTotal = settings.taxInclusive ? taxable : taxable + taxAmount;
    const total = settings.autoRound ? Math.round(rawTotal / 100) * 100 : rawTotal;
    return {
      subtotal,
      discountLabel: discountAmount > 0 ? activeDiscount.label : undefined,
      discountAmount,
      taxAmount,
      total,
    };
  }, [cart, discountId, settings]);

  const selectedCustomer = CUSTOMERS.find((c) => c.id === selectedCustomerId);

  const handleCompletePayment = (payload: {
    paymentMethod: PaymentMethod;
    paymentProvider?: string;
    referenceCode?: string;
    tenderedAmount: number;
    changeAmount: number;
  }): Transaction => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      orderNumber: nextOrderNumber,
      createdAt: new Date().toISOString(),
      orderType,
      tableOrCustomer,
      customerName: selectedCustomer?.name,
      cashierName: settings.cashierName,
      items: cart,
      subtotal: cartTotals.subtotal,
      discountLabel: cartTotals.discountLabel,
      discountAmount: cartTotals.discountAmount,
      taxAmount: cartTotals.taxAmount,
      total: cartTotals.total,
      paymentMethod: payload.paymentMethod,
      paymentProvider: payload.paymentProvider,
      referenceCode: payload.referenceCode,
      tenderedAmount: payload.tenderedAmount,
      changeAmount: payload.changeAmount,
      status: 'Selesai',
    };

    const newMovements: StockMovement[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const soldQty = cart
          .filter((item) => item.productId === prod.id)
          .reduce((s, item) => s + item.quantity, 0);
        if (soldQty === 0) return prod;
        const nextStock = Math.max(0, prod.stock - soldQty);
        newMovements.push({
          id: `mov-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'Penjualan',
          delta: -soldQty,
          resultingStock: nextStock,
          note: `Transaksi #${newTx.orderNumber}`,
          createdAt: new Date().toISOString(),
          actor: settings.cashierName,
        });
        return { ...prod, stock: nextStock };
      }),
    );

    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
    }

    setTransactions((prev) => [newTx, ...prev]);
    handleClearCart();
    return newTx;
  };

  const handleVoidTransaction = (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (!target || target.status === 'Void') return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'Void' } : t)),
    );

    const restoredMovements: StockMovement[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const qty = target.items
          .filter((item) => item.productId === prod.id)
          .reduce((s, item) => s + item.quantity, 0);
        if (qty === 0) return prod;
        const nextStock = prod.stock + qty;
        restoredMovements.push({
          id: `mov-void-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'Void',
          delta: qty,
          resultingStock: nextStock,
          note: `Pembatalan #${target.orderNumber}`,
          createdAt: new Date().toISOString(),
          actor: settings.cashierName,
        });
        return { ...prod, stock: nextStock };
      }),
    );

    if (restoredMovements.length > 0) {
      setMovements((prev) => [...restoredMovements, ...prev]);
    }
    showToast(`${target.orderNumber} dibatalkan & stok dikembalikan`);
  };

  const handleAdjustStock = (productId: string, delta: number, note = 'Penyesuaian stok') => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextStock = Math.max(0, p.stock + delta);
        setMovements((mprev) => [
          {
            id: `mov-${Date.now()}-${p.id}`,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: delta > 0 ? 'Restock' : 'Penyesuaian',
            delta,
            resultingStock: nextStock,
            note,
            createdAt: new Date().toISOString(),
            actor: settings.cashierName,
          },
          ...mprev,
        ]);
        return { ...p, stock: nextStock };
      }),
    );
  };

  const handleSaveProduct = (data: Omit<Product, 'id'>, existingId?: string) => {
    if (existingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === existingId ? { ...data, id: existingId } : p)),
      );
      showToast(`Produk "${data.name}" diperbarui`);
    } else {
      const created: Product = { ...data, id: `prd-${Date.now()}` };
      setProducts((prev) => [created, ...prev]);
      setMovements((prev) => [
        {
          id: `mov-init-${Date.now()}`,
          productId: created.id,
          productName: created.name,
          sku: created.sku,
          type: 'Restock',
          delta: created.stock,
          resultingStock: created.stock,
          note: 'Stok awal produk baru',
          createdAt: new Date().toISOString(),
          actor: settings.cashierName,
        },
        ...prev,
      ]);
      showToast(`Produk "${created.name}" ditambahkan ke katalog`);
    }
    setProductModalState({ open: false });
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (target) {
      showToast(`${target.name} dihapus dari katalog`);
    }
  };

  const handleAddPettyCash = (label: string, type: 'in' | 'out', amount: number) => {
    setPettyCash((prev) => [
      {
        id: `pc-${Date.now()}`,
        label,
        type,
        amount,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    showToast('Catatan kas laci diperbarui');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        heldCount={heldOrders.length}
        lowStockCount={lowStockCount}
        branchName={settings.branchName}
        cashierName={settings.cashierName}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderBar
          activeScreen={activeScreen}
          branchName={settings.branchName}
          cashierName={settings.cashierName}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenShift={() => setActiveScreen('shift')}
        />

        {activeScreen === 'kasir' && (
          <KasirScreen
            products={products}
            cart={cart}
            heldOrders={heldOrders}
            orderType={orderType}
            tableOrCustomer={tableOrCustomer}
            selectedCustomerId={selectedCustomerId}
            discountId={discountId}
            nextOrderNumber={nextOrderNumber}
            settings={settings}
            onSelectOrderType={setOrderType}
            onSelectTable={setTableOrCustomer}
            onSelectCustomer={setSelectedCustomerId}
            onSelectDiscount={setDiscountId}
            onQuickAddProduct={handleQuickAddProduct}
            onOpenCustomizeNew={(product) =>
              setModifierModalState({ mode: 'add', product })
            }
            onEditCartItem={(cartItem) => {
              const product = products.find((p) => p.id === cartItem.productId);
              if (product) {
                setModifierModalState({ mode: 'edit', product, cartItem });
              }
            }}
            onUpdateQty={handleUpdateQty}
            onRemoveLine={handleRemoveLine}
            onClearCart={handleClearCart}
            onHoldOrder={handleHoldOrder}
            onResumeHeldOrder={handleResumeHeldOrder}
            onVoidHeldOrder={handleVoidHeldOrder}
            onCompletePayment={handleCompletePayment}
          />
        )}

        {activeScreen === 'produk' && (
          <ProdukScreen
            products={products}
            movements={movements}
            onAdjustStock={handleAdjustStock}
            onOpenAddModal={() => setProductModalState({ open: true, product: null })}
            onOpenEditModal={(product) => setProductModalState({ open: true, product })}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeScreen === 'riwayat' && (
          <RiwayatScreen
            transactions={transactions}
            settings={settings}
            onVoidTransaction={handleVoidTransaction}
          />
        )}

        {activeScreen === 'shift' && (
          <ShiftScreen
            transactions={transactions}
            pettyCash={pettyCash}
            cashierName={settings.cashierName}
            onAddPettyCash={handleAddPettyCash}
            onCloseShift={() => showToast('Laporan tutup shift dicatat')}
          />
        )}

        {activeScreen === 'laporan' && (
          <LaporanScreen transactions={transactions} products={products} />
        )}

        {activeScreen === 'pengaturan' && (
          <PengaturanScreen
            settings={settings}
            onSaveSettings={(next) => {
              setSettings(next);
              showToast('Pengaturan toko berhasil disimpan');
            }}
          />
        )}
      </div>

      {/* Modifier Modal */}
      {modifierModalState && (
        <ModifierModal
          product={modifierModalState.product}
          mode={modifierModalState.mode}
          initialModifiers={
            modifierModalState.mode === 'edit'
              ? modifierModalState.cartItem.modifiers
              : undefined
          }
          initialNote={
            modifierModalState.mode === 'edit' ? modifierModalState.cartItem.note : ''
          }
          initialQuantity={
            modifierModalState.mode === 'edit' ? modifierModalState.cartItem.quantity : 1
          }
          onClose={() => setModifierModalState(null)}
          onConfirm={handleConfirmModifiers}
        />
      )}

      {/* Tambah / Edit Produk Modal */}
      {productModalState.open && (
        <ProductModal
          product={productModalState.product}
          onClose={() => setProductModalState({ open: false })}
          onSave={handleSaveProduct}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="elevation-2 fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0F172A] px-4 py-2 text-xs font-semibold text-[#FFFFFF] lg:bottom-6"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
