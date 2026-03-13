import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, Building2, Ghost, Printer } from "lucide-react";

const KATEGORI_LABEL: Record<string, string> = {
  pembelajaran: "Pembelajaran",
  penelitian: "Penelitian",
  pengabdian_masyarakat: "Pengabdian Masyarakat",
  sewa_eksternal: "Sewa Eksternal",
};

const KATEGORI_COLOR: Record<string, string> = {
  pembelajaran: "bg-blue-50 text-blue-700 border-blue-200",
  penelitian: "bg-teal-50 text-teal-700 border-teal-200",
  pengabdian_masyarakat: "bg-rose-50 text-rose-700 border-rose-200",
  sewa_eksternal: "bg-amber-50 text-amber-700 border-amber-200",
};

async function fetchJson(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Gagal memuat data");
  return res.json();
}

function printLogbook(title: string, labNama: string, subTitle: string, records: any[]) {
  const rows = records.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.hariTanggal}</td>
      <td>${r.jamMulai}</td>
      <td>${r.jamSelesai}</td>
      <td>${r.namaPengguna}</td>
      <td>${r.nimNip}</td>
      <td>${r.tujuan}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Log Book ${title}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 20mm; color: #000; }
  h2 { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; }
  .sub { font-size: 12px; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-weight: bold; }
  tr:nth-child(even) { background: #fafafa; }
  @media print { body { margin: 10mm; } }
</style></head>
<body>
<h2>LOG BOOK PENGGUNAAN PERALATAN LABORATORIUM</h2>
<p class="sub"><strong>Nama Laboratorium:</strong> ${labNama}</p>
<p class="sub"><strong>${title}:</strong> ${subTitle}</p>
<table>
  <thead><tr>
    <th style="width:40px">No</th>
    <th style="width:130px">Hari/Tanggal</th>
    <th style="width:70px">Jam Mulai</th>
    <th style="width:70px">Jam Selesai</th>
    <th>Nama Pengguna</th>
    <th>NIM/NIP/Instansi</th>
    <th>Tujuan Penggunaan</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
}

