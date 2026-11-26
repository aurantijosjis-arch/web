import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { CATEGORIES, formatRp } from '../data/posData';
import { CategoryId, Product, ProductVisualKind } from '../types/pos';
import { BarcodeSvg, ProductVisual } from './ProductVisual';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>, existingId?: string) => void;
}

const VISUAL_PRESETS: { id: ProductVisualKind; label: string }[] = [
  { id: 'latte', label: 'Kopi Susu Gula Aren' },
  { id: 'caramel-latte', label: 'Salted Caramel Latte' },
  { id: 'espresso', label: 'Americano / Espresso' },
  { id: 'coldbrew', label: 'Cold Brew 250ml' },
  { id: 'concentrate', label: 'Cold Brew Concentrate 500ml' },
  { id: 'matcha', label: 'Uji Matcha Latte' },
  { id: 'hojicha', label: 'Hojicha Roasted Latte' },
  { id: 'tea', label: 'Yuzu Sparkling Tea' },
  { id: 'croissant', label: 'Butter Croissant' },
  { id: 'pain-au-chocolat', label: 'Pain au Chocolat' },
  { id: 'morning-bun', label: 'Cardamom Morning Bun' },
  { id: 'pastry', label: 'Basque Cheesecake' },
  { id: 'bowl', label: 'Salmon Rice Bowl' },
  { id: 'sandwich', label: 'Truffle Brioche Sandwich' },
  { id: 'beef-melt', label: 'Smoked Beef Sourdough Melt' },
  { id: 'beans', label: 'Biji Kopi 250g' },
];

const UNIT_OPTIONS = ['Cup', 'Pcs', 'Porsi', 'Slice', 'Botol', 'Pack'];

