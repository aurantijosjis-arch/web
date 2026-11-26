import { useMemo, useState } from 'react';
import { Download, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { CATEGORIES, formatRp } from '../data/posData';
import { CategoryId, Product, StockMovement } from '../types/pos';
import { ProductVisual } from './ProductVisual';

interface ProdukScreenProps {
  products: Product[];
  movements: StockMovement[];
  onAdjustStock: (productId: string, delta: number, note?: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

type StockFilter = 'all' | 'in' | 'low' | 'out';

export function ProdukScreen({
  products,
  movements,
  onAdjustStock,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
}: ProdukScreenProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const stats = useMemo(() => {
    const low = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const out = products.filter((p) => p.stock <= 0).length;
    const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
    return {
      totalSku: products.length,
      low,
      out,
      inventoryValue,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (stockFilter === 'in' && p.stock <= p.lowStockThreshold) return false;
      if (stockFilter === 'low' && (p.stock <= 0 || p.stock > p.lowStockThreshold)) return false;
      if (stockFilter === 'out' && p.stock > 0) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, categoryFilter, stockFilter, search]);

  const exportCsv = () => {
    const header = 'SKU,Nama Produk,Kategori,Harga Jual,Harga Modal,Stok,Satuan\n';
    const rows = products
      .map(
        (p) =>
          `${p.sku},"${p.name}",${p.category},${p.price},${p.costPrice},${p.stock},${p.unit}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasir-produk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="pos-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        {/* Top Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Daftar Produk &amp; Kelola Stok</h2>
            <p className="text-xs text-[#64748B]">
              Atur katalog menu, harga modal, margin keuntungan, dan stok harian outlet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-[#10B981] px-4 text-xs font-bold text-[#FFFFFF] hover:bg-[#059669]"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* 4-Column KPI Strip matching screenshot #1 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Total Produk Aktif</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#0F172A]">
              {stats.totalSku} SKU
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Stok Menipis</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#B45309]">
              {stats.low} Produk
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Nilai Modal Inventaris</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#006C49]">
              {formatRp(stats.inventoryValue)}
            </p>
          </div>
          <div className="elevation-1 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <p className="text-xs font-semibold text-[#64748B]">Stok Habis</p>
            <p className="tnum mt-1 text-2xl font-extrabold text-[#DC2626]">
              {stats.out} Produk
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk atau SKU..."
                aria-label="Cari produk"
                className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] pl-9 pr-3 text-sm focus:border-2 focus:border-[#10B981] focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter kategori"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryId)}
              className="h-10 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-xs font-semibold text-[#334155]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'in', label: 'Tersedia' },
                { id: 'low', label: 'Menipis' },
                { id: 'out', label: 'Habis' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStockFilter(tab.id)}
                className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-bold transition-colors ${
                  stockFilter === tab.id
                    ? 'border-[#0F172A] bg-[#0F172A] text-[#FFFFFF]'
                    : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:bg-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Table */}
        <div className="elevation-1 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  <th className="px-5 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Harga Jual</th>
                  <th className="px-4 py-3 text-right">HPP / Margin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Kelola Stok</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {filtered.map((item) => {
                  const isSoldOut = item.stock <= 0;
                  const isLow = item.stock > 0 && item.stock <= item.lowStockThreshold;
                  const catLabel =
                    CATEGORIES.find((c) => c.id === item.category)?.label ?? item.category;
                  const marginPct =
                    item.price > 0
                      ? Math.round(((item.price - item.costPrice) / item.price) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductVisual kind={item.visual} soldOut={isSoldOut} variant="sm" />
                          <div>
                            <p className="font-bold text-[#0F172A]">{item.name}</p>
                            <p className="tnum font-mono text-[11px] text-[#64748B]">
                              {item.sku} · {item.unit}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#334155]">
                        {catLabel}
                      </td>
                      <td className="tnum px-4 py-3 text-right font-extrabold text-[#0F172A]">
                        {formatRp(item.price)}
                      </td>
                      <td className="tnum px-4 py-3 text-right text-xs">
                        <span className="font-semibold text-[#334155]">
                          {formatRp(item.costPrice)}
                        </span>
                        <span className="ml-1.5 font-bold text-[#006C49]">({marginPct}%)</span>
                      </td>
                      <td className="px-4 py-3">
                        {isSoldOut ? (
                          <span className="rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#DC2626]">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#B45309]">
                            Menipis
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-[11px] font-bold text-[#005236]">
                            Tersedia
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
                            <button
                              type="button"
                              disabled={item.stock <= 0}
                              onClick={() =>
                                onAdjustStock(item.id, -1, 'Penyesuaian manual (-1)')
                              }
                              aria-label={`Kurangi stok ${item.name}`}
                              className="flex h-8 w-8 items-center justify-center font-bold text-[#334155] hover:bg-[#F1F5F9] disabled:text-[#CBD5E1]"
                            >
                              -
                            </button>
                            <span className="tnum w-9 text-center text-xs font-extrabold text-[#0F172A]">
                              {item.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onAdjustStock(item.id, 1, 'Penambahan manual (+1)')
                              }
                              aria-label={`Tambah stok ${item.name}`}
                              className="flex h-8 w-8 items-center justify-center font-bold text-[#334155] hover:bg-[#F1F5F9]"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(item.id, 10, 'Restock cepat (+10)')}
                            className="tnum h-8 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-[11px] font-bold text-[#006C49] hover:border-[#10B981]"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(item)}
                            aria-label={`Edit ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] hover:bg-[#F8FAFC]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(item.id)}
                            aria-label={`Hapus ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE2E2]/60 text-[#DC2626] hover:bg-[#FEE2E2]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stock Movements Table matching bottom of screenshot #1 */}
        <div className="elevation-1 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="border-b border-[#E2E8F0] px-5 py-3.5">
            <h3 className="text-sm font-bold text-[#0F172A]">Riwayat Perubahan Stok Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  <th className="px-5 py-2.5">Waktu</th>
                  <th className="px-4 py-2.5">Produk</th>
                  <th className="px-4 py-2.5">Aktivitas</th>
                  <th className="px-4 py-2.5">Catatan</th>
                  <th className="px-4 py-2.5 text-right">Perubahan</th>
                  <th className="px-5 py-2.5 text-right">Stok Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {movements.slice(0, 8).map((mov) => (
                  <tr key={mov.id} className="hover:bg-[#F8FAFC]">
                    <td className="tnum px-5 py-2.5 text-[#64748B]">
                      {new Date(mov.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#0F172A]">
                      {mov.productName}{' '}
                      <span className="font-mono text-[11px] text-[#64748B]">({mov.sku})</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          mov.type === 'Restock' || mov.type === 'Void'
                            ? 'bg-[#D1FAE5] text-[#005236]'
                            : mov.type === 'Penjualan'
                              ? 'bg-[#EEF2FF] text-[#4338CA]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#64748B]">{mov.note}</td>
                    <td
                      className={`tnum px-4 py-2.5 text-right font-extrabold ${
                        mov.delta >= 0 ? 'text-[#006C49]' : 'text-[#DC2626]'
                      }`}
                    >
                      {mov.delta >= 0 ? `+${mov.delta}` : mov.delta}
                    </td>
                    <td className="tnum px-5 py-2.5 text-right font-bold text-[#0F172A]">
                      {mov.resultingStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
