import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Printer, Receipt, Search } from 'lucide-react';
import { formatRp } from '../data/posData';
import { PaymentMethod, StoreSettings, Transaction } from '../types/pos';
import { BarcodeSvg } from './ProductVisual';

interface RiwayatScreenProps {
  transactions: Transaction[];
  settings: StoreSettings;
  onVoidTransaction: (txId: string) => void;
}

type MethodFilter = 'Semua' | PaymentMethod;
type StatusFilter = 'Semua' | 'Selesai' | 'Void';

export function RiwayatScreen({
  transactions,
  settings,
  onVoidTransaction,
}: RiwayatScreenProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('Semua');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [selectedId, setSelectedId] = useState<string>(() => transactions[0]?.id ?? '');

  const completed = useMemo(
    () => transactions.filter((t) => t.status === 'Selesai'),
    [transactions],
  );
  const voidedCount = transactions.length - completed.length;
  const totalSales = useMemo(() => completed.reduce((s, t) => s + t.total, 0), [completed]);
  const avgTicket = completed.length > 0 ? Math.round(totalSales / completed.length) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (methodFilter !== 'Semua' && tx.paymentMethod !== methodFilter) return false;
      if (statusFilter !== 'Semua' && tx.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tx.orderNumber.toLowerCase().includes(q) ||
        tx.tableOrCustomer.toLowerCase().includes(q) ||
        (tx.customerName?.toLowerCase().includes(q) ?? false) ||
        (tx.referenceCode?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [transactions, methodFilter, statusFilter, search]);

  const activeTx =
    filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? transactions[0] ?? null;

  return (
    <main className="pos-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        {/* Top 4 KPI Cards matching screenshot #4 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Total Penjualan Hari Ini</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#006C49]">
              {formatRp(totalSales)}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Transaksi Selesai</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">
              {completed.length} Transaksi
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Rata-rata Keranjang</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">
              {formatRp(avgTicket)}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Transaksi Void / Batal</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#DC2626]">{voidedCount}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor struk, meja, atau pelanggan..."
              aria-label="Cari transaksi"
              className="h-10 w-full rounded-lg border border-[#CBD5E1] pl-9 pr-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['Semua', 'Tunai', 'QRIS', 'Debit', 'E-Wallet'] as MethodFilter[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`h-9 rounded-lg border px-3 text-xs font-bold ${
                  methodFilter === m
                    ? 'border-[#10B981] bg-[#10B981] text-[#FFFFFF]'
                    : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:bg-[#F8FAFC]'
                }`}
              >
                {m}
              </button>
            ))}

            <select
              aria-label="Filter status transaksi"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs font-bold text-[#334155]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Void">Void</option>
            </select>
          </div>
        </div>

        {/* Split View: Transaction Cards Left + Live Thermal Receipt Right */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.9fr]">
          {/* Left: Transaction List */}
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-12 text-center">
                <Receipt className="mb-2 h-8 w-8 text-[#94A3B8]" />
                <p className="text-sm font-bold text-[#0F172A]">Tidak ada transaksi ditemukan</p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Ubah filter metode pembayaran atau kata kunci pencarian.
                </p>
              </div>
            ) : (
              filtered.map((tx) => {
                const isSelected = activeTx?.id === tx.id;
                const isDigital = tx.paymentMethod !== 'Tunai';
                const totalItems = tx.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedId(tx.id)}
                    className={`elevation-1 flex w-full items-center justify-between gap-4 rounded-2xl border bg-[#FFFFFF] p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-[#10B981] bg-[#D1FAE5]/15'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tnum font-mono text-sm font-extrabold text-[#0F172A]">
                          {tx.orderNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isDigital
                              ? 'bg-[#EEF2FF] text-[#4338CA]'
                              : 'bg-[#D1FAE5] text-[#005236]'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                        {tx.status === 'Selesai' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006C49]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-bold text-[#DC2626]">
                            <Ban className="h-3 w-3" />
                            Void
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs font-medium text-[#334155]">
                        {tx.orderType} · {tx.tableOrCustomer}
                        {tx.customerName ? ` · ${tx.customerName}` : ''}
                      </p>
                      <p className="tnum mt-0.5 text-[11px] text-[#64748B]">
                        {new Date(tx.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {totalItems} item · Kasir {tx.cashierName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`tnum text-base font-extrabold ${
                          tx.status === 'Void' ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'
                        }`}
                      >
                        {formatRp(tx.total)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">
                        Lihat Struk →
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Live Thermal Receipt Preview Card */}
          <div className="elevation-1 flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            {activeTx ? (
              <>
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#0F172A]">Preview Struk Transaksi</h2>
                    <span className="tnum font-mono text-xs font-bold text-[#64748B]">
                      {activeTx.orderNumber}
                    </span>
                  </div>

                  <div
                    id="printable-receipt"
                    className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-xs text-[#0F172A]"
                  >
                    <div className="border-b border-dashed border-[#CBD5E1] pb-3 text-center">
                      <p className="text-sm font-extrabold uppercase">{settings.storeName}</p>
                      <p className="text-[11px] text-[#64748B]">{settings.address}</p>
                      <p className="text-[11px] text-[#64748B]">Telp: {settings.phone}</p>
                      {activeTx.status === 'Void' && (
                        <p className="mt-1.5 rounded bg-[#FEE2E2] py-0.5 text-[11px] font-extrabold uppercase text-[#DC2626]">
                          TRANSAKSI DIBATALKAN (VOID)
                        </p>
                      )}
                    </div>

                    <div className="my-3 space-y-0.5 text-[11px] text-[#334155]">
                      <div className="flex justify-between">
                        <span>No. Struk</span>
                        <span className="tnum font-mono font-bold">{activeTx.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tanggal</span>
                        <span className="tnum">
                          {new Date(activeTx.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kasir / Meja</span>
                        <span>
                          {activeTx.cashierName} · {activeTx.tableOrCustomer}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border-y border-dashed border-[#CBD5E1] py-3">
                      {activeTx.items.map((item) => (
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

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[#334155]">
                        <span>Subtotal</span>
                        <span className="tnum font-semibold">{formatRp(activeTx.subtotal)}</span>
                      </div>
                      {activeTx.discountAmount > 0 && (
                        <div className="flex justify-between text-[#B45309]">
                          <span>Diskon ({activeTx.discountLabel})</span>
                          <span className="tnum font-semibold">
                            -{formatRp(activeTx.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#334155]">
                        <span>Pajak PB1 (10%)</span>
                        <span className="tnum font-semibold">{formatRp(activeTx.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#E2E8F0] pt-2 text-sm font-extrabold">
                        <span>Total</span>
                        <span className="tnum">{formatRp(activeTx.total)}</span>
                      </div>
                      <div className="flex justify-between pt-1 text-[#334155]">
                        <span>
                          {activeTx.paymentMethod}
                          {activeTx.paymentProvider ? ` (${activeTx.paymentProvider})` : ''}
                        </span>
                        <span className="tnum font-semibold">
                          {formatRp(activeTx.tenderedAmount)}
                        </span>
                      </div>
                      {activeTx.changeAmount > 0 && (
                        <div className="flex justify-between font-bold text-[#006C49]">
                          <span>Kembalian</span>
                          <span className="tnum">{formatRp(activeTx.changeAmount)}</span>
                        </div>
                      )}
                    </div>

                    {settings.showBarcodeOnReceipt && (
                      <div className="mt-4 border-t border-dashed border-[#CBD5E1] pt-3">
                        <BarcodeSvg code={activeTx.orderNumber} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#10B981] px-4 text-sm font-bold text-[#FFFFFF] hover:bg-[#059669]"
                  >
                    <Printer className="h-4 w-4" />
                    Cetak Ulang Struk
                  </button>
                  {activeTx.status === 'Selesai' && (
                    <button
                      type="button"
                      onClick={() => onVoidTransaction(activeTx.id)}
                      className="h-11 rounded-lg bg-[#FEE2E2] px-4 text-sm font-bold text-[#DC2626] hover:bg-[#FECACA]"
                    >
                      Void
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-[#64748B]">
                Pilih transaksi di sebelah kiri untuk melihat detail struk.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
