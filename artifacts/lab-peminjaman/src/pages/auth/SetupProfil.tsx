import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SignaturePad } from "@/components/ui-custom/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, KeyRound, PenLine, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

const STEPS = [
  { id: 1, label: "Data Diri", icon: User },
  { id: 2, label: "Password Baru", icon: KeyRound },
  { id: 3, label: "Tanda Tangan", icon: PenLine },
];

export default function SetupProfil() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [nama, setNama] = useState(user?.nama || "");
  const [noHp, setNoHp] = useState((user as any)?.noHp || "");
  const [noWa, setNoWa] = useState((user as any)?.noWa || "");

  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [tandaTangan, setTandaTangan] = useState<string | null>(null);

  const canGoNext = () => {
    if (step === 1) return nama.trim().length > 0;
    if (step === 2) return passwordBaru.length >= 6 && passwordBaru === konfirmasi;
    if (step === 3) return !!tandaTangan;
    return false;
  };

  const handleNext = () => {
    if (step === 1 && !nama.trim()) {
      toast({ variant: "destructive", title: "Nama tidak boleh kosong" }); return;
    }
    if (step === 2) {
      if (passwordBaru.length < 6) { toast({ variant: "destructive", title: "Password minimal 6 karakter" }); return; }
      if (passwordBaru !== konfirmasi) { toast({ variant: "destructive", title: "Konfirmasi password tidak cocok" }); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!tandaTangan) { toast({ variant: "destructive", title: "Tanda tangan wajib dibuat" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nama: nama.trim(), noHp: noHp.trim(), noWa: noWa.trim(), passwordBaru, tandaTangan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
      await refreshUser();
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profil berhasil disiapkan!", description: "Selamat datang di SIPELAB." });
      setLocation("/dashboard");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Selesaikan Pengaturan Akun</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Halo, <strong>{user?.nama}</strong>! Sebelum menggunakan SIPELAB, mohon lengkapi profil Anda terlebih dahulu.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isDone ? "bg-teal-100 text-teal-700" :
                  isActive ? "bg-primary text-white shadow-md shadow-primary/25" :
                  "bg-slate-100 text-slate-400"
                }`}>
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 rounded-full ${step > s.id ? "bg-teal-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          {step === 1 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />Lengkapi Data Diri
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Pastikan nama dan kontak Anda sudah benar.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Info Akun Anda</p>
                  <p>Email: <strong>{user?.email}</strong></p>
                  <p>Peran: <strong>{(user?.role as string) || "-"}</strong></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Masukkan nama lengkap" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>No. HP</Label>
                  <Input value={noHp} onChange={e => setNoHp(e.target.value)} placeholder="Contoh: 08123456789" className="rounded-xl h-11" type="tel" />
                </div>
                <div className="space-y-1.5">
                  <Label>No. WhatsApp <span className="text-muted-foreground text-xs">(untuk notifikasi)</span></Label>
                  <Input value={noWa} onChange={e => setNoWa(e.target.value)} placeholder="Contoh: 08123456789" className="rounded-xl h-11" type="tel" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />Buat Password Baru
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Ganti password default dengan password yang aman dan mudah diingat.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Password default Anda (NIM/NIP atau <code>Password123!</code>) harus diganti sekarang demi keamanan akun.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Password Baru <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      value={passwordBaru}
                      onChange={e => setPasswordBaru(e.target.value)}
                      type={showPass ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      className="rounded-xl h-11 pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-primary"
                    >
                      {showPass ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </div>
                  {passwordBaru && (
                    <div className="flex gap-1.5 mt-1">
                      {[
                        { label: "6+ karakter", ok: passwordBaru.length >= 6 },
                        { label: "Huruf besar", ok: /[A-Z]/.test(passwordBaru) },
                        { label: "Angka", ok: /[0-9]/.test(passwordBaru) },
                      ].map(r => (
                        <Badge key={r.label} variant="outline" className={`text-xs ${r.ok ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-slate-50 text-slate-400"}`}>
                          {r.ok ? "✓" : "·"} {r.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Konfirmasi Password <span className="text-red-500">*</span></Label>
                  <Input
                    value={konfirmasi}
                    onChange={e => setKonfirmasi(e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    className={`rounded-xl h-11 ${konfirmasi && konfirmasi !== passwordBaru ? "border-red-300 focus-visible:ring-red-300" : ""}`}
                  />
                  {konfirmasi && konfirmasi !== passwordBaru && (
                    <p className="text-xs text-red-500">Password tidak cocok</p>
                  )}
                  {konfirmasi && konfirmasi === passwordBaru && passwordBaru.length >= 6 && (
                    <p className="text-xs text-teal-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Password cocok</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PenLine className="w-5 h-5 text-primary" />Buat Tanda Tangan Digital
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Tanda tangan ini akan muncul di dokumen peminjaman yang Anda buat.</p>
              </div>

              <div className="space-y-3">
                <Label>Tanda Tangan <span className="text-red-500">*</span></Label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-1 overflow-hidden">
                  <SignaturePad
                    value={tandaTangan}
                    onChange={setTandaTangan}
                    width={440}
                    height={160}
                  />
                </div>
                {!tandaTangan && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <PenLine className="w-3 h-3" />Gambar tanda tangan Anda di area abu-abu di atas
                  </p>
                )}
                {tandaTangan && (
                  <p className="text-xs text-teal-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />Tanda tangan berhasil dibuat
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="px-8 pb-8 flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl flex-1 gap-2" disabled={saving}>
                <ChevronLeft className="w-4 h-4" />Kembali
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="rounded-xl flex-1 gap-2" disabled={!canGoNext()}>
                Lanjut<ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving || !tandaTangan} className="rounded-xl flex-1 gap-2 bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? "Menyimpan..." : "Selesai & Masuk"}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          Langkah {step} dari {STEPS.length} — Data ini dapat diubah kembali di halaman Profil
        </p>
      </div>
    </div>
  );
}
