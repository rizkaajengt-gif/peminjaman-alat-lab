import { useState } from "react";
import { useGetLaboratorium, useCreateLaboratorium, useUpdateLaboratorium, useDeleteLaboratorium, useGetJurusan } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, FlaskConical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLaboratorium() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { data: labs, isLoading } = useGetLaboratorium({});
  const { data: jurusanList } = useGetJurusan();
  const createMutation = useCreateLaboratorium();
  const updateMutation = useUpdateLaboratorium();
  const deleteMutation = useDeleteLaboratorium();
  const emptyForm = { nama: "", kode: "", lokasi: "", kapasitas: 30, jurusanId: "", deskripsi: "", fasilitas: "" };
  const [form, setForm] = useState(emptyForm);

  const open = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { nama: item.nama, kode: item.kode, lokasi: item.lokasi, kapasitas: item.kapasitas, jurusanId: item.jurusanId?.toString() || "", deskripsi: item.deskripsi || "", fasilitas: item.fasilitas || "" } : emptyForm);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload: any = { nama: form.nama, kode: form.kode, lokasi: form.lokasi, kapasitas: Number(form.kapasitas), jurusanId: form.jurusanId ? parseInt(form.jurusanId) : null, deskripsi: form.deskripsi || null, fasilitas: form.fasilitas || null };
    const p = editItem ? updateMutation.mutateAsync({ id: editItem.id, data: payload }) : createMutation.mutateAsync({ data: payload });
    p.then(() => { toast({ title: "Berhasil disimpan" }); setShowDialog(false); qc.invalidateQueries({ queryKey: ["/api/laboratorium"] }); })
     .catch((e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message || e.message }));
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus lab "${nama}"?`)) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { toast({ title: "Dihapus" }); qc.invalidateQueries({ queryKey: ["/api/laboratorium"] }); }, onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }) });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Data Laboratorium" description="Kelola ruangan dan fasilitas laboratorium." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        {labs?.slice(0, 3).map(l => (
          <Card key={l.id} className="p-4 border-none shadow-sm bg-gradient-to-br from-teal-50 to-white flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl"><FlaskConical className="text-primary" size={22} /></div>
            <div>
              <p className="font-bold text-sm">{l.nama}</p>
              <p className="text-xs text-muted-foreground">{l.lokasi} · Kapasitas {l.kapasitas}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between">
          <h3 className="font-semibold text-lg">Daftar Laboratorium</h3>
          <Button onClick={() => open()} className="h-10 rounded-xl"><Plus className="w-4 h-4 mr-2" />Tambah Lab</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-semibold">Kode</TableHead>
              <TableHead className="font-semibold">Nama Laboratorium</TableHead>
              <TableHead className="font-semibold">Lokasi</TableHead>
              <TableHead className="font-semibold">Jurusan</TableHead>
              <TableHead className="font-semibold text-center">Kapasitas</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              : labs?.map(l => (
                <TableRow key={l.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs text-slate-500">{l.kode}</TableCell>
                  <TableCell className="font-semibold">{l.nama}</TableCell>
                  <TableCell className="text-sm text-slate-600">{l.lokasi}</TableCell>
                  <TableCell className="text-sm">{(l as any).jurusan?.nama || "-"}</TableCell>
                  <TableCell className="text-center font-semibold">{l.kapasitas}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => open(l)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(l.id, l.nama)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Edit Laboratorium" : "Tambah Laboratorium"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nama Lab</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kode</Label><Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="rounded-xl h-10" placeholder="LKD-01" /></div>
            <div className="space-y-1.5"><Label>Lokasi</Label><Input value={form.lokasi} onChange={e => setForm({...form, lokasi: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kapasitas</Label><Input type="number" value={form.kapasitas} onChange={e => setForm({...form, kapasitas: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Jurusan</Label>
              <Select value={form.jurusanId || "_lintas_"} onValueChange={v => setForm({...form, jurusanId: v === "_lintas_" ? "" : v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih jurusan (opsional)" /></SelectTrigger>
                <SelectContent><SelectItem value="_lintas_">-- Lintas Jurusan --</SelectItem>{jurusanList?.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Deskripsi</Label><Textarea value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Fasilitas</Label><Textarea value={form.fasilitas} onChange={e => setForm({...form, fasilitas: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
