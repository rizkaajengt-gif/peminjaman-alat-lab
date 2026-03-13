import { useState, useMemo } from "react";
import { useGetBahan, useGetAlat, useUpdateBahan } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, ArrowDownToLine, AlertTriangle, History, Wrench, Ghost } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function usePlpLabIds() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["/api/plp-laboratorium", user?.id],
    queryFn: () => customFetch(`/api/plp-laboratorium?plpId=${user!.id}`),
    enabled: !!user?.id,
    select: (d: any) => (d as any[]).map((a: any) => a.laboratoriumId as number),
  });
  return data || [];
}

function fmt(d: string | undefined) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

export default function PlpStokLab() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris & Stok Lab" description="Alat, bahan, dan phantom di laboratorium yang Anda tangani." />
      <Tabs defaultValue="bahan">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4 flex-wrap">
          <TabsTrigger value="alat" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Wrench className="w-4 h-4" />Alat Lab
          </TabsTrigger>
          <TabsTrigger value="bahan" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Package className="w-4 h-4" />Bahan Lab
          </TabsTrigger>
          <TabsTrigger value="phantom" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Ghost className="w-4 h-4" />Phantom
          </TabsTrigger>
          <TabsTrigger value="transfer" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <ArrowDownToLine className="w-4 h-4" />Minta Stok Gudang
          </TabsTrigger>
          <TabsTrigger value="riwayat-transfer" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <History className="w-4 h-4" />Riwayat Permintaan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="alat"><AlatLabTab /></TabsContent>
        <TabsContent value="bahan"><StokLabTab /></TabsContent>
        <TabsContent value="phantom"><PhantomLabTab /></TabsContent>
        <TabsContent value="transfer"><MintaStokTab /></TabsContent>
        <TabsContent value="riwayat-transfer"><RiwayatTransferTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AlatLabTab() {
  const labIds = usePlpLabIds();
  const { data: alat, isLoading } = useGetAlat({});
  const filtered = useMemo(() => (alat || []).filter((a: any) => labIds.length === 0 || labIds.includes(a.laboratoriumId)), [alat, labIds]);

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <Wrench className="text-primary w-5 h-5" />
        <h3 className="font-semibold">Alat di Lab Saya</h3>
        <Badge variant="outline" className="ml-auto bg-slate-50 text-slate-600">{filtered.length} item</Badge>
      </div>
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">Kode</TableHead>
          <TableHead className="font-semibold">Nama Alat</TableHead>
          <TableHead className="font-semibold">Lab</TableHead>
          <TableHead className="font-semibold text-center">Stok Total</TableHead>
          <TableHead className="font-semibold text-center">Stok Tersedia</TableHead>
          <TableHead className="font-semibold">Kondisi</TableHead>
          <TableHead className="font-semibold">Satuan</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{labIds.length === 0 ? "Belum ada lab yang ditugaskan" : "Tidak ada alat di lab Anda"}</TableCell></TableRow>
          : filtered.map((a: any) => (
            <TableRow key={a.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs">{a.kode}</TableCell>
              <TableCell className="font-semibold">{a.nama}</TableCell>
              <TableCell className="text-sm">{a.laboratorium?.nama}</TableCell>
              <TableCell className="text-center font-bold text-primary">{a.stok}</TableCell>
              <TableCell className="text-center">
                <span className={`font-bold ${a.stokTersedia < 1 ? "text-red-600" : "text-teal-600"}`}>{a.stokTersedia}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${{ baik: "bg-green-50 text-green-700 border-green-200", rusak_ringan: "bg-yellow-50 text-yellow-700 border-yellow-200", rusak_berat: "bg-red-50 text-red-700 border-red-200" }[a.kondisi] || ""}`}>
                  {a.kondisi?.replace("_", " ") || "-"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{a.satuan}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function PhantomLabTab() {
  const labIds = usePlpLabIds();
  const { data: phantomData, isLoading } = useQuery({
    queryKey: ["/api/phantom"],
    queryFn: () => customFetch("/api/phantom"),
    select: (d: any) => d as any[],
  });
  const filtered = useMemo(() => (phantomData || []).filter((p: any) => labIds.length === 0 || labIds.includes(p.laboratoriumId)), [phantomData, labIds]);

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <Ghost className="text-primary w-5 h-5" />
        <h3 className="font-semibold">Phantom di Lab Saya</h3>
        <Badge variant="outline" className="ml-auto bg-slate-50 text-slate-600">{filtered.length} item</Badge>
      </div>
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">Kode</TableHead>
          <TableHead className="font-semibold">Nama Phantom</TableHead>
          <TableHead className="font-semibold">Lab</TableHead>
          <TableHead className="font-semibold text-center">Stok Total</TableHead>
          <TableHead className="font-semibold text-center">Stok Tersedia</TableHead>
          <TableHead className="font-semibold">Kondisi</TableHead>
          <TableHead className="font-semibold">Satuan</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{labIds.length === 0 ? "Belum ada lab yang ditugaskan" : "Tidak ada phantom di lab Anda"}</TableCell></TableRow>
          : filtered.map((p: any) => (
            <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-mono text-xs">{p.kode}</TableCell>
              <TableCell className="font-semibold">{p.nama}</TableCell>
              <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
              <TableCell className="text-center font-bold text-primary">{p.stok}</TableCell>
              <TableCell className="text-center">
                <span className={`font-bold ${p.stokTersedia < 1 ? "text-red-600" : "text-teal-600"}`}>{p.stokTersedia}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${{ baik: "bg-green-50 text-green-700 border-green-200", rusak_ringan: "bg-yellow-50 text-yellow-700 border-yellow-200", rusak_berat: "bg-red-50 text-red-700 border-red-200" }[p.kondisi] || ""}`}>
                  {p.kondisi?.replace("_", " ") || "-"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.satuan}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function StokLabTab() {
  const labIds = usePlpLabIds();
  const { data: bahanAll, isLoading } = useGetBahan({});
  const bahan = useMemo(() => (bahanAll || []).filter((b: any) => labIds.length === 0 || labIds.includes(b.laboratoriumId)), [bahanAll, labIds]);
  const lowStock = bahan?.filter(b => b.stok <= b.stokMinimal) || [];

  return (
    <>
      {lowStock.length > 0 && (
        <Card className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Stok Menipis — Segera Minta ke Gudang</p>
            <p className="text-sm text-amber-700">{lowStock.map(b => `${b.nama} (sisa ${b.stok} ${b.satuan})`).join(", ")}</p>
          </div>
        </Card>
      )}

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Package className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Stok Bahan di Lab</h3>
          <Badge variant="outline" className="ml-auto bg-slate-50 text-slate-600">{bahan?.length || 0} item</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">Kode</TableHead>
            <TableHead className="font-semibold">Nama Bahan</TableHead>
            <TableHead className="font-semibold">Lab</TableHead>
            <TableHead className="font-semibold text-center text-teal-700">Stok Lab (PLP)</TableHead>
            <TableHead className="font-semibold text-center text-blue-700">Stok Gudang</TableHead>
            <TableHead className="font-semibold text-center">Min. Stok</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : bahan?.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Tidak ada data bahan</TableCell></TableRow>
            : bahan?.map(b => {
              const stokGudang = (b as any).stokGudang ?? 0;
              const isLow = b.stok <= b.stokMinimal;
              return (
                <TableRow key={b.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs">{b.kode}</TableCell>
                  <TableCell className="font-semibold">{b.nama}</TableCell>
                  <TableCell className="text-sm">{b.laboratorium?.nama}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-lg ${isLow ? "text-amber-600" : "text-teal-600"}`}>{b.stok}</span>
                    <div className="text-xs text-muted-foreground">{b.satuan}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-blue-600">{stokGudang}</span>
                    <div className="text-xs text-muted-foreground">{b.satuan}</div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{b.stokMinimal}</TableCell>
                  <TableCell>
                    {isLow
                      ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Stok Rendah</Badge>
                      : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Normal</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function MintaStokTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: bahan } = useGetBahan({});
  const [bahanId, setBahanId] = useState("");
  const [laboratoriumId, setLaboratoriumId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");

  const selectedBahan = bahan?.find(b => String(b.id) === bahanId);

  const requestMutation = useMutation({
    mutationFn: (body: any) => customFetch("/api/transfer-bahan", {
      method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
    }),
    onSuccess: () => {
      toast({ title: "Permintaan transfer dikirim ke gudang", description: "Gudang akan memproses permintaan Anda." });
      setBahanId(""); setLaboratoriumId(""); setJumlah(""); setCatatan("");
      qc.invalidateQueries({ queryKey: ["/api/transfer-bahan"] });
    },
    onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message || "Gagal mengirim permintaan" }),
  });

  const handleSubmit = () => {
    if (!bahanId || !laboratoriumId || !jumlah || Number(jumlah) <= 0) {
      toast({ variant: "destructive", description: "Lengkapi semua data" }); return;
    }
    requestMutation.mutate({ bahanId: Number(bahanId), laboratoriumId: Number(laboratoriumId), jumlah: Number(jumlah), catatanPlp: catatan });
  };

  const labs = [...new Set(bahan?.map(b => b.laboratoriumId))]
    .map(id => bahan?.find(b => b.laboratoriumId === id)?.laboratorium)
    .filter(Boolean);

  return (
    <div className="max-w-lg mx-auto">
      <Card className="p-6 rounded-2xl border-none shadow-lg space-y-5">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Form Permintaan Stok ke Gudang</h3>
        </div>

        <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
          <p className="font-medium">Cara kerja transfer stok:</p>
          <p className="mt-1 text-xs">PLP mengajukan permintaan stok dari gudang pusat → Gudang menyetujui → Stok gudang berkurang, stok lab bertambah.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="font-semibold">Laboratorium *</Label>
          <Select value={laboratoriumId} onValueChange={v => { setLaboratoriumId(v); setBahanId(""); }}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Pilih laboratorium..." />
            </SelectTrigger>
            <SelectContent>
              {labs.map((lab: any) => (
                <SelectItem key={lab.id} value={String(lab.id)}>{lab.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="font-semibold">Bahan yang Diminta *</Label>
          <Select value={bahanId} onValueChange={setBahanId} disabled={!laboratoriumId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Pilih bahan..." />
            </SelectTrigger>
            <SelectContent>
              {bahan?.filter(b => !laboratoriumId || String(b.laboratoriumId) === laboratoriumId)
                .map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.nama} — Gudang: {(b as any).stokGudang ?? 0} {b.satuan}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {selectedBahan && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="bg-teal-50 rounded-lg p-2">
                <span className="text-teal-700 font-medium">Stok Lab Saat Ini</span>
                <div className="font-bold text-teal-800 text-base mt-0.5">{selectedBahan.stok} <span className="text-xs font-normal">{selectedBahan.satuan}</span></div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <span className="text-blue-700 font-medium">Stok Gudang</span>
                <div className={`font-bold text-base mt-0.5 ${((selectedBahan as any).stokGudang ?? 0) === 0 ? "text-red-600" : "text-blue-800"}`}>
                  {(selectedBahan as any).stokGudang ?? 0} <span className="text-xs font-normal">{selectedBahan.satuan}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="font-semibold">Jumlah yang Diminta *</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min="1" max={(selectedBahan as any)?.stokGudang ?? 9999}
              value={jumlah} onChange={e => setJumlah(e.target.value)} placeholder="0" className="rounded-xl h-11 flex-1" />
            <span className="text-sm text-muted-foreground w-12">{selectedBahan?.satuan || ""}</span>
          </div>
          {selectedBahan && jumlah && Number(jumlah) > ((selectedBahan as any).stokGudang ?? 0) && (
            <p className="text-xs text-red-500">Melebihi stok gudang ({(selectedBahan as any).stokGudang ?? 0} {selectedBahan.satuan})</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Catatan untuk Gudang (Opsional)</Label>
          <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Alasan permintaan, keperluan praktikum, dll..." className="rounded-xl resize-none" rows={2} />
        </div>

        <Button onClick={handleSubmit} disabled={requestMutation.isPending || !bahanId || !laboratoriumId || !jumlah}
          className="w-full rounded-xl gap-2">
          {requestMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><ArrowDownToLine className="w-4 h-4" />Kirim Permintaan ke Gudang</>}
        </Button>
      </Card>
    </div>
  );
}

function RiwayatTransferTab() {
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["/api/transfer-bahan"],
    queryFn: () => customFetch("/api/transfer-bahan"),
  });

  const statusColor: Record<string, string> = {
    menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    disetujui: "bg-green-50 text-green-700 border-green-200",
    ditolak: "bg-red-50 text-red-700 border-red-200",
  };

  const statusLabel: Record<string, string> = {
    menunggu: "Menunggu Persetujuan Gudang",
    disetujui: "Disetujui & Stok Ditransfer",
    ditolak: "Ditolak",
  };

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <History className="text-primary w-5 h-5" />
        <h3 className="font-semibold">Riwayat Permintaan Stok ke Gudang</h3>
      </div>
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">Bahan</TableHead>
          <TableHead className="font-semibold">Lab</TableHead>
          <TableHead className="font-semibold text-center">Jumlah</TableHead>
          <TableHead className="font-semibold">Catatan PLP</TableHead>
          <TableHead className="font-semibold">Catatan Gudang</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Tanggal</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : (transfers as any[])?.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada riwayat permintaan</TableCell></TableRow>
          : (transfers as any[])?.map((t: any) => (
            <TableRow key={t.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell>
                <div className="font-semibold">{t.bahan?.nama}</div>
                <div className="text-xs text-muted-foreground">{t.bahan?.kode}</div>
              </TableCell>
              <TableCell className="text-sm">{t.laboratorium?.nama}</TableCell>
              <TableCell className="text-center font-bold text-primary">{t.jumlah} <span className="text-xs font-normal text-muted-foreground">{t.bahan?.satuan}</span></TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{t.catatanPlp || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{t.catatanGudang || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${statusColor[t.status]}`}>{statusLabel[t.status] || t.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmt(t.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
