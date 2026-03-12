import { useState } from "react";
import { useGetBahan, useUpdateBahan, useGetPermintaanBahan, useUpdatePermintaanBahanStatus } from "@workspace/api-client-react";
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
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Package, Edit3 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function formatDate(d: string | undefined) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

export default function GudangManajemen() {
  const { data: bahan, isLoading: lBahan } = useGetBahan({});
  const lowStock = bahan?.filter(b => b.stok <= b.stokMinimal) || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Gudang" description="Kelola stok bahan dan verifikasi permintaan bahan dari unit lab." />
      {lowStock.length > 0 && (
        <Card className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Peringatan Stok Rendah</p>
            <p className="text-sm text-amber-700">{lowStock.map(b => b.nama).join(", ")} hampir habis.</p>
          </div>
        </Card>
      )}
      <Tabs defaultValue="stok">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4">
          <TabsTrigger value="stok" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Package className="w-4 h-4" />Stok Bahan
          </TabsTrigger>
          <TabsTrigger value="verifikasi" className="rounded-lg px-5 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <CheckCircle2 className="w-4 h-4" />Verifikasi Permintaan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stok"><StokTab bahan={bahan} isLoading={lBahan} /></TabsContent>
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
  const [stokBaru, setStokBaru] = useState("");

  const handleUpdateStok = () => {
    if (!editItem || !stokBaru) return;
    updateMutation.mutate({ id: editItem.id, data: { ...editItem, stok: parseInt(stokBaru), laboratoriumId: editItem.laboratoriumId } }, {
      onSuccess: () => { toast({ title: "Stok diperbarui" }); setEditItem(null); qc.invalidateQueries({ queryKey: ["/api/bahan"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Package className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Daftar Stok Bahan Habis Pakai</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">Kode</TableHead>
            <TableHead className="font-semibold">Nama Bahan</TableHead>
            <TableHead className="font-semibold">Laboratorium</TableHead>
            <TableHead className="font-semibold text-center">Stok</TableHead>
            <TableHead className="font-semibold text-center">Min. Stok</TableHead>
            <TableHead className="font-semibold">Kondisi</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : bahan?.map(b => (
              <TableRow key={b.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs">{b.kode}</TableCell>
                <TableCell className="font-semibold">{b.nama}</TableCell>
                <TableCell className="text-sm">{b.laboratorium?.nama}</TableCell>
                <TableCell className="text-center font-bold text-lg">{b.stok} <span className="text-xs font-normal text-muted-foreground">{b.satuan}</span></TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">{b.stokMinimal}</TableCell>
                <TableCell>
                  {b.stok <= b.stokMinimal
                    ? <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">Stok Rendah</Badge>
                    : <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">Normal</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10 rounded-lg gap-1" onClick={() => { setEditItem(b); setStokBaru(String(b.stok)); }}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit Stok
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Update Stok: {editItem?.nama}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
              <span className="text-sm text-muted-foreground">Stok saat ini:</span>
              <span className="font-bold">{editItem?.stok} {editItem?.satuan}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Stok Baru</Label>
              <Input type="number" min="0" value={stokBaru} onChange={e => setStokBaru(e.target.value)} className="rounded-xl h-11" autoFocus />
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

function VerifikasiTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPb, setSelectedPb] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const { data: permintaan, isLoading } = useGetPermintaanBahan({ status: "menunggu" as any });
  const updateStatus = useUpdatePermintaanBahanStatus();

  const handleAction = (status: string) => {
    if (!selectedPb) return;
    updateStatus.mutate({ id: selectedPb.id, data: { status, catatan: catatan || undefined } }, {
      onSuccess: () => { toast({ title: status === "disetujui" ? "Permintaan disetujui" : "Permintaan ditolak" }); setSelectedPb(null); setCatatan(""); qc.invalidateQueries({ queryKey: ["/api/permintaan-bahan"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold">Permintaan Menunggu Verifikasi</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Total: {permintaan?.length || 0} permintaan</p>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Permintaan</TableHead>
            <TableHead className="font-semibold">Pemohon</TableHead>
            <TableHead className="font-semibold">Keperluan</TableHead>
            <TableHead className="font-semibold">Bahan Diminta</TableHead>
            <TableHead className="font-semibold">Tgl Dibutuhkan</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : permintaan?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada permintaan yang perlu diverifikasi</TableCell></TableRow>
            : permintaan?.map(p => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-semibold text-primary">{p.noPermintaan}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{p.user?.nama}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div>
                </TableCell>
                <TableCell className="text-sm max-w-xs truncate">{p.keperluan}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs">
                  {p.items?.map((i: any) => `${i.bahan?.nama} (${i.jumlahDiminta} ${i.bahan?.satuan})`).join(", ")}
                </TableCell>
                <TableCell className="text-sm">{formatDate(p.tanggalDibutuhkan)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => setSelectedPb(p)}>Proses</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedPb} onOpenChange={(o) => !o && setSelectedPb(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Verifikasi Permintaan Bahan</DialogTitle></DialogHeader>
          {selectedPb && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">No. Permintaan</span><span className="font-mono font-bold">{selectedPb.noPermintaan}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pemohon</span><span className="font-medium">{selectedPb.user?.nama}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Keperluan</span><span className="font-medium text-right max-w-xs">{selectedPb.keperluan}</span></div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Daftar Bahan</Label>
                {selectedPb.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 text-sm">
                    <span className="font-medium">{item.bahan?.nama}</span>
                    <span className="text-muted-foreground">{item.jumlahDiminta} {item.bahan?.satuan}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Catatan (Opsional)</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan untuk pemohon..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedPb(null)} className="rounded-xl">Batal</Button>
            <Button variant="destructive" onClick={() => handleAction("ditolak")} disabled={updateStatus.isPending} className="rounded-xl gap-2">
              <XCircle className="w-4 h-4" />Tolak
            </Button>
            <Button onClick={() => handleAction("disetujui")} disabled={updateStatus.isPending} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatus.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