export function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(
    product?.sku ?? `PRD-${Math.floor(100 + Math.random() * 899)}`,
  );
  const [category, setCategory] = useState<Exclude<CategoryId, 'all'>>(
    product?.category ?? 'kopi',
  );
  const [unit, setUnit] = useState(product?.unit ?? 'Cup');
  const [price, setPrice] = useState(String(product?.price ?? 32000));
  const [costPrice, setCostPrice] = useState(String(product?.costPrice ?? 12000));
  const [stock, setStock] = useState(String(product?.stock ?? 24));
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(product?.lowStockThreshold ?? 6),
  );
  const [visual, setVisual] = useState<ProductVisualKind>(product?.visual ?? 'latte');
  const [taxable, setTaxable] = useState(product?.taxable ?? true);
  const [active, setActive] = useState(product?.active ?? true);
  const [customizable, setCustomizable] = useState(product?.customizable ?? true);
  const [promoLabel, setPromoLabel] = useState(product?.promoLabel ?? '');
  const [description, setDescription] = useState(product?.description ?? '');

  const numericPrice = Math.max(0, Number(price) || 0);
  const numericCost = Math.max(0, Number(costPrice) || 0);
  const profit = numericPrice - numericCost;
  const marginPct = numericPrice > 0 ? Math.round((profit / numericPrice) * 100) : 0;

  const generateSku = () => {
    const prefixMap: Record<Exclude<CategoryId, 'all'>, string> = {
      kopi: 'KPI',
      'non-kopi': 'NKP',
      makanan: 'MKN',
      snack: 'SNK',
      botolan: 'BTL',
    };
    const num = Math.floor(100 + Math.random() * 899);
    setSku(`${prefixMap[category]}-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;
    onSave(
      {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category,
        unit,
        price: numericPrice,
        costPrice: numericCost,
        stock: Math.max(0, Number(stock) || 0),
        lowStockThreshold: Math.max(1, Number(lowStockThreshold) || 5),
        taxable,
        active,
        customizable,
        visual,
        promoLabel: promoLabel.trim() || undefined,
        description: description.trim() || undefined,
      },
      product?.id,
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[4px]"
    >
      <form
        onSubmit={handleSubmit}
        className="elevation-3 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#CBD5E1] bg-[#FFFFFF]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Manajemen Katalog Produk
            </p>
            <h2 id="product-modal-title" className="text-xl font-bold text-[#0F172A]">
              {isEdit ? `Edit Produk · ${product?.name}` : 'Tambah Produk Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal produk"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Two-Column Modal Body matching KassaPOS screenshot #3 */}
        <div className="pos-scroll grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[260px_1fr]">
          {/* Left Column: Visual, Barcode, Status Toggles */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <ProductVisual kind={visual} variant="lg" />
              <div className="mt-3">
                <label
                  htmlFor="prod-visual-select"
                  className="mb-1 block text-xs font-bold text-[#334155]"
                >
                  Tipe Visual Produk
                </label>
                <select
                  id="prod-visual-select"
                  value={visual}
                  onChange={(e) => setVisual(e.target.value as ProductVisualKind)}
                  className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs font-semibold text-[#0F172A] focus:border-2 focus:border-[#10B981] focus:outline-none"
                >
                  {VISUAL_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barcode Preview Box */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Preview Barcode / SKU
              </p>
              <BarcodeSvg code={sku || 'KSR-001'} />
              <button
                type="button"
                onClick={generateSku}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Generate SKU Otomatis
              </button>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[#334155]">
                <span>Tampilkan di Kasir</span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 accent-[#10B981]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[#334155]">
                <span>Kena Pajak (PB1 10%)</span>
                <input
                  type="checkbox"
                  checked={taxable}
                  onChange={(e) => setTaxable(e.target.checked)}
                  className="h-4 w-4 accent-[#10B981]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[#334155]">
                <span>Opsi Kustomisasi (Es/Gula)</span>
                <input
                  type="checkbox"
                  checked={customizable}
                  onChange={(e) => setCustomizable(e.target.checked)}
                  className="h-4 w-4 accent-[#10B981]"
                />
              </label>
            </div>
          </div>

          {/* Right Column: Detailed Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="prod-name" className="mb-1 block text-xs font-bold text-[#334155]">
                Nama Produk
              </label>
              <input
                id="prod-name"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kopi Susu Gula Aren"
                className="h-11 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-sm font-medium text-[#0F172A] focus:border-2 focus:border-[#10B981] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="prod-sku" className="mb-1 block text-xs font-bold text-[#334155]">
                  Kode SKU
                </label>
                <input
                  id="prod-sku"
                  required
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="tnum h-11 w-full rounded-lg border border-[#CBD5E1] px-3 font-mono text-sm font-semibold uppercase focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="prod-cat" className="mb-1 block text-xs font-bold text-[#334155]">
                  Kategori
                </label>
                <select
                  id="prod-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Exclude<CategoryId, 'all'>)}
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-sm font-medium focus:border-2 focus:border-[#10B981] focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prod-unit" className="mb-1 block text-xs font-bold text-[#334155]">
                  Satuan
                </label>
                <select
                  id="prod-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-sm font-medium focus:border-2 focus:border-[#10B981] focus:outline-none"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & Margin Box */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="prod-price"
                    className="mb-1 block text-xs font-bold text-[#334155]"
                  >
                    Harga Jual (Rp)
                  </label>
                  <input
                    id="prod-price"
                    required
                    type="number"
                    min="0"
                    step="500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="tnum h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-sm font-bold text-[#0F172A] focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-cost"
                    className="mb-1 block text-xs font-bold text-[#334155]"
                  >
                    Harga Modal / HPP (Rp)
                  </label>
                  <input
                    id="prod-cost"
                    type="number"
                    min="0"
                    step="500"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="tnum h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-sm font-bold text-[#0F172A] focus:border-2 focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 text-xs">
                <span className="font-medium text-[#64748B]">Estimasi Margin Keuntungan</span>
                <span
                  className={`tnum font-extrabold ${
                    profit >= 0 ? 'text-[#006C49]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatRp(profit)} ({marginPct}%)
                </span>
              </div>
            </div>

            {/* Stock & Threshold */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="prod-stock" className="mb-1 block text-xs font-bold text-[#334155]">
                  Stok Saat Ini
                </label>
                <input
                  id="prod-stock"
                  required
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="tnum h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm font-bold focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="prod-low" className="mb-1 block text-xs font-bold text-[#334155]">
                  Batas Stok Menipis
                </label>
                <input
                  id="prod-low"
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="tnum h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm font-bold focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="prod-promo" className="mb-1 block text-xs font-bold text-[#334155]">
                  Label Promo (Opsional)
                </label>
                <input
                  id="prod-promo"
                  type="text"
                  value={promoLabel}
                  onChange={(e) => setPromoLabel(e.target.value)}
                  placeholder="Terlaris / Baru"
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prod-desc" className="mb-1 block text-xs font-bold text-[#334155]">
                Deskripsi / Catatan Menu
              </label>
              <textarea
                id="prod-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan komposisi atau alergen..."
                className="w-full rounded-lg border border-[#CBD5E1] p-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-5 text-sm font-semibold text-[#334155] hover:bg-[#F1F5F9]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="h-11 rounded-lg bg-[#10B981] px-6 text-sm font-bold text-[#FFFFFF] transition-colors hover:bg-[#059669]"
          >
            {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </div>
  );
}
