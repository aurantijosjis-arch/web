import { useEffect, useState } from 'react';
import { Menu, Printer } from 'lucide-react';
import { ScreenView } from '../types/pos';

interface HeaderBarProps {
  activeScreen: ScreenView;
  branchName: string;
  cashierName: string;
  onOpenMobileNav: () => void;
  onOpenShift: () => void;
}

const SCREEN_TITLES: Record<ScreenView, string> = {
  kasir: 'Tampilan Kasir',
  produk: 'Produk & Kelola Stok',
  riwayat: 'Riwayat Transaksi',
  shift: 'Shift Kasir & Rekonsiliasi',
  laporan: 'Dashboard & Laporan',
  pengaturan: 'Pengaturan Toko',
};

export function HeaderBar({
  activeScreen,
  branchName,
  cashierName,
  onOpenMobileNav,
  onOpenShift,
}: HeaderBarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const initials = cashierName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Buka menu navigasi"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[#334155] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-[#0F172A] sm:text-lg">
            {SCREEN_TITLES[activeScreen]}
          </h1>
          <p className="hidden truncate text-xs text-[#64748B] sm:block">
            {branchName} ·{' '}
            <span className="tnum">
              {now.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>{' '}
            ·{' '}
            <span className="tnum">
              {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
        <div className="hidden items-center gap-1.5 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-bold text-[#005236] md:inline-flex">
          <Printer className="h-3.5 w-3.5" />
          <span>Printer Siap</span>
        </div>

        <button
          type="button"
          onClick={onOpenShift}
          className="hidden h-9 items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-bold text-[#334155] transition-colors hover:border-[#CBD5E1] hover:text-[#0F172A] sm:inline-flex"
        >
          Shift Aktif
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-extrabold text-[#4338CA]">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-bold leading-tight text-[#0F172A]">{cashierName}</p>
            <p className="text-[11px] leading-tight text-[#64748B]">Kasir Utama</p>
          </div>
        </div>
      </div>
    </header>
  );
}
