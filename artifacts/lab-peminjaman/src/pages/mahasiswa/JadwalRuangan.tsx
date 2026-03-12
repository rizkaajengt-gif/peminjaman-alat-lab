import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Clock, Users, Building2 } from "lucide-react";
import { format, isSameDay, parseISO, startOfWeek, addDays, isToday } from "date-fns";
import { id } from "date-fns/locale";

function formatWaktu(w: string | undefined) {
  if (!w) return "-";
  return w.slice(0, 5);
}

function formatTanggal(d: string | undefined) {
  if (!d) return "-";
  try { return format(parseISO(d), "dd MMM yyyy", { locale: id }); } catch { return d; }
}

function kategoriLabel(k: string) {
  return { pembelajaran: "Pembelajaran/Praktikum", penelitian: "Penelitian", pengabdian_masyarakat: "Pengabdian Masyarakat" }[k] || k;
}

function kategoriColor(k: string) {
  return { pembelajaran: "bg-blue-100 text-blue-700", penelitian: "bg-purple-100 text-purple-700", pengabdian_masyarakat: "bg-green-100 text-green-700" }[k] || "bg-slate-100 text-slate-700";
}

export default function JadwalRuangan() {
  const [labId, setLabId] = useState<string>("_all_");
  const [view, setView] = useState<"list" | "week">("list");

  const { data: labs } = useGetLaboratorium({});
  const { data: jadwal, isLoading } = useQuery<any[]>({
    queryKey: ["/api/peminjaman-ruangan/jadwal", labId],
    queryFn: () => customFetch(`/api/peminjaman-ruangan/jadwal${labId !== "_all_" ? `?laboratoriumId=${labId}` : ""}`),
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcoming = jadwal?.filter((j) => j.tanggalSelesai >= todayStr) || [];
  const past = jadwal?.filter((j) => j.tanggalSelesai < todayStr) || [];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Peminjaman Ruangan"
        description="Lihat ketersediaan ruangan laboratorium yang sudah disetujui."
      />

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={labId} onValueChange={setLabId}>
          <SelectTrigger className="w-64 rounded-xl border-slate-200">
            <SelectValue placeholder="Semua Laboratorium" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">Semua Laboratorium</SelectItem>
            {labs?.map((l: any) => (
              <SelectItem key={l.id} value={String(l.id)}>{l.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === "list" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >Daftar</button>
          <button
            onClick={() => setView("week")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === "week" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >Mingguan</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
      ) : view === "list" ? (
        <div className="space-y-6">
          {upcoming.length === 0 && past.length === 0 ? (
            <Card className="border-none shadow-sm p-12 text-center">
              <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-muted-foreground">Belum ada jadwal peminjaman ruangan yang disetujui</p>
            </Card>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                    Akan Datang / Berlangsung ({upcoming.length})
                  </h3>
                  {upcoming.map((j: any) => (
                    <JadwalCard key={j.id} jadwal={j} />
                  ))}
                </div>
              )}
              {past.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-300 rounded-full inline-block" />
                    Sudah Selesai ({past.length})
                  </h3>
                  {past.slice(0, 5).map((j: any) => (
                    <JadwalCard key={j.id} jadwal={j} past />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
          <div className="grid grid-cols-8 border-b border-slate-100">
            <div className="p-3 bg-slate-50 border-r border-slate-100" />
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday(day) ? "bg-primary/5" : "bg-slate-50"}`}>
                <div className="text-xs text-muted-foreground">{format(day, "EEE", { locale: id })}</div>
                <div className={`text-sm font-bold mt-0.5 ${isToday(day) ? "text-primary" : "text-slate-700"}`}>
                  {format(day, "dd")}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 divide-x divide-slate-100">
            <div className="text-xs text-muted-foreground p-3 pt-4 space-y-4">
              {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map(t => (
                <div key={t} className="h-8 flex items-start">{t}</div>
              ))}
            </div>
            {weekDays.map((day, di) => {
              const dayItems = jadwal?.filter((j: any) => {
                const start = parseISO(j.tanggalMulai);
                const end = parseISO(j.tanggalSelesai);
                return day >= start && day <= end;
              }) || [];
              return (
                <div key={di} className={`relative min-h-[352px] p-1 ${isToday(day) ? "bg-primary/5" : ""}`}>
                  {dayItems.map((j: any) => (
                    <div key={j.id} className={`rounded-lg p-1.5 mb-1 text-xs ${kategoriColor(j.kategori)}`}>
                      <div className="font-semibold truncate">{j.laboratorium?.nama}</div>
                      <div className="text-xs opacity-80">{formatWaktu(j.waktuMulai)}-{formatWaktu(j.waktuSelesai)}</div>
                      <div className="truncate opacity-70">{j.user?.nama}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function JadwalCard({ jadwal: j, past }: { jadwal: any; past?: boolean }) {
  return (
    <Card className={`border-none shadow-sm rounded-2xl overflow-hidden ${past ? "opacity-60" : ""}`}>
      <div className="flex gap-0">
        <div className={`w-1.5 flex-shrink-0 ${j.kategori === "pembelajaran" ? "bg-blue-500" : j.kategori === "penelitian" ? "bg-purple-500" : "bg-green-500"}`} />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{j.laboratorium?.nama}</span>
                <Badge className={`text-xs rounded-lg border-0 ${kategoriColor(j.kategori)}`}>
                  {kategoriLabel(j.kategori)}
                </Badge>
                {j.judulKegiatan && (
                  <span className="text-xs text-muted-foreground">— {j.judulKegiatan}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatTanggal(j.tanggalMulai)}
                  {j.tanggalMulai !== j.tanggalSelesai && ` – ${formatTanggal(j.tanggalSelesai)}`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatWaktu(j.waktuMulai)} – {formatWaktu(j.waktuSelesai)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {j.jumlahPeserta} peserta
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {j.user?.nama}
                {j.user?.jurusan?.nama && ` · ${j.user.jurusan.nama}`}
              </div>
            </div>
            {past && <Badge variant="outline" className="text-xs shrink-0 text-slate-400">Selesai</Badge>}
            {!past && <Badge className="text-xs shrink-0 bg-green-100 text-green-700 border-0">Disetujui</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
}
