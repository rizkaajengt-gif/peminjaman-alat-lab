import { useState, useRef } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser, useVerifyUser, useGetJurusan } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, MoreHorizontal, CheckCircle2, XCircle, Pencil, Trash2, UserCog, Upload, Download, KeyRound, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const ROLES = ["admin", "mahasiswa", "plp", "gudang", "dosen"] as const;
const ROLE_LABELS: Record<string, string> = { admin: "Admin", mahasiswa: "Mahasiswa", plp: "PLP", gudang: "Gudang", dosen: "Dosen" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  mahasiswa: "bg-blue-100 text-blue-700 border-blue-200",
  plp: "bg-purple-100 text-purple-700 border-purple-200",
  gudang: "bg-orange-100 text-orange-700 border-orange-200",
  dosen: "bg-green-100 text-green-700 border-green-200",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showPassDialog, setShowPassDialog] = useState(false);
  const [passUserId, setPassUserId] = useState<number | null>(null);
  const [passUserName, setPassUserName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const { data: users, isLoading } = useGetUsers({ search, role: filterRole as any || undefined });
  const { data: jurusanList } = useGetJurusan();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const verifyMutation = useVerifyUser();

  const [form, setForm] = useState({ nama: "", email: "", password: "", role: "mahasiswa", nim: "", nip: "", noHp: "", noWa: "", callmebotKey: "", jurusanId: "", status: "aktif" });

  const openCreate = () => { setEditUser(null); setForm({ nama: "", email: "", password: "", role: "mahasiswa", nim: "", nip: "", noHp: "", noWa: "", callmebotKey: "", jurusanId: "", status: "aktif" }); setShowDialog(true); };
  const openEdit = (u: any) => { setEditUser(u); setForm({ nama: u.nama, email: u.email, password: "", role: u.role, nim: u.nim || "", nip: u.nip || "", noHp: u.noHp || "", noWa: u.noWa || "", callmebotKey: u.callmebotKey || "", jurusanId: u.jurusanId?.toString() || "", status: u.status }); setShowDialog(true); };
  const openChangePass = (u: any) => { setPassUserId(u.id); setPassUserName(u.nama); setNewPass(""); setConfirmPass(""); setShowPassDialog(true); };

  const handleSave = () => {
    const payload: any = { nama: form.nama, email: form.email, role: form.role as any, nim: form.nim || null, nip: form.nip || null, noHp: form.noHp || null, noWa: form.noWa || null, callmebotKey: form.callmebotKey || null, jurusanId: form.jurusanId ? parseInt(form.jurusanId) : null, status: form.status as any };
    if (!editUser) payload.password = form.password;
    const mutation = editUser
      ? updateMutation.mutateAsync({ id: editUser.id, data: payload })
      : createMutation.mutateAsync({ data: payload });
    mutation.then(() => {
      toast({ title: editUser ? "User diperbarui" : "User dibuat" });
      setShowDialog(false);
      qc.invalidateQueries({ queryKey: ["/api/users"] });
    }).catch((e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message || e.message }));
  };

  const handleVerify = (id: number, status: "aktif" | "ditolak") => {
    verifyMutation.mutate({ id, data: { status } }, {
      onSuccess: () => { toast({ title: status === "aktif" ? "User diaktifkan" : "User ditolak" }); qc.invalidateQueries({ queryKey: ["/api/users"] }); },
      onError: (e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message }),
    });
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus user "${nama}"?`)) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "User dihapus" }); qc.invalidateQueries({ queryKey: ["/api/users"] }); },
      onError: (e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message }),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportCsv(ev.target?.result as string || "");
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importCsv.trim()) { toast({ variant: "destructive", title: "Pilih file CSV terlebih dahulu" }); return; }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/import/users", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ csv: importCsv }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal import");
      setImportResult(data);
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: `Import berhasil: ${data.success} user ditambahkan` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal import", description: e.message });
    } finally {
      setImporting(false);
    }
  };

  const handleChangePass = async () => {
    if (!newPass || newPass.length < 6) { toast({ variant: "destructive", title: "Password minimal 6 karakter" }); return; }
    if (newPass !== confirmPass) { toast({ variant: "destructive", title: "Password tidak cocok" }); return; }
    setSavingPass(true);
    try {
      const res = await fetch(`/api/users/${passUserId}/password`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ password: newPass }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal");
      toast({ title: "Password berhasil diubah" });
      setShowPassDialog(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setSavingPass(false);
    }
  };

  const downloadTemplate = () => window.open("/api/import/users/template", "_blank");

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Pengguna" description="Kelola semua akun pengguna sistem SIPELAB." />

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Cari nama / email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
            </div>
            <Select value={filterRole || "_all_"} onValueChange={v => setFilterRole(v === "_all_" ? "" : v)}>
              <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue placeholder="Semua Peran" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Semua Peran</SelectItem>
                {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setImportCsv(""); setImportResult(null); setShowImport(true); }} className="h-10 rounded-xl gap-2 text-sm">
              <Upload className="w-4 h-4" />Import CSV
            </Button>
            <Button onClick={openCreate} className="h-10 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />Tambah User
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-semibold">Nama</TableHead>
                <TableHead className="font-semibold">Peran</TableHead>
                <TableHead className="font-semibold">NIM / NIP</TableHead>
                <TableHead className="font-semibold">Jurusan</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : users?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
              ) : users?.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell>
                    <div className="font-semibold text-slate-800">{u.nama}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-semibold ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-slate-600">{u.nim || u.nip || "-"}</TableCell>
                  <TableCell className="text-sm">{(u as any).jurusan?.nama || "-"}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary rounded-lg h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2"><Pencil className="w-4 h-4" />Edit Data</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openChangePass(u)} className="gap-2 text-blue-600"><KeyRound className="w-4 h-4" />Ganti Password</DropdownMenuItem>
                        {u.status === "menunggu" && <>
                          <DropdownMenuItem onClick={() => handleVerify(u.id, "aktif")} className="gap-2 text-green-600"><CheckCircle2 className="w-4 h-4" />Aktifkan</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(u.id, "ditolak")} className="gap-2 text-red-600"><XCircle className="w-4 h-4" />Tolak</DropdownMenuItem>
                        </>}
                        {u.status === "aktif" && <DropdownMenuItem onClick={() => handleVerify(u.id, "ditolak")} className="gap-2 text-orange-600"><UserCog className="w-4 h-4" />Nonaktifkan</DropdownMenuItem>}
                        {u.status !== "aktif" && u.status !== "menunggu" && <DropdownMenuItem onClick={() => handleVerify(u.id, "aktif")} className="gap-2 text-green-600"><CheckCircle2 className="w-4 h-4" />Aktifkan</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => handleDelete(u.id, u.nama)} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" />Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Dialog Tambah / Edit User ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Tambah User Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl h-10" />
            </div>
            {!editUser && <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="rounded-xl h-10" />
            </div>}
            <div className="space-y-1.5">
              <Label>Peran</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="menunggu">Menunggu</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>NIM (jika Mahasiswa)</Label>
              <Input value={form.nim} onChange={e => setForm({...form, nim: e.target.value})} className="rounded-xl h-10" placeholder="2021XXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>NIP (jika Staf)</Label>
              <Input value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} className="rounded-xl h-10" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Jurusan</Label>
              <Select value={form.jurusanId || "_none_"} onValueChange={v => setForm({...form, jurusanId: v === "_none_" ? "" : v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih Jurusan (opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">-- Tidak Ada --</SelectItem>
                  {jurusanList?.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.role === "plp" && (
              <>
                <div className="col-span-2 border-t pt-3">
                  <p className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400" />
                    Konfigurasi Notifikasi WhatsApp (Callmebot)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>No. WhatsApp (format: 628xxx)</Label>
                  <Input value={form.noWa} onChange={e => setForm({...form, noWa: e.target.value})} className="rounded-xl h-10" placeholder="628123456789" />
                </div>
                <div className="space-y-1.5">
                  <Label>API Key Callmebot</Label>
                  <Input value={form.callmebotKey} onChange={e => setForm({...form, callmebotKey: e.target.value})} className="rounded-xl h-10" placeholder="Key dari Callmebot" />
                </div>
                <div className="col-span-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                  <strong>Cara aktivasi Callmebot:</strong> Simpan nomor <strong>+34 644 44 53 84</strong> di WA → Kirim pesan <em>"I allow callmebot to send me messages"</em> → Balas bot berisi API key → Masukkan key di sini.
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Ganti Password ── */}
      <Dialog open={showPassDialog} onOpenChange={setShowPassDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-blue-600" />Ganti Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Mengubah password untuk: <strong className="text-slate-700">{passUserName}</strong></p>
            <div className="space-y-1.5">
              <Label>Password Baru</Label>
              <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password</Label>
              <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Ulangi password baru" className="rounded-xl h-10" />
            </div>
            {confirmPass && newPass !== confirmPass && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Password tidak cocok</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPassDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleChangePass} disabled={savingPass} className="rounded-xl">
              {savingPass ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Import CSV ── */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="w-4 h-4 text-teal-600" />Import Pengguna dari CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Upload file CSV untuk menambah pengguna massal.</p>
              <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs h-8 rounded-xl text-teal-600">
                <Download className="w-3.5 h-3.5" />Template
              </Button>
            </div>
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {importCsv ? <span className="text-teal-600 font-semibold">File dipilih ({importCsv.split("\n").length - 1} baris data)</span> : "Klik atau seret file CSV ke sini"}
              </p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
              <p className="font-semibold text-blue-700">Format kolom CSV:</p>
              <p className="font-mono">nama, email, password, role, nim, nip, noHp, jurusanId</p>
              <p>role: admin/mahasiswa/plp/gudang/dosen | Unduh template untuk contoh lengkap.</p>
            </div>
            {importResult && (
              <div className={`rounded-xl p-3 text-sm ${importResult.errors?.length ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
                <p className="font-semibold text-green-700">{importResult.success} user berhasil ditambahkan</p>
                {importResult.errors?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-amber-700 text-xs">{importResult.errors.length} error:</p>
                    {importResult.errors.slice(0, 5).map((e: string, i: number) => <p key={i} className="text-xs text-amber-600">{e}</p>)}
                    {importResult.errors.length > 5 && <p className="text-xs text-amber-500">...dan {importResult.errors.length - 5} lainnya</p>}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)} className="rounded-xl">Tutup</Button>
            <Button onClick={handleImport} disabled={importing || !importCsv} className="rounded-xl gap-2">
              {importing ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
