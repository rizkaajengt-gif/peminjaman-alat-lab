import { useAuth } from "@/lib/auth-context";
import { Loader2, Users, Package, Clock, ShieldAlert } from "lucide-react";
import { useGetStatistik } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";

export default function DashboardHome() {
  const { user } = useAuth();
  
  if (!user) return null;

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'mahasiswa') return <MahasiswaDashboard />;
  if (user.role === 'plp') return <PlpDashboard />;
  
  // Generic fallback for others
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Dashboard {user.role}</h1>
      <p className="text-muted-foreground">Selamat datang kembali, {user.nama}.</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <Card className="p-6 border-none shadow-lg shadow-slate-100 rounded-2xl flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
      <div className={`p-4 rounded-2xl ${colorClass}`}>
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
      </div>
    </Card>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useGetStatistik();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Overview Sistem</h1>
        <p className="text-muted-foreground mt-1 text-lg">Ringkasan data laboratorium Poltekkes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pengguna" value={stats.totalUser} icon={Users} colorClass="bg-blue-100 text-blue-600" />
        <StatCard title="Total Alat" value={stats.totalAlat} icon={Package} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard title="Total Bahan" value={stats.totalBahan} icon={Package} colorClass="bg-amber-100 text-amber-600" />
        <StatCard title="Peminjaman Aktif" value={stats.peminjamanAlatBulanIni} icon={Clock} colorClass="bg-purple-100 text-purple-600" />
      </div>
      
      {/* Placeholder for charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-lg shadow-slate-100 rounded-2xl min-h-[300px] flex items-center justify-center bg-slate-50/50">
          <p className="text-muted-foreground font-medium">Grafik Peminjaman Bulan Ini (Recharts)</p>
        </Card>
        <Card className="p-6 border-none shadow-lg shadow-slate-100 rounded-2xl min-h-[300px] flex items-center justify-center bg-slate-50/50">
           <p className="text-muted-foreground font-medium">Aktivitas Terkini</p>
        </Card>
      </div>
    </div>
  );
}

function MahasiswaDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-primary to-teal-600 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Selamat Datang, {user?.nama}</h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">Mulai ajukan peminjaman alat atau ruangan praktikum Anda dari sini.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 translate-x-12 blur-3xl"></div>
      </div>
      
      <div className="grid sm:grid-cols-3 gap-6">
        {/* Quick action cards */}
      </div>
    </div>
  );
}

function PlpDashboard() {
  const { data: stats } = useGetStatistik();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard PLP</h1>
        <p className="text-muted-foreground mt-1 text-lg">Tugas verifikasi yang menunggu tindakan Anda.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Menunggu Verif. Alat" value={stats?.peminjamanAlatMenunggu || 0} icon={ShieldAlert} colorClass="bg-rose-100 text-rose-600" />
        <StatCard title="Menunggu Verif. Ruangan" value={stats?.peminjamanRuanganMenunggu || 0} icon={ShieldAlert} colorClass="bg-orange-100 text-orange-600" />
      </div>
    </div>
  );
}
