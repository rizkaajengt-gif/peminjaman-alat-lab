import { useState } from "react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Send, Trash2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function fmt(d: string) {
  try { return format(new Date(d), "dd MMM yyyy, HH:mm", { locale: id }); } catch { return d; }
}

const ROLE_LABELS: Record<string, string> = {
  mahasiswa: "Mahasiswa",
  dosen: "Dosen",
  plp: "PLP",
  gudang: "Gudang",
};

const ROLE_COLORS: Record<string, string> = {
  mahasiswa: "bg-blue-50 text-blue-700 border-blue-200",
  dosen: "bg-purple-50 text-purple-700 border-purple-200",
  plp: "bg-teal-50 text-teal-700 border-teal-200",
  gudang: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AdminNotifikasi() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [pesan, setPesan] = useState("");
  const [targetRole, setTargetRole] = useState("semua");

  const { data: notifikasi, isLoading } = useQuery({
    queryKey: ["/api/notifikasi/admin"],
    queryFn: () => customFetch("/api/notifikasi"),
  });

  const kirimMutation = useMutation({
    mutationFn: (body: any) => customFetch("/api/notifikasi", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      toast({ title: "Notifikasi berhasil dikirim" });
      setOpen(false); setJudul(""); setPesan(""); setTargetRole("semua");
      qc.invalidateQueries({ queryKey: ["/api/notifikasi/admin"] });
    },
    onError: () => toast({ variant: "destructive", description: "Gagal mengirim notifikasi" }),
  });

  const hapusMutation = useMutation({
    mutationFn: (id: number) => customFetch(`/api/notifikasi/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Notifikasi dihapus" }); qc.invalidateQueries({ queryKey: ["/api/notifikasi/admin"] }); },
    onError: () => toast({ variant: "destructive", description: "Gagal menghapus" }),
  });

  const handleKirim = () => {
    if (!judul.trim() || !pesan.trim()) { toast({ variant: "destructive", description: "Judul dan pesan wajib diisi" }); return; }
    kirimMutation.mutate({ judul, pesan, targetRole: targetRole === "semua" ? null : targetRole });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pusat Notifikasi" description="Kirim pengumuman dan pemberitahuan kepada pengguna sistem." />

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />Buat Notifikasi Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Notifikasi", value: (notifikasi as any[])?.length ?? 0, color: "text-primary" },
          { label: "Ke Mahasiswa", value: (notifikasi as any[])?.filter((n: any) => n.targetRole === "mahasiswa").length ?? 0, color: "text-blue-600" },
          { label: "Ke Semua", value: (notifikasi as any[])?.filter((n: any) => !n.targetRole).length ?? 0, color: "text-green-600" },
          { label: "Ke PLP", value: (notifikasi as any[])?.filter((n: any) => n.targetRole === "plp").length ?? 0, color: "text-teal-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4 border-none shadow-sm">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Bell className="text-primary w-5 h-5" />
          <h3 className="font-semibold">Riwayat Notifikasi Terkirim</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold">Judul</TableHead>
            <TableHead className="font-semibold">Pesan</TableHead>
            <TableHead className="font-semibold">Ditujukan Ke</TableHead>
            <TableHead className="font-semibold">Waktu Kirim</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : (notifikasi as any[])?.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Belum ada notifikasi terkirim</TableCell></TableRow>
            : (notifikasi as any[])?.map((n: any) => (
              <TableRow key={n.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-semibold">{n.judul}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{n.pesan}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${n.targetRole ? ROLE_COLORS[n.targetRole] || "bg-slate-50 text-slate-600" : "bg-green-50 text-green-700 border-green-200"}`}>
                    {n.targetRole ? ROLE_LABELS[n.targetRole] || n.targetRole : "Semua Pengguna"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmt(n.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => hapusMutation.mutate(n.id)} disabled={hapusMutation.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Buat Notifikasi */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Buat Notifikasi Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-semibold">Ditujukan Kepada</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Pengguna</SelectItem>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="plp">PLP</SelectItem>
                  <SelectItem value="gudang">Gudang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Judul Notifikasi *</Label>
              <Input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Misal: Lab Kimia Tidak Tersedia" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Isi Pesan *</Label>
              <Textarea value={pesan} onChange={e => setPesan(e.target.value)} placeholder="Tulis pesan pemberitahuan..." className="rounded-xl resize-none" rows={4} />
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <span className="font-semibold">Catatan:</span> Notifikasi akan ditampilkan kepada pengguna yang dituju saat mereka masuk ke sistem.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleKirim} disabled={kirimMutation.isPending} className="rounded-xl gap-2">
              {kirimMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" />Kirim Notifikasi</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
