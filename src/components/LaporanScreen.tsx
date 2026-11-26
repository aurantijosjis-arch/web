import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { formatRp } from '../data/posData';
import { Product, Transaction } from '../types/pos';
import { ProductVisual } from './ProductVisual';

interface LaporanScreenProps {
  transactions: Transaction[];
  products: Product[];
}

type DateRange = 'today' | '7d' | '30d';

export function LaporanScreen({ transactions, products }: LaporanScreenProps) {
  const [range, setRange] = useState<DateRange>('7d');

  const completed = useMemo(
    () => transactions.filter((t) => t.status === 'Selesai'),
    [transactions],
  );

  const todaySales = useMemo(() => completed.reduce((s, t) => s + t.total, 0), [completed]);
  const todayUnits = useMemo(
    () =>
      completed.reduce(
        (s, t) => s + t.items.reduce((isum, item) => isum + item.quantity, 0),
        0,
      ),
    [completed],
  );

  const multiplier = range === 'today' ? 1 : range === '7d' ? 7.2 : 28.5;
  const totalRevenue =
    range === 'today' ? todaySales : Math.round(todaySales * multiplier + 12450000);
  const totalOrders =
    range === 'today' ? completed.length : Math.round(completed.length * multiplier + 280);
  const totalSoldUnits =
    range === 'today' ? todayUnits : Math.round(todayUnits * multiplier + 610);
  const estGrossProfit = Math.round(totalRevenue * 0.58);

  const weeklyBars = useMemo(() => {
    const base = [
      { day: 'Sen', value: 1850000 },
      { day: 'Sel', value: 2120000 },
      { day: 'Rab', value: 1980000 },
      { day: 'Kam', value: 2460000 },
      { day: 'Jum', value: 3150000 },
      { day: 'Sab', value: 3890000 },
      { day: 'Min', value: Math.max(2640000, todaySales + 2200000) },
    ];
    const maxVal = Math.max(...base.map((b) => b.value));
    return base.map((b) => ({
      ...b,
      pct: Math.round((b.value / maxVal) * 100),
      isPeak: b.value === maxVal,
    }));
  }, [todaySales]);

  const paymentBreakdown = useMemo(() => {
    const sums = {
      QRIS: 0,
      Tunai: 0,
      Debit: 0,
      'E-Wallet': 0,
    };
    for (const tx of completed) {
      sums[tx.paymentMethod] += tx.total;
    }
    const baseAdd = range === 'today' ? { QRIS: 0, Tunai: 0, Debit: 0, 'E-Wallet': 0 } : {
      QRIS: 5420000,
      Tunai: 3980000,
      Debit: 2150000,
      'E-Wallet': 1420000,
    };
    const merged = [
      { label: 'QRIS Dinamis', amount: sums.QRIS + baseAdd.QRIS, color: 'bg-[#6366F1]' },
      { label: 'Tunai', amount: sums.Tunai + baseAdd.Tunai, color: 'bg-[#10B981]' },
      { label: 'Debit / Kredit', amount: sums.Debit + baseAdd.Debit, color: 'bg-[#0F172A]' },
      { label: 'E-Wallet', amount: sums['E-Wallet'] + baseAdd['E-Wallet'], color: 'bg-[#F59E0B]' },
    ];
    const grand = merged.reduce((s, m) => s + m.amount, 0) || 1;
    return merged.map((m) => ({
      ...m,
      pct: Math.round((m.amount / grand) * 100),
    }));
  }, [completed, range]);

  const topProducts = useMemo(() => {
    const qtyMap = new Map<string, number>();
    for (const tx of completed) {
      for (const item of tx.items) {
        qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.quantity);
      }
    }
    return products
      .slice(0, 5)
      .map((p, idx) => {
        const liveQty = qtyMap.get(p.id) ?? 0;
        const baseQty = range === 'today' ? liveQty + (5 - idx) * 3 : liveQty + (5 - idx) * 28;
        return {
          product: p,
          units: baseQty,
          revenue: baseQty * p.price,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [products, completed, range]);

  const handleExportReport = () => {
    const lines = [
      'Metrik,Nilai',
      `Periode,${range}`,
      `Omzet Penjualan,${totalRevenue}`,
      `Total Transaksi,${totalOrders}`,
      `Produk Terjual,${totalSoldUnits}`,
      `Estimasi Laba Kotor,${estGrossProfit}`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasir-laporan-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="pos-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        {/* Header & Range Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Dashboard &amp; Laporan Penjualan</h2>
            <p className="text-xs text-[#64748B]">
              Pantau performa omzet, metode pembayaran populer, dan produk terlaris outlet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-1">
              {(
                [
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7d', label: '7 Hari' },
                  { id: '30d', label: '30 Hari' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRange(opt.id)}
                  className={`h-8 rounded-md px-3 text-xs font-bold transition-colors ${
                    range === opt.id
                      ? 'bg-[#10B981] text-[#FFFFFF]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExportReport}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* 4 KPI Cards matching screenshot #6 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Omzet Penjualan</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#006C49]">
              {formatRp(totalRevenue)}
            </p>
            <p className="tnum mt-1 text-[11px] font-bold text-[#006C49]">+14.2% vs periode lalu</p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Total Transaksi</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">{totalOrders}</p>
            <p className="tnum mt-1 text-[11px] font-semibold text-[#64748B]">
              Rata-rata {formatRp(Math.round(totalRevenue / Math.max(1, totalOrders)))}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Item Terjual</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">
              {totalSoldUnits} Unit
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#64748B]">Kategori Kopi dominan</p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Estimasi Laba Kotor</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#4338CA]">
              {formatRp(estGrossProfit)}
            </p>
            <p className="tnum mt-1 text-[11px] font-semibold text-[#64748B]">Margin kotor 58%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* 7-Day Emerald Bar Chart */}
          <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Tren Penjualan 7 Hari Terakhir
                </h3>
                <p className="text-xs text-[#64748B]">Perbandingan omzet harian outlet</p>
              </div>
              <span className="rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-[11px] font-bold text-[#005236]">
                Puncak: Sabtu
              </span>
            </div>

            <div className="flex h-56 items-end justify-between gap-3 border-b border-[#E2E8F0] pb-3 pt-6">
              {weeklyBars.map((bar) => (
                <div key={bar.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="tnum text-[10px] font-bold text-[#64748B] opacity-0 transition-opacity group-hover:opacity-100">
                    {formatRp(bar.value)}
                  </span>
                  <div className="flex w-full max-w-[44px] flex-1 items-end">
                    <div
                      style={{ height: `${bar.pct}%` }}
                      className={`w-full rounded-t-lg transition-all ${
                        bar.isPeak
                          ? 'bg-[#006C49]'
                          : 'bg-[#10B981]/80 group-hover:bg-[#10B981]'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#334155]">{bar.day}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Methods Breakdown */}
          <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            <h3 className="text-base font-bold text-[#0F172A]">Komposisi Metode Pembayaran</h3>
            <p className="text-xs text-[#64748B]">Proporsi transaksi tunai vs non-tunai</p>

            <div className="mt-5 space-y-4">
              {paymentBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F172A]">{item.label}</span>
                    <span className="tnum font-bold text-[#334155]">
                      {formatRp(item.amount)} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      style={{ width: `${item.pct}%` }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom Row: Top 5 Products + Operational Summary */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            <h3 className="mb-4 text-base font-bold text-[#0F172A]">5 Produk Terlaris</h3>
            <div className="space-y-3">
              {topProducts.map(({ product, units, revenue }, idx) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFFFFF] text-xs font-extrabold text-[#334155]">
                      {idx + 1}
                    </span>
                    <ProductVisual kind={product.visual} variant="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0F172A]">{product.name}</p>
                      <p className="tnum text-xs text-[#64748B]">{units} terjual</p>
                    </div>
                  </div>
                  <span className="tnum shrink-0 text-sm font-extrabold text-[#006C49]">
                    {formatRp(revenue)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="elevation-1 flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Ringkasan Operasional Outlet</h3>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Sorotan performa kasir dan jam sibuk harian
              </p>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                  <span className="font-medium text-[#334155]">Jam Sibuk Puncak</span>
                  <span className="tnum font-bold text-[#0F172A]">12:00 – 14:30 WIB</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                  <span className="font-medium text-[#334155]">Kategori Kontribusi Tertinggi</span>
                  <span className="font-bold text-[#006C49]">Kopi (44%)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                  <span className="font-medium text-[#334155]">Channel Pesanan Dominan</span>
                  <span className="font-bold text-[#4338CA]">Dine In (58%)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#EEF2FF] p-4 text-xs text-[#4338CA]">
              <p className="font-bold">Adopsi Pembayaran Digital Meningkat</p>
              <p className="mt-1 leading-relaxed">
                Transaksi QRIS &amp; E-Wallet menyumbang mayoritas pembayaran cepat di jam makan
                siang, mempercepat antrean kasir hingga 28%.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
