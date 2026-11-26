import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Printer } from 'lucide-react';
import { formatRp } from '../data/posData';
import { PettyCashEntry, Transaction } from '../types/pos';

interface ShiftScreenProps {
  transactions: Transaction[];
  pettyCash: PettyCashEntry[];
  cashierName: string;
  onAddPettyCash: (label: string, type: 'in' | 'out', amount: number) => void;
  onCloseShift: () => void;
}

const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];

export function ShiftScreen({
  transactions,
  pettyCash,
  cashierName,
  onAddPettyCash,
  onCloseShift,
}: ShiftScreenProps) {
  const openingFloat = 500000;

  const [counts, setCounts] = useState<Record<number, number>>({
    100000: 4,
    50000: 3,
    20000: 3,
    10000: 2,
    5000: 2,
    2000: 3,
    1000: 4,
    500: 4,
  });
  const [shiftNote, setShiftNote] = useState('');
  const [pcLabel, setPcLabel] = useState('');
  const [pcAmount, setPcAmount] = useState('');
  const [pcType, setPcType] = useState<'out' | 'in'>('out');
  const [shiftClosedToast, setShiftClosedToast] = useState(false);

  const completed = useMemo(
    () => transactions.filter((t) => t.status === 'Selesai'),
    [transactions],
  );

  const cashSales = useMemo(
    () =>
      completed
        .filter((t) => t.paymentMethod === 'Tunai')
        .reduce((s, t) => s + t.total, 0),
    [completed],
  );

  const nonCashSales = useMemo(
    () =>
      completed
        .filter((t) => t.paymentMethod !== 'Tunai')
        .reduce((s, t) => s + t.total, 0),
    [completed],
  );

  const pettyNet = useMemo(
    () =>
      pettyCash.reduce((sum, entry) => (entry.type === 'in' ? sum + entry.amount : sum - entry.amount), 0),
    [pettyCash],
  );

  const expectedDrawerCash = openingFloat + cashSales + pettyNet;

  const physicalCashTotal = useMemo(
    () => DENOMINATIONS.reduce((sum, denom) => sum + denom * (counts[denom] ?? 0), 0),
    [counts],
  );

  const variance = physicalCashTotal - expectedDrawerCash;

  const updateDenom = (denom: number, qty: number) => {
    setCounts((prev) => ({ ...prev, [denom]: Math.max(0, qty) }));
  };

  const handleSubmitPettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(pcAmount);
    if (!pcLabel.trim() || !amt || amt <= 0) return;
    onAddPettyCash(pcLabel.trim(), pcType, amt);
    setPcLabel('');
    setPcAmount('');
  };

  const handleCloseShiftClick = () => {
    onCloseShift();
    setShiftClosedToast(true);
    window.print();
  };

  return (
    <main className="pos-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Shift Kasir &amp; Rekonsiliasi Laci Kas
            </h2>
            <p className="text-xs text-[#64748B]">
              Shift Pagi #02 · Kasir: {cashierName} · Dibuka pukul 08:00 WIB
            </p>
          </div>
          {shiftClosedToast && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-bold text-[#005236]">
              <CheckCircle2 className="h-4 w-4" />
              Laporan Tutup Shift Tercatat
            </span>
          )}
        </div>

        {/* 4 KPI Cards matching screenshot #5 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Modal Awal Laci</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">
              {formatRp(openingFloat)}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Penjualan Tunai</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#006C49]">
              {formatRp(cashSales)}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Non-Tunai (QRIS/EDC)</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#4338CA]">
              {formatRp(nonCashSales)}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Kas Sistem Diharapkan</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">
              {formatRp(expectedDrawerCash)}
            </p>
          </div>
        </div>

        {/* Two-Column Reconciliation */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: Cash Denomination Counter */}
          <section className="elevation-1 flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Hitung Pecahan Uang Fisik
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Masukkan jumlah lembar/koin uang di laci kasir saat tutup shift.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCounts(
                      DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {}),
                    )
                  }
                  className="text-xs font-bold text-[#DC2626] hover:underline"
                >
                  Reset Hitungan
                </button>
              </div>

              <div className="space-y-2">
                {DENOMINATIONS.map((denom) => {
                  const qty = counts[denom] ?? 0;
                  const rowTotal = denom * qty;
                  return (
                    <div
                      key={denom}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2"
                    >
                      <span className="tnum w-28 text-sm font-bold text-[#0F172A]">
                        {formatRp(denom)}
                      </span>

                      <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-[#FFFFFF]">
                        <button
                          type="button"
                          onClick={() => updateDenom(denom, qty - 1)}
                          aria-label={`Kurangi pecahan ${denom}`}
                          className="flex h-8 w-8 items-center justify-center font-bold text-[#334155] hover:bg-[#F1F5F9]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          aria-label={`Jumlah lembar ${denom}`}
                          value={qty}
                          onChange={(e) => updateDenom(denom, Number(e.target.value) || 0)}
                          className="tnum h-8 w-14 border-x border-[#E2E8F0] text-center text-xs font-extrabold text-[#0F172A] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateDenom(denom, qty + 1)}
                          aria-label={`Tambah pecahan ${denom}`}
                          className="flex h-8 w-8 items-center justify-center font-bold text-[#334155] hover:bg-[#F1F5F9]"
                        >
                          +
                        </button>
                      </div>

                      <span className="tnum w-28 text-right text-sm font-extrabold text-[#0F172A]">
                        {formatRp(rowTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between rounded-xl bg-[#D1FAE5]/50 px-4 py-3">
              <span className="text-sm font-bold text-[#005236]">Total Uang Fisik Dihitung</span>
              <span className="tnum text-2xl font-extrabold text-[#006C49]">
                {formatRp(physicalCashTotal)}
              </span>
            </div>
          </section>

          {/* Right: Petty Cash + Variance Summary + Close Shift */}
          <div className="space-y-5">
            {/* Petty Cash Entry */}
            <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
              <h3 className="text-base font-bold text-[#0F172A]">Kas Masuk / Kas Keluar</h3>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Catat pengeluaran kecil dari laci kas selama shift berlangsung.
              </p>

              <form onSubmit={handleSubmitPettyCash} className="mt-3 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={pcLabel}
                  onChange={(e) => setPcLabel(e.target.value)}
                  placeholder="Keterangan (mis. Beli galon)"
                  className="h-10 min-w-[160px] flex-1 rounded-lg border border-[#CBD5E1] px-3 text-xs focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
                <select
                  aria-label="Tipe kas"
                  value={pcType}
                  onChange={(e) => setPcType(e.target.value as 'in' | 'out')}
                  className="h-10 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 text-xs font-semibold"
                >
                  <option value="out">Kas Keluar (-)</option>
                  <option value="in">Kas Masuk (+)</option>
                </select>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={pcAmount}
                  onChange={(e) => setPcAmount(e.target.value)}
                  placeholder="Nominal"
                  className="tnum h-10 w-28 rounded-lg border border-[#CBD5E1] px-3 text-xs font-bold focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-10 items-center gap-1 rounded-lg bg-[#0F172A] px-3.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#1E293B]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Catat
                </button>
              </form>

              <div className="mt-3 space-y-1.5">
                {pettyCash.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-[#334155]">{entry.label}</span>
                    <span
                      className={`tnum font-bold ${
                        entry.type === 'in' ? 'text-[#006C49]' : 'text-[#DC2626]'
                      }`}
                    >
                      {entry.type === 'in' ? '+' : '-'}
                      {formatRp(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Shift Discrepancy & Finalize */}
            <section
              id="printable-receipt"
              className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5"
            >
              <h3 className="text-base font-bold text-[#0F172A]">Ringkasan &amp; Selisih Kas</h3>

              <div className="mt-3 space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
                <div className="flex justify-between text-[#334155]">
                  <span>Kas Sistem Diharapkan</span>
                  <span className="tnum font-bold text-[#0F172A]">
                    {formatRp(expectedDrawerCash)}
                  </span>
                </div>
                <div className="flex justify-between text-[#334155]">
                  <span>Total Uang Fisik</span>
                  <span className="tnum font-bold text-[#0F172A]">
                    {formatRp(physicalCashTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2.5">
                  <span className="font-bold text-[#0F172A]">Selisih Kas (Variance)</span>
                  <span
                    className={`tnum rounded-full px-3 py-0.5 text-sm font-extrabold ${
                      variance === 0
                        ? 'bg-[#D1FAE5] text-[#005236]'
                        : variance > 0
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}
                  >
                    {variance === 0
                      ? 'Rp 0 (Sesuai)'
                      : `${variance > 0 ? '+' : ''}${formatRp(variance)}`}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="shift-note"
                  className="mb-1 block text-xs font-bold text-[#334155]"
                >
                  Catatan Tutup Shift
                </label>
                <textarea
                  id="shift-note"
                  rows={2}
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  placeholder="Catatan serah terima shift ke kasir berikutnya..."
                  className="w-full rounded-lg border border-[#CBD5E1] p-3 text-xs focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCloseShiftClick}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 text-sm font-bold text-[#FFFFFF] transition-colors hover:bg-[#059669]"
              >
                <Printer className="h-4 w-4" />
                Tutup Shift &amp; Cetak Laporan
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
