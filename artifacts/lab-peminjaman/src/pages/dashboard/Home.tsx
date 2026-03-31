import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { Loader2, Users, Package, Clock, ShieldAlert, CalendarCheck, FlaskConical, ClipboardList, BookOpenCheck, Warehouse, BarChart3, Database, Building2, GraduationCap, AlertCircle, RotateCcw, TrendingUp } from "lucide-react";
import { useGetStatistik, useGetLaporanPeminjaman, customFetch } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const BULAN_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function DashboardHome() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "plp") return <PlpDashboard />;
  if (user.role === "gudang") return <GudangDashboard />;
  if (user.role === "mahasiswa" || user.role === "dosen") return <MahasiswaDashboard />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Selamat datang kembali, {user.nama}.</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass }: { title: string; value: number | string; icon: React.ElementType; colorClass: string }) {
  return (
    <Card className="p-6 border-none shadow-lg shadow-slate-100 rounded-2xl flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
      <div className={`p-4 rounded-2xl ${colorClass}`}>
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
      </div>
    </Card>
  );
}

function QuickActionCard({ title, desc, href, icon: Icon, colorClass }: { title: string; desc: string; href: string; icon: React.ElementType; colorClass: string }) {
  return (
    <Link href={href}>
      <Card className={`p-6 border-none shadow-lg shadow-slate-100 rounded-2xl cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${colorClass}`}>
        <Icon size={32} strokeWidth={1.5} className="mb-4 opacity-80" />
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm opacity-75">{desc}</p>
      </Card>
    </Link>
  );
}

function AdminTrendChart() {
  const currentYear = new Date().getFullYear();
  const { data: laporan, isLoading } = useGetLaporanPeminjaman({ periode: "bulanan", tahun: currentYear });

  const chartData = laporan?.dataAlat?.map((_: any, i: number) => ({
    bulan: BULAN_SHORT[i],
    "Alat": laporan.dataAlat[i]?.total || 0,
    "Ruangan": laporan.dataRuangan?.[i]?.total || 0,
    "Bahan": laporan.dataBahan?.[i]?.total || 0,
  })) || [];

  return (
    <Card className="p-6 border-none shadow-lg shadow-slate-100 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-100 text-teal-600">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Tren Peminjaman {currentYear}</h3>
            <p className="text-xs text-muted-foreground">Jumlah pengajuan per bulan</p>
          </div>
        </div>
        <Link href="/admin/laporan">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />Laporan Lengkap
          </Button>
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-primary w-6 h-6" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAlat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRuangan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBahan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", fontSize: "12px" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
            <Area type="monotone" dataKey="Alat" stroke="#14b8a6" strokeWidth={2} fill="url(#colorAlat)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="Ruangan" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRuangan)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="Bahan" stroke="#f59e0b" strokeWidth={2} fill="url(#colorBahan)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetStatistik();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Selamat datang, {user?.nama}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Ringkasan data laboratorium Poltekkes Kemenkes Tasikmalaya.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard title="Total Pengguna" value={stats?.totalUser ?? 0} icon={Users} colorClass="bg-blue-100 text-blue-600" />
            <StatCard title="Total Alat" value={stats?.totalAlat ?? 0} icon={Package} colorClass="bg-emerald-100 text-emerald-600" />
            <StatCard title="Total Bahan" value={stats?.totalBahan ?? 0} icon={FlaskConical} colorClass="bg-amber-100 text-amber-600" />
            <StatCard title="Total Laboratorium" value={stats?.totalLaboratorium ?? 0} icon={Building2} colorClass="bg-purple-100 text-purple-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <StatCard title="Peminjaman Alat Bulan Ini" value={stats?.peminjamanAlatBulanIni ?? 0} icon={Clock} colorClass="bg-sky-100 text-sky-600" />
            <StatCard title="Peminjaman Ruangan Bulan Ini" value={stats?.peminjamanRuanganBulanIni ?? 0} icon={CalendarCheck} colorClass="bg-indigo-100 text-indigo-600" />
            <StatCard title="Permintaan Bahan Bulan Ini" value={stats?.permintaanBahanBulanIni ?? 0} icon={FlaskConical} colorClass="bg-pink-100 text-pink-600" />
          </div>

          {((stats?.peminjamanAlatMenunggu ?? 0) + (stats?.peminjamanRuanganMenunggu ?? 0) + (stats?.permintaanBahanMenunggu ?? 0)) > 0 && (
            <Card className="p-5 border border-amber-200 bg-amber-50 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-amber-500 shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-amber-800">Ada pengajuan yang menunggu verifikasi</p>
                  <p className="text-sm text-amber-700">
                    {stats?.peminjamanAlatMenunggu ?? 0} peminjaman alat · {stats?.peminjamanRuanganMenunggu ?? 0} peminjaman ruangan · {stats?.permintaanBahanMenunggu ?? 0} permintaan bahan
                  </p>
                </div>
              </div>
              <Link href="/plp/verifikasi">
                <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100 rounded-xl shrink-0">
                  Lihat Antrian
                </Button>
              </Link>
            </Card>
          )}
          {(stats?.peminjamaTerlambat ?? 0) > 0 && (
            <Card className="p-5 border border-red-200 bg-red-50 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-red-800">{stats?.peminjamaTerlambat} peminjaman melewati batas waktu pengembalian!</p>
                  <p className="text-sm text-red-700">Segera tindaklanjuti — peminjaman alat dan phantom yang terlambat dikembalikan.</p>
                </div>
              </div>
              <Link href="/plp/riwayat">
                <Button variant="outline" className="border-red-400 text-red-700 hover:bg-red-100 rounded-xl shrink-0">
                  <RotateCcw className="w-4 h-4 mr-1.5" />Cek Pengembalian
                </Button>
              </Link>
            </Card>
          )}
        </>
      )}

      <AdminTrendChart />

      <div>
        <h2 className="text-lg font-bold mb-4">Akses Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <QuickActionCard title="Data Pengguna" desc="Kelola akun pengguna sistem" href="/admin/users" icon={Users} colorClass="bg-blue-50 text-blue-700" />
          <QuickActionCard title="Data Jurusan" desc="Daftar jurusan Poltekkes" href="/admin/jurusan" icon={GraduationCap} colorClass="bg-violet-50 text-violet-700" />
          <QuickActionCard title="Laboratorium" desc="Master data laboratorium" href="/admin/laboratorium" icon={Building2} colorClass="bg-emerald-50 text-emerald-700" />
          <QuickActionCard title="Inventaris" desc="Alat & bahan laboratorium" href="/admin/inventaris" icon={Database} colorClass="bg-amber-50 text-amber-700" />
          <QuickActionCard title="Verifikasi" desc="Setujui pengajuan masuk" href="/plp/verifikasi" icon={BookOpenCheck} colorClass="bg-rose-50 text-rose-700" />
          <QuickActionCard title="Laporan" desc="Statistik & ekspor data" href="/admin/laporan" icon={BarChart3} colorClass="bg-sky-50 text-sky-700" />
          <QuickActionCard title="Penugasan PLP" desc="Atur penugasan per lab" href="/admin/plp-penugasan" icon={Users} colorClass="bg-teal-50 text-teal-700" />
          <QuickActionCard title="Stok Bahan" desc="Manajemen stok gudang" href="/gudang/manajemen" icon={Warehouse} colorClass="bg-orange-50 text-orange-700" />
        </div>
      </div>
    </div>
  );
}

