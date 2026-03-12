import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        toast({ title: "Login Berhasil", description: res.message });
        window.location.href = "/dashboard"; // hard reload to trigger auth context
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login Gagal", 
          description: err.response?.data?.message || "Periksa kembali email dan password Anda." 
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] bg-white shadow-2xl z-10 relative">
        <Link href="/" className="absolute top-8 left-8 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Beranda
        </Link>
        
        <div className="mx-auto w-full max-w-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex justify-center mb-8">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <img src={`${import.meta.env.BASE_URL}logo-poltekkes.png`} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground text-center tracking-tight">Selamat Datang</h2>
            <p className="mt-2 text-center text-muted-foreground">Masuk ke akun SIPELAB Anda</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-10">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-semibold">Email</Label>
                <Input 
                  id="email" 
                  placeholder="nama@poltekkes.ac.id" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/20 transition-all"
                  {...form.register("email")}
                />
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">Lupa password?</a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/20 transition-all"
                  {...form.register("password")}
                />
                {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Lab"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-display font-bold mb-4 leading-tight">Sistem Terpadu<br/>Manajemen Laboratorium</h2>
          <p className="text-slate-300 text-lg max-w-xl">Mengelola peminjaman alat, ruangan, dan permintaan bahan habis pakai dengan transparan dan terukur.</p>
        </div>
      </div>
    </div>
  );
}
