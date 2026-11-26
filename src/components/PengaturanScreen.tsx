import { useState } from 'react';
import { CheckCircle2, Printer, Save } from 'lucide-react';
import { formatRp } from '../data/posData';
import { StoreSettings } from '../types/pos';
import { BarcodeSvg } from './ProductVisual';

interface PengaturanScreenProps {
  settings: StoreSettings;
  onSaveSettings: (next: StoreSettings) => void;
}

export function PengaturanScreen({ settings, onSaveSettings }: PengaturanScreenProps) {
  const [draft, setDraft] = useState<StoreSettings>(settings);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draft);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <main className="pos-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      <form onSubmit={handleSave} className="mx-auto max-w-[1440px] space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Pengaturan Toko, Pajak &amp; Struk
            </h2>
            <p className="text-xs text-[#64748B]">
              Perubahan langsung tercermin pada preview struk thermal di sebelah kanan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedBanner && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-bold text-[#005236]">
                <CheckCircle2 className="h-4 w-4" />
                Pengaturan Tersimpan
              </span>
            )}
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#10B981] px-5 text-xs font-bold text-[#FFFFFF] hover:bg-[#059669]"
            >
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Left Column: Store, Tax, Printer, Security */}
          <div className="space-y-5">
            {/* Profil Toko */}
            <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
              <h3 className="text-base font-bold text-[#0F172A]">Profil Toko &amp; Outlet</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="set-store" className="mb-1 block text-xs font-bold text-[#334155]">
                    Nama Toko
                  </label>
                  <input
                    id="set-store"
                    type="text"
                    value={draft.storeName}
                    onChange={(e) => setDraft({ ...draft, storeName: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="set-branch" className="mb-1 block text-xs font-bold text-[#334155]">
                    Cabang / Outlet
                  </label>
                  <input
                    id="set-branch"
                    type="text"
                    value={draft.branchName}
                    onChange={(e) => setDraft({ ...draft, branchName: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="set-addr" className="mb-1 block text-xs font-bold text-[#334155]">
                    Alamat Lengkap
                  </label>
                  <input
                    id="set-addr"
                    type="text"
                    value={draft.address}
                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="set-phone" className="mb-1 block text-xs font-bold text-[#334155]">
                    No. Telepon
                  </label>
                  <input
                    id="set-phone"
                    type="text"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    className="tnum h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="set-cashier" className="mb-1 block text-xs font-bold text-[#334155]">
                    Nama Kasir Aktif
                  </label>
                  <input
                    id="set-cashier"
                    type="text"
                    value={draft.cashierName}
                    onChange={(e) => setDraft({ ...draft, cashierName: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Pajak & Pembulatan */}
            <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
              <h3 className="text-base font-bold text-[#0F172A]">Pajak PB1 &amp; Pembulatan</h3>
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#334155]">
                  <span>Aktifkan Pajak Restoran (PB1)</span>
                  <input
                    type="checkbox"
                    checked={draft.taxEnabled}
                    onChange={(e) => setDraft({ ...draft, taxEnabled: e.target.checked })}
                    className="h-4 w-4 accent-[#10B981]"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="set-tax" className="mb-1 block text-xs font-bold text-[#334155]">
                      Persentase Pajak (%)
                    </label>
                    <input
                      id="set-tax"
                      type="number"
                      min="0"
                      max="25"
                      value={draft.taxRate}
                      onChange={(e) =>
                        setDraft({ ...draft, taxRate: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="tnum h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex h-10 w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-xs font-semibold text-[#334155]">
                      <span>Pembulatan Rp 100</span>
                      <input
                        type="checkbox"
                        checked={draft.autoRound}
                        onChange={(e) => setDraft({ ...draft, autoRound: e.target.checked })}
                        className="h-4 w-4 accent-[#10B981]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Printer & Struk Header/Footer */}
            <section className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
              <h3 className="text-base font-bold text-[#0F172A]">Perangkat Printer &amp; Teks Struk</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="set-printer" className="mb-1 block text-xs font-bold text-[#334155]">
                    Model Printer Thermal
                  </label>
                  <input
                    id="set-printer"
                    type="text"
                    value={draft.printerName}
                    onChange={(e) => setDraft({ ...draft, printerName: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="set-paper" className="mb-1 block text-xs font-bold text-[#334155]">
                    Lebar Kertas
                  </label>
                  <select
                    id="set-paper"
                    value={draft.paperWidth}
                    onChange={(e) =>
                      setDraft({ ...draft, paperWidth: e.target.value as '58mm' | '80mm' })
                    }
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-sm font-semibold"
                  >
                    <option value="80mm">80mm (Standar Kasir)</option>
                    <option value="58mm">58mm (Printer Bluetooth)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="set-header" className="mb-1 block text-xs font-bold text-[#334155]">
                    Catatan Atas Struk
                  </label>
                  <input
                    id="set-header"
                    type="text"
                    value={draft.receiptHeader}
                    onChange={(e) => setDraft({ ...draft, receiptHeader: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="set-footer" className="mb-1 block text-xs font-bold text-[#334155]">
                    Catatan Bawah Struk
                  </label>
                  <input
                    id="set-footer"
                    type="text"
                    value={draft.receiptFooter}
                    onChange={(e) => setDraft({ ...draft, receiptFooter: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#334155]">
                  <span>Auto-Cetak Setelah Bayar</span>
                  <input
                    type="checkbox"
                    checked={draft.autoPrint}
                    onChange={(e) => setDraft({ ...draft, autoPrint: e.target.checked })}
                    className="h-4 w-4 accent-[#10B981]"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#334155]">
                  <span>Tampilkan Barcode Struk</span>
                  <input
                    type="checkbox"
                    checked={draft.showBarcodeOnReceipt}
                    onChange={(e) =>
                      setDraft({ ...draft, showBarcodeOnReceipt: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#10B981]"
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Right Column: Live Thermal Receipt Preview */}
          <section className="elevation-1 flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A]">Live Preview Struk Thermal</h3>
                <span className="tnum rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-bold text-[#4338CA]">
                  {draft.paperWidth}
                </span>
              </div>

              <div
                id="printable-receipt"
                className={`mx-auto rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-xs text-[#0F172A] ${
                  draft.paperWidth === '58mm' ? 'max-w-[270px]' : 'max-w-[340px]'
                }`}
              >
                <div className="border-b border-dashed border-[#CBD5E1] pb-3 text-center">
                  <p className="text-sm font-extrabold uppercase">
                    {draft.storeName || 'KASIR'}
                  </p>
                  <p className="text-[11px] font-semibold text-[#334155]">{draft.branchName}</p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">{draft.address}</p>
                  <p className="tnum text-[11px] text-[#64748B]">Telp: {draft.phone}</p>
                  {draft.receiptHeader && (
                    <p className="mt-1.5 font-semibold text-[#006C49]">{draft.receiptHeader}</p>
                  )}
                </div>

                <div className="my-2.5 flex justify-between text-[11px] text-[#334155]">
                  <span>ORD-2045 · Meja 03</span>
                  <span>Kasir: {draft.cashierName}</span>
                </div>

                <div className="space-y-1.5 border-y border-dashed border-[#CBD5E1] py-2.5">
                  <div className="flex justify-between font-semibold">
                    <span>2x Kopi Susu Gula Aren</span>
                    <span className="tnum">{formatRp(56000)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>1x French Butter Croissant</span>
                    <span className="tnum">{formatRp(29000)}</span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[#334155]">
                    <span>Subtotal</span>
                    <span className="tnum font-semibold">{formatRp(85000)}</span>
                  </div>
                  {draft.taxEnabled && (
                    <div className="flex justify-between text-[#334155]">
                      <span>PB1 ({draft.taxRate}%)</span>
                      <span className="tnum font-semibold">
                        {formatRp(Math.round(85000 * (draft.taxRate / 100)))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#E2E8F0] pt-1.5 text-sm font-extrabold">
                    <span>Total</span>
                    <span className="tnum">
                      {formatRp(
                        85000 + (draft.taxEnabled ? Math.round(85000 * (draft.taxRate / 100)) : 0),
                      )}
                    </span>
                  </div>
                </div>

                {draft.receiptFooter && (
                  <p className="mt-3 border-t border-dashed border-[#CBD5E1] pt-2.5 text-center text-[11px] text-[#64748B]">
                    {draft.receiptFooter}
                  </p>
                )}

                {draft.showBarcodeOnReceipt && (
                  <div className="mt-3 pt-1">
                    <BarcodeSvg code="ORD-2045" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-xs font-bold text-[#334155] hover:bg-[#F8FAFC]"
            >
              <Printer className="h-4 w-4" />
              Test Print Struk ({draft.printerName})
            </button>
          </section>
        </div>
      </form>
    </main>
  );
}