function ActiveBorrowingsWidget() {
  const { data: alatData } = useQuery<any[]>({
    queryKey: ["/api/peminjaman-alat", { status: "dipinjam" }],
    queryFn: () => customFetch("/api/peminjaman-alat?status=dipinjam"),
    select: (d: any) => d as any[],
  });
  const { data: phantomData } = useQuery<any[]>({
    queryKey: ["/api/peminjaman-phantom", { status: "dipinjam" }],
    queryFn: () => customFetch("/api/peminjaman-phantom?status=dipinjam"),
    select: (d: any) => d as any[],
  });

  const totalAlat = alatData?.length ?? 0;
  const totalPhantom = phantomData?.length ?? 0;
  const total = totalAlat + totalPhantom;

  if (total === 0) return null;

  return (
    <Card className="border-none shadow-lg shadow-amber-100 rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
      <div className="p-5 flex items-start gap-4">
        <div className="p-3 bg-amber-100 rounded-xl mt-0.5">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-amber-900">Peminjaman Aktif</h3>
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100">{total} item dipinjam</Badge>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            Anda sedang meminjam {totalAlat > 0 ? `${totalAlat} alat lab` : ""}
            {totalAlat > 0 && totalPhantom > 0 ? " dan " : ""}
            {totalPhantom > 0 ? `${totalPhantom} phantom` : ""}. Pastikan dikembalikan tepat waktu.
          </p>
          <div className="flex flex-wrap gap-2">
            {alatData?.map((p: any) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs bg-white/80 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <span className="font-mono font-bold text-primary text-[10px]">{p.noPeminjaman}</span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-700">{p.items?.slice(0,1).map((i:any) => i.alat?.nama).join("")}{p.items?.length > 1 ? ` +${p.items.length-1}` : ""}</span>
              </div>
            ))}
            {phantomData?.map((p: any) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs bg-white/80 border border-orange-200 rounded-lg px-2.5 py-1.5">
                <span className="font-mono font-bold text-primary text-[10px]">{p.noPeminjaman}</span>
                <span className="text-slate-500">·</span>
                <span className="text-orange-700">{p.items?.slice(0,1).map((i:any) => i.phantom?.nama).join("")}{p.items?.length > 1 ? ` +${p.items.length-1}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
        <Link href="/mahasiswa/riwayat">
          <Button size="sm" className="rounded-xl gap-1.5 bg-amber-600 hover:bg-amber-700 whitespace-nowrap shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />Ajukan Kembalikan
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function MahasiswaDashboard() {
  const { user } = useAuth();
  const role = user?.role;
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-primary to-teal-600 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-widest mb-2">{role === "dosen" ? "Dosen" : "Mahasiswa"}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Selamat Datang, {user?.nama}</h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">Ajukan peminjaman alat, ruangan, atau bahan praktikum langsung dari sini.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 translate-x-12 blur-3xl pointer-events-none"></div>
      </div>

      <ActiveBorrowingsWidget />

      <div>
        <h2 className="text-lg font-bold mb-4">Layanan Tersedia</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <QuickActionCard title="Pinjam Alat Lab" desc="Ajukan peminjaman peralatan praktikum" href="/mahasiswa/peminjaman" icon={ClipboardList} colorClass="bg-teal-50 text-teal-700" />
          <QuickActionCard title="Pinjam Ruangan" desc="Reservasi ruang laboratorium" href="/mahasiswa/ruangan" icon={CalendarCheck} colorClass="bg-blue-50 text-blue-700" />
          <QuickActionCard title="Minta Bahan" desc="Ajukan permintaan bahan habis pakai" href="/mahasiswa/permintaan" icon={FlaskConical} colorClass="bg-amber-50 text-amber-700" />
          <QuickActionCard title="Riwayat Saya" desc="Pantau status semua pengajuan Anda" href="/mahasiswa/riwayat" icon={Clock} colorClass="bg-purple-50 text-purple-700" />
        </div>
      </div>
    </div>
  );
}

function PlpDashboard() {
  const { user } = useAuth();
  const { data: stats } = useGetStatistik();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Selamat datang, {user?.nama}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Pantau dan verifikasi pengajuan yang masuk.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <StatCard title="Menunggu Verif. Alat" value={stats?.peminjamanAlatMenunggu ?? 0} icon={ShieldAlert} colorClass="bg-rose-100 text-rose-600" />
        <StatCard title="Menunggu Verif. Ruangan" value={stats?.peminjamanRuanganMenunggu ?? 0} icon={ShieldAlert} colorClass="bg-orange-100 text-orange-600" />
        <StatCard title="Menunggu Permintaan Bahan" value={stats?.permintaanBahanMenunggu ?? 0} icon={ShieldAlert} colorClass="bg-amber-100 text-amber-600" />
        <StatCard title="Terlambat Dikembalikan" value={(stats as any)?.peminjamaTerlambat ?? 0} icon={AlertCircle} colorClass="bg-red-100 text-red-600" />
      </div>
      {((stats as any)?.peminjamaTerlambat ?? 0) > 0 && (
        <Card className="p-4 border border-red-200 bg-red-50 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={22} />
            <div>
              <p className="font-semibold text-red-800 text-sm">{(stats as any).peminjamaTerlambat} peminjaman sudah melewati batas waktu pengembalian!</p>
              <p className="text-xs text-red-700">Segera cek dan hubungi peminjam untuk mengembalikan alat/phantom.</p>
            </div>
          </div>
          <Link href="/plp/riwayat">
            <Button variant="outline" size="sm" className="border-red-400 text-red-700 hover:bg-red-100 rounded-xl shrink-0 gap-1.5">
              <RotateCcw className="w-4 h-4" />Cek Sekarang
            </Button>
          </Link>
        </Card>
      )}
      <div>
        <h2 className="text-lg font-bold mb-4">Akses Cepat</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <QuickActionCard title="Verifikasi Pengajuan" desc="Setujui atau tolak pengajuan" href="/plp/verifikasi" icon={BookOpenCheck} colorClass="bg-rose-50 text-rose-700" />
          <QuickActionCard title="Inventaris Lab" desc="Kelola alat & bahan" href="/plp/inventaris" icon={Database} colorClass="bg-teal-50 text-teal-700" />
          <QuickActionCard title="Permintaan Bahan" desc="Lihat permintaan bahan masuk" href="/plp/permintaan" icon={FlaskConical} colorClass="bg-amber-50 text-amber-700" />
          <QuickActionCard title="Laporan Lab Saya" desc="Statistik & ekspor data lab" href="/plp/laporan" icon={BarChart3} colorClass="bg-sky-50 text-sky-700" />
        </div>
      </div>
    </div>
  );
}

function GudangDashboard() {
  const { user } = useAuth();
  const { data: stats } = useGetStatistik();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Selamat datang, {user?.nama}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Kelola stok dan verifikasi permintaan bahan.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard title="Total Bahan di Gudang" value={stats?.totalBahan ?? 0} icon={Package} colorClass="bg-amber-100 text-amber-600" />
        <StatCard title="Permintaan Menunggu" value={stats?.permintaanBahanMenunggu ?? 0} icon={ShieldAlert} colorClass="bg-rose-100 text-rose-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">Akses Cepat</h2>
        <div className="grid sm:grid-cols-2 gap-5 max-w-md">
          <QuickActionCard title="Stok & Verifikasi" desc="Kelola stok bahan gudang" href="/gudang/manajemen" icon={Warehouse} colorClass="bg-orange-50 text-orange-700" />
        </div>
      </div>
    </div>
  );
}
