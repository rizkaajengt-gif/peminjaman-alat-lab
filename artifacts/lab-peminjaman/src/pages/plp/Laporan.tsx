import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Loader2, Download, Clock, Building2, TrendingUp, Calendar, FlaskConical, BookOpen, Heart, Info } from "lucide-react";

const PIE_COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#3b82f6", "#f43f5e", "#10b981"];

async function fetchJson(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Gagal memuat data");
  return res.json();
}

export default function PlpLaporan() {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [filterLab, setFilterLab] = useState("_all_");

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/laporan/statistik-plp"],
    queryFn: () => fetchJson("/api/laporan/statistik-plp"),
  });

  const { data: statLab, isLoading: loadingLab } = useQuery({
    queryKey: ["/api/laporan/statistik-lab", startDate, endDate, filterLab],
    queryFn: () => {
      const p = new URLSearchParams({ startDate, endDate });
      if (filterLab !== "_all_") p.set("labId", filterLab);
      return fetchJson(`/api/laporan/statistik-lab?${p}`);
    },
  });

  const myLabs: any[] = stats?.labs || [];

  const pieData = (statLab?.labs || [])
    .map((l: any) => ({ name: l.laboratorium.nama, value: l.totalJamTerpakai }))
    .filter((d: any) => d.value > 0);

  const barData = (statLab?.labs || []).map((l: any) => ({
    name: l.laboratorium.nama.split(" ").slice(-2).join(" "),
    Pembelajaran: l.perKategori.pembelajaran.jam,
    Penelitian: l.perKategori.penelitian.jam,
    Pengabdian: l.perKategori.pengabdian_masyarakat.jam,
  }));

  const exportRuanganCsv = () => {
    const p = new URLSearchParams({ startDate, endDate });
    if (filterLab !== "_all_") p.set("labId", filterLab);
    window.open(`/api/laporan/statistik-lab/export?${p}`, "_blank");
  };

  const exportAlatCsv = () => {
    const p = new URLSearchParams();
    if (filterLab !== "_all_") p.set("labId", filterLab);
    window.open(`/api/export/peminjaman-alat?${p}`, "_blank");
  };

  const exportBahanCsv = () => {
    const p = new URLSearchParams();
    if (filterLab !== "_all_") p.set("labId", filterLab);
    window.open(`/api/export/permintaan-bahan?${p}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Laboratorium Saya"
        description="Statistik dan laporan penggunaan laboratorium yang Anda tangani."
      />

      {/* Info labs yang ditugaskan */}
      {!loadingStats && (
        <div className="flex flex-wrap items-center gap-2 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-sm text-teal-700 font-medium">Lab yang Anda tangani:</span>
          {myLabs.length > 0 ? (
            myLabs.map((l: any) => (
              <Badge key={l.id} variant="outline" className="bg-white border-teal-300 text-teal-700 text-xs">{l.nama}</Badge>
            ))
          ) : (
            <span className="text-sm text-teal-600 italic">Belum ada lab yang ditugaskan ke Anda</span>
          )}
        </div>
      )}

      {/* Kartu ringkasan bulan ini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 border shadow-sm rounded-2xl animate-pulse bg-slate-50 h-24" />
          ))
        ) : (
          [
            { label: "Peminjaman Alat Bulan Ini", value: stats?.peminjamanAlatBulanIni ?? 0, color: "purple", icon: TrendingUp },
            { label: "Peminjaman Ruangan Bulan Ini", value: stats?.peminjamanRuanganBulanIni ?? 0, color: "teal", icon: Building2 },
            { label: "Permintaan Bahan Bulan Ini", value: stats?.permintaanBahanBulanIni ?? 0, color: "blue", icon: Calendar },
            { label: "Menunggu Verifikasi", value: stats?.menungguVerifikasi ?? 0, color: "amber", icon: Clock },
          ].map((s, i) => {
            const colorMap: Record<string, string> = {
              purple: "bg-purple-50 text-purple-600 border-purple-100",
              teal: "bg-teal-50 text-teal-600 border-teal-100",
              blue: "bg-blue-50 text-blue-600 border-blue-100",
              amber: "bg-amber-50 text-amber-600 border-amber-100",
            };
            const [bg, text, border] = colorMap[s.color].split(" ");
            return (
              <Card key={i} className={`p-5 border shadow-sm rounded-2xl ${bg} ${border}`}>
                <s.icon className={`w-5 h-5 mb-2 ${text}`} />
                <div className={`text-3xl font-black ${text}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">{s.label}</div>
              </Card>
            );
          })
        )}
      </div>

      {/* Statistik per lab */}
      <Card className="p-6 border-none shadow-lg rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-teal-600" />Statistik Penggunaan Lab</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Jam terpakai dan kategori penggunaan ruangan per laboratorium Anda</p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Dari</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 rounded-xl text-sm w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Sampai</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 rounded-xl text-sm w-40" />
            </div>
            {myLabs.length > 1 && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Lab</Label>
                <Select value={filterLab} onValueChange={setFilterLab}>
                  <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">Semua Lab Saya</SelectItem>
                    {myLabs.map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button size="sm" onClick={exportRuanganCsv} variant="outline" className="h-9 rounded-xl gap-1.5 text-xs self-end">
              <Download className="w-3.5 h-3.5" />Export Ruangan
            </Button>
          </div>
        </div>

        {loadingLab ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : !statLab?.labs?.length ? (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm gap-1">
            <Building2 className="w-8 h-8 text-slate-200" />
            Tidak ada data pada rentang waktu ini
          </div>
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
              <div>
                <h4 className="text-sm font-semibold mb-3 text-slate-700">Jam per Kategori Kegiatan</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
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
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 border-b border-slate-200"><Clock className="w-3.5 h-3.5 inline mr-1" />Jam</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-700 border-b border-slate-200"><BookOpen className="w-3.5 h-3.5 inline mr-1" />Pembelajaran</th>
                    <th className="text-center py-3 px-4 font-semibold text-teal-700 border-b border-slate-200"><FlaskConical className="w-3.5 h-3.5 inline mr-1" />Penelitian</th>
                    <th className="text-center py-3 px-4 font-semibold text-rose-700 border-b border-slate-200"><Heart className="w-3.5 h-3.5 inline mr-1" />Pengabdian</th>
                    <th className="text-center py-3 px-4 font-semibold text-purple-700 border-b border-slate-200">Alat</th>
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

      {/* Export Data */}
      <Card className="p-5 border-none shadow-sm rounded-2xl">
        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />Export Data ke CSV
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Data yang diexport sudah otomatis difilter hanya untuk lab yang Anda tangani{filterLab !== "_all_" ? " (lab yang dipilih)" : ""}.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant="outline" onClick={exportAlatCsv} className="h-10 rounded-xl gap-2 justify-start text-sm">
            <Download className="w-3.5 h-3.5 text-purple-600 shrink-0" />Laporan Peminjaman Alat
          </Button>
          <Button variant="outline" onClick={exportRuanganCsv} className="h-10 rounded-xl gap-2 justify-start text-sm">
            <Download className="w-3.5 h-3.5 text-teal-600 shrink-0" />Laporan Peminjaman Ruangan
          </Button>
          <Button variant="outline" onClick={exportBahanCsv} className="h-10 rounded-xl gap-2 justify-start text-sm">
            <Download className="w-3.5 h-3.5 text-amber-600 shrink-0" />Laporan Permintaan Bahan
          </Button>
        </div>
      </Card>
    </div>
  );
}
