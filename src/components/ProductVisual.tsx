import { useMemo, useState } from 'react';
import {
  CakeSlice,
  Coffee,
  Croissant,
  CupSoda,
  Leaf,
  Package,
  Sandwich,
  Soup,
} from 'lucide-react';
import { ProductVisualKind } from '../types/pos';

interface ProductVisualProps {
  kind: ProductVisualKind;
  alt?: string;
  soldOut?: boolean;
  variant?: 'sm' | 'card' | 'lg';
}

const IMAGE_BY_KIND: Record<ProductVisualKind, string> = {
  latte: '/src/assets/images/menu_iced_kopi_susu_1795663767848.jpg',
  'caramel-latte': '/src/assets/images/menu_caramel_latte_1795663902716.jpg',
  espresso: '/src/assets/images/menu_hot_americano_1795663769099.jpg',
  coldbrew: '/src/assets/images/menu_cold_brew_bottle_1795663769296.jpg',
  bottle: '/src/assets/images/menu_cold_brew_bottle_1795663769296.jpg',
  concentrate: '/src/assets/images/menu_concentrate_500ml_1795663905263.jpg',
  matcha: '/src/assets/images/menu_matcha_latte_1795663769046.jpg',
  hojicha: '/src/assets/images/menu_hojicha_latte_1795663903478.jpg',
  tea: '/src/assets/images/menu_iced_tea_1795663769806.jpg',
  croissant: '/src/assets/images/menu_butter_croissant_1795663770161.jpg',
  'pain-au-chocolat': '/src/assets/images/menu_pain_au_chocolat_1795663904281.jpg',
  'morning-bun': '/src/assets/images/menu_morning_bun_1795663904053.jpg',
  pastry: '/src/assets/images/menu_basque_cheesecake_1795663771157.jpg',
  bowl: '/src/assets/images/menu_salmon_rice_bowl_1795663770579.jpg',
  sandwich: '/src/assets/images/menu_brioche_sandwich_1795663771489.jpg',
  'beef-melt': '/src/assets/images/menu_beef_sourdough_melt_1795663905301.jpg',
  beans: '/src/assets/images/menu_coffee_beans_bag_1795663770956.jpg',
};

const LABEL_BY_KIND: Record<ProductVisualKind, string> = {
  latte: 'Kopi Susu Gula Aren',
  'caramel-latte': 'Salted Caramel Latte',
  espresso: 'Double Shot Americano',
  coldbrew: 'Kyoto Cold Brew 250ml',
  bottle: 'Botol Cold Brew',
  concentrate: 'Cold Brew Concentrate 500ml',
  matcha: 'Uji Matcha Oat Latte',
  hojicha: 'Hojicha Roasted Latte',
  tea: 'Yuzu Sparkling Sencha',
  croissant: 'French Butter Croissant',
  'pain-au-chocolat': 'Pain au Chocolat',
  'morning-bun': 'Cardamom Morning Bun',
  pastry: 'Burnt Basque Cheesecake',
  bowl: 'Salmon Miso Rice Bowl',
  sandwich: 'Truffle Scrambled Brioche',
  'beef-melt': 'Smoked Beef Sourdough Melt',
  beans: 'Gayo Highland Beans 250g',
};

const FALLBACK_THEME: Record<
  ProductVisualKind,
  {
    gradient: string;
    iconColor: string;
    Icon: typeof Coffee;
  }
> = {
  espresso: { gradient: 'from-[#F5EFE6] to-[#E8DCCB]', iconColor: 'text-[#5C3D2E]', Icon: Coffee },
  latte: { gradient: 'from-[#FAF1E4] to-[#EEDAC0]', iconColor: 'text-[#8B5A2B]', Icon: CupSoda },
  'caramel-latte': { gradient: 'from-[#FEF3C7] to-[#FDE68A]', iconColor: 'text-[#92400E]', Icon: CupSoda },
  coldbrew: { gradient: 'from-[#EEF2FF] to-[#DBEAFE]', iconColor: 'text-[#3730A3]', Icon: CupSoda },
  concentrate: { gradient: 'from-[#EEF2FF] to-[#E0E7FF]', iconColor: 'text-[#312E81]', Icon: CupSoda },
  matcha: { gradient: 'from-[#ECFDF5] to-[#D1FAE5]', iconColor: 'text-[#047857]', Icon: Leaf },
  hojicha: { gradient: 'from-[#F5EFE6] to-[#E6D5B8]', iconColor: 'text-[#78350F]', Icon: Leaf },
  tea: { gradient: 'from-[#F0FDFA] to-[#CCFBF1]', iconColor: 'text-[#0F766E]', Icon: Leaf },
  croissant: { gradient: 'from-[#FFFBEB] to-[#FDE68A]/70', iconColor: 'text-[#B45309]', Icon: Croissant },
  'pain-au-chocolat': { gradient: 'from-[#FEF3C7] to-[#F59E0B]/30', iconColor: 'text-[#78350F]', Icon: Croissant },
  'morning-bun': { gradient: 'from-[#FFFBEB] to-[#FDE68A]', iconColor: 'text-[#92400E]', Icon: Croissant },
  pastry: { gradient: 'from-[#FFF1F2] to-[#FFE4E6]', iconColor: 'text-[#BE123C]', Icon: CakeSlice },
  bowl: { gradient: 'from-[#ECFDF5] to-[#E0F2FE]', iconColor: 'text-[#065F46]', Icon: Soup },
  sandwich: { gradient: 'from-[#FEF3C7]/70 to-[#FDE68A]/60', iconColor: 'text-[#92400E]', Icon: Sandwich },
  'beef-melt': { gradient: 'from-[#FFF1F2] to-[#FDE68A]/60', iconColor: 'text-[#9A3412]', Icon: Sandwich },
  beans: { gradient: 'from-[#F1F5F9] to-[#E2E8F0]', iconColor: 'text-[#334155]', Icon: Package },
  bottle: { gradient: 'from-[#EEF2FF] to-[#E0E7FF]', iconColor: 'text-[#4338CA]', Icon: CupSoda },
};

