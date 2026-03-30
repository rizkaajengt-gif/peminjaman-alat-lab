import { useState } from "react";
import { useGetStatistik, useGetLaporanPeminjaman, useGetLaboratorium } from "@workspace/api-client-react";
import { LogbookCard } from "@/pages/shared/LogbookCard";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Loader2, Download, Clock, Building2, BookOpen, FlaskConical, Heart, TrendingUp, Calendar } from "lucide-react";

async function fetchStatistikLab(startDate: string, endDate: string, labId: string) {
  const params = new URLSearchParams({ startDate, endDate });
  if (labId && labId !== "_all_") params.set("labId", labId);
  const res = await fetch(`/api/laporan/statistik-lab?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Gagal memuat data");
  return res.json();
}

const PIE_COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#3b82f6", "#f43f5e", "#10b981", "#6366f1"];

export default function AdminLaporan() {
  const [periode, setPeriode] = useState<"harian" | "bulanan" | "tahunan">("bulanan");
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [filterLab, setFilterLab] = useState("_all_");

  const { data: laporan, isLoading } = useGetLaporanPeminjaman({ periode, tahun });
  const { data: stats } = useGetStatistik();
  const { data: labs } = useGetLaboratorium({});

  const { data: statLab, isLoading: loadingLab } = useQuery({
    queryKey: ["/api/laporan/statistik-lab", startDate, endDate, filterLab],
    queryFn: () => fetchStatistikLab(startDate, endDate, filterLab),
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const chartData = laporan?.dataAlat?.map((_: any, i: number) => ({
    name: laporan.dataAlat[i]?.tanggal?.split("-").slice(-1)[0] || laporan.dataAlat[i]?.tanggal,
    "Pinjam Alat": laporan.dataAlat[i]?.total || 0,
    "Pinjam Ruangan": laporan.dataRuangan?.[i]?.total || 0,
    "Permintaan Bahan": laporan.dataBahan?.[i]?.total || 0,
  })) || [];

  const pieData = (statLab?.labs || [])
    .map((l: any) => ({ name: l.laboratorium.nama, value: l.totalJamTerpakai }))
    .filter((d: any) => d.value > 0);

  const exportLabCsv = () => {
    const params = new URLSearchParams({ startDate, endDate });
    if (filterLab !== "_all_") params.set("labId", filterLab);
    window.open(`/api/laporan/statistik-lab/export?${params}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan & Statistik" description="Analisis penggunaan laboratorium berdasarkan rentang waktu dan per laboratorium." />

      {/* Kartu ringkasan bulan ini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Peminjaman Alat Bulan Ini", value: stats?.peminjamanAlatBulanIni ?? 0, color: "purple", icon: TrendingUp },
          { label: "Peminjaman Ruangan Bulan Ini", value: stats?.peminjamanRuanganBulanIni ?? 0, color: "teal", icon: Building2 },
          { label: "Permintaan Bahan Bulan Ini", value: stats?.permintaanBahanBulanIni ?? 0, color: "blue", icon: Calendar },
          { label: "Menunggu Verifikasi", value: (stats?.peminjamanAlatMenunggu || 0) + (stats?.peminjamanRuanganMenunggu || 0), color: "amber", icon: Clock },
        ].map((s, i) => {
          const colorMap: Record<string, string> = { purple: "bg-purple-50 text-purple-600 border-purple-100", teal: "bg-teal-50 text-teal-600 border-teal-100", blue: "bg-blue-50 text-blue-600 border-blue-100", amber: "bg-amber-50 text-amber-600 border-amber-100" };
          const [bg, text, border] = colorMap[s.color].split(" ");
          return (
            <Card key={i} className={`p-5 border shadow-sm rounded-2xl ${bg} ${border}`}>
              <s.icon className={`w-5 h-5 mb-2 ${text}`} />
              <div className={`text-3xl font-black ${text}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">{s.label}</div>
            </Card>
          );
        })}
      </div>

      {/* ═══ STATISTIK PER LABORATORIUM ═══ */}
      <Card className="p-6 border-none shadow-lg rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-teal-600" />Statistik Per Laboratorium</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Jam terpakai dan kategori penggunaan ruangan</p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Dari Tanggal</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 rounded-xl text-sm w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Sampai Tanggal</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 rounded-xl text-sm w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Laboratorium</Label>
              <Select value={filterLab} onValueChange={setFilterLab}>
                <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Semua Laboratorium</SelectItem>
                  {labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={exportLabCsv} variant="outline" className="h-9 rounded-xl gap-1.5 text-xs self-end">
              <Download className="w-3.5 h-3.5" />Export CSV
            </Button>
          </div>
        </div>

        {loadingLab ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : !statLab?.labs?.length ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Tidak ada data pada rentang waktu ini</div>
        ) : (
          <>
            {/* Ringkasan total */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center">
                <Clock className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="text-3xl font-black text-teal-700">{statLab.totalJamSeluruhLab}</div>
                <div className="text-xs text-teal-600 font-semibold mt-0.5">Total Jam Terpakai</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <Building2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-3xl font-black text-blue-700">{statLab.totalTransaksiRuangan}</div>
                <div className="text-xs text-blue-600 font-semibold mt-0.5">Peminjaman Ruangan</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <div className="text-3xl font-black text-purple-700">{statLab.totalTransaksiAlat}</div>
                <div className="text-xs text-purple-600 font-semibold mt-0.5">Peminjaman Alat</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pie chart jam per lab */}
              {pieData.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-slate-700">Distribusi Jam per Lab</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" fontSize={11}>
                        {pieData.map((_: any, idx: number) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v} jam`, "Jam"]} contentStyle={{ borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar chart kategori per lab */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-slate-700">Jam per Kategori Kegiatan</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statLab.labs.map((l: any) => ({
                    name: l.laboratorium.nama.split(" ").slice(-2).join(" "),
                    Pembelajaran: l.perKategori.pembelajaran.jam,
                    Penelitian: l.perKategori.penelitian.jam,
                    Pengabdian: l.perKategori.pengabdian_masyarakat.jam,
                  }))} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="j" />
                    <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: any) => [`${v} jam`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Pembelajaran" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Penelitian" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Pengabdian" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabel detail per lab */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 border-b border-slate-200">Laboratorium</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 border-b border-slate-200"><Clock className="w-3.5 h-3.5 inline mr-1" />Jam Terpakai</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-700 border-b border-slate-200"><BookOpen className="w-3.5 h-3.5 inline mr-1" />Pembelajaran</th>
                    <th className="text-center py-3 px-4 font-semibold text-teal-700 border-b border-slate-200"><FlaskConical className="w-3.5 h-3.5 inline mr-1" />Penelitian</th>
                    <th className="text-center py-3 px-4 font-semibold text-rose-700 border-b border-slate-200"><Heart className="w-3.5 h-3.5 inline mr-1" />Pengabdian</th>
                    <th className="text-center py-3 px-4 font-semibold text-purple-700 border-b border-slate-200">Pinjam Alat</th>
                  </tr>
                </thead>
                <tbody>
                  {statLab.labs.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{l.laboratorium.nama}</div>
                        <div className="text-xs text-muted-foreground">{l.laboratorium.jurusan}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-xl text-teal-600">{l.totalJamTerpakai}</span>
                        <span className="text-xs text-muted-foreground ml-0.5">jam</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-blue-600">{l.perKategori.pembelajaran.jumlah}×</div>
                        <div className="text-xs text-muted-foreground">{l.perKategori.pembelajaran.jam} jam</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-teal-600">{l.perKategori.penelitian.jumlah}×</div>
                        <div className="text-xs text-muted-foreground">{l.perKategori.penelitian.jam} jam</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-rose-600">{l.perKategori.pengabdian_masyarakat.jumlah}×</div>
                        <div className="text-xs text-muted-foreground">{l.perKategori.pengabdian_masyarakat.jam} jam</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-purple-600">{l.totalPeminjamanAlat}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ═══ GRAFIK TREN TRANSAKSI ═══ */}
      <Card className="p-6 border-none shadow-lg rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Grafik Tren Transaksi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Jumlah transaksi per periode waktu</p>
          </div>
          <div className="flex gap-2">
            <Select value={periode} onValueChange={(v) => setPeriode(v as any)}>
              <SelectTrigger className="w-32 h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="harian">Harian</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
                <SelectItem value="tahunan">Tahunan</SelectItem>
              </SelectContent>
            </Select>
            {periode !== "tahunan" && (
              <Select value={String(tahun)} onValueChange={v => setTahun(parseInt(v))}>
                <SelectTrigger className="w-28 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
              <Bar dataKey="Pinjam Alat" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pinjam Ruangan" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Permintaan Bahan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ═══ EXPORT DATA ═══ */}
      <Card className="p-5 border-none shadow-sm rounded-2xl">
        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />Export Data ke CSV
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: "Peminjaman Alat", url: "/api/export/peminjaman-alat" },
            { label: "Peminjaman Ruangan", url: "/api/export/peminjaman-ruangan" },
            { label: "Peminjaman Phantom", url: "/api/export/peminjaman-phantom" },
            { label: "Permintaan Bahan", url: "/api/export/permintaan-bahan" },
            { label: "Inventaris Alat", url: "/api/export/alat" },
            { label: "Data Pengguna", url: "/api/export/users" },
          ].map(e => (
            <Button key={e.url} variant="outline" onClick={() => window.open(e.url, "_blank")} className="h-10 rounded-xl gap-2 justify-start text-sm">
              <Download className="w-3.5 h-3.5 text-teal-600 shrink-0" />{e.label}
            </Button>
          ))}
        </div>
      </Card>

      <LogbookCard labs={labs || []} />
    </div>
  );
}
