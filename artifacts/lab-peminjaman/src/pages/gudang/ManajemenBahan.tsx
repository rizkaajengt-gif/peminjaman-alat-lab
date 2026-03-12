import { useState } from "react";
import { useGetBahan, useUpdateBahan, useGetPermintaanBahan, useUpdatePermintaanBahanStatus, customFetch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Package, Edit3, Pencil, Printer, ArrowRightLeft, Building2 } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function formatDate(d: string | undefined) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

export default function GudangManajemen() {
  const { data: bahan, isLoading: lBahan } = useGetBahan({});
  const lowStockGudang = bahan?.filter(b => (b as any).stokGudang <= b.stokMinimal) || [];
  const lowStockPlp = bahan?.filter(b => b.stok <= b.stokMinimal) || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Gudang" description="Kelola stok bahan di gudang & distribusi ke PLP, serta verifikasi permintaan mahasiswa." />

      {(lowStockGudang.length > 0 || lowStockPlp.length > 0) && (
        <Card className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Peringatan Stok Rendah</p>
              {lowStockGudang.length > 0 && <p className="text-sm text-amber-700">Stok Gudang rendah: {lowStockGudang.map(b => b.nama).join(", ")}</p>}
              {lowStockPlp.length > 0 && <p className="text-sm text-amber-700">Stok PLP rendah: {lowStockPlp.map(b => b.nama).join(", ")}</p>}
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="stok">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4 flex-wrap">
          <TabsTrigger value="stok" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Package className="w-4 h-4" />Stok Gudang &amp; PLP
          </TabsTrigger>
          <TabsTrigger value="transfer" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <ArrowRightLeft className="w-4 h-4" />Permintaan Transfer PLP
          </TabsTrigger>
          <TabsTrigger value="verifikasi" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <CheckCircle2 className="w-4 h-4" />Verifikasi Permintaan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stok"><StokTab bahan={bahan} isLoading={lBahan} /></TabsContent>
        <TabsContent value="transfer"><TransferTab /></TabsContent>
        <TabsContent value="verifikasi"><VerifikasiTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StokTab({ bahan, isLoading }: { bahan: any[] | undefined; isLoading: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateMutation = useUpdateBahan();
  const [editItem, setEditItem] = useState<any>(null);
  const [stokGudangBaru, setStokGudangBaru] = useState("");
  const [stokPlpBaru, setStokPlpBaru] = useState("");

  const handleUpdateStok = () => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: {
        ...editItem,
        stokGudang: stokGudangBaru !== "" ? parseInt(stokGudangBaru) : editItem.stokGudang,
        stok: stokPlpBaru !== "" ? parseInt(stokPlpBaru) : editItem.stok,
        laboratoriumId: editItem.laboratoriumId,
      }
    }, {
      onSuccess: () => { toast({ title: "Stok diperbarui" }); setEditItem(null); qc.invalidateQueries({ queryKey: ["/api/bahan"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Package className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Stok Bahan Habis Pakai</h3>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>Stok Gudang (Pusat)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500 inline-block"></span>Stok PLP (di Lab)</span>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">Kode</TableHead>
            <TableHead className="font-semibold">Nama Bahan</TableHead>
            <TableHead className="font-semibold">Lab / PLP</TableHead>
            <TableHead className="font-semibold text-center text-blue-700">Stok Gudang</TableHead>
            <TableHead className="font-semibold text-center text-teal-700">Stok PLP</TableHead>
            <TableHead className="font-semibold text-center">Min. Stok</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : bahan?.length === 0 ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Belum ada data bahan</TableCell></TableRow>
            : bahan?.map(b => {
              const stokGudang = (b as any).stokGudang ?? 0;
              const stokPlp = b.stok;
              const isGudangLow = stokGudang <= b.stokMinimal;
              const isPlpLow = stokPlp <= b.stokMinimal;
              return (
                <TableRow key={b.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs">{b.kode}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{b.nama}</div>
                    <div className="text-xs text-muted-foreground">{b.satuan}</div>
                  </TableCell>
                  <TableCell className="text-sm">{b.laboratorium?.nama}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-lg ${isGudangLow ? "text-red-600" : "text-blue-600"}`}>{stokGudang}</span>
                    <div className="text-xs text-muted-foreground">{b.satuan}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-lg ${isPlpLow ? "text-amber-600" : "text-teal-600"}`}>{stokPlp}</span>
                    <div className="text-xs text-muted-foreground">{b.satuan}</div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{b.stokMinimal}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {isGudangLow && <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 block">Gudang Rendah</Badge>}
                      {isPlpLow && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200 block">PLP Rendah</Badge>}
                      {!isGudangLow && !isPlpLow && <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">Normal</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10 rounded-lg gap-1"
                      onClick={() => { setEditItem(b); setStokGudangBaru(String(stokGudang)); setStokPlpBaru(String(stokPlp)); }}>
                      <Edit3 className="w-3.5 h-3.5" /> Edit Stok
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Update Stok: {editItem?.nama}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-xl">
              <div><span className="text-muted-foreground block">Stok Gudang saat ini</span><span className="font-bold text-blue-600">{(editItem as any)?.stokGudang ?? 0} {editItem?.satuan}</span></div>
              <div><span className="text-muted-foreground block">Stok PLP saat ini</span><span className="font-bold text-teal-600">{editItem?.stok} {editItem?.satuan}</span></div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-blue-700">Stok Gudang (Pusat) Baru</Label>
              <Input type="number" min="0" value={stokGudangBaru} onChange={e => setStokGudangBaru(e.target.value)} className="rounded-xl h-11" placeholder="Stok gudang..." />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-teal-700">Stok PLP (di Lab) Baru</Label>
              <Input type="number" min="0" value={stokPlpBaru} onChange={e => setStokPlpBaru(e.target.value)} className="rounded-xl h-11" placeholder="Stok PLP..." />
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <strong>Catatan:</strong> Stok Gudang = stok di gudang pusat. Stok PLP = stok yang sudah di lab dan siap dibagikan ke mahasiswa.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} className="rounded-xl">Batal</Button>
            <Button onClick={handleUpdateStok} disabled={updateMutation.isPending} className="rounded-xl">
              {updateMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TransferTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedT, setSelectedT] = useState<any>(null);
  const [catatan, setCatatan] = useState("");

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["/api/transfer-bahan"],
    queryFn: () => customFetch("/api/transfer-bahan"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status, catatanGudang }: any) => customFetch(`/api/transfer-bahan/${id}/approve`, {
      method: "PUT", body: JSON.stringify({ status, catatanGudang }), headers: { "Content-Type": "application/json" },
    }),
    onSuccess: (_, vars: any) => {
      toast({ title: vars.status === "disetujui" ? "Transfer disetujui, stok diperbarui" : "Transfer ditolak" });
      setSelectedT(null); setCatatan("");
      qc.invalidateQueries({ queryKey: ["/api/transfer-bahan"] });
      qc.invalidateQueries({ queryKey: ["/api/bahan"] });
    },
    onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message || "Gagal memproses transfer" }),
  });

  const pending = (transfers as any[])?.filter((t: any) => t.status === "menunggu") || [];
  const history = (transfers as any[])?.filter((t: any) => t.status !== "menunggu") || [];

  const statusColor: Record<string, string> = {
    menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    disetujui: "bg-green-50 text-green-700 border-green-200",
    ditolak: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <ArrowRightLeft className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Permintaan Transfer Bahan dari PLP</h3>
          <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200">{pending.length} menunggu</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">Bahan</TableHead>
            <TableHead className="font-semibold">Lab Tujuan</TableHead>
            <TableHead className="font-semibold">Jumlah Diminta</TableHead>
            <TableHead className="font-semibold">Diminta Oleh</TableHead>
            <TableHead className="font-semibold">Stok Gudang</TableHead>
            <TableHead className="font-semibold">Tgl Permintaan</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : pending.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Tidak ada permintaan transfer yang menunggu</TableCell></TableRow>
            : pending.map((t: any) => (
              <TableRow key={t.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell>
                  <div className="font-semibold">{t.bahan?.nama}</div>
                  <div className="text-xs text-muted-foreground">{t.bahan?.kode} · {t.bahan?.satuan}</div>
                </TableCell>
                <TableCell className="text-sm">{t.laboratorium?.nama}</TableCell>
                <TableCell><span className="font-bold text-primary">{t.jumlah}</span> <span className="text-xs text-muted-foreground">{t.bahan?.satuan}</span></TableCell>
                <TableCell className="text-sm">{t.dimintaOleh?.nama}</TableCell>
                <TableCell>
                  <span className={`font-bold ${t.bahan?.stokGudang < t.jumlah ? "text-red-600" : "text-blue-600"}`}>{t.bahan?.stokGudang ?? 0}</span>
                  <span className="text-xs text-muted-foreground ml-1">{t.bahan?.satuan}</span>
                  {t.bahan?.stokGudang < t.jumlah && <div className="text-xs text-red-500">Stok tidak cukup!</div>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="destructive" className="h-8 text-xs rounded-lg"
                    onClick={() => approveMutation.mutate({ id: t.id, status: "ditolak", catatanGudang: "" })}
                    disabled={approveMutation.isPending}>
                    <XCircle className="w-3.5 h-3.5 mr-1" />Tolak
                  </Button>
                  <Button size="sm" className="h-8 text-xs rounded-lg bg-green-600 hover:bg-green-700"
                    onClick={() => { setSelectedT(t); setCatatan(""); }}
                    disabled={t.bahan?.stokGudang < t.jumlah}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Setujui
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {history.length > 0 && (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100"><h3 className="font-semibold text-sm text-muted-foreground">Riwayat Transfer</h3></div>
          <Table>
            <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Bahan</TableHead>
              <TableHead className="font-semibold">Lab</TableHead>
              <TableHead className="font-semibold">Jumlah</TableHead>
              <TableHead className="font-semibold">Diminta Oleh</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Tanggal</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {history.map((t: any) => (
                <TableRow key={t.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-sm">{t.bahan?.nama}</TableCell>
                  <TableCell className="text-sm">{t.laboratorium?.nama}</TableCell>
                  <TableCell className="font-bold">{t.jumlah} <span className="text-xs font-normal text-muted-foreground">{t.bahan?.satuan}</span></TableCell>
                  <TableCell className="text-sm">{t.dimintaOleh?.nama}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${statusColor[t.status]}`}>{t.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!selectedT} onOpenChange={(o) => !o && setSelectedT(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Konfirmasi Transfer Bahan ke PLP</DialogTitle></DialogHeader>
          {selectedT && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Bahan</span><span className="font-bold">{selectedT.bahan?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lab Tujuan</span><span className="font-medium">{selectedT.laboratorium?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Jumlah</span><span className="font-bold text-primary">{selectedT.jumlah} {selectedT.bahan?.satuan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Stok Gudang saat ini</span><span className="font-bold text-blue-600">{selectedT.bahan?.stokGudang ?? 0} {selectedT.bahan?.satuan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Stok Gudang setelah transfer</span>
                  <span className={`font-bold ${(selectedT.bahan?.stokGudang ?? 0) - selectedT.jumlah < 0 ? "text-red-600" : "text-green-600"}`}>
                    {(selectedT.bahan?.stokGudang ?? 0) - selectedT.jumlah} {selectedT.bahan?.satuan}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Catatan untuk PLP (Opsional)</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Informasi tambahan..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedT(null)} className="rounded-xl">Batal</Button>
            <Button onClick={() => approveMutation.mutate({ id: selectedT.id, status: "disetujui", catatanGudang: catatan })}
              disabled={approveMutation.isPending}
              className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {approveMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui Transfer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerifikasiTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPb, setSelectedPb] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<number, number>>({});
  const { data: permintaan, isLoading } = useGetPermintaanBahan({ status: "menunggu" as any });
  const updateStatus = useUpdatePermintaanBahanStatus();

  const openPrint = (id: number) => {
    window.open(`${import.meta.env.BASE_URL}print/permintaan-bahan/${id}`, "_blank");
  };

  const gudangPermintaan = (permintaan || []).filter((p: any) => p.tujuan === "gudang");

  const handleAction = (status: string) => {
    if (!selectedPb) return;
    const jumlahDisetujui = status === "disetujui"
      ? selectedPb.items?.map((item: any) => ({ itemId: item.id, jumlah: editedItems[item.id] ?? item.jumlahDiminta }))
      : undefined;
    updateStatus.mutate({ id: selectedPb.id, data: { status, catatan: catatan || undefined, jumlahDisetujui } as any }, {
      onSuccess: () => {
        toast({ title: status === "disetujui" ? "Permintaan disetujui" : status === "disiapkan" ? "Bahan disiapkan, stok dikurangi" : "Permintaan ditolak" });
        setSelectedPb(null); setCatatan(""); setEditMode(false); setEditedItems({});
        qc.invalidateQueries({ queryKey: ["/api/permintaan-bahan"] });
        qc.invalidateQueries({ queryKey: ["/api/bahan"] });
      },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <CheckCircle2 className="text-primary w-5 h-5" />
          <div>
            <h3 className="font-semibold">Permintaan Bahan ke Gudang</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Mahasiswa yang meminta langsung ke gudang (stok PLP habis)</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200">{gudangPermintaan.length} permintaan</Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Permintaan</TableHead>
            <TableHead className="font-semibold">Pemohon</TableHead>
            <TableHead className="font-semibold">Keperluan</TableHead>
            <TableHead className="font-semibold">Bahan</TableHead>
            <TableHead className="font-semibold">Tgl Dibutuhkan</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : gudangPermintaan.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada permintaan bahan ke gudang</TableCell></TableRow>
            : gudangPermintaan.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-semibold text-primary">{p.noPermintaan}</TableCell>
                <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
                <TableCell className="text-sm max-w-xs truncate">{p.keperluan}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs">{p.items?.map((i: any) => `${i.bahan?.nama} (${i.jumlahDiminta} ${i.bahan?.satuan})`).join(", ")}</TableCell>
                <TableCell className="text-sm">{formatDate(p.tanggalDibutuhkan)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" title="Cetak" onClick={() => openPrint(p.id)}><Printer className="w-4 h-4" /></Button>
                  <Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => { setSelectedPb(p); setCatatan(""); setEditMode(false); setEditedItems({}); }}>Proses</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedPb} onOpenChange={(o) => { if (!o) { setSelectedPb(null); setEditMode(false); setEditedItems({}); } }}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Verifikasi Permintaan Bahan Gudang</DialogTitle></DialogHeader>
          {selectedPb && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">No. Permintaan</span><span className="font-mono font-bold">{selectedPb.noPermintaan}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pemohon</span><span className="font-medium">{selectedPb.user?.nama}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Keperluan</span><span className="font-medium text-right max-w-xs">{selectedPb.keperluan}</span></div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Daftar Bahan</Label>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => { setEditMode(!editMode); setEditedItems({}); }}>
                  <Pencil className="w-3 h-3" />{editMode ? "Batalkan Edit" : "Edit Jumlah"}
                </Button>
              </div>
              <div className="space-y-2">
                {selectedPb.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 text-sm">
                    <div>
                      <div className="font-medium">{item.bahan?.nama}</div>
                      <div className="text-xs text-muted-foreground">Diminta: {item.jumlahDiminta} {item.bahan?.satuan}</div>
                      <div className="text-xs text-blue-600">Stok Gudang: {(item.bahan as any)?.stokGudang ?? 0} {item.bahan?.satuan}</div>
                    </div>
                    {editMode ? (
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} max={(item.bahan as any)?.stokGudang ?? 999}
                          className="w-20 h-8 rounded-lg text-center text-sm"
                          value={editedItems[item.id] ?? item.jumlahDiminta}
                          onChange={e => setEditedItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))} />
                        <span className="text-xs text-muted-foreground">{item.bahan?.satuan}</span>
                      </div>
                    ) : (
                      <span className="font-semibold">{item.jumlahDiminta} {item.bahan?.satuan}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Catatan (Opsional)</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan untuk pemohon..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setSelectedPb(null)} className="rounded-xl">Batal</Button>
            {selectedPb && <Button variant="outline" onClick={() => openPrint(selectedPb.id)} className="rounded-xl gap-2"><Printer className="w-4 h-4" />Cetak</Button>}
            <Button variant="destructive" onClick={() => handleAction("ditolak")} disabled={updateStatus.isPending} className="rounded-xl gap-2">
              <XCircle className="w-4 h-4" />Tolak
            </Button>
            <Button onClick={() => handleAction("disetujui")} disabled={updateStatus.isPending} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatus.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui</>}
            </Button>
            {selectedPb?.status === "disetujui" && (
              <Button onClick={() => handleAction("disiapkan")} disabled={updateStatus.isPending} className="rounded-xl gap-2">
                Disiapkan (Kurangi Stok)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
