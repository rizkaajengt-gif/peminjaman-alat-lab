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

export default function PrintPermintaan() {
  const [match, params] = useRoute("/print/permintaan-bahan/:id");
  const itemId = params?.id ? parseInt(params.id) : 0;
  const { data, isLoading } = useGetPermintaanBahanById(itemId, { query: { enabled: !!itemId } });

  useEffect(() => {
    if (data) {
      document.title = `Permintaan Bahan ${data.noPermintaan}`;
    }
  }, [data]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  if (!data) return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Print controls - hidden on print */}
      <div className="print:hidden bg-slate-100 border-b px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Preview cetak surat permintaan bahan</p>
        <Button onClick={() => window.print()} className="gap-2 rounded-xl">
          <Printer className="w-4 h-4" />Cetak Sekarang
        </Button>
      </div>

      {/* Printable area */}
      <div className="max-w-[794px] mx-auto p-8 md:p-12 print:p-8">
        {/* Kop Surat */}
        <div className="border-b-4 border-teal-700 pb-4 mb-6 flex items-start gap-4">
          <div className="w-20 h-20 bg-teal-700/10 rounded-xl flex items-center justify-center text-4xl font-black text-teal-700">S</div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-medium">KEMENTERIAN KESEHATAN REPUBLIK INDONESIA</p>
            <h1 className="text-xl font-black text-slate-800 leading-tight">POLTEKKES KEMENKES TASIKMALAYA</h1>
            <p className="text-xs text-slate-500 mt-0.5">Jl. Cilolohan No. 35, Kahuripan, Tawang, Tasikmalaya 46115</p>
            <p className="text-xs text-slate-500">Telp: (0265) 340186 | www.poltekkestasikmalaya.ac.id</p>
          </div>
        </div>

        {/* Judul Surat */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">SURAT PERMINTAAN BAHAN HABIS PAKAI</h2>
          <p className="text-sm text-slate-500 mt-1">Nomor: {data.noPermintaan}</p>
        </div>

        {/* Info Utama */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Tanggal Permintaan", fmt(data.createdAt)],
                ["Tanggal Dibutuhkan", fmt(data.tanggalDibutuhkan)],
                ["Nama Pemohon", data.user?.nama || "-"],
                ["NIM / NIP", data.user?.nim || data.user?.nip || "-"],
                ["Jurusan", (data.user as any)?.jurusan?.nama || "-"],
                ["Laboratorium", data.laboratorium?.nama || "-"],
                [
                  "Ditujukan Kepada",
                  data.tujuan === "plp" ? `PLP: ${(data as any).plp?.nama || "-"}` : "Gudang"
                ],
                ["Keperluan / Tujuan", data.keperluan],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 w-48 bg-slate-50">{label}</td>
                  <td className="py-2.5 px-4">: {val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabel Bahan */}
        <h3 className="font-bold text-sm mb-2 uppercase tracking-wide text-slate-700">Daftar Bahan yang Diminta</h3>
        <table className="w-full border border-slate-200 rounded-xl overflow-hidden mb-8 text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-8">No</th>
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200">Nama Bahan</th>
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200 text-center">Jumlah Diminta</th>
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200 text-center">Jumlah Disetujui</th>
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200">Satuan</th>
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-center font-medium">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium">{item.bahan?.nama}</td>
                <td className="px-4 py-2.5 text-center">{item.jumlahDiminta}</td>
                <td className="px-4 py-2.5 text-center font-bold text-teal-700">{item.jumlahDisetujui || "—"}</td>
                <td className="px-4 py-2.5">{item.bahan?.satuan}</td>
                <td className="px-4 py-2.5 text-slate-400">—</td>
              </tr>
            ))}
            {(!data.items || data.items.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-4 text-center text-muted-foreground italic">Tidak ada item</td></tr>
            )}
          </tbody>
        </table>

        {data.catatan && (
          <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <p className="font-semibold text-amber-800">Catatan Verifikator:</p>
            <p className="text-amber-700 mt-1">{data.catatan}</p>
          </div>
        )}

        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {[
            { label: "Pemohon", name: data.user?.nama },
            { label: "Mengetahui (Dosen/Koordinator)", name: "" },
            { label: data.tujuan === "plp" ? "PLP Laboratorium" : "Petugas Gudang", name: (data as any).plp?.nama || "" },
          ].map(({ label, name }) => (
            <div key={label} className="text-center text-sm">
              <p className="text-slate-600 font-medium">{label}</p>
              <div className="h-16 mt-2 mb-1 border-b border-slate-300"></div>
              <p className="font-semibold text-slate-800 truncate">{name || "................................."}</p>
              <p className="text-xs text-slate-500">NIM/NIP: ..............................</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 print:mt-4">
          Dicetak dari SIPELAB Poltekkes Kemenkes Tasikmalaya · {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
        </p>
      </div>
    </div>
  );
}
