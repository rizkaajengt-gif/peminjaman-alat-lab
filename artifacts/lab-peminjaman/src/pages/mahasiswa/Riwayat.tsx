import { useGetPeminjamanAlat, useGetPeminjamanRuangan, useGetPermintaanBahan } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList, CalendarDays, FlaskConical, Printer } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useLocation } from "wouter";

function formatDate(d: string | undefined) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

export default function MahasiswaRiwayat() {
  const [, setLocation] = useLocation();
  const { data: peminjamanAlat, isLoading: l1 } = useGetPeminjamanAlat({});
  const { data: peminjamanRuangan, isLoading: l2 } = useGetPeminjamanRuangan({});
  const { data: permintaanBahan, isLoading: l3 } = useGetPermintaanBahan({});

  const openPrint = (type: string, id: number) => {
    window.open(`/lab-peminjaman/print/${type}/${id}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Riwayat Transaksi" description="Semua riwayat pengajuan peminjaman dan permintaan bahan Anda." />
      <Tabs defaultValue="alat">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4">
          <TabsTrigger value="alat" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <ClipboardList className="w-4 h-4" />Peminjaman Alat
          </TabsTrigger>
          <TabsTrigger value="ruangan" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <CalendarDays className="w-4 h-4" />Peminjaman Ruangan
          </TabsTrigger>
          <TabsTrigger value="bahan" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <FlaskConical className="w-4 h-4" />Permintaan Bahan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alat">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-semibold">No. Peminjaman</TableHead>
                <TableHead className="font-semibold">Laboratorium</TableHead>
                <TableHead className="font-semibold">Alat</TableHead>
                <TableHead className="font-semibold">Tgl Pinjam</TableHead>
                <TableHead className="font-semibold">Tgl Kembali</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {l1 ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                : peminjamanAlat?.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
                : peminjamanAlat?.map(p => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.noPeminjaman}</TableCell>
                    <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{p.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ") || "-"}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.tanggalPinjam)}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.tanggalKembali)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" title="Cetak Surat" onClick={() => openPrint("peminjaman-alat", p.id)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ruangan">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-semibold">No. Peminjaman</TableHead>
                <TableHead className="font-semibold">Laboratorium</TableHead>
                <TableHead className="font-semibold">Kategori & Judul</TableHead>
                <TableHead className="font-semibold">Tanggal</TableHead>
                <TableHead className="font-semibold">Waktu</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {l2 ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                : peminjamanRuangan?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
                : peminjamanRuangan?.map(p => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.noPeminjaman}</TableCell>
                    <TableCell className="text-sm">{(p as any).laboratorium?.nama}</TableCell>
                    <TableCell className="text-sm max-w-xs">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-md px-1.5 py-0.5">
                        {{pembelajaran:"Pembelajaran",penelitian:"Penelitian",pengabdian_masyarakat:"Pengabdian"}[(p as any).kategori] || (p as any).kategori || "-"}
                      </span>
                      {(p as any).judulKegiatan && <div className="text-xs text-muted-foreground truncate mt-0.5">{(p as any).judulKegiatan}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(p.tanggalMulai)}</TableCell>
                    <TableCell className="text-sm">{p.waktuMulai?.slice(0, 5)} - {p.waktuSelesai?.slice(0, 5)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="bahan">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-semibold">No. Permintaan</TableHead>
                <TableHead className="font-semibold">Keperluan</TableHead>
                <TableHead className="font-semibold">Bahan Diminta</TableHead>
                <TableHead className="font-semibold">Tujuan</TableHead>
                <TableHead className="font-semibold">Tgl Dibutuhkan</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {l3 ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                : permintaanBahan?.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
                : permintaanBahan?.map(p => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.noPermintaan}</TableCell>
                    <TableCell className="text-sm max-w-[140px] truncate">{p.keperluan}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{p.items?.map((i: any) => `${i.bahan?.nama} (${i.jumlahDiminta})`).join(", ") || "-"}</TableCell>
                    <TableCell className="text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${(p as any).tujuan === "plp" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        {(p as any).tujuan === "plp" ? "PLP" : "Gudang"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(p.tanggalDibutuhkan)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" title="Cetak Surat" onClick={() => openPrint("permintaan-bahan", p.id)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
