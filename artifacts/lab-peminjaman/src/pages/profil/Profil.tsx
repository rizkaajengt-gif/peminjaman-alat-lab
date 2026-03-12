import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, KeyRound, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", mahasiswa: "Mahasiswa", plp: "PLP", gudang: "Gudang", dosen: "Dosen" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  mahasiswa: "bg-blue-100 text-blue-700 border-blue-200",
  plp: "bg-purple-100 text-purple-700 border-purple-200",
  gudang: "bg-orange-100 text-orange-700 border-orange-200",
  dosen: "bg-green-100 text-green-700 border-green-200",
};

export default function Profil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [nama, setNama] = useState(user?.nama || "");
  const [noHp, setNoHp] = useState((user as any)?.noHp || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async () => {
    if (!nama.trim()) { toast({ variant: "destructive", title: "Nama tidak boleh kosong" }); return; }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nama: nama.trim(), noHp: noHp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profil berhasil diperbarui" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePass = async () => {
    if (!passwordLama) { toast({ variant: "destructive", title: "Masukkan password lama" }); return; }
    if (passwordBaru.length < 6) { toast({ variant: "destructive", title: "Password baru minimal 6 karakter" }); return; }
    if (passwordBaru !== konfirmasi) { toast({ variant: "destructive", title: "Konfirmasi password tidak cocok" }); return; }
    setSavingPass(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passwordLama, passwordBaru }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal");
      toast({ title: "Password berhasil diubah" });
      setPasswordLama(""); setPasswordBaru(""); setKonfirmasi("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Profil Saya" description="Kelola informasi akun dan keamanan login Anda." />

      {/* Info Akun */}
      <Card className="p-6 border-none shadow-lg rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">{user?.nama?.substring(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-800">{user?.nama}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="outline" className={`mt-1 text-xs font-semibold ${ROLE_COLORS[user?.role || "mahasiswa"]}`}>
              {ROLE_LABELS[user?.role || "mahasiswa"]}
            </Badge>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h4 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />Edit Informasi Pribadi
          </h4>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={nama} onChange={e => setNama(e.target.value)} className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>No. Handphone</Label>
              <Input value={noHp} onChange={e => setNoHp(e.target.value)} className="rounded-xl h-10" placeholder="08xx-xxxx-xxxx" />
            </div>
            {user?.nim && (
              <div className="space-y-1.5">
                <Label>NIM</Label>
                <Input value={user.nim} disabled className="rounded-xl h-10 bg-slate-50 text-muted-foreground" />
              </div>
            )}
            {(user as any)?.nip && (
              <div className="space-y-1.5">
                <Label>NIP</Label>
                <Input value={(user as any).nip} disabled className="rounded-xl h-10 bg-slate-50 text-muted-foreground" />
              </div>
            )}
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="rounded-xl gap-2">
              {savingProfile ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              Simpan Profil
            </Button>
          </div>
        </div>
      </Card>

      {/* Ganti Password */}
      <Card className="p-6 border-none shadow-lg rounded-2xl">
        <h4 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" />Ganti Password
        </h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Password Lama</Label>
            <Input type="password" value={passwordLama} onChange={e => setPasswordLama(e.target.value)} className="rounded-xl h-10" placeholder="Masukkan password saat ini" />
          </div>
          <div className="space-y-1.5">
            <Label>Password Baru</Label>
            <Input type="password" value={passwordBaru} onChange={e => setPasswordBaru(e.target.value)} className="rounded-xl h-10" placeholder="Minimal 6 karakter" />
          </div>
          <div className="space-y-1.5">
            <Label>Konfirmasi Password Baru</Label>
            <Input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)} className="rounded-xl h-10" placeholder="Ulangi password baru" />
          </div>
          {konfirmasi && passwordBaru !== konfirmasi && (
            <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Password tidak cocok</p>
          )}
          {konfirmasi && passwordBaru === konfirmasi && passwordBaru.length >= 6 && (
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Password cocok</p>
          )}
          <Button onClick={handleChangePass} disabled={savingPass} variant="outline" className="rounded-xl gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
            {savingPass ? <Loader2 className="animate-spin w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            Ubah Password
          </Button>
        </div>
      </Card>

      {/* Info tambahan (jurusan) */}
      {(user as any)?.jurusan && (
        <Card className="p-5 border-none shadow-sm rounded-2xl bg-teal-50/50">
          <p className="text-xs font-semibold text-teal-700 mb-1">Jurusan</p>
          <p className="text-sm font-bold text-teal-900">{(user as any).jurusan.nama}</p>
        </Card>
      )}
    </div>
  );
}
