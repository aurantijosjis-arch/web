import { useState } from 'react';
import { X } from 'lucide-react';
import { MODIFIER_GROUPS, formatRp } from '../data/posData';
import { ModifierChoice, Product } from '../types/pos';

interface ModifierModalProps {
  product: Product;
  initialModifiers?: ModifierChoice[];
  initialNote?: string;
  initialQuantity?: number;
  mode: 'add' | 'edit';
  onClose: () => void;
  onConfirm: (modifiers: ModifierChoice[], note: string, quantity: number) => void;
}

export function ModifierModal({
  product,
  initialModifiers,
  initialNote = '',
  initialQuantity = 1,
  mode,
  onClose,
  onConfirm,
}: ModifierModalProps) {
  const findInitial = (group: string, fallback: string) =>
    initialModifiers?.find((m) => m.group === group)?.label ?? fallback;

  const [temp, setTemp] = useState<string>(() => findInitial('Suhu', 'Iced'));
  const [size, setSize] = useState<string>(() => findInitial('Ukuran', 'Regular'));
  const [sweetness, setSweetness] = useState<string>(() => findInitial('Gula', 'Normal'));
  const [addons, setAddons] = useState<string[]>(() =>
    initialModifiers
      ? initialModifiers.filter((m) => m.group === 'Tambahan').map((m) => m.label)
      : [],
  );
  const [note, setNote] = useState(initialNote);
  const [quantity, setQuantity] = useState(initialQuantity);

  const toggleAddon = (label: string) => {
    setAddons((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const selectedModifiers: ModifierChoice[] = [
    {
      group: 'Suhu',
      label: temp,
      priceDelta: MODIFIER_GROUPS.temp.options.find((o) => o.label === temp)?.priceDelta ?? 0,
    },
    {
      group: 'Ukuran',
      label: size,
      priceDelta: MODIFIER_GROUPS.size.options.find((o) => o.label === size)?.priceDelta ?? 0,
    },
    {
      group: 'Gula',
      label: sweetness,
      priceDelta:
        MODIFIER_GROUPS.sweetness.options.find((o) => o.label === sweetness)?.priceDelta ?? 0,
    },
    ...addons.map((addonLabel) => ({
      group: 'Tambahan',
      label: addonLabel,
      priceDelta:
        MODIFIER_GROUPS.addons.options.find((o) => o.label === addonLabel)?.priceDelta ?? 0,
    })),
  ];

  const unitPrice = product.price + selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  const totalLinePrice = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedModifiers, note.trim(), quantity);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modifier-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[4px]"
    >
      <form
        onSubmit={handleSubmit}
        className="elevation-3 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#CBD5E1] bg-[#FFFFFF]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <p className="tnum font-mono text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              {product.sku} · Kustomisasi Menu
            </p>
            <h2 id="modifier-modal-title" className="mt-1 text-xl font-bold text-[#0F172A]">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kustomisasi"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:bg-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pos-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0F172A]">Suhu Penyajian</span>
              <span className="text-xs font-medium text-[#64748B]">Wajib</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MODIFIER_GROUPS.temp.options.map((opt) => {
                const active = temp === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setTemp(opt.label)}
                    className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'border-[#10B981] bg-[#D1FAE5]/50 text-[#005236]'
                        : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0F172A]">Ukuran Gelas</span>
              <span className="text-xs font-medium text-[#64748B]">Wajib</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODIFIER_GROUPS.size.options.map((opt) => {
                const active = size === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSize(opt.label)}
                    className={`flex min-h-[44px] items-center justify-between rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'border-[#10B981] bg-[#D1FAE5]/50 text-[#005236]'
                        : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="tnum text-xs text-[#64748B]">
                      {opt.priceDelta > 0 ? `+${formatRp(opt.priceDelta)}` : 'Standar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0F172A]">Tingkat Manis</span>
              <span className="text-xs font-medium text-[#64748B]">Wajib</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MODIFIER_GROUPS.sweetness.options.map((opt) => {
                const active = sweetness === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSweetness(opt.label)}
                    className={`min-h-[44px] rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
                      active
                        ? 'border-[#10B981] bg-[#D1FAE5]/50 text-[#005236]'
                        : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0F172A]">Tambahan / Topping</span>
              <span className="text-xs font-medium text-[#64748B]">Opsional</span>
            </div>
            <div className="space-y-2">
              {MODIFIER_GROUPS.addons.options.map((opt) => {
                const active = addons.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => toggleAddon(opt.label)}
                    className={`flex min-h-[44px] w-full items-center justify-between rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'border-[#10B981] bg-[#D1FAE5]/45 text-[#005236]'
                        : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="tnum text-xs font-bold text-[#0F172A]">
                      +{formatRp(opt.priceDelta)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="modifier-note"
              className="mb-1.5 block text-sm font-semibold text-[#0F172A]"
            >
              Catatan Barista / Dapur
            </label>
            <input
              id="modifier-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Es batu dipisah, tanpa sedotan"
              className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-2 focus:border-[#10B981] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center text-lg font-bold text-[#334155] hover:bg-[#F1F5F9]"
              aria-label="Kurangi jumlah"
            >
              -
            </button>
            <span className="tnum w-9 text-center text-base font-bold text-[#0F172A]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="flex h-11 w-11 items-center justify-center text-lg font-bold text-[#334155] hover:bg-[#F1F5F9]"
              aria-label="Tambah jumlah"
            >
              +
            </button>
          </div>

          <button
            type="submit"
            className="tnum flex h-12 flex-1 items-center justify-center rounded-lg bg-[#10B981] px-5 text-sm font-bold text-[#FFFFFF] transition-colors hover:bg-[#059669]"
          >
            {mode === 'edit' ? 'Perbarui Item' : 'Tambah ke Pesanan'} · {formatRp(totalLinePrice)}
          </button>
        </div>
      </form>
    </div>
  );
}
