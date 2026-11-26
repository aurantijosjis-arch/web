import {
  BarChart3,
  Clock,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { ScreenView } from '../types/pos';

interface SidebarProps {
  activeScreen: ScreenView;
  onSelectScreen: (screen: ScreenView) => void;
  heldCount: number;
  lowStockCount: number;
  branchName: string;
  cashierName: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeScreen,
  onSelectScreen,
  heldCount,
  lowStockCount,
  branchName,
  cashierName,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: {
    id: ScreenView;
    label: string;
    Icon: typeof ShoppingBag;
    badge?: number;
    badgeTone?: 'amber' | 'indigo';
  }[] = [
    { id: 'kasir', label: 'Kasir', Icon: ShoppingBag, badge: heldCount > 0 ? heldCount : undefined, badgeTone: 'amber' },
    { id: 'produk', label: 'Produk & Stok', Icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeTone: 'amber' },
    { id: 'riwayat', label: 'Riwayat Transaksi', Icon: ReceiptText },
    { id: 'shift', label: 'Shift Kasir', Icon: Clock },
    { id: 'laporan', label: 'Dashboard & Laporan', Icon: BarChart3 },
    { id: 'pengaturan', label: 'Pengaturan', Icon: Settings },
  ];

  const handleSelect = (id: ScreenView) => {
    onSelectScreen(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#FFFFFF]">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-5">
          <button
            type="button"
            onClick={() => handleSelect('kasir')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-[#FFFFFF] shadow-xs">
              <Store className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
              KASIR
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#334155] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Menu utama KASIR" className="space-y-1 px-3 py-4">
          {navItems.map(({ id, label, Icon, badge, badgeTone }) => {
            const active = activeScreen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                className={`flex h-11 w-full items-center justify-between rounded-lg px-3.5 text-left text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#10B981] text-[#FFFFFF] shadow-xs'
                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FFFFFF]' : 'text-[#64748B]'}`} />
                  <span className="truncate">{label}</span>
                </span>
                {badge !== undefined && (
                  <span
                    className={`tnum ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                        : badgeTone === 'amber'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#EEF2FF] text-[#4338CA]'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Outlet & Shift Card */}
      <div className="border-t border-[#E2E8F0] p-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Outlet Aktif
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-[#0F172A]">{branchName}</p>
          <p className="mt-0.5 truncate text-xs text-[#64748B]">
            Shift Pagi · {cashierName}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-[230px] shrink-0 border-r border-[#E2E8F0] bg-[#FFFFFF] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-[2px]"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-[260px] border-r border-[#E2E8F0] bg-[#FFFFFF]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
