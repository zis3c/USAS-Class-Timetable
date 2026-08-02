import { MapPin, Footprints } from 'lucide-react';

type CampusVenueBadgeProps = {
  location?: string;
};

export default function CampusVenueBadge({ location = 'Dewan / Makmal USAS' }: CampusVenueBadgeProps) {
  let blockTag = 'Blok Akademik USAS';
  let walkingTime = '2-4 mnt berjalan';
  let badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20';

  const locUpper = location.toUpperCase();

  if (locUpper.includes('MAKMAL') || locUpper.includes('MK')) {
    blockTag = 'Blok Makmal FTMK';
    walkingTime = '3 mnt dari DK';
    badgeColor = 'bg-[#002B5B] text-amber-300 border-amber-500/30';
  } else if (locUpper.includes('DEWAN KULIAH') || locUpper.includes('DK')) {
    blockTag = 'Kompleks Dewan Kuliah';
    walkingTime = '2 mnt dari Perpustakaan';
    badgeColor = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25';
  } else if (locUpper.includes('DEWAN BESAR')) {
    blockTag = 'Dewan Besar USAS';
    walkingTime = '5 mnt dari FTMK';
    badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
  } else if (locUpper.includes('BILIK MESYUARAT') || locUpper.includes('FTMK')) {
    blockTag = 'Bangunan Pentadbiran FTMK';
    walkingTime = '1 mnt dari Dekan';
    badgeColor = 'bg-purple-500/15 text-purple-300 border-purple-500/25';
  }

  return (
    <div className="flex items-center justify-between text-xs pt-1">
      <div className="flex items-start gap-2 text-slate-200 font-semibold">
        <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span className="truncate max-w-[180px]" title={location}>{location}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badgeColor}`}>
          {blockTag}
        </span>
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1" title="Anggaran Masa Berjalan">
          <Footprints className="w-3 h-3 text-amber-400" />
          <span>{walkingTime}</span>
        </span>
      </div>
    </div>
  );
}
