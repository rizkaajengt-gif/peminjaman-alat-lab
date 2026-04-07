import { useState } from "react";
import { useGetJurusan, useCreateJurusan, useUpdateJurusan, useDeleteJurusan } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, GraduationCap, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminJurusan() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { data: jurusan, isLoading } = useGetJurusan();
  const createMutation = useCreateJurusan();
  const updateMutation = useUpdateJurusan();
  const deleteMutation = useDeleteJurusan();
  const emptyForm = { nama: "", kode: "", grupJurusan: "", deskripsi: "" };
  const [form, setForm] = useState(emptyForm);

  const open = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { nama: item.nama, kode: item.kode, grupJurusan: item.grupJurusan || "", deskripsi: item.deskripsi || "" } : emptyForm);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload = { nama: form.nama, kode: form.kode, grupJurusan: form.grupJurusan?.trim() || null, deskripsi: form.deskripsi || null };
    const p = editItem
      ? updateMutation.mutateAsync({ id: editItem.id, data: payload })
      : createMutation.mutateAsync({ data: payload });
    p.then(() => {
      toast({ title: "Berhasil disimpan" });
      setShowDialog(false);
      qc.invalidateQueries({ queryKey: ["/api/jurusan"] });
    }).catch((e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message || e.message }));
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus jurusan "${nama}"? Semua data terkait (lab, user) akan kehilangan referensi jurusan ini.`)) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Dihapus" }); qc.invalidateQueries({ queryKey: ["/api/jurusan"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }),
    });
  };

  const handleExport = () => {
    window.open("/api/export/users", "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Data Jurusan" description="Kelola program studi / jurusan yang ada di Poltekkes." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {jurusan?.slice(0, 4).map(j => (
          <Card key={j.id} className="p-4 border-none shadow-sm bg-gradient-to-br from-teal-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><GraduationCap className="text-primary" size={20} /></div>
              <div>
                <p className="font-bold text-sm">{j.kode}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[100px]">{j.nama}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">Daftar Jurusan</h3>
            <p className="text-sm text-muted-foreground">{jurusan?.length || 0} jurusan terdaftar</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="h-10 rounded-xl gap-2">
              <Download className="w-4 h-4" />Export Data
            </Button>
            <Button onClick={() => open()} className="h-10 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />Tambah Jurusan
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-semibold">Kode</TableHead>
              <TableHead className="font-semibold">Nama Jurusan / Prodi</TableHead>
              <TableHead className="font-semibold">Grup Jurusan</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : jurusan?.map(j => (
                <TableRow key={j.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono font-bold text-primary text-sm">{j.kode}</TableCell>
                  <TableCell className="font-semibold">{j.nama}</TableCell>
                  <TableCell>
                    {(j as any).grupJurusan ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {(j as any).grupJurusan}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => open(j)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(j.id, j.nama)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Edit Jurusan" : "Tambah Jurusan Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kode Jurusan</Label>
                <Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="rounded-xl h-10" placeholder="JKL, JKG..." />
              </div>
              <div className="space-y-1.5">
                <Label>Nama Jurusan</Label>
                <Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Grup Jurusan
                <span className="text-xs font-normal text-muted-foreground">(opsional, untuk pengelompokan multi-prodi)</span>
              </Label>
              <Input
                value={form.grupJurusan}
                onChange={e => setForm({...form, grupJurusan: e.target.value})}
                className="rounded-xl h-10"
                placeholder="Contoh: kebidanan, keperawatan, farmasi..."
              />
              <p className="text-xs text-muted-foreground">
                Tulis nama grup yang sama untuk prodi-prodi yang berbagi laboratorium dan PLP yang sama.
                Misal: D3, D4, dan Profesi Kebidanan semua diisi <strong>kebidanan</strong>.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi (Opsional)</Label>
              <Textarea value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} className="rounded-xl resize-none" rows={2} />
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
    </div>
  );
}
