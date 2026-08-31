import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Microscope, CalendarClock, Beaker, ScanEye } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 h-20 glass z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo-poltekkes.png`} alt="Poltekkes Tasikmalaya" className="h-10 object-contain" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:flex"
            data-testid="link-public-availability"
            href="/ketersediaan"
          >
            <ScanEye className="h-4 w-4" />
            Ketersediaan Lab
          </Link>
          <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors" data-testid="link-login-header">
            Masuk
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            data-testid="link-register-header"
            href="/register"
          >
            Daftar Sekarang
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 pt-20">
        <section className="relative w-full overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Laboratory Background" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30 backdrop-blur-[2px]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32 flex flex-col lg:flex-row items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-3/5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Sistem Terintegrasi Poltekkes Kemenkes Tasikmalaya
              </div>
              <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.1] mb-6">
                Manajemen Laboratorium <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-500">Lebih Mudah & Modern</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                Platform digital untuk peminjaman alat, pemesanan ruangan, dan permintaan bahan praktikum. Terintegrasi, transparan, dan efisien untuk mendukung kegiatan akademik.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  className="inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:-translate-y-1 hover:bg-primary/90 sm:w-auto"
                  data-testid="link-login-hero"
                  href="/login"
                >
                  Mulai Gunakan SIPELAB <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  className="inline-flex h-14 w-full items-center justify-center rounded-full border-2 border-primary/25 bg-card/50 px-8 text-base font-bold text-foreground transition-all hover:bg-secondary sm:w-auto"
                  data-testid="link-register-guide"
                  href="/register"
                >
                  Panduan Penggunaan
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">Fitur Utama</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Dirancang khusus untuk memenuhi kebutuhan manajemen laboratorium di lingkungan pendidikan kesehatan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Microscope, title: "Peminjaman Alat", desc: "Katalog alat lengkap dengan status stok real-time." },
                { icon: CalendarClock, title: "Reservasi Ruangan", desc: "Jadwal lab terpadu untuk mencegah bentrok penggunaan." },
                { icon: Beaker, title: "Permintaan Bahan", desc: "Alur persetujuan bahan habis pakai praktikum." },
                { icon: ShieldCheck, title: "Verifikasi Berjenjang", desc: "Sistem approval oleh PLP dan Gudang untuk keamanan." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-10 text-center text-sm">
        <p className="font-medium text-slate-300">© {new Date().getFullYear()} Poltekkes Kemenkes Tasikmalaya. Hak Cipta Dilindungi.</p>
        <p className="mt-1.5 text-slate-500 text-xs">Design by <span className="text-teal-400 font-medium">Rizka Ajeng Trikusumah</span></p>
      </footer>
    </div>
  );
}
