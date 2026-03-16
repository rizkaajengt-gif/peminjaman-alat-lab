import { useState } from "react";
import { useGetPeminjamanAlat, useUpdatePeminjamanAlatStatus, useGetPeminjamanRuangan, useUpdatePeminjamanRuanganStatus, useGetUsers, useVerifyUser, useGetPermintaanBahan, useUpdatePermintaanBahanStatus, useGetAlat, customFetch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ClipboardList, CalendarDays, Users, Pencil, Printer, FlaskConical, Ghost, Plus, Trash2, MessageCircle } from "lucide-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function formatDate(d: string | undefined) {
  if (!d) return "-";
  try { return format(new Date(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

function toWaNum(num: string) {
  const d = num.replace(/\D/g, "");
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("62")) return d;
  return "62" + d;
}

function openPrint(type: string, id: number) {
  window.open(`${import.meta.env.BASE_URL}print/${type}/${id}`, "_blank");
}

export default function PlpVerifikasi() {
  const { data: pa } = useGetPeminjamanAlat({ status: "menunggu" as any });
  const { data: pr } = useGetPeminjamanRuangan({ status: "menunggu" as any });
  const { data: usersPending } = useGetUsers({ role: "mahasiswa" as any });
  const { data: phantom } = useQuery({
    queryKey: ["/api/peminjaman-phantom", { status: "menunggu" }],
    queryFn: () => customFetch("/api/peminjaman-phantom?status=menunggu"),
    select: (d: any) => d as any[],
  });
  const pendingUsers = usersPending?.filter((u: any) => u.status === "menunggu") || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Verifikasi PLP" description="Tinjau dan verifikasi semua pengajuan dari mahasiswa dan dosen." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Peminjaman Alat Menunggu", value: pa?.length || 0, color: "text-blue-600" },
          { label: "Peminjaman Phantom Menunggu", value: phantom?.length || 0, color: "text-purple-600" },
          { label: "Peminjaman Ruangan Menunggu", value: pr?.length || 0, color: "text-teal-600" },
          { label: "Pendaftaran Mahasiswa Menunggu", value: pendingUsers.length, color: "text-amber-600" },
        ].map((s, i) => (
          <Card key={i} className="p-5 border-none shadow-sm">
            <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="alat">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4 flex-wrap">
          <TabsTrigger value="alat" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <ClipboardList className="w-4 h-4" />Peminjaman Alat
          </TabsTrigger>
          <TabsTrigger value="phantom" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Ghost className="w-4 h-4" />Peminjaman Phantom
          </TabsTrigger>
          <TabsTrigger value="ruangan" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <CalendarDays className="w-4 h-4" />Peminjaman Ruangan
          </TabsTrigger>
          <TabsTrigger value="bahan" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <FlaskConical className="w-4 h-4" />Permintaan Bahan
          </TabsTrigger>
          <TabsTrigger value="mahasiswa" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Users className="w-4 h-4" />Pendaftaran Mahasiswa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="alat"><VerifikasiAlatTab /></TabsContent>
        <TabsContent value="phantom"><VerifikasiPhantomTab /></TabsContent>
        <TabsContent value="ruangan"><VerifikasiRuanganTab /></TabsContent>
        <TabsContent value="bahan"><VerifikasiBahanTab /></TabsContent>
        <TabsContent value="mahasiswa"><VerifikasiMahasiswaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Item Edit Dialog Helper ───────────────────────────────────────────────────

function ItemEditControls({ item, editMode, editedItems, setEditedItems, onDelete }: {
  item: any; editMode: boolean; editedItems: Record<number, number>;
  setEditedItems: (fn: (prev: Record<number, number>) => Record<number, number>) => void;
  onDelete: (id: number) => void;
}) {
  if (!editMode) return <span className="text-muted-foreground font-semibold">{editedItems[item.id] ?? item.jumlah}</span>;
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number" min={1}
        className="w-16 h-7 rounded-lg text-center text-sm"
        value={editedItems[item.id] ?? item.jumlah}
        onChange={e => setEditedItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
      />
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-50" onClick={() => onDelete(item.id)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ─── Verifikasi Alat Tab ───────────────────────────────────────────────────────

function VerifikasiAlatTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [editedItems, setEditedItems] = useState<Record<number, number>>({});
  const [editMode, setEditMode] = useState(false);
  const [newAlatId, setNewAlatId] = useState<string>("");
  const [newJumlah, setNewJumlah] = useState(1);
  const { data, isLoading } = useGetPeminjamanAlat({ status: "menunggu" as any });
  const updateStatus = useUpdatePeminjamanAlatStatus();

  const { data: alatList } = useGetAlat(
    { laboratoriumId: selected?.laboratoriumId },
    { query: { enabled: !!selected } }
  );

  const updateItemsMutation = useMutation({
    mutationFn: (vars: { id: number; items: { id: number; jumlah: number }[] }) =>
      customFetch(`/api/peminjaman-alat/${vars.id}/items`, { method: "PUT", body: JSON.stringify({ items: vars.items }), headers: { "Content-Type": "application/json" } }),
    onSuccess: (data: any) => { setSelected(data); setEditMode(false); toast({ title: "Jumlah diperbarui" }); qc.invalidateQueries({ queryKey: ["/api/peminjaman-alat"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal memperbarui" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ peminjamanId, itemId }: { peminjamanId: number; itemId: number }) =>
      customFetch(`/api/peminjaman-alat/${peminjamanId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: (data: any) => { setSelected(data); setEditedItems({}); toast({ title: "Item dihapus" }); qc.invalidateQueries({ queryKey: ["/api/peminjaman-alat"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal menghapus item" }),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ peminjamanId, alatId, jumlah }: { peminjamanId: number; alatId: number; jumlah: number }) =>
      customFetch(`/api/peminjaman-alat/${peminjamanId}/items/add`, { method: "POST", body: JSON.stringify({ alatId, jumlah }), headers: { "Content-Type": "application/json" } }),
    onSuccess: (data: any) => { setSelected(data); setNewAlatId(""); setNewJumlah(1); toast({ title: "Alat ditambahkan" }); qc.invalidateQueries({ queryKey: ["/api/peminjaman-alat"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal menambah alat" }),
  });

  const handleAction = (status: string) => {
    if (!selected) return;
    updateStatus.mutate({ id: selected.id, data: { status, catatan } }, {
      onSuccess: () => { toast({ title: status === "disetujui" ? "Disetujui" : "Ditolak" }); setSelected(null); setCatatan(""); setEditedItems({}); setEditMode(false); qc.invalidateQueries({ queryKey: ["/api/peminjaman-alat"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  const handleSaveItems = () => {
    if (!selected) return;
    const items = selected.items?.map((item: any) => ({ id: item.id, jumlah: editedItems[item.id] ?? item.jumlah })) || [];
    updateItemsMutation.mutate({ id: selected.id, items });
  };

  const openDialog = (p: any) => { setSelected(p); setCatatan(""); setEditMode(false); setEditedItems({}); setNewAlatId(""); setNewJumlah(1); };

  const existingAlatIds = selected?.items?.map((i: any) => i.alatId) || [];
  const availableAlat = (alatList || []).filter((a: any) => !existingAlatIds.includes(a.id) && a.stokTersedia > 0);

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Peminjaman</TableHead>
            <TableHead className="font-semibold">Pemohon</TableHead>
            <TableHead className="font-semibold">Lab</TableHead>
            <TableHead className="font-semibold">Alat</TableHead>
            <TableHead className="font-semibold">Tgl Pinjam</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : data?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada pengajuan yang perlu diverifikasi</TableCell></TableRow>
            : data?.map(p => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground">{p.user?.nim || (p.user as any)?.role}</div></TableCell>
                <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.items?.map((i: any) => `${i.alat?.nama} (${i.jumlah})`).join(", ")}</TableCell>
                <TableCell className="text-sm">{formatDate(p.tanggalPinjam)}</TableCell>
                <TableCell className="text-right"><Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => openDialog(p)}>Proses</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setEditMode(false); setEditedItems({}); } }}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Verifikasi Peminjaman Alat</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pemohon</span><span className="font-bold">{selected.user?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lab</span><span>{selected.laboratorium?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Keperluan</span><span className="text-right max-w-xs">{selected.keperluan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tgl Pinjam</span><span>{formatDate(selected.tanggalPinjam)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tgl Kembali</span><span>{formatDate(selected.tanggalKembali)}</span></div>
                {((selected.user as any)?.noWa || (selected.user as any)?.noHp) && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <a href={`https://wa.me/${toWaNum(((selected.user as any).noWa || (selected.user as any).noHp))}?text=${encodeURIComponent(`Halo ${selected.user?.nama}, pengajuan peminjaman alat Anda (No. ${selected.noPeminjaman}) sedang kami proses.\n\nDaftar barang yang dipinjam:\n${selected.items?.map((i: any) => `- ${i.alat?.nama}: ${i.jumlah} unit`).join("\n") || ""}\n\nTerima kasih.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg px-2.5 py-1 font-medium transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Daftar Alat:</span>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => { setEditMode(!editMode); setEditedItems({}); setNewAlatId(""); setNewJumlah(1); }}>
                  <Pencil className="w-3 h-3" />{editMode ? "Batalkan" : "Edit"}
                </Button>
              </div>

              <div className="space-y-2">
                {selected.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 text-sm">
                    <div>
                      <div className="font-medium">{item.alat?.nama}</div>
                      <div className="text-xs text-muted-foreground">Diminta: {item.jumlah} {item.alat?.satuan}</div>
                    </div>
                    <ItemEditControls
                      item={item} editMode={editMode} editedItems={editedItems} setEditedItems={setEditedItems}
                      onDelete={(itemId) => deleteItemMutation.mutate({ peminjamanId: selected.id, itemId })}
                    />
                  </div>
                ))}
              </div>

              {editMode && (
                <>
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Plus className="w-3 h-3" />Tambah Alat</p>
                    <div className="flex gap-2">
                      <Select value={newAlatId} onValueChange={setNewAlatId}>
                        <SelectTrigger className="flex-1 h-8 text-xs rounded-lg"><SelectValue placeholder="Pilih alat..." /></SelectTrigger>
                        <SelectContent>
                          {availableAlat.map((a: any) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.nama} (stok: {a.stokTersedia})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} value={newJumlah} onChange={e => setNewJumlah(Number(e.target.value))} className="w-16 h-8 text-xs rounded-lg text-center" />
                      <Button size="sm" className="h-8 text-xs rounded-lg px-3" disabled={!newAlatId || addItemMutation.isPending}
                        onClick={() => addItemMutation.mutate({ peminjamanId: selected.id, alatId: Number(newAlatId), jumlah: newJumlah })}>
                        {addItemMutation.isPending ? <Loader2 className="animate-spin w-3 h-3" /> : "Tambah"}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleSaveItems} disabled={updateItemsMutation.isPending} className="w-full rounded-xl gap-2 h-9">
                    {updateItemsMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan Perubahan Jumlah"}
                  </Button>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Batal</Button>
            {selected && <Button variant="outline" onClick={() => openPrint("peminjaman-alat", selected.id)} className="rounded-xl gap-2"><Printer className="w-4 h-4" />Cetak</Button>}
            <Button variant="destructive" onClick={() => handleAction("ditolak")} disabled={updateStatus.isPending || editMode} className="rounded-xl gap-2"><XCircle className="w-4 h-4" />Tolak</Button>
            <Button onClick={() => handleAction("disetujui")} disabled={updateStatus.isPending || editMode} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatus.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Verifikasi Phantom Tab ────────────────────────────────────────────────────

function VerifikasiPhantomTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [editedItems, setEditedItems] = useState<Record<number, number>>({});
  const [editMode, setEditMode] = useState(false);
  const [newPhantomId, setNewPhantomId] = useState<string>("");
  const [newJumlah, setNewJumlah] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/peminjaman-phantom", { status: "menunggu" }],
    queryFn: () => customFetch("/api/peminjaman-phantom?status=menunggu"),
    select: (d: any) => d as any[],
  });

  const { data: phantomList } = useQuery({
    queryKey: ["/api/phantom"],
    queryFn: () => customFetch("/api/phantom"),
    select: (d: any) => d as any[],
    enabled: !!selected,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      customFetch(`/api/peminjaman-phantom/${id}/status`, { method: "PUT", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { toast({ title: "Status diperbarui" }); setSelected(null); setCatatan(""); setEditedItems({}); setEditMode(false); qc.invalidateQueries({ queryKey: ["/api/peminjaman-phantom"] }); },
    onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
  });

  const updateItemsMutation = useMutation({
    mutationFn: (vars: { id: number; items: { id: number; jumlah: number }[] }) =>
      customFetch(`/api/peminjaman-phantom/${vars.id}/items`, { method: "PUT", body: JSON.stringify({ items: vars.items }), headers: { "Content-Type": "application/json" } }),
    onSuccess: (data: any) => { setSelected(data); setEditMode(false); toast({ title: "Jumlah diperbarui" }); qc.invalidateQueries({ queryKey: ["/api/peminjaman-phantom"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal memperbarui" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ peminjamanId, itemId }: { peminjamanId: number; itemId: number }) =>
      customFetch(`/api/peminjaman-phantom/${peminjamanId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: (data: any) => { setSelected(data); setEditedItems({}); toast({ title: "Item dihapus" }); qc.invalidateQueries({ queryKey: ["/api/peminjaman-phantom"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal menghapus item" }),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ peminjamanId, phantomId, jumlah }: { peminjamanId: number; phantomId: number; jumlah: number }) =>
      customFetch(`/api/peminjaman-phantom/${peminjamanId}/items/add`, { method: "POST", body: JSON.stringify({ phantomId, jumlah }), headers: { "Content-Type": "application/json" } }),
    onSuccess: (data: any) => { setSelected(data); setNewPhantomId(""); setNewJumlah(1); toast({ title: "Phantom ditambahkan" }); qc.invalidateQueries({ queryKey: ["/api/peminjaman-phantom"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal menambah phantom" }),
  });

  const handleAction = (status: string) => {
    if (!selected) return;
    updateStatusMutation.mutate({ id: selected.id, data: { status, catatan } });
  };

  const handleSaveItems = () => {
    if (!selected) return;
    const items = selected.items?.map((item: any) => ({ id: item.id, jumlah: editedItems[item.id] ?? item.jumlah })) || [];
    updateItemsMutation.mutate({ id: selected.id, items });
  };

  const openDialog = (p: any) => { setSelected(p); setCatatan(""); setEditMode(false); setEditedItems({}); setNewPhantomId(""); setNewJumlah(1); };

  const existingPhantomIds = selected?.items?.map((i: any) => i.phantomId) || [];
  const availablePhantom = (phantomList || []).filter((p: any) => !existingPhantomIds.includes(p.id) && p.stokTersedia > 0);

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Peminjaman</TableHead>
            <TableHead className="font-semibold">Pemohon</TableHead>
            <TableHead className="font-semibold">Lab</TableHead>
            <TableHead className="font-semibold">Phantom</TableHead>
            <TableHead className="font-semibold">Tgl Pinjam</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : !data?.length ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada pengajuan phantom yang perlu diverifikasi</TableCell></TableRow>
            : data.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
                <TableCell className="text-sm">{p.laboratorium?.nama || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.items?.map((i: any) => `${i.phantom?.nama} (${i.jumlah})`).join(", ")}</TableCell>
                <TableCell className="text-sm">{formatDate(p.tanggalPinjam)}</TableCell>
                <TableCell className="text-right"><Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => openDialog(p)}>Proses</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setEditMode(false); setEditedItems({}); } }}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Verifikasi Peminjaman Phantom</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pemohon</span><span className="font-bold">{selected.user?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lab</span><span>{selected.laboratorium?.nama || "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Keperluan</span><span className="text-right max-w-xs">{selected.keperluan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tgl Pinjam</span><span>{formatDate(selected.tanggalPinjam)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tgl Kembali</span><span>{formatDate(selected.tanggalKembali)}</span></div>
                {((selected.user as any)?.noWa || (selected.user as any)?.noHp) && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <a href={`https://wa.me/${toWaNum(((selected.user as any).noWa || (selected.user as any).noHp))}?text=${encodeURIComponent(`Halo ${selected.user?.nama}, pengajuan peminjaman phantom Anda (No. ${selected.noPeminjaman}) sedang kami proses.\n\nDaftar phantom yang dipinjam:\n${selected.items?.map((i: any) => `- ${i.phantom?.nama}: ${i.jumlah} unit`).join("\n") || ""}\n\nTerima kasih.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg px-2.5 py-1 font-medium transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Daftar Phantom:</span>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => { setEditMode(!editMode); setEditedItems({}); setNewPhantomId(""); setNewJumlah(1); }}>
                  <Pencil className="w-3 h-3" />{editMode ? "Batalkan" : "Edit"}
                </Button>
              </div>

              <div className="space-y-2">
                {selected.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 text-sm">
                    <div>
                      <div className="font-medium">{item.phantom?.nama}</div>
                      <div className="text-xs text-muted-foreground">{item.phantom?.kode} · {item.jumlah} {item.phantom?.satuan}</div>
                    </div>
                    <ItemEditControls
                      item={item} editMode={editMode} editedItems={editedItems} setEditedItems={setEditedItems}
                      onDelete={(itemId) => deleteItemMutation.mutate({ peminjamanId: selected.id, itemId })}
                    />
                  </div>
                ))}
              </div>

              {editMode && (
                <>
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Plus className="w-3 h-3" />Tambah Phantom</p>
                    <div className="flex gap-2">
                      <Select value={newPhantomId} onValueChange={setNewPhantomId}>
                        <SelectTrigger className="flex-1 h-8 text-xs rounded-lg"><SelectValue placeholder="Pilih phantom..." /></SelectTrigger>
                        <SelectContent>
                          {availablePhantom.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.nama} (stok: {p.stokTersedia})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} value={newJumlah} onChange={e => setNewJumlah(Number(e.target.value))} className="w-16 h-8 text-xs rounded-lg text-center" />
                      <Button size="sm" className="h-8 text-xs rounded-lg px-3" disabled={!newPhantomId || addItemMutation.isPending}
                        onClick={() => addItemMutation.mutate({ peminjamanId: selected.id, phantomId: Number(newPhantomId), jumlah: newJumlah })}>
                        {addItemMutation.isPending ? <Loader2 className="animate-spin w-3 h-3" /> : "Tambah"}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleSaveItems} disabled={updateItemsMutation.isPending} className="w-full rounded-xl gap-2 h-9">
                    {updateItemsMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan Perubahan Jumlah"}
                  </Button>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Batal</Button>
            {selected && <Button variant="outline" onClick={() => openPrint("peminjaman-phantom", selected.id)} className="rounded-xl gap-2"><Printer className="w-4 h-4" />Cetak</Button>}
            <Button variant="destructive" onClick={() => handleAction("ditolak")} disabled={updateStatusMutation.isPending || editMode} className="rounded-xl gap-2"><XCircle className="w-4 h-4" />Tolak</Button>
            <Button onClick={() => handleAction("disetujui")} disabled={updateStatusMutation.isPending || editMode} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatusMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Verifikasi Ruangan Tab ────────────────────────────────────────────────────

function VerifikasiRuanganTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const { data, isLoading } = useGetPeminjamanRuangan({ status: "menunggu" as any });
  const updateStatus = useUpdatePeminjamanRuanganStatus();

  const handleAction = (status: string) => {
    if (!selected) return;
    updateStatus.mutate({ id: selected.id, data: { status, catatan } }, {
      onSuccess: () => { toast({ title: status === "disetujui" ? "Disetujui" : "Ditolak" }); setSelected(null); setCatatan(""); qc.invalidateQueries({ queryKey: ["/api/peminjaman-ruangan"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">No. Peminjaman</TableHead>
            <TableHead className="font-semibold">Pemohon</TableHead>
            <TableHead className="font-semibold">Ruangan</TableHead>
            <TableHead className="font-semibold">Tanggal & Waktu</TableHead>
            <TableHead className="font-semibold">Peserta</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : data?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada pengajuan</TableCell></TableRow>
            : data?.map(p => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-bold text-primary">{p.noPeminjaman}</TableCell>
                <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
                <TableCell className="text-sm">{p.laboratorium?.nama}</TableCell>
                <TableCell className="text-sm">{formatDate(p.tanggalMulai)}<br /><span className="text-xs text-muted-foreground">{p.waktuMulai?.slice(0,5)} - {p.waktuSelesai?.slice(0,5)}</span></TableCell>
                <TableCell className="text-sm font-semibold">{p.jumlahPeserta} orang</TableCell>
                <TableCell className="text-right"><Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => { setSelected(p); setCatatan(""); }}>Proses</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Verifikasi Peminjaman Ruangan</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pemohon</span><span className="font-bold">{selected.user?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ruangan</span><span>{selected.laboratorium?.nama}</span></div>
                {(selected as any).kategori && <div className="flex justify-between"><span className="text-muted-foreground">Kategori</span><span className="font-semibold">{{pembelajaran:"Pembelajaran/Praktikum",penelitian:"Penelitian",pengabdian_masyarakat:"Pengabdian Masyarakat"}[(selected as any).kategori]}</span></div>}
                {(selected as any).judulKegiatan && <div className="flex justify-between"><span className="text-muted-foreground">Judul</span><span className="text-right max-w-xs">{(selected as any).judulKegiatan}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Keperluan</span><span>{selected.keperluan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span>{formatDate(selected.tanggalMulai)} - {formatDate(selected.tanggalSelesai)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Waktu</span><span>{selected.waktuMulai?.slice(0,5)} - {selected.waktuSelesai?.slice(0,5)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Peserta</span><span className="font-bold">{selected.jumlahPeserta} orang</span></div>
              </div>
              {((selected.user as any)?.noWa || (selected.user as any)?.noHp) && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">WhatsApp</span>
                  <a href={`https://wa.me/${toWaNum(((selected.user as any).noWa || (selected.user as any).noHp))}?text=${encodeURIComponent(`Halo ${selected.user?.nama}, pengajuan peminjaman ruangan Anda (No. ${selected.noPeminjaman}) sedang kami proses.\n\nRuangan: ${selected.laboratorium?.nama || ""}\nTanggal: ${formatDate(selected.tanggalMulai)} - ${formatDate(selected.tanggalSelesai)}\nWaktu: ${selected.waktuMulai?.slice(0,5) || ""} - ${selected.waktuSelesai?.slice(0,5) || ""}\n\nTerima kasih.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-medium">
                    <MessageCircle className="w-3.5 h-3.5" />Hubungi via WA
                  </a>
                </div>
              )}
              <div className="space-y-1.5"><Label>Catatan</Label><Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional..." className="rounded-xl resize-none" rows={2} /></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Batal</Button>
            <Button variant="destructive" onClick={() => handleAction("ditolak")} disabled={updateStatus.isPending} className="rounded-xl gap-2"><XCircle className="w-4 h-4" />Tolak</Button>
            <Button onClick={() => handleAction("disetujui")} disabled={updateStatus.isPending} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatus.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Verifikasi Mahasiswa Tab ──────────────────────────────────────────────────

function VerifikasiMahasiswaTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: users, isLoading } = useGetUsers({ role: "mahasiswa" as any });
  const verifyMutation = useVerifyUser();
  const pendingUsers = users?.filter((u: any) => u.status === "menunggu") || [];

  const handleVerify = (id: number, status: "aktif" | "ditolak") => {
    verifyMutation.mutate({ id, data: { status } }, {
      onSuccess: () => { toast({ title: status === "aktif" ? "Mahasiswa diaktifkan" : "Pendaftaran ditolak" }); qc.invalidateQueries({ queryKey: ["/api/users"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="text-primary w-5 h-5" />
        <h3 className="font-semibold">Pendaftaran Mahasiswa Menunggu Verifikasi</h3>
        <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200">{pendingUsers.length} pending</Badge>
      </div>
      <Table>
        <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="font-semibold">Nama</TableHead>
          <TableHead className="font-semibold">NIM</TableHead>
          <TableHead className="font-semibold">Jurusan</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="text-right font-semibold">Aksi</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
          : pendingUsers.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada pendaftaran baru</TableCell></TableRow>
          : pendingUsers.map((u: any) => (
            <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="font-semibold">{u.nama}</TableCell>
              <TableCell className="font-mono text-sm">{u.nim || "-"}</TableCell>
              <TableCell className="text-sm">{u.jurusan?.nama || "-"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
              <TableCell><StatusBadge status={u.status} /></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="outline" className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleVerify(u.id, "ditolak")}><XCircle className="w-3.5 h-3.5 mr-1" />Tolak</Button>
                <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => handleVerify(u.id, "aktif")}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Aktifkan</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─── Verifikasi Bahan Tab ──────────────────────────────────────────────────────

function VerifikasiBahanTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [catatan, setCatatan] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<number, number>>({});
  const { data, isLoading } = useGetPermintaanBahan({ status: "menunggu" as any });
  const updateStatus = useUpdatePermintaanBahanStatus();

  const handleAction = (status: string) => {
    if (!selected) return;
    const jumlahDisetujui = status === "disetujui"
      ? selected.items?.map((item: any) => ({ itemId: item.id, jumlah: editedItems[item.id] ?? item.jumlahDiminta }))
      : undefined;
    updateStatus.mutate({ id: selected.id, data: { status, catatan: catatan || undefined, jumlahDisetujui } as any }, {
      onSuccess: () => { toast({ title: status === "disetujui" ? "Permintaan disetujui" : "Permintaan ditolak" }); setSelected(null); setCatatan(""); setEditMode(false); setEditedItems({}); qc.invalidateQueries({ queryKey: ["/api/permintaan-bahan"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
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
            : data?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada permintaan bahan yang menunggu verifikasi</TableCell></TableRow>
            : data?.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs font-bold text-primary">{p.noPermintaan}</TableCell>
                <TableCell><div className="font-medium text-sm">{p.user?.nama}</div><div className="text-xs text-muted-foreground capitalize">{p.user?.role}</div></TableCell>
                <TableCell className="text-sm max-w-xs truncate">{p.keperluan}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs">{p.items?.map((i: any) => `${i.bahan?.nama} (${i.jumlahDiminta} ${i.bahan?.satuan})`).join(", ")}</TableCell>
                <TableCell className="text-sm">{formatDate(p.tanggalDibutuhkan)}</TableCell>
                <TableCell className="text-right"><Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => { setSelected(p); setCatatan(""); setEditMode(false); setEditedItems({}); }}>Proses</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Verifikasi Permintaan Bahan</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pemohon</span><span className="font-bold">{selected.user?.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Keperluan</span><span className="text-right max-w-xs">{selected.keperluan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tgl Dibutuhkan</span><span>{formatDate(selected.tanggalDibutuhkan)}</span></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Daftar Bahan:</span>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => { setEditMode(!editMode); setEditedItems({}); }}>
                  <Pencil className="w-3 h-3" />{editMode ? "Batalkan" : "Edit Jumlah"}
                </Button>
              </div>

              {selected.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 text-sm">
                  <div>
                    <div className="font-medium">{item.bahan?.nama}</div>
                    <div className="text-xs text-muted-foreground">Diminta: {item.jumlahDiminta} {item.bahan?.satuan}</div>
                  </div>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} className="w-20 h-8 rounded-lg text-center text-sm"
                        value={editedItems[item.id] ?? item.jumlahDiminta}
                        onChange={e => setEditedItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))} />
                      <span className="text-xs text-muted-foreground">{item.bahan?.satuan}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-semibold">{editedItems[item.id] ?? item.jumlahDiminta} {item.bahan?.satuan}</span>
                  )}
                </div>
              ))}

              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional..." className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Batal</Button>
            <Button variant="destructive" onClick={() => handleAction("ditolak")} disabled={updateStatus.isPending} className="rounded-xl gap-2"><XCircle className="w-4 h-4" />Tolak</Button>
            <Button onClick={() => handleAction("disetujui")} disabled={updateStatus.isPending} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700">
              {updateStatus.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" />Setujui</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
