import { useState, useRef } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser, useVerifyUser, useGetJurusan, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, MoreHorizontal, CheckCircle2, XCircle, Pencil, Trash2, UserCog, Upload, Download, KeyRound, AlertTriangle, ChevronLeft, ChevronRight, GraduationCap, ShieldBan, ShieldCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 10;

const ROLES = ["admin", "mahasiswa", "plp", "gudang", "dosen", "kepala_laboratorium"] as const;
const ROLE_LABELS: Record<string, string> = { admin: "Admin", mahasiswa: "Mahasiswa", plp: "PLP", gudang: "Gudang", dosen: "Dosen", kepala_laboratorium: "Kepala Laboratorium" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  mahasiswa: "bg-blue-100 text-blue-700 border-blue-200",
  plp: "bg-purple-100 text-purple-700 border-purple-200",
  gudang: "bg-orange-100 text-orange-700 border-orange-200",
  dosen: "bg-green-100 text-green-700 border-green-200",
  kepala_laboratorium: "bg-teal-100 text-teal-700 border-teal-200",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [page, setPage] = useState(1);
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

  const [showNonaktifDialog, setShowNonaktifDialog] = useState(false);
  const [nonaktifAngkatan, setNonaktifAngkatan] = useState("");
  const [nonaktifJurusanId, setNonaktifJurusanId] = useState("");
  const [nonaktifRole, setNonaktifRole] = useState("mahasiswa");
  const [nonaktifLoading, setNonaktifLoading] = useState(false);
  const [nonaktifResult, setNonaktifResult] = useState<string | null>(null);

  const [showBlokirDialog, setShowBlokirDialog] = useState(false);
  const [blokirUser, setBlokirUser] = useState<any>(null);
  const [blokirCatatan, setBlokirCatatan] = useState("");
  const [blokirLoading, setBlokirLoading] = useState(false);

  const { data: users, isLoading } = useGetUsers({ search, role: filterRole as any || undefined });
  const totalPages = Math.max(1, Math.ceil((users?.length || 0) / PAGE_SIZE));
  const pagedUsers = users?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { data: jurusanList } = useGetJurusan();
  const { data: laboratoriumList } = useGetLaboratorium({});
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const verifyMutation = useVerifyUser();

  const [form, setForm] = useState({ nama: "", email: "", password: "", role: "mahasiswa", nim: "", nip: "", noHp: "", noWa: "", callmebotKey: "", angkatan: "", jurusanId: "", laboratoriumId: "", status: "aktif" });

  const openCreate = () => { setEditUser(null); setForm({ nama: "", email: "", password: "", role: "mahasiswa", nim: "", nip: "", noHp: "", noWa: "", callmebotKey: "", angkatan: "", jurusanId: "", laboratoriumId: "", status: "aktif" }); setShowDialog(true); };
  const openEdit = (u: any) => { setEditUser(u); setForm({ nama: u.nama, email: u.email, password: "", role: u.role, nim: u.nim || "", nip: u.nip || "", noHp: u.noHp || "", noWa: u.noWa || "", callmebotKey: u.callmebotKey || "", angkatan: u.angkatan || "", jurusanId: u.jurusanId?.toString() || "", laboratoriumId: u.laboratoriumId?.toString() || "", status: u.status }); setShowDialog(true); };
  const openChangePass = (u: any) => { setPassUserId(u.id); setPassUserName(u.nama); setNewPass(""); setConfirmPass(""); setShowPassDialog(true); };

  const handleSave = () => {
    const payload: any = { nama: form.nama, email: form.email, role: form.role as any, nim: form.nim || null, nip: form.nip || null, noHp: form.noHp || null, noWa: form.noWa || null, callmebotKey: form.callmebotKey || null, angkatan: form.angkatan || null, jurusanId: form.jurusanId ? parseInt(form.jurusanId) : null, laboratoriumId: form.laboratoriumId ? parseInt(form.laboratoriumId) : null, status: form.status as any };
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

  const openBlokir = (u: any) => { setBlokirUser(u); setBlokirCatatan(u.catatanBlokir || ""); setShowBlokirDialog(true); };

  const handleBlokir = async (isBlocked: boolean, targetUser?: any) => {
    const user = targetUser || blokirUser;
    if (!user) return;
    setBlokirLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/blokir`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isBlocked, catatanBlokir: isBlocked ? blokirCatatan : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: isBlocked ? `${user.nama} diblokir` : `Blokir ${user.nama} dicabut` });
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      setShowBlokirDialog(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setBlokirLoading(false);
    }
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

  const handleBulkNonaktif = async () => {
    if (!nonaktifAngkatan && !nonaktifJurusanId && !nonaktifRole) {
      toast({ variant: "destructive", title: "Isi minimal satu kriteria" }); return;
    }
    setNonaktifLoading(true);
    setNonaktifResult(null);
    try {
      const body: any = {};
      if (nonaktifAngkatan) body.angkatan = nonaktifAngkatan;
      if (nonaktifJurusanId) body.jurusanId = parseInt(nonaktifJurusanId);
      if (nonaktifRole) body.role = nonaktifRole;
      const res = await fetch("/api/users/bulk-nonaktif", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNonaktifResult(`${data.count} akun berhasil dinonaktifkan`);
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: data.message });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setNonaktifLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Pengguna" description="Kelola semua akun pengguna sistem SIPELAB." />

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Cari nama / email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-10 rounded-xl" />
            </div>
            <Select value={filterRole || "_all_"} onValueChange={v => { setFilterRole(v === "_all_" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue placeholder="Semua Peran" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Semua Peran</SelectItem>
                {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => { setNonaktifAngkatan(""); setNonaktifJurusanId(""); setNonaktifRole("mahasiswa"); setNonaktifResult(null); setShowNonaktifDialog(true); }} className="h-10 rounded-xl gap-2 text-sm text-orange-600 border-orange-200 hover:bg-orange-50">
              <GraduationCap className="w-4 h-4" />Nonaktifkan Massal
            </Button>
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
                <TableHead className="font-semibold">Angkatan</TableHead>
                <TableHead className="font-semibold">Jurusan</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : users?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
              ) : pagedUsers?.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell>
                    <div className="font-semibold text-slate-800">{u.nama}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-semibold ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-slate-600">{u.nim || u.nip || "-"}</TableCell>
                  <TableCell className="text-sm text-slate-600">{(u as any).angkatan || "-"}</TableCell>
                  <TableCell className="text-sm">{(u as any).jurusan?.nama || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={u.status} />
                      {(u as any).isBlocked && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 w-fit">
                          <ShieldBan className="w-3 h-3 mr-1" />Diblokir
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary rounded-lg h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-52">
                        <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2"><Pencil className="w-4 h-4" />Edit Data</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openChangePass(u)} className="gap-2 text-blue-600"><KeyRound className="w-4 h-4" />Ganti Password</DropdownMenuItem>
                        {u.status === "menunggu" && <>
                          <DropdownMenuItem onClick={() => handleVerify(u.id, "aktif")} className="gap-2 text-green-600"><CheckCircle2 className="w-4 h-4" />Aktifkan</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(u.id, "ditolak")} className="gap-2 text-red-600"><XCircle className="w-4 h-4" />Tolak</DropdownMenuItem>
                        </>}
                        {u.status === "aktif" && <DropdownMenuItem onClick={() => handleVerify(u.id, "ditolak")} className="gap-2 text-orange-600"><UserCog className="w-4 h-4" />Nonaktifkan</DropdownMenuItem>}
                        {u.status !== "aktif" && u.status !== "menunggu" && <DropdownMenuItem onClick={() => handleVerify(u.id, "aktif")} className="gap-2 text-green-600"><CheckCircle2 className="w-4 h-4" />Aktifkan</DropdownMenuItem>}
                        {!(u as any).isBlocked ? (
                          <DropdownMenuItem onClick={() => openBlokir(u)} className="gap-2 text-red-700"><ShieldBan className="w-4 h-4" />Blokir Akun</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleBlokir(false, u)} className="gap-2 text-green-700"><ShieldCheck className="w-4 h-4" />Cabut Blokir</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(u.id, u.nama)} className="gap-2 text-destructive"><Trash2 className="w-4 h-4" />Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, users?.length || 0)}–{Math.min(page * PAGE_SIZE, users?.length || 0)} dari {users?.length} pengguna
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8 rounded-lg text-xs" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                );
              })}
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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
            <div className="space-y-1.5">
              <Label>Angkatan (Tahun Masuk)</Label>
              <Input value={form.angkatan} onChange={e => setForm({...form, angkatan: e.target.value})} className="rounded-xl h-10" placeholder="2021" maxLength={4} />
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
            {form.role === "kepala_laboratorium" && (
              <div className="col-span-2 space-y-1.5 rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                <Label className="text-teal-800">Laboratorium yang Dipimpin</Label>
                <Select value={form.laboratoriumId || "_none_"} onValueChange={v => setForm({...form, laboratoriumId: v === "_none_" ? "" : v})}>
                  <SelectTrigger className="rounded-xl h-10 bg-white"><SelectValue placeholder="Pilih laboratorium" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">-- Pilih Laboratorium --</SelectItem>
                    {laboratoriumList?.map(lab => <SelectItem key={lab.id} value={String(lab.id)}>{lab.nama} ({lab.kode})</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-teal-700">Akun ini hanya dapat meninjau pengajuan dan perpanjangan dari laboratorium yang dipilih.</p>
              </div>
            )}
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

      {/* ── Dialog Nonaktifkan Massal ── */}
      <Dialog open={showNonaktifDialog} onOpenChange={setShowNonaktifDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-orange-600" />Nonaktifkan Akun Massal</DialogTitle>
            <DialogDescription>Nonaktifkan semua akun aktif yang memenuhi kriteria di bawah (misal: mahasiswa angkatan 2021 yang sudah lulus).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Angkatan (Tahun Masuk)</Label>
              <Input value={nonaktifAngkatan} onChange={e => setNonaktifAngkatan(e.target.value)} className="rounded-xl h-10" placeholder="Contoh: 2021" maxLength={4} />
              <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin filter berdasarkan angkatan</p>
            </div>
            <div className="space-y-1.5">
              <Label>Peran</Label>
              <Select value={nonaktifRole || "_all_"} onValueChange={v => setNonaktifRole(v === "_all_" ? "" : v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Semua Peran</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jurusan (opsional)</Label>
              <Select value={nonaktifJurusanId || "_all_"} onValueChange={v => setNonaktifJurusanId(v === "_all_" ? "" : v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Semua Jurusan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Semua Jurusan</SelectItem>
                  {jurusanList?.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Tindakan ini akan mengubah status semua akun aktif yang sesuai kriteria menjadi <strong>Nonaktif</strong>. Akun yang sudah nonaktif tidak terpengaruh. Akun bisa diaktifkan kembali secara manual jika diperlukan.</span>
            </div>
            {nonaktifResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-semibold">{nonaktifResult}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNonaktifDialog(false)} className="rounded-xl">Tutup</Button>
            <Button onClick={handleBulkNonaktif} disabled={nonaktifLoading} className="rounded-xl gap-2 bg-orange-600 hover:bg-orange-700 text-white">
              {nonaktifLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              Nonaktifkan Sekarang
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

      {/* ── Dialog Blokir Akun ── */}
      <Dialog open={showBlokirDialog} onOpenChange={setShowBlokirDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <ShieldBan className="w-5 h-5" />Blokir Akun Pengguna
            </DialogTitle>
            <DialogDescription>
              Pengguna yang diblokir tidak dapat login ke sistem meskipun akun mereka aktif.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {blokirUser && (
              <div className="bg-slate-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-slate-800">{blokirUser.nama}</p>
                <p className="text-muted-foreground">{blokirUser.email}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Alasan blokir (opsional)</Label>
              <Textarea
                placeholder="Contoh: Melanggar aturan penggunaan laboratorium..."
                value={blokirCatatan}
                onChange={(e) => setBlokirCatatan(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlokirDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={() => handleBlokir(true)} disabled={blokirLoading} className="rounded-xl gap-2 bg-red-600 hover:bg-red-700 text-white">
              {blokirLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
              Blokir Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
