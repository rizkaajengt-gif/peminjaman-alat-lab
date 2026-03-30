import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function fmt(d?: string) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMMM yyyy", { locale: id }); } catch { return d; }
}

const LOGO = `${import.meta.env.BASE_URL}logo-poltekkes.png`;

const KATEGORI_LABEL: Record<string, string> = {
  pembelajaran: "Pembelajaran / Praktikum",
  penelitian: "Penelitian",
  pengabdian_masyarakat: "Pengabdian Masyarakat",
};

function TTDBox({ label, nama, nimNip, tandaTangan }: { label: string; nama?: string; nimNip?: string; tandaTangan?: string | null }) {
  return (
    <div className="text-center text-[11px]">
      <p className="text-slate-600 font-medium mb-1">{label}</p>
      <div className="border border-slate-200 rounded-lg bg-slate-50/50 flex items-end justify-center" style={{ height: 80 }}>
        {tandaTangan ? (
          <img src={tandaTangan} alt="tanda tangan" className="max-h-full max-w-full object-contain p-1" />
        ) : (
          <div className="w-full border-b border-dashed border-slate-300 mx-4 mb-2" />
        )}
      </div>
      <p className="font-semibold text-slate-800 mt-1 truncate">{nama || "( ________________________________ )"}</p>
      <p className="text-[10px] text-slate-500">{nimNip ? `NIM/NIP: ${nimNip}` : "NIM/NIP: ____________________"}</p>
    </div>
  );
}

export default function PrintPeminjamanRuangan() {
  const [, params] = useRoute("/print/peminjaman-ruangan/:id");
  const itemId = params?.id ? parseInt(params.id) : 0;
  const { data, isLoading } = useQuery({
    queryKey: ["/api/peminjaman-ruangan", itemId],
    queryFn: () => customFetch(`/api/peminjaman-ruangan/${itemId}`),
    enabled: !!itemId,
  });

  useEffect(() => {
    if (data) document.title = `Peminjaman Ruangan ${(data as any).noPeminjaman}`;
  }, [data]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan</div>;

  const d = data as any;
  const user = d.user as any;
  const nimNip = user?.nim || user?.nip || null;
  const plp = d.verifikator as any;
  const plpNip = plp?.nip || plp?.nim || null;

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden bg-slate-100 border-b px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Preview cetak — Surat Peminjaman Ruangan Lab</p>
        <Button onClick={() => window.print()} className="gap-2 rounded-xl"><Printer className="w-4 h-4" />Cetak Sekarang</Button>
      </div>

      <div className="max-w-[794px] mx-auto p-6 print:p-6 text-[13px]">
        {/* Kop Surat */}
        <div className="border-b-[3px] border-teal-700 pb-3 mb-4 flex items-center gap-3">
          <img src={LOGO} alt="Logo Poltekkes" className="w-16 h-16 object-contain print:w-14 print:h-14" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">KEMENTERIAN KESEHATAN REPUBLIK INDONESIA</p>
            <h1 className="text-[17px] font-black text-slate-800 leading-tight">POLTEKKES KEMENKES TASIKMALAYA</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Jl. Cilolohan No. 35, Kahuripan, Tawang, Tasikmalaya 46115 · Telp: (0265) 340186</p>
          </div>
          <div className="text-right text-[10px] text-slate-400 leading-relaxed">
            <div>No: <span className="font-mono font-bold text-slate-600">{d.noPeminjaman}</span></div>
            <div>Tgl: {fmt(d.createdAt)}</div>
          </div>
        </div>

        {/* Judul */}
        <div className="text-center mb-4">
          <h2 className="text-[14px] font-bold uppercase tracking-widest">SURAT PEMINJAMAN RUANGAN LABORATORIUM</h2>
        </div>

        {/* Info 2 kolom */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-[12px]">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              {[
                ["Tanggal Pengajuan", fmt(d.createdAt)],
                ["Nama Pemohon", user?.nama || "-"],
                ["NIM / NIP", nimNip || "-"],
                ["Jurusan", user?.jurusan?.nama || "-"],
                ["No. WhatsApp", (user?.noWa || user?.noHp) || "-"],
                ["Jumlah Peserta", d.jumlahPeserta ? `${d.jumlahPeserta} orang` : "-"],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 px-3 font-semibold text-slate-600 w-36 bg-slate-50 whitespace-nowrap">{label}</td>
                  <td className="py-1.5 px-3">: {val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              {[
                ["Laboratorium", d.laboratorium?.nama || "-"],
                ["Kategori Kegiatan", KATEGORI_LABEL[d.kategori] || d.kategori || "-"],
                ["Judul Kegiatan", d.judulKegiatan || "-"],
                ["Tanggal Mulai", fmt(d.tanggalMulai)],
                ["Tanggal Selesai", fmt(d.tanggalSelesai)],
                ["Waktu", d.waktuMulai && d.waktuSelesai ? `${d.waktuMulai.slice(0,5)} – ${d.waktuSelesai.slice(0,5)} WIB` : "-"],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 px-3 font-semibold text-slate-600 w-32 bg-slate-50 whitespace-nowrap">{label}</td>
                  <td className="py-1.5 px-3">: {val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keperluan */}
        <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden text-[12px]">
          <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">Keperluan / Tujuan Kegiatan</div>
          <div className="px-3 py-2.5 text-slate-700">{d.keperluan || "-"}</div>
        </div>

        {d.catatanPlp && (
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px]">
            <span className="font-semibold text-amber-800">Catatan PLP: </span>
            <span className="text-amber-700">{d.catatanPlp}</span>
          </div>
        )}

        {/* Status */}
        <div className="mb-4 flex items-center gap-3 text-[12px]">
          <span className="font-semibold text-slate-600">Status:</span>
          <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
            d.status === "disetujui" ? "bg-green-100 text-green-700" :
            d.status === "ditolak" ? "bg-red-100 text-red-700" :
            d.status === "menunggu" ? "bg-amber-100 text-amber-700" :
            "bg-slate-100 text-slate-700"
          }`}>
            {d.status === "disetujui" ? "Disetujui" : d.status === "ditolak" ? "Ditolak" : d.status === "menunggu" ? "Menunggu Verifikasi" : d.status}
          </span>
        </div>

        {/* TTD */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          <TTDBox label="Pemohon" nama={user?.nama} nimNip={nimNip} tandaTangan={user?.tandaTangan} />
          <TTDBox label="PLP / Pengelola Lab" nama={plp?.nama} nimNip={plpNip} tandaTangan={plp?.tandaTangan} />
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Dicetak dari SIPELAB Poltekkes Kemenkes Tasikmalaya · {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
        </p>
      </div>
    </div>
  );
}
