import { Badge } from "@/components/ui/badge";

type StatusType = "menunggu" | "disetujui" | "ditolak" | "dipinjam" | "dikembalikan" | "disiapkan" | "selesai" | "aktif" | "nonaktif";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase() as StatusType;
  
  let variantClass = "";
  
  switch (s) {
    case "menunggu":
      variantClass = "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      break;
    case "disetujui":
    case "aktif":
      variantClass = "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
      break;
    case "ditolak":
    case "nonaktif":
      variantClass = "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200";
      break;
    case "dipinjam":
    case "disiapkan":
      variantClass = "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      break;
    case "dikembalikan":
    case "selesai":
      variantClass = "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200";
      break;
    default:
      variantClass = "bg-gray-100 text-gray-800 border-gray-200";
  }

  return (
    <Badge variant="outline" className={`capitalize font-semibold px-2.5 py-0.5 ${variantClass}`}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
