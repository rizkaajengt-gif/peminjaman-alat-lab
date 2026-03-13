import { useEffect } from "react";
import { useRoute } from "wouter";
import { useGetPeminjamanAlatById } from "@workspace/api-client-react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function fmt(d?: string) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMMM yyyy", { locale: id }); } catch { return d; }
}

const LOGO = `${import.meta.env.BASE_URL}logo-poltekkes.png`;

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

export default function PrintPeminjaman() {
  const [, params] = useRoute("/print/peminjaman-alat/:id");
  const itemId = params?.id ? parseInt(params.id) : 0;
  const { data, isLoading } = useGetPeminjamanAlatById(itemId, { query: { enabled: !!itemId } });

  useEffect(() => {
    if (data) document.title = `Peminjaman Alat ${data.noPeminjaman}`;
  }, [data]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan</div>;

  const user = data.user as any;
  const nimNip = user?.nim || user?.nip || null;

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden bg-slate-100 border-b px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Preview cetak — Surat Peminjaman Alat</p>
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
            <div>No: <span className="font-mono font-bold text-slate-600">{data.noPeminjaman}</span></div>
            <div>Tgl: {fmt(data.createdAt)}</div>
          </div>
        </div>

        {/* Judul */}
        <div className="text-center mb-4">
          <h2 className="text-[14px] font-bold uppercase tracking-widest">SURAT PEMINJAMAN ALAT LABORATORIUM</h2>
        </div>

        {/* Info 2 kolom */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-[12px]">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              {[
                ["Tanggal Pengajuan", fmt(data.createdAt)],
                ["Nama Peminjam", user?.nama || "-"],
                ["NIM / NIP", nimNip || "-"],
                ["Jurusan", user?.jurusan?.nama || "-"],
                ["No. WhatsApp", user?.noWa || user?.noHp || "-"],
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
                ["Laboratorium", data.laboratorium?.nama || "-"],
                ["Tgl Pinjam", fmt(data.tanggalPinjam)],
                ["Tgl Kembali", fmt(data.tanggalKembali)],
                ["Keperluan", data.keperluan],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 px-3 font-semibold text-slate-600 w-28 bg-slate-50 whitespace-nowrap">{label}</td>
                  <td className="py-1.5 px-3">: {val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabel Alat */}
        <h3 className="font-bold text-[11px] mb-1.5 uppercase tracking-wide text-slate-700">Daftar Alat yang Dipinjam</h3>
        <table className="w-full border border-slate-200 mb-4 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 w-6 text-center">No</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 w-20">Kode</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200">Nama Alat</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 text-center w-12">Jml</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 w-14">Satuan</th>
              <th className="px-3 py-2 font-semibold border-b border-slate-200">Kondisi Kembali</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-1.5 text-center">{i + 1}</td>
                <td className="px-3 py-1.5 font-mono text-[10px]">{item.alat?.kode}</td>
                <td className="px-3 py-1.5 font-medium">{item.alat?.nama}</td>
                <td className="px-3 py-1.5 text-center font-bold">{item.jumlah}</td>
                <td className="px-3 py-1.5">{item.alat?.satuan}</td>
                <td className="px-3 py-1.5 text-slate-300">______________</td>
              </tr>
            ))}
            {(!data.items || data.items.length === 0) && (
              <tr><td colSpan={6} className="px-3 py-3 text-center text-slate-400 italic">Tidak ada item</td></tr>
            )}
          </tbody>
        </table>

        {(data as any).kondisiKembali && (
          <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px]">
            <span className="font-semibold text-blue-800">Kondisi Pengembalian: </span>
            <span className="text-blue-700 capitalize">{(data as any).kondisiKembali}</span>
          </div>
        )}

        {(data as any).catatanPlp && (
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px]">
            <span className="font-semibold text-amber-800">Catatan PLP: </span>
            <span className="text-amber-700">{(data as any).catatanPlp}</span>
          </div>
        )}

        {/* TTD 2 kolom: Peminjam + PLP */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          <TTDBox
            label="Peminjam"
            nama={user?.nama}
            nimNip={nimNip}
            tandaTangan={user?.tandaTangan}
          />
          <TTDBox
            label="PLP / Pengelola Lab"
            nama=""
            nimNip={null}
            tandaTangan={null}
          />
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Dicetak dari SIPELAB Poltekkes Kemenkes Tasikmalaya · {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
        </p>
      </div>
    </div>
  );
}
