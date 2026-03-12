import { useEffect } from "react";
import { useRoute } from "wouter";
import { useGetPermintaanBahanById } from "@workspace/api-client-react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function fmt(d?: string) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMMM yyyy", { locale: id }); } catch { return d; }
}

const LOGO = `${import.meta.env.BASE_URL}logo-poltekkes.png`;

export default function PrintPermintaan() {
  const [, params] = useRoute("/print/permintaan-bahan/:id");
  const itemId = params?.id ? parseInt(params.id) : 0;
  const { data, isLoading } = useGetPermintaanBahanById(itemId, { query: { enabled: !!itemId } });

  useEffect(() => {
    if (data) document.title = `Permintaan Bahan ${data.noPermintaan}`;
  }, [data]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan</div>;

  const user = data.user as any;
  const ditujukanKe = data.tujuan === "plp" ? `PLP: ${(data as any).plp?.nama || "-"}` : "Gudang";

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden bg-slate-100 border-b px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Preview cetak — Surat Permintaan Bahan</p>
        <Button onClick={() => window.print()} className="gap-2 rounded-xl">
          <Printer className="w-4 h-4" />Cetak Sekarang
        </Button>
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
            <div>No: <span className="font-mono font-bold text-slate-600">{data.noPermintaan}</span></div>
            <div>Tgl: {fmt(data.createdAt)}</div>
          </div>
        </div>

        {/* Judul */}
        <div className="text-center mb-4">
          <h2 className="text-[14px] font-bold uppercase tracking-widest">SURAT PERMINTAAN BAHAN HABIS PAKAI</h2>
        </div>

        {/* Info 2 kolom */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-[12px]">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              {[
                ["Tgl Permintaan", fmt(data.createdAt)],
                ["Tgl Dibutuhkan", fmt(data.tanggalDibutuhkan)],
                ["Nama Pemohon", user?.nama || "-"],
                ["NIM / NIP", user?.nim || user?.nip || "-"],
                ["Jurusan", user?.jurusan?.nama || "-"],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 px-3 font-semibold text-slate-600 w-32 bg-slate-50 whitespace-nowrap">{label}</td>
                  <td className="py-1.5 px-3">: {val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              {[
                ["Laboratorium", data.laboratorium?.nama || "-"],
                ["Ditujukan Ke", ditujukanKe],
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

        {/* Tabel Bahan */}
        <h3 className="font-bold text-[11px] mb-1.5 uppercase tracking-wide text-slate-700">Daftar Bahan yang Diminta</h3>
        <table className="w-full border border-slate-200 mb-4 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 w-6 text-center">No</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200">Nama Bahan</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 text-center w-16">Diminta</th>
              <th className="px-3 py-2 font-semibold border-b border-r border-slate-200 text-center w-16">Disetujui</th>
              <th className="px-3 py-2 font-semibold border-b border-slate-200 w-16">Satuan</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-1.5 text-center">{i + 1}</td>
                <td className="px-3 py-1.5 font-medium">{item.bahan?.nama}</td>
                <td className="px-3 py-1.5 text-center">{item.jumlahDiminta}</td>
                <td className="px-3 py-1.5 text-center font-bold text-teal-700">{item.jumlahDisetujui ?? "—"}</td>
                <td className="px-3 py-1.5">{item.bahan?.satuan}</td>
              </tr>
            ))}
            {(!data.items || data.items.length === 0) && (
              <tr><td colSpan={5} className="px-3 py-3 text-center text-slate-400 italic">Tidak ada item</td></tr>
            )}
          </tbody>
        </table>

        {data.catatan && (
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px]">
            <span className="font-semibold text-amber-800">Catatan Verifikator: </span>
            <span className="text-amber-700">{data.catatan}</span>
          </div>
        )}

        {/* TTD 3 kolom */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: "Pemohon", name: user?.nama },
            { label: "Mengetahui (Dosen/Ka. Jur)", name: "" },
            { label: data.tujuan === "plp" ? "PLP Laboratorium" : "Petugas Gudang", name: (data as any).plp?.nama || "" },
          ].map(({ label, name }) => (
            <div key={label} className="text-center text-[11px]">
              <p className="text-slate-600 font-medium">{label}</p>
              <div className="h-14 mt-1.5 mb-1 border-b border-slate-300"></div>
              <p className="font-semibold text-slate-800 truncate">{name || "( ________________________________ )"}</p>
              <p className="text-[10px] text-slate-500">NIM/NIP: ____________________</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Dicetak dari SIPELAB Poltekkes Kemenkes Tasikmalaya · {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
        </p>
      </div>
    </div>
  );
}
