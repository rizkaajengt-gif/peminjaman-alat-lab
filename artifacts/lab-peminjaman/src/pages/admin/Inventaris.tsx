import { useState } from "react";
import { useGetAlat, useCreateAlat, useUpdateAlat, useDeleteAlat, useGetBahan, useCreateBahan, useUpdateBahan, useDeleteBahan, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const KONDISI_COLORS: Record<string, string> = {
  baik: "bg-green-100 text-green-700 border-green-200",
  rusak_ringan: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rusak_berat: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminInventaris() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris" description="Kelola alat dan bahan habis pakai laboratorium." />
      <Tabs defaultValue="alat">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4">
          <TabsTrigger value="alat" className="rounded-lg px-6 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white">Inventaris Alat</TabsTrigger>
          <TabsTrigger value="bahan" className="rounded-lg px-6 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white">Bahan Habis Pakai</TabsTrigger>
        </TabsList>
        <TabsContent value="alat"><AlatTab /></TabsContent>
        <TabsContent value="bahan"><BahanTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AlatTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterLab, setFilterLab] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { data: labs } = useGetLaboratorium({});
  const { data: alat, isLoading } = useGetAlat({ search, laboratoriumId: filterLab ? parseInt(filterLab) : undefined });
  const createMutation = useCreateAlat();
  const updateMutation = useUpdateAlat();
  const deleteMutation = useDeleteAlat();
  const emptyForm = { nama: "", kode: "", deskripsi: "", kondisi: "baik", stok: 1, satuan: "unit", laboratoriumId: "" };
  const [form, setForm] = useState(emptyForm);

  const open = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { nama: item.nama, kode: item.kode, deskripsi: item.deskripsi || "", kondisi: item.kondisi, stok: item.stok, satuan: item.satuan, laboratoriumId: item.laboratoriumId?.toString() || "" } : emptyForm);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload: any = { nama: form.nama, kode: form.kode, deskripsi: form.deskripsi || null, kondisi: form.kondisi as any, stok: Number(form.stok), satuan: form.satuan, laboratoriumId: parseInt(form.laboratoriumId) };
    const p = editItem ? updateMutation.mutateAsync({ id: editItem.id, data: payload }) : createMutation.mutateAsync({ data: payload });
    p.then(() => { toast({ title: "Berhasil disimpan" }); setShowDialog(false); qc.invalidateQueries({ queryKey: ["/api/alat"] }); })
     .catch((e: any) => toast({ variant: "destructive", description: e?.data?.message || e.message }));
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus alat "${nama}"?`)) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { toast({ title: "Dihapus" }); qc.invalidateQueries({ queryKey: ["/api/alat"] }); }, onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }) });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Cari alat..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" /></div>
            <Select value={filterLab || "_all_"} onValueChange={v => setFilterLab(v === "_all_" ? "" : v)}><SelectTrigger className="w-44 h-10 rounded-xl"><SelectValue placeholder="Semua Lab" /></SelectTrigger><SelectContent><SelectItem value="_all_">Semua Lab</SelectItem>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={() => open()} className="h-10 rounded-xl"><Plus className="w-4 h-4 mr-2" />Tambah Alat</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-semibold">Kode</TableHead>
              <TableHead className="font-semibold">Nama Alat</TableHead>
              <TableHead className="font-semibold">Laboratorium</TableHead>
              <TableHead className="font-semibold">Kondisi</TableHead>
              <TableHead className="font-semibold text-center">Stok / Tersedia</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              : alat?.map(a => (
                <TableRow key={a.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs text-slate-500">{a.kode}</TableCell>
                  <TableCell className="font-semibold">{a.nama}</TableCell>
                  <TableCell className="text-sm">{a.laboratorium?.nama}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${KONDISI_COLORS[a.kondisi]}`}>{a.kondisi.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-center"><span className="font-bold">{a.stok}</span> / <span className="text-primary font-bold">{a.stokTersedia}</span> <span className="text-xs text-muted-foreground">{a.satuan}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => open(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(a.id, a.nama)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Edit Alat" : "Tambah Alat"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nama Alat</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kode</Label><Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kondisi</Label>
              <Select value={form.kondisi} onValueChange={v => setForm({...form, kondisi: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="baik">Baik</SelectItem><SelectItem value="rusak_ringan">Rusak Ringan</SelectItem><SelectItem value="rusak_berat">Rusak Berat</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Stok</Label><Input type="number" min="0" value={form.stok} onChange={e => setForm({...form, stok: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Satuan</Label><Input value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})} className="rounded-xl h-10" placeholder="unit / set / buah" /></div>
            <div className="space-y-1.5"><Label>Laboratorium</Label>
              <Select value={form.laboratoriumId} onValueChange={v => setForm({...form, laboratoriumId: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BahanTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { data: labs } = useGetLaboratorium({});
  const { data: bahan, isLoading } = useGetBahan({ search });
  const createMutation = useCreateBahan();
  const updateMutation = useUpdateBahan();
  const deleteMutation = useDeleteBahan();
  const emptyForm = { nama: "", kode: "", deskripsi: "", stok: 0, stokMinimal: 0, satuan: "unit", laboratoriumId: "" };
  const [form, setForm] = useState(emptyForm);

  const open = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { nama: item.nama, kode: item.kode, deskripsi: item.deskripsi || "", stok: item.stok, stokMinimal: item.stokMinimal, satuan: item.satuan, laboratoriumId: item.laboratoriumId?.toString() || "" } : emptyForm);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload: any = { nama: form.nama, kode: form.kode, deskripsi: form.deskripsi || null, stok: Number(form.stok), stokMinimal: Number(form.stokMinimal), satuan: form.satuan, laboratoriumId: parseInt(form.laboratoriumId) };
    const p = editItem ? updateMutation.mutateAsync({ id: editItem.id, data: payload }) : createMutation.mutateAsync({ data: payload });
    p.then(() => { toast({ title: "Berhasil disimpan" }); setShowDialog(false); qc.invalidateQueries({ queryKey: ["/api/bahan"] }); })
     .catch((e: any) => toast({ variant: "destructive", description: e?.data?.message || e.message }));
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus bahan "${nama}"?`)) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { toast({ title: "Dihapus" }); qc.invalidateQueries({ queryKey: ["/api/bahan"] }); }, onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }) });
  };

  return (
    <>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex gap-3 justify-between">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Cari bahan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" /></div>
          <Button onClick={() => open()} className="h-10 rounded-xl"><Plus className="w-4 h-4 mr-2" />Tambah Bahan</Button>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">Kode</TableHead>
            <TableHead className="font-semibold">Nama Bahan</TableHead>
            <TableHead className="font-semibold">Laboratorium</TableHead>
            <TableHead className="font-semibold text-center">Stok</TableHead>
            <TableHead className="font-semibold text-center">Min. Stok</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : bahan?.map(b => (
              <TableRow key={b.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs text-slate-500">{b.kode}</TableCell>
                <TableCell>
                  <div className="font-semibold">{b.nama}</div>
                  {b.stok <= b.stokMinimal && <div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" />Stok hampir habis</div>}
                </TableCell>
                <TableCell className="text-sm">{b.laboratorium?.nama}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold ${b.stok <= b.stokMinimal ? "text-red-600" : "text-green-600"}`}>{b.stok}</span> <span className="text-xs text-muted-foreground">{b.satuan}</span>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">{b.stokMinimal} {b.satuan}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => open(b)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(b.id, b.nama)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Edit Bahan" : "Tambah Bahan"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nama Bahan</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kode</Label><Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Stok Awal</Label><Input type="number" min="0" value={form.stok} onChange={e => setForm({...form, stok: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Stok Minimal</Label><Input type="number" min="0" value={form.stokMinimal} onChange={e => setForm({...form, stokMinimal: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Satuan</Label><Input value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Laboratorium</Label>
              <Select value={form.laboratoriumId} onValueChange={v => setForm({...form, laboratoriumId: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