function LogbookAlat({ labs }: { labs: any[] }) {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [filterLab, setFilterLab] = useState("_all_");
  const [filterAlat, setFilterAlat] = useState("_all_");

  const params = new URLSearchParams({ startDate, endDate });
  if (filterLab !== "_all_") params.set("labId", filterLab);
  if (filterAlat !== "_all_") params.set("alatId", filterAlat);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/laporan/logbook/alat", startDate, endDate, filterLab, filterAlat],
    queryFn: () => fetchJson(`/api/laporan/logbook/alat?${params}`),
  });

  const records: any[] = data?.records || [];
  const alats: any[] = data?.alats || [];

  const labNama = labs.find(l => String(l.id) === filterLab)?.nama || "Semua Lab";
  const alatNama = alats.find(a => String(a.id) === filterAlat)?.nama || "Semua Alat";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Laboratorium</Label>
          <Select value={filterLab} onValueChange={v => { setFilterLab(v); setFilterAlat("_all_"); }}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Semua Lab</SelectItem>
              {labs.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Alat</Label>
          <Select value={filterAlat} onValueChange={setFilterAlat}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Semua Alat</SelectItem>
              {alats.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Dari</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Sampai</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl" onClick={() => printLogbook("Alat", labNama, alatNama, records)}>
          <Printer className="w-4 h-4" />Cetak Log Book
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent">
            <TableHead className="w-10 font-bold">No</TableHead>
            <TableHead className="font-bold">Hari/Tanggal</TableHead>
            <TableHead className="font-bold">Jam Mulai</TableHead>
            <TableHead className="font-bold">Jam Selesai</TableHead>
            <TableHead className="font-bold">Nama Pengguna</TableHead>
            <TableHead className="font-bold">NIM/NIP</TableHead>
            <TableHead className="font-bold">Tujuan Penggunaan</TableHead>
            <TableHead className="font-bold">Kategori</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : records.length === 0 ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Belum ada data peminjaman alat pada rentang waktu ini</TableCell></TableRow>
            : records.map(r => (
              <TableRow key={r.noPeminjaman} className="hover:bg-slate-50/50">
                <TableCell className="text-center font-semibold">{r.no}</TableCell>
                <TableCell className="font-medium">{r.hariTanggal}</TableCell>
                <TableCell className="font-mono">{r.jamMulai}</TableCell>
                <TableCell className="font-mono">{r.jamSelesai}</TableCell>
                <TableCell>{r.namaPengguna}</TableCell>
                <TableCell className="font-mono text-sm">{r.nimNip}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-sm">{r.tujuan}</div>
                  <div className="text-xs text-muted-foreground">{r.alat}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${KATEGORI_COLOR[r.kategori] || ""}`}>
                    {KATEGORI_LABEL[r.kategori] || r.kategori}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LogbookRuangan({ labs }: { labs: any[] }) {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [filterLab, setFilterLab] = useState("_all_");

  const params = new URLSearchParams({ startDate, endDate });
  if (filterLab !== "_all_") params.set("labId", filterLab);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/laporan/logbook/ruangan", startDate, endDate, filterLab],
    queryFn: () => fetchJson(`/api/laporan/logbook/ruangan?${params}`),
  });

  const records: any[] = data?.records || [];
  const labNama = labs.find(l => String(l.id) === filterLab)?.nama || "Semua Lab";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Laboratorium / Ruangan</Label>
          <Select value={filterLab} onValueChange={setFilterLab}>
            <SelectTrigger className="h-9 w-48 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Semua Lab</SelectItem>
              {labs.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Dari</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Sampai</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl" onClick={() => printLogbook("Ruangan", labNama, labNama, records)}>
          <Printer className="w-4 h-4" />Cetak Log Book
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent">
            <TableHead className="w-10 font-bold">No</TableHead>
            <TableHead className="font-bold">Hari/Tanggal</TableHead>
            <TableHead className="font-bold">Jam Mulai</TableHead>
            <TableHead className="font-bold">Jam Selesai</TableHead>
            <TableHead className="font-bold">Nama Pengguna</TableHead>
            <TableHead className="font-bold">NIM/NIP</TableHead>
            <TableHead className="font-bold">Tujuan Penggunaan</TableHead>
            <TableHead className="font-bold">Kategori</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : records.length === 0 ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Belum ada data peminjaman ruangan pada rentang waktu ini</TableCell></TableRow>
            : records.map(r => (
              <TableRow key={r.noPeminjaman} className="hover:bg-slate-50/50">
                <TableCell className="text-center font-semibold">{r.no}</TableCell>
                <TableCell className="font-medium">{r.hariTanggal}</TableCell>
                <TableCell className="font-mono">{r.jamMulai}</TableCell>
                <TableCell className="font-mono">{r.jamSelesai}</TableCell>
                <TableCell>{r.namaPengguna}</TableCell>
                <TableCell className="font-mono text-sm">{r.nimNip}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-sm">{r.tujuan}</div>
                  <div className="text-xs text-muted-foreground">{r.jumlahPeserta} peserta · {r.laboratorium}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${KATEGORI_COLOR[r.kategori] || ""}`}>
                    {KATEGORI_LABEL[r.kategori] || r.kategori}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LogbookPhantom({ labs }: { labs: any[] }) {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);
  const [filterLab, setFilterLab] = useState("_all_");

  const params = new URLSearchParams({ startDate, endDate });
  if (filterLab !== "_all_") params.set("labId", filterLab);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/laporan/logbook/phantom", startDate, endDate, filterLab],
    queryFn: () => fetchJson(`/api/laporan/logbook/phantom?${params}`),
  });

  const records: any[] = data?.records || [];
  const labNama = labs.find(l => String(l.id) === filterLab)?.nama || "Semua Lab";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Laboratorium</Label>
          <Select value={filterLab} onValueChange={setFilterLab}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Semua Lab</SelectItem>
              {labs.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Dari</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Sampai</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl" onClick={() => printLogbook("Phantom", labNama, "Semua Phantom", records)}>
          <Printer className="w-4 h-4" />Cetak Log Book
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow className="hover:bg-transparent">
            <TableHead className="w-10 font-bold">No</TableHead>
            <TableHead className="font-bold">Hari/Tanggal</TableHead>
            <TableHead className="font-bold">Jam Mulai</TableHead>
            <TableHead className="font-bold">Jam Selesai</TableHead>
            <TableHead className="font-bold">Nama Pengguna</TableHead>
            <TableHead className="font-bold">NIM/NIP</TableHead>
            <TableHead className="font-bold">Tujuan Penggunaan</TableHead>
            <TableHead className="font-bold">Kategori</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : records.length === 0 ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Belum ada data peminjaman phantom pada rentang waktu ini</TableCell></TableRow>
            : records.map(r => (
              <TableRow key={r.noPeminjaman} className="hover:bg-slate-50/50">
                <TableCell className="text-center font-semibold">{r.no}</TableCell>
                <TableCell className="font-medium">{r.hariTanggal}</TableCell>
                <TableCell className="font-mono">{r.jamMulai}</TableCell>
                <TableCell className="font-mono">{r.jamSelesai}</TableCell>
                <TableCell>{r.namaPengguna}</TableCell>
                <TableCell className="font-mono text-sm">{r.nimNip}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-sm">{r.tujuan}</div>
                  <div className="text-xs text-muted-foreground">{r.phantom}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${KATEGORI_COLOR[r.kategori] || ""}`}>
                    {KATEGORI_LABEL[r.kategori] || r.kategori}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function LogbookCard({ labs }: { labs: any[] }) {
  return (
    <Card className="p-6 border-none shadow-lg rounded-2xl">
      <div className="mb-5">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600" />Log Book Penggunaan Laboratorium
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Riwayat penggunaan alat, ruangan, dan phantom dalam format log book. Bisa dicetak langsung.</p>
      </div>
      <Tabs defaultValue="alat">
        <TabsList className="bg-slate-50 border border-slate-200 p-1 rounded-xl h-auto mb-4">
          <TabsTrigger value="alat" className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <BookOpen className="w-4 h-4" />Log Book Alat
          </TabsTrigger>
          <TabsTrigger value="ruangan" className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Building2 className="w-4 h-4" />Log Book Ruangan
          </TabsTrigger>
          <TabsTrigger value="phantom" className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Ghost className="w-4 h-4" />Log Book Phantom
          </TabsTrigger>
        </TabsList>
        <TabsContent value="alat"><LogbookAlat labs={labs} /></TabsContent>
        <TabsContent value="ruangan"><LogbookRuangan labs={labs} /></TabsContent>
        <TabsContent value="phantom"><LogbookPhantom labs={labs} /></TabsContent>
      </Tabs>
    </Card>
  );
}
