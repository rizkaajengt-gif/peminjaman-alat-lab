import { useState } from "react";
import { useGetPeminjamanAlat, useGetPeminjamanRuangan, useGetPermintaanBahan, useUpdatePeminjamanAlatStatus, customFetch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardList, CalendarDays, FlaskConical, RotateCcw, CheckCircle2, Printer, MessageCircle, Ghost, PackageOpen } from "lucide-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function fmt(d?: string) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

function openPrint(type: string, itemId: number) {
  window.open(`${import.meta.env.BASE_URL}print/${type}/${itemId}`, "_blank");
}

const KONDISI_LABELS: Record<string, string> = {
  baik: "Baik / Dapat Digunakan",
  cacat: "Cacat (Kerusakan Ringan)",
  rusak: "Rusak Berat",
};

export default function PlpRiwayatPengembalian() {
  return (
    <div className="space-y-6">
      <PageHeader title="Riwayat & Pengembalian" description="Pantau riwayat peminjaman mahasiswa dan verifikasi kondisi pengembalian alat." />
      <Tabs defaultValue="aktif">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4 flex-wrap">
          <TabsTrigger value="aktif" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <PackageOpen className="w-4 h-4" />Sedang Dipinjam
          </TabsTrigger>
          <TabsTrigger value="pengembalian" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <RotateCcw className="w-4 h-4" />Pengembalian Alat
          </TabsTrigger>
          <TabsTrigger value="pengembalian-phantom" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Ghost className="w-4 h-4" />Pengembalian Phantom
          </TabsTrigger>
          <TabsTrigger value="laporan" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <CheckCircle2 className="w-4 h-4" />Laporan Pengembalian
          </TabsTrigger>
          <TabsTrigger value="riwayat-alat" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <ClipboardList className="w-4 h-4" />Riwayat Alat
          </TabsTrigger>
          <TabsTrigger value="riwayat-phantom" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Ghost className="w-4 h-4" />Riwayat Phantom
          </TabsTrigger>
          <TabsTrigger value="riwayat-ruangan" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <CalendarDays className="w-4 h-4" />Riwayat Ruangan
          </TabsTrigger>
          <TabsTrigger value="riwayat-bahan" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <FlaskConical className="w-4 h-4" />Riwayat Bahan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="aktif"><PeminjamanAktifTab /></TabsContent>
        <TabsContent value="pengembalian"><VerifikasiPengembalianTab /></TabsContent>
        <TabsContent value="pengembalian-phantom"><VerifikasiPengembalianPhantomTab /></TabsContent>
        <TabsContent value="laporan"><LaporanPengembalianTab /></TabsContent>
        <TabsContent value="riwayat-alat"><RiwayatAlatTab /></TabsContent>
        <TabsContent value="riwayat-phantom"><RiwayatPhantomTab /></TabsContent>
        <TabsContent value="riwayat-ruangan"><RiwayatRuanganTab /></TabsContent>
        <TabsContent value="riwayat-bahan"><RiwayatBahanTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PeminjamanAktifTab() {
  const { data: alatData, isLoading: loadingAlat } = useGetPeminjamanAlat({});
  const { data: phantomData, isLoading: loadingPhantom } = useQuery({
    queryKey: ["/api/peminjaman-phantom"],
    queryFn: () => customFetch("/api/peminjaman-phantom"),
    select: (d: any) => d as any[],
  });

  const aktifAlat = (alatData || []).filter(
    (p: any) => (p.status === "disetujui" || p.status === "dipinjam") && p.requestKembali !== "menunggu"
  );
  const aktifPhantom = (phantomData || []).filter(
    (p: any) => (p.status === "disetujui" || p.status === "dipinjam") && p.requestKembali !== "menunggu"
  );

  const loading = loadingAlat || loadingPhantom;
  const total = aktifAlat.length + aktifPhantom.length;

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm rounded-2xl p-4 bg-orange-50 border border-orange-100 flex items-start gap-3">
        <PackageOpen className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-orange-800 text-sm">Peminjaman Sedang Aktif — {total} item belum kembali</p>
          <p className="text-xs text-orange-600 mt-0.5">
            Gunakan tombol <strong>Hubungi via WA</strong> untuk mengingatkan mahasiswa/dosen agar segera mengembalikan. Tombol WA akan membuka WhatsApp dengan pesan pengingat yang sudah terisi otomatis.
          </p>
        </div>
      </Card>

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <ClipboardList className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Alat Sedang Dipinjam</h3>
          <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200">{aktifAlat.length} aktif</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-semibold">No. Peminjaman</TableHead>
              <TableHead className="font-semibold">Peminjam</TableHead>
              <TableHead className="font-semibold">Alat</TableHead>
              <TableHead className="font-semibold">Tgl Kembali</TableHead>
              <TableHead className="text-right font-semibold">WA Pengingat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            ) : aktifAlat.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada alat yang sedang dipinjam</TableCell></TableRow>
            ) : aktifAlat.map((p: any) => {
              const noWa = p.user?.noWa || p.user?.noHp;
              const pesan = `Halo ${p.user?.nama}, ini adalah pengingat bahwa Anda masih memiliki peminjaman alat (No. ${p.noPeminjaman}) yang belum dikembalikan. Mohon segera mengembalikan alat ke laboratorium ${p.laboratorium?.nama || ""}. Terima kasih.`;
              const terlambat = p.tanggalKembali && new Date(p.tanggalKembali) < new Date();
              return (
                <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.user?.nama}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.user?.nim || p.user?.role}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                    {p.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${terlambat ? "text-red-600 font-bold" : ""}`}>{fmt(p.tanggalKembali)}</span>
                    {terlambat && <div className="text-xs text-red-500 font-medium">Terlambat!</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    {noWa ? (
                      <a
                        href={`https://wa.me/${noWa.replace(/\D/g, "")}?text=${encodeURIComponent(pesan)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-medium whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Tidak ada WA</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Ghost className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Phantom Sedang Dipinjam</h3>
          <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-700 border-purple-200">{aktifPhantom.length} aktif</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-semibold">No. Peminjaman</TableHead>
              <TableHead className="font-semibold">Peminjam</TableHead>
              <TableHead className="font-semibold">Phantom</TableHead>
              <TableHead className="font-semibold">Tgl Kembali</TableHead>
              <TableHead className="text-right font-semibold">WA Pengingat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            ) : aktifPhantom.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada phantom yang sedang dipinjam</TableCell></TableRow>
            ) : aktifPhantom.map((p: any) => {
              const noWa = p.user?.noWa || p.user?.noHp;
              const pesan = `Halo ${p.user?.nama}, ini adalah pengingat bahwa Anda masih memiliki peminjaman phantom (No. ${p.noPeminjaman}) yang belum dikembalikan. Mohon segera mengembalikan ke laboratorium ${p.laboratorium?.nama || ""}. Terima kasih.`;
              const terlambat = p.tanggalKembali && new Date(p.tanggalKembali) < new Date();
              return (
                <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.user?.nama}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.user?.nim || p.user?.role}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                    {p.items?.map((i: any) => `${i.phantom?.nama} (${i.jumlah})`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${terlambat ? "text-red-600 font-bold" : ""}`}>{fmt(p.tanggalKembali)}</span>
                    {terlambat && <div className="text-xs text-red-500 font-medium">Terlambat!</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    {noWa ? (
                      <a
                        href={`https://wa.me/${noWa.replace(/\D/g, "")}?text=${encodeURIComponent(pesan)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-medium whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Tidak ada WA</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function VerifikasiPengembalianTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [kondisi, setKondisi] = useState("baik");
  const updateStatus = useUpdatePeminjamanAlatStatus();

  const { data: all, isLoading } = useGetPeminjamanAlat({});
  const pending = all?.filter((p: any) => (p.status === "disetujui" || p.status === "dipinjam") && p.requestKembali === "menunggu") || [];

  const handleVerifikasi = () => {
    if (!selected) return;
    updateStatus.mutate({ id: selected.id, data: { status: "dikembalikan", catatan, kondisiKembali: kondisi } as any }, {
      onSuccess: () => {
        toast({ title: "Pengembalian diverifikasi", description: `Kondisi alat: ${KONDISI_LABELS[kondisi]}` });
        setSelected(null); setCatatan(""); setKondisi("baik");
        qc.invalidateQueries({ queryKey: ["/api/peminjaman-alat"] });
      },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <RotateCcw className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Alat yang Menunggu Verifikasi Pengembalian</h3>
          <Badge variant="outline" className="ml-auto bg-orange-50 text-orange-700 border-orange-200">{pending.length} menunggu</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Peminjaman</TableHead>
            <TableHead className="font-semibold">Peminjam</TableHead>
            <TableHead className="font-semibold">Lab</TableHead>
            <TableHead className="font-semibold">Alat</TableHead>
            <TableHead className="font-semibold">Tgl Harus Kembali</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : pending.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada pengembalian yang perlu diverifikasi</TableCell></TableRow>
            : pending.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{p.user?.nama}</div>
                  <div className="text-xs text-muted-foreground">{p.user?.nim || p.user?.nip || p.user?.role}</div>
                  {(p.user?.noWa || p.user?.noHp) && (
                    <a href={`https://wa.me/${(p.user.noWa || p.user.noHp).replace(/\D/g, "")}?text=${encodeURIComponent(`Halo ${p.user?.nama}, mohon segera kembalikan alat peminjaman Anda (No. ${p.noPeminjaman}). Terima kasih.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 mt-0.5 font-medium">
                      <MessageCircle className="w-3 h-3" />Hubungi WA
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ")}</TableCell>
                <TableCell className="text-sm">{fmt(p.tanggalKembali)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" title="Cetak" onClick={() => openPrint("peminjaman-alat", p.id)}><Printer className="w-4 h-4" /></Button>
                  <Button size="sm" className="rounded-lg h-8 text-xs bg-orange-600 hover:bg-orange-700" onClick={() => { setSelected(p); setCatatan(""); setKondisi("baik"); }}>Verifikasi</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Verifikasi Pengembalian Alat</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Peminjam</span><span className="font-bold">{selected.user?.nama}</span></div>
                {(selected.user?.noWa || selected.user?.noHp) && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <a href={`https://wa.me/${(selected.user.noWa || selected.user.noHp).replace(/\D/g, "")}?text=${encodeURIComponent(`Halo ${selected.user?.nama}, mohon segera kembalikan alat peminjaman Anda (No. ${selected.noPeminjaman}) ke laboratorium ${selected.laboratorium?.nama || ""}. Terima kasih.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100">
                      <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                    </a>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Lab</span><span>{selected.laboratorium?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Alat</span><span className="text-right max-w-xs text-xs">{selected.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ")}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Kondisi Alat Dikembalikan *</Label>
                <Select value={kondisi} onValueChange={setKondisi}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik / Dapat Digunakan Kembali</SelectItem>
                    <SelectItem value="cacat">Cacat (Kerusakan Ringan)</SelectItem>
                    <SelectItem value="rusak">Rusak Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Catatan (Opsional)</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Deskripsi kondisi alat..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Batal</Button>
            <Button onClick={handleVerifikasi} disabled={updateStatus.isPending} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatus.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Konfirmasi Dikembalikan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LaporanPengembalianTab() {
  const { data, isLoading } = useGetPeminjamanAlat({ status: "dikembalikan" as any });

  const kondisiColor: Record<string, string> = {
    baik: "bg-green-50 text-green-700 border-green-200",
    cacat: "bg-amber-50 text-amber-700 border-amber-200",
    rusak: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <CheckCircle2 className="text-green-600 w-5 h-5" />
        <h3 className="font-semibold">Daftar Laporan Pengembalian Alat</h3>
        <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">{data?.length || 0} data</Badge>
      </div>
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">No. Peminjaman</TableHead>
          <TableHead className="font-semibold">Peminjam</TableHead>
          <TableHead className="font-semibold">Lab</TableHead>
          <TableHead className="font-semibold">Alat</TableHead>
          <TableHead className="font-semibold">Tgl Kembali</TableHead>
          <TableHead className="font-semibold">Kondisi</TableHead>
          <TableHead className="text-right font-semibold">Cetak</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : data?.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada data pengembalian</TableCell></TableRow>
          : data?.map((p: any) => (
            <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
              <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground">{p.user?.nim || p.user?.nip}</div></TableCell>
              <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{p.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ")}</TableCell>
              <TableCell className="text-sm">{fmt(p.tanggalDikembalikan)}</TableCell>
              <TableCell>
                {p.kondisiKembali ? (
                  <Badge variant="outline" className={`text-xs ${kondisiColor[p.kondisiKembali] || "bg-slate-50 text-slate-600"}`}>
                    {KONDISI_LABELS[p.kondisiKembali] || p.kondisiKembali}
                  </Badge>
                ) : <span className="text-muted-foreground text-xs">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => openPrint("peminjaman-alat", p.id)}><Printer className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RiwayatAlatTab() {
  const { data, isLoading } = useGetPeminjamanAlat({});
  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">No. Peminjaman</TableHead>
          <TableHead className="font-semibold">Peminjam</TableHead>
          <TableHead className="font-semibold">Lab</TableHead>
          <TableHead className="font-semibold">Alat</TableHead>
          <TableHead className="font-semibold">Tgl Pinjam</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="text-right">Cetak</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : data?.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
          : data?.map((p: any) => (
            <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
              <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
              <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{p.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ")}</TableCell>
              <TableCell className="text-sm">{fmt(p.tanggalPinjam)}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => openPrint("peminjaman-alat", p.id)}><Printer className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RiwayatRuanganTab() {
  const { data, isLoading } = useGetPeminjamanRuangan({});
  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">No. Peminjaman</TableHead>
          <TableHead className="font-semibold">Peminjam</TableHead>
          <TableHead className="font-semibold">Ruangan</TableHead>
          <TableHead className="font-semibold">Tanggal</TableHead>
          <TableHead className="font-semibold">Kategori</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : data?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
          : data?.map((p: any) => (
            <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
              <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
              <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
              <TableCell className="text-sm">{fmt(p.tanggalMulai)} — {fmt(p.tanggalSelesai)}</TableCell>
              <TableCell className="text-sm capitalize">{p.kategori?.replace(/_/g, " ")}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RiwayatBahanTab() {
  const { data, isLoading } = useGetPermintaanBahan({});
  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">No. Permintaan</TableHead>
          <TableHead className="font-semibold">Pemohon</TableHead>
          <TableHead className="font-semibold">Bahan</TableHead>
          <TableHead className="font-semibold">Tgl Dibutuhkan</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="text-right">Cetak</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : data?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
          : data?.map((p: any) => (
            <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs font-bold text-primary">{p.noPermintaan}</TableCell>
              <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{p.items?.map((i: any) => `${i.bahan?.nama} (${i.jumlahDiminta})`).join(", ")}</TableCell>
              <TableCell className="text-sm">{fmt(p.tanggalDibutuhkan)}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => openPrint("permintaan-bahan", p.id)}><Printer className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function VerifikasiPengembalianPhantomTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [kondisi, setKondisi] = useState("baik");

  const { data: all, isLoading } = useQuery({
    queryKey: ["/api/peminjaman-phantom"],
    queryFn: () => customFetch("/api/peminjaman-phantom"),
    select: (d: any) => d as any[],
  });
  const pending = all?.filter((p: any) => (p.status === "disetujui" || p.status === "dipinjam") && p.requestKembali === "menunggu") || [];

  const verifikasiMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      customFetch(`/api/peminjaman-phantom/${id}/status`, { method: "PUT", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      toast({ title: "Pengembalian phantom diverifikasi", description: `Kondisi: ${KONDISI_LABELS[kondisi]}` });
      setSelected(null); setCatatan(""); setKondisi("baik");
      qc.invalidateQueries({ queryKey: ["/api/peminjaman-phantom"] });
    },
    onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
  });

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Ghost className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Phantom Menunggu Verifikasi Pengembalian</h3>
          <Badge variant="outline" className="ml-auto bg-orange-50 text-orange-700 border-orange-200">{pending.length} menunggu</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Peminjaman</TableHead>
            <TableHead className="font-semibold">Peminjam</TableHead>
            <TableHead className="font-semibold">Phantom</TableHead>
            <TableHead className="font-semibold">Tgl Harus Kembali</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : pending.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Tidak ada pengembalian phantom yang perlu diverifikasi</TableCell></TableRow>
            : pending.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{p.user?.nama}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div>
                  {(p.user?.noWa || p.user?.noHp) && (
                    <a href={`https://wa.me/${(p.user.noWa || p.user.noHp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 font-medium mt-0.5">
                      <MessageCircle className="w-3 h-3" />{p.user.noWa || p.user.noHp}
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.items?.map((i: any) => `${i.phantom?.nama} (${i.jumlah})`).join(", ")}</TableCell>
                <TableCell className="text-sm">{fmt(p.tanggalKembali)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" title="Cetak" onClick={() => openPrint("peminjaman-phantom", p.id)}><Printer className="w-4 h-4" /></Button>
                  <Button size="sm" className="rounded-lg h-8 text-xs bg-orange-600 hover:bg-orange-700 ml-1" onClick={() => { setSelected(p); setCatatan(""); setKondisi("baik"); }}>Verifikasi</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Verifikasi Pengembalian Phantom</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Peminjam</span><span className="font-bold">{selected.user?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phantom</span><span className="text-right max-w-xs text-xs">{selected.items?.map((i: any) => `${i.phantom?.nama} (${i.jumlah})`).join(", ")}</span></div>
                {(selected.user?.noWa || selected.user?.noHp) && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <a href={`https://wa.me/${(selected.user.noWa || selected.user.noHp).replace(/\D/g, "")}?text=${encodeURIComponent(`Halo ${selected.user.nama}, tolong segera kembalikan phantom yang Anda pinjam (No. ${selected.noPeminjaman}). Terima kasih.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg px-2.5 py-1 font-medium transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Kondisi Phantom Dikembalikan *</Label>
                <Select value={kondisi} onValueChange={setKondisi}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik / Dapat Digunakan Kembali</SelectItem>
                    <SelectItem value="cacat">Cacat (Kerusakan Ringan)</SelectItem>
                    <SelectItem value="rusak">Rusak Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Catatan (Opsional)</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Deskripsi kondisi phantom..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Batal</Button>
            <Button onClick={() => verifikasiMutation.mutate({ id: selected.id, data: { status: "dikembalikan", catatan, kondisiKembali: kondisi } })}
              disabled={verifikasiMutation.isPending} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {verifikasiMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Konfirmasi Dikembalikan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RiwayatPhantomTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/peminjaman-phantom"],
    queryFn: () => customFetch("/api/peminjaman-phantom"),
    select: (d: any) => d as any[],
  });

  const kondisiColor: Record<string, string> = {
    baik: "bg-green-50 text-green-700 border-green-200",
    cacat: "bg-amber-50 text-amber-700 border-amber-200",
    rusak: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">No. Peminjaman</TableHead>
          <TableHead className="font-semibold">Peminjam</TableHead>
          <TableHead className="font-semibold">Lab</TableHead>
          <TableHead className="font-semibold">Phantom</TableHead>
          <TableHead className="font-semibold">Tgl Pinjam</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Kondisi</TableHead>
          <TableHead className="text-right">Cetak</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : !data?.length ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
          : data.map((p: any) => (
            <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
              <TableCell>
                <div className="font-medium text-sm">{p.user?.nama}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div>
                {(p.user?.noWa || p.user?.noHp) && (
                  <a href={`https://wa.me/${(p.user.noWa || p.user.noHp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 font-medium mt-0.5">
                    <MessageCircle className="w-3 h-3" />{p.user.noWa || p.user.noHp}
                  </a>
                )}
              </TableCell>
              <TableCell className="text-sm">{p.laboratorium?.nama || "-"}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{p.items?.map((i: any) => `${i.phantom?.nama} (${i.jumlah})`).join(", ")}</TableCell>
              <TableCell className="text-sm">{fmt(p.tanggalPinjam)}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell>
                {p.kondisiKembali ? (
                  <Badge variant="outline" className={`text-xs ${kondisiColor[p.kondisiKembali] || "bg-slate-50 text-slate-600"}`}>
                    {KONDISI_LABELS[p.kondisiKembali] || p.kondisiKembali}
                  </Badge>
                ) : <span className="text-muted-foreground text-xs">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => openPrint("peminjaman-phantom", p.id)}><Printer className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