export function ProductVisual({
  kind,
  alt,
  soldOut = false,
  variant = 'sm',
}: ProductVisualProps) {
  const [imgError, setImgError] = useState(false);
  const src = IMAGE_BY_KIND[kind] || IMAGE_BY_KIND.espresso;
  const fallback = FALLBACK_THEME[kind] || FALLBACK_THEME.espresso;
  const Icon = fallback.Icon;
  const altText = alt || LABEL_BY_KIND[kind] || 'Foto menu produk';

  const containerClass =
    variant === 'lg'
      ? 'h-44 w-full rounded-2xl'
      : variant === 'card'
        ? 'aspect-[4/3] w-full rounded-xl'
        : 'h-10 w-10 shrink-0 rounded-lg';

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden bg-gradient-to-br ${
          soldOut ? 'from-slate-100 to-slate-200 text-slate-400' : `${fallback.gradient} ${fallback.iconColor}`
        } ${containerClass}`}
      >
        <Icon className={variant === 'lg' ? 'h-10 w-10' : variant === 'card' ? 'h-7 w-7' : 'h-5 w-5'} />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-[#F1F5F9] ${containerClass}`}>
      <img
        src={src}
        alt={altText}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgError(true)}
        className={`h-full w-full object-cover transition-transform duration-200 ${
          soldOut ? 'grayscale opacity-75' : 'group-hover:scale-[1.03]'
        }`}
      />
    </div>
  );
}

export function BarcodeSvg({ code }: { code: string }) {
  const bars = useMemo(() => {
    const widths: number[] = [];
    for (let i = 0; i < 36; i++) {
      const charCode = code.charCodeAt(i % code.length) || 65;
      widths.push(((charCode + i * 7) % 3) + 1);
    }
    return widths;
  }, [code]);

  let x = 2;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 28" className="h-7 w-40" aria-hidden="true">
        {bars.map((w, idx) => {
          const currentX = x;
          x += w + (idx % 2 === 0 ? 1.4 : 2.1);
          if (idx % 2 === 1) return null;
          return (
            <rect
              key={idx}
              x={currentX}
              y={2}
              width={w}
              height={24}
              fill="#0F172A"
              rx="0.3"
            />
          );
        })}
      </svg>
      <span className="tnum mt-0.5 font-mono text-[10px] tracking-[0.2em] text-[#334155]">
        {code}
      </span>
    </div>
  );
}

export function QrMatrixSvg({ seed, sizePx = 152 }: { seed: string; sizePx?: number }) {
  const gridDim = 15;
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const arr: boolean[] = [];
    for (let r = 0; r < gridDim; r++) {
      for (let c = 0; c < gridDim; c++) {
        const tl = r < 4 && c < 4;
        const tr = r < 4 && c >= gridDim - 4;
        const bl = r >= gridDim - 4 && c < 4;
        if (tl || tr || bl) {
          const lr = r >= gridDim - 4 ? r - (gridDim - 4) : r;
          const lc = c >= gridDim - 4 ? c - (gridDim - 4) : c;
          const border = lr === 0 || lr === 3 || lc === 0 || lc === 3;
          const center = lr >= 1 && lr <= 2 && lc >= 1 && lc <= 2;
          arr.push(border || center);
        } else {
          hash ^= (r * 31 + c * 17) & 0xff;
          hash = Math.imul(hash, 16777619);
          arr.push((hash >>> 0) % 10 > 4);
        }
      }
    }
    return arr;
  }, [seed]);

  return (
    <svg
      viewBox={`0 0 ${gridDim} ${gridDim}`}
      style={{ width: sizePx, height: sizePx }}
      className="rounded-lg bg-[#FFFFFF] p-2"
      role="img"
      aria-label="QRIS Kode Pembayaran"
    >
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const x = idx % gridDim;
        const y = Math.floor(idx / gridDim);
        return <rect key={idx} x={x} y={y} width="0.88" height="0.88" rx="0.14" fill="#0F172A" />;
      })}
    </svg>
  );
}
