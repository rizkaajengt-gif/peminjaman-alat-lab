import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGetJurusan } from "@workspace/api-client-react";
import { Loader2, Building2, CheckCircle } from "lucide-react";

const schema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["mahasiswa", "dosen"]),
  nim: z.string().optional(),
  jurusanId: z.coerce.number().optional(),
  noHp: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { data: jurusanList } = useGetJurusan();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { role: "mahasiswa" },
  });

  const role = form.watch("role");

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setSuccess(true);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Daftar", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Pendaftaran Berhasil!</h2>
          <p className="text-muted-foreground">Akun Anda sedang menunggu verifikasi dari PLP / Admin. Anda akan diberitahu setelah akun diaktifkan.</p>
          <Button className="w-full h-12 rounded-xl" onClick={() => setLocation("/login")}>Kembali ke Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><Building2 size={22} /></div>
            <span className="font-bold text-xl">SIPE<span className="text-primary">LAB</span></span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daftar Akun</h1>
            <p className="text-muted-foreground mt-1">Buat akun baru untuk mengakses sistem lab</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input {...form.register("nama")} placeholder="Nama lengkap Anda" className="h-11 rounded-xl" />
              {form.formState.errors.nama && <p className="text-xs text-destructive">{form.formState.errors.nama.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" placeholder="nama@poltekkes.ac.id" className="h-11 rounded-xl" />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input {...form.register("password")} type="password" placeholder="Min. 6 karakter" className="h-11 rounded-xl" />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select defaultValue="mahasiswa" onValueChange={(v) => form.setValue("role", v as any)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                    <SelectItem value="dosen">Dosen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Jurusan</Label>
                <Select onValueChange={(v) => form.setValue("jurusanId", parseInt(v))}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusanList?.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {role === "mahasiswa" && (
              <div className="space-y-1.5">
                <Label>NIM</Label>
                <Input {...form.register("nim")} placeholder="Nomor Induk Mahasiswa" className="h-11 rounded-xl" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>No. HP (Opsional)</Label>
              <Input {...form.register("noHp")} placeholder="08xxxxxxxxxx" className="h-11 rounded-xl" />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-base font-semibold mt-2">
              {isLoading ? <Loader2 className="animate-spin" /> : "Daftar Sekarang"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">Masuk</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800 text-white p-12">
        <div className="max-w-sm space-y-4 text-center">
          <div className="text-6xl font-black opacity-20 mb-8">✦</div>
          <h2 className="text-3xl font-bold">Bergabung dengan SIPELAB</h2>
          <p className="text-teal-100 text-lg leading-relaxed">Sistem terpadu untuk mengelola laboratorium Poltekkes Tasikmalaya dengan mudah dan efisien.</p>
        </div>
      </div>
    </div>
  );
}
