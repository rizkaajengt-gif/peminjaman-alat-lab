import { useState } from "react";
import { useGetStatistik, useGetLaporanPeminjaman } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, Download } from "lucide-react";

export default function AdminLaporan() {
  const [periode, setPeriode] = useState<"harian" | "bulanan" | "tahunan">("bulanan");
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const { data: laporan, isLoading } = useGetLaporanPeminjaman({ periode, tahun });
  const { data: stats } = useGetStatistik();

  const chartData = laporan?.dataAlat?.map((d, i) => ({
    name: d.tanggal?.split("-").slice(-1)[0] || d.tanggal,
    "Peminjaman Alat": laporan.dataAlat[i]?.total || 0,
    "Peminjaman Ruangan": laporan.dataRuangan[i]?.total || 0,
    "Permintaan Bahan": laporan.dataBahan[i]?.total || 0,
  })) || [];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" description="Statistik dan rekap transaksi peminjaman laboratorium." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Peminjaman Alat", value: laporan?.totalPeminjamanAlat ?? stats?.peminjamanAlatBulanIni ?? 0, color: "text-blue-600 bg-blue-50" },
          { label: "Total Peminjaman Ruangan", value: laporan?.totalPeminjamanRuangan ?? stats?.peminjamanRuanganBulanIni ?? 0, color: "text-purple-600 bg-purple-50" },
          { label: "Total Permintaan Bahan", value: laporan?.totalPermintaanBahan ?? stats?.permintaanBahanBulanIni ?? 0, color: "text-teal-600 bg-teal-50" },
          { label: "Menunggu Verifikasi", value: (stats?.peminjamanAlatMenunggu || 0) + (stats?.peminjamanRuanganMenunggu || 0), color: "text-amber-600 bg-amber-50" },
        ].map((s, i) => (
          <Card key={i} className="p-5 border-none shadow-sm">
            <div className={`text-3xl font-black ${s.color.split(" ")[0]}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-none shadow-lg rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <h3 className="font-bold text-lg">Grafik Peminjaman</h3>
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
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Bar dataKey="Peminjaman Alat" fill="#14b8a6" radius={[4,4,0,0]} />
              <Bar dataKey="Peminjaman Ruangan" fill="#8b5cf6" radius={[4,4,0,0]} />
              <Bar dataKey="Permintaan Bahan" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
