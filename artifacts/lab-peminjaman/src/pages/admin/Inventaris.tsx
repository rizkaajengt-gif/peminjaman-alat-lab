import { useState, useRef, useMemo } from "react";
import { useGetAlat, useCreateAlat, useUpdateAlat, useDeleteAlat, useGetBahan, useCreateBahan, useUpdateBahan, useDeleteBahan, useGetLaboratorium, customFetch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Pencil, Trash2, AlertTriangle, Upload, Download, ChevronLeft, ChevronRight, X, GraduationCap, FlaskConical, BarChart3 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

const KONDISI_COLORS: Record<string, string> = {
  baik: "bg-green-100 text-green-700 border-green-200",
  rusak_ringan: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rusak_berat: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminInventaris() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris" description="Kelola alat dan bahan habis pakai laboratorium." />
      <Tabs defaultValue="alat">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4">
          <TabsTrigger value="alat" className="rounded-lg px-6 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white">Inventaris Alat</TabsTrigger>
          <TabsTrigger value="bahan" className="rounded-lg px-6 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-white">Bahan Habis Pakai</TabsTrigger>
        </TabsList>
        <TabsContent value="alat"><AlatTab /></TabsContent>
        <TabsContent value="bahan"><BahanTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ImportCsvDialog({ open, onClose, type, queryKey }: { open: boolean; onClose: () => void; type: "alat" | "bahan"; queryKey: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [importCsv, setImportCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportCsv(ev.target?.result as string || "");
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importCsv.trim()) { toast({ variant: "destructive", title: "Pilih file CSV terlebih dahulu" }); return; }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await customFetch(`/api/import/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: importCsv }) });
      setImportResult(res);
      qc.invalidateQueries({ queryKey: [queryKey] });
    } catch (e: any) {
      toast({ variant: "destructive", description: e?.data?.message || "Gagal import" });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => { setImportCsv(""); setImportResult(null); if (fileRef.current) fileRef.current.value = ""; onClose(); };

  const typeLabel = type === "alat" ? "Alat" : "Bahan";
  const colFormat = type === "alat" ? "kode,nama,deskripsi,kondisi,stok,satuan,laboratoriumId" : "kode,nama,deskripsi,stok,stokMinimal,satuan,laboratoriumId";

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader><DialogTitle>Import {typeLabel} dari CSV</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload className="mx-auto mb-2 text-muted-foreground w-8 h-8" />
            <p className="text-sm font-medium">{importCsv ? "File dipilih. Klik untuk ganti." : "Klik untuk pilih file CSV"}</p>
            <p className="text-xs text-muted-foreground mt-1">Format: .csv</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-blue-700">Format kolom CSV:</p>
            <p className="font-mono">{colFormat}</p>
            <p>Unduh template untuk contoh data lengkap.</p>
          </div>
          {importResult && (
            <div className={`rounded-xl p-3 text-sm ${importResult.errors?.length ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
              <p className="font-semibold text-green-700">{importResult.success} {typeLabel.toLowerCase()} berhasil ditambahkan</p>
              {importResult.errors?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-amber-700 text-xs">{importResult.errors.length} error:</p>
                  {importResult.errors.slice(0, 5).map((e: string, i: number) => <p key={i} className="text-xs text-amber-600">{e}</p>)}
                  {importResult.errors.length > 5 && <p className="text-xs text-amber-500">...dan {importResult.errors.length - 5} lainnya</p>}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-xl">Tutup</Button>
          <Button onClick={handleImport} disabled={importing || !importCsv} className="rounded-xl gap-2">
            {importing ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterBar({
  search, onSearch,
  jurusanList, filterJurusan, onJurusan,
  labList, filterLab, onLab,
  filterStok, onStok,
  placeholder,
}: {
  search: string; onSearch: (v: string) => void;
  jurusanList: any[]; filterJurusan: string; onJurusan: (v: string) => void;
  labList: any[]; filterLab: string; onLab: (v: string) => void;
  filterStok?: string; onStok?: (v: string) => void;
  placeholder?: string;
}) {
  const activeCount = [filterJurusan, filterLab, filterStok].filter(Boolean).length;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder={placeholder || "Cari..."} value={search} onChange={e => onSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>
      <Select value={filterJurusan || "_all_"} onValueChange={v => { onJurusan(v === "_all_" ? "" : v); onLab(""); }}>
        <SelectTrigger className={`w-44 h-10 rounded-xl ${filterJurusan ? "border-primary bg-primary/5 text-primary font-medium" : ""}`}>
          <GraduationCap className="w-3.5 h-3.5 mr-1 shrink-0" />
          <SelectValue placeholder="Semua Jurusan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all_">Semua Jurusan</SelectItem>
          {jurusanList.map(j => <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterLab || "_all_"} onValueChange={v => onLab(v === "_all_" ? "" : v)}>
        <SelectTrigger className={`w-44 h-10 rounded-xl ${filterLab ? "border-primary bg-primary/5 text-primary font-medium" : ""}`}>
          <FlaskConical className="w-3.5 h-3.5 mr-1 shrink-0" />
          <SelectValue placeholder="Semua Lab" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all_">Semua Lab</SelectItem>
          {labList.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}
        </SelectContent>
      </Select>
      {onStok && (
        <Select value={filterStok || "_all_"} onValueChange={v => onStok(v === "_all_" ? "" : v)}>
          <SelectTrigger className={`w-40 h-10 rounded-xl ${filterStok ? "border-amber-500 bg-amber-50 text-amber-700 font-medium" : ""}`}>
            <SelectValue placeholder="Semua Stok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">Semua Stok</SelectItem>
            <SelectItem value="rendah">Stok Rendah</SelectItem>
            <SelectItem value="normal">Stok Normal</SelectItem>
          </SelectContent>
        </Select>
      )}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="h-10 rounded-xl gap-1.5 text-muted-foreground hover:text-destructive"
          onClick={() => { onJurusan(""); onLab(""); onStok?.(""); }}>
          <X className="w-3.5 h-3.5" />Reset ({activeCount})
        </Button>
      )}
    </div>
  );
}

function StokSummaryCards({ items, getJurusanNama }: { items: any[]; getJurusanNama: (lab: any) => string }) {
  const byJurusan = useMemo(() => {
    const map: Record<string, { nama: string; total: number; rendah: number }> = {};
    items.forEach(item => {
      const jurusan = getJurusanNama(item.laboratorium);
      if (!map[jurusan]) map[jurusan] = { nama: jurusan, total: 0, rendah: 0 };
      map[jurusan].total += item.stok || 0;
      if ((item.stok || 0) <= (item.stokMinimal || 0)) map[jurusan].rendah++;
    });
    return Object.values(map).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [items]);

  if (byJurusan.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-1">
      {byJurusan.map(j => (
        <Card key={j.nama} className={`p-3 rounded-xl border-none shadow-sm ${j.rendah > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium truncate">{j.nama}</p>
              <p className="font-bold text-lg leading-tight mt-0.5">{j.total}</p>
              <p className="text-xs text-muted-foreground">total stok</p>
            </div>
            {j.rendah > 0 && (
              <div className="shrink-0 flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-lg mt-0.5">
                <AlertTriangle className="w-3 h-3" />{j.rendah}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function AlatTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterLab, setFilterLab] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const { data: labs } = useGetLaboratorium({});
  const { data: jurusanList } = useQuery<any[]>({ queryKey: ["/api/jurusan"], queryFn: () => customFetch("/api/jurusan") });
  const { data: alat, isLoading } = useGetAlat({ search });
  const createMutation = useCreateAlat();
  const updateMutation = useUpdateAlat();
  const deleteMutation = useDeleteAlat();
  const emptyForm = { nama: "", kode: "", deskripsi: "", kondisi: "baik", stok: 1, satuan: "unit", laboratoriumId: "" };
  const [form, setForm] = useState(emptyForm);

  const jurusanMap = useMemo(() => {
    const m: Record<number, string> = {};
    (labs || []).forEach((l: any) => { if (l.jurusan) m[l.id] = l.jurusan.nama; });
    return m;
  }, [labs]);

  const filteredLabs = useMemo(() => (labs || []).filter((l: any) => !filterJurusan || String(l.jurusanId) === filterJurusan || l.jurusan?.id?.toString() === filterJurusan), [labs, filterJurusan]);

  const filtered = useMemo(() => (alat || []).filter(a => {
    if (filterLab && String(a.laboratoriumId) !== filterLab) return false;
    if (filterJurusan && jurusanMap[a.laboratoriumId] !== (jurusanList || []).find((j: any) => j.id.toString() === filterJurusan)?.nama) return false;
    if (filterKondisi && a.kondisi !== filterKondisi) return false;
    return true;
  }), [alat, filterLab, filterJurusan, filterKondisi, jurusanMap, jurusanList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedAlat = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const open = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { nama: item.nama, kode: item.kode, deskripsi: item.deskripsi || "", kondisi: item.kondisi, stok: item.stok, satuan: item.satuan, laboratoriumId: item.laboratoriumId?.toString() || "" } : emptyForm);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload: any = { nama: form.nama, kode: form.kode, deskripsi: form.deskripsi || null, kondisi: form.kondisi as any, stok: Number(form.stok), satuan: form.satuan, laboratoriumId: parseInt(form.laboratoriumId) };
    const p = editItem ? updateMutation.mutateAsync({ id: editItem.id, data: payload }) : createMutation.mutateAsync({ data: payload });
    p.then(() => { toast({ title: "Berhasil disimpan" }); setShowDialog(false); qc.invalidateQueries({ queryKey: ["/api/alat"] }); })
     .catch((e: any) => toast({ variant: "destructive", description: e?.data?.message || e.message }));
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus alat "${nama}"?`)) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { toast({ title: "Dihapus" }); qc.invalidateQueries({ queryKey: ["/api/alat"] }); }, onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }) });
  };

  return (
    <>
      <StokSummaryCards items={alat || []} getJurusanNama={lab => lab ? jurusanMap[lab?.id] || lab?.nama || "Lainnya" : "Lainnya"} />
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap gap-2 justify-between">
            <FilterBar
              search={search} onSearch={v => { setSearch(v); setPage(1); }}
              jurusanList={jurusanList || []} filterJurusan={filterJurusan} onJurusan={v => { setFilterJurusan(v); setPage(1); }}
              labList={filteredLabs} filterLab={filterLab} onLab={v => { setFilterLab(v); setPage(1); }}
              placeholder="Cari alat..."
            />
            <div className="flex gap-2">
              <Select value={filterKondisi || "_all_"} onValueChange={v => { setFilterKondisi(v === "_all_" ? "" : v); setPage(1); }}>
                <SelectTrigger className={`w-40 h-10 rounded-xl ${filterKondisi ? "border-primary bg-primary/5 text-primary font-medium" : ""}`}>
                  <SelectValue placeholder="Semua Kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Semua Kondisi</SelectItem>
                  <SelectItem value="baik">Baik</SelectItem>
                  <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                  <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowImport(true)} className="h-10 rounded-xl gap-2 text-sm">
                <Upload className="w-4 h-4" />Import CSV
              </Button>
              <Button onClick={() => open()} className="h-10 rounded-xl"><Plus className="w-4 h-4 mr-2" />Tambah Alat</Button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari {alat?.length || 0} alat</span>
            {(filterJurusan || filterLab || filterKondisi) && (
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">Filter aktif</Badge>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-semibold">Kode</TableHead>
                <TableHead className="font-semibold">Nama Alat</TableHead>
                <TableHead className="font-semibold">Jurusan</TableHead>
                <TableHead className="font-semibold">Laboratorium</TableHead>
                <TableHead className="font-semibold">Kondisi</TableHead>
                <TableHead className="font-semibold text-center">Stok / Tersedia</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Tidak ada data yang sesuai filter</TableCell></TableRow>
              : pagedAlat.map(a => (
                <TableRow key={a.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="font-mono text-xs text-slate-500">{a.kode}</TableCell>
                  <TableCell className="font-semibold">{a.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{jurusanMap[a.laboratoriumId] || "—"}</TableCell>
                  <TableCell className="text-sm">{a.laboratorium?.nama}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${KONDISI_COLORS[a.kondisi]}`}>{a.kondisi.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-center"><span className="font-bold">{a.stok}</span> / <span className="text-primary font-bold">{a.stokTersedia}</span> <span className="text-xs text-muted-foreground">{a.satuan}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => open(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(a.id, a.nama)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4"/></Button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(totalPages-4,page-2))+i;return(<Button key={p} variant={p===page?"default":"outline"} size="icon" className="h-8 w-8 rounded-lg text-xs" onClick={()=>setPage(p)}>{p}</Button>);})}
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Edit Alat" : "Tambah Alat"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nama Alat</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kode</Label><Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kondisi</Label>
              <Select value={form.kondisi} onValueChange={v => setForm({...form, kondisi: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="baik">Baik</SelectItem><SelectItem value="rusak_ringan">Rusak Ringan</SelectItem><SelectItem value="rusak_berat">Rusak Berat</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Stok</Label><Input type="number" min="0" value={form.stok} onChange={e => setForm({...form, stok: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Satuan</Label><Input value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})} className="rounded-xl h-10" placeholder="unit / set / buah" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Laboratorium</Label>
              <Select value={form.laboratoriumId} onValueChange={v => setForm({...form, laboratoriumId: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={showImport} onClose={() => setShowImport(false)} type="alat" queryKey="/api/alat" />
    </>
  );
}

function BahanTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterLab, setFilterLab] = useState("");
  const [filterStok, setFilterStok] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const { data: labs } = useGetLaboratorium({});
  const { data: jurusanList } = useQuery<any[]>({ queryKey: ["/api/jurusan"], queryFn: () => customFetch("/api/jurusan") });
  const { data: bahan, isLoading } = useGetBahan({ search });
  const createMutation = useCreateBahan();
  const updateMutation = useUpdateBahan();
  const deleteMutation = useDeleteBahan();
  const emptyForm = { nama: "", kode: "", deskripsi: "", stok: 0, stokMinimal: 0, satuan: "unit", laboratoriumId: "" };
  const [form, setForm] = useState(emptyForm);

  const jurusanMap = useMemo(() => {
    const m: Record<number, string> = {};
    (labs || []).forEach((l: any) => { if (l.jurusan) m[l.id] = l.jurusan.nama; });
    return m;
  }, [labs]);

  const filteredLabs = useMemo(() => (labs || []).filter((l: any) => !filterJurusan || l.jurusan?.id?.toString() === filterJurusan), [labs, filterJurusan]);

  const filtered = useMemo(() => (bahan || []).filter(b => {
    if (filterLab && String(b.laboratoriumId) !== filterLab) return false;
    if (filterJurusan && (jurusanList || []).find((j: any) => j.id.toString() === filterJurusan)?.nama !== jurusanMap[b.laboratoriumId]) return false;
    if (filterStok === "rendah" && b.stok > b.stokMinimal) return false;
    if (filterStok === "normal" && b.stok <= b.stokMinimal) return false;
    return true;
  }), [bahan, filterLab, filterJurusan, filterStok, jurusanMap, jurusanList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedBahan = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const lowStockCount = (bahan || []).filter(b => b.stok <= b.stokMinimal).length;

  const open = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { nama: item.nama, kode: item.kode, deskripsi: item.deskripsi || "", stok: item.stok, stokMinimal: item.stokMinimal, satuan: item.satuan, laboratoriumId: item.laboratoriumId?.toString() || "" } : emptyForm);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload: any = { nama: form.nama, kode: form.kode, deskripsi: form.deskripsi || null, stok: Number(form.stok), stokMinimal: Number(form.stokMinimal), satuan: form.satuan, laboratoriumId: parseInt(form.laboratoriumId) };
    const p = editItem ? updateMutation.mutateAsync({ id: editItem.id, data: payload }) : createMutation.mutateAsync({ data: payload });
    p.then(() => { toast({ title: "Berhasil disimpan" }); setShowDialog(false); qc.invalidateQueries({ queryKey: ["/api/bahan"] }); })
     .catch((e: any) => toast({ variant: "destructive", description: e?.data?.message || e.message }));
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Hapus bahan "${nama}"?`)) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { toast({ title: "Dihapus" }); qc.invalidateQueries({ queryKey: ["/api/bahan"] }); }, onError: (e: any) => toast({ variant: "destructive", description: e?.data?.message }) });
  };

  return (
    <>
      {lowStockCount > 0 && (
        <Card className="p-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => { setFilterStok("rendah"); setPage(1); }}>
          <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
          <p className="text-sm text-amber-800"><strong>{lowStockCount} bahan</strong> memiliki stok rendah — klik untuk melihat</p>
          {filterStok === "rendah" && <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-700 border-amber-300 text-xs">Filter aktif</Badge>}
        </Card>
      )}
      <StokSummaryCards items={bahan || []} getJurusanNama={lab => lab ? jurusanMap[lab?.id] || lab?.nama || "Lainnya" : "Lainnya"} />
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap gap-2 justify-between">
            <FilterBar
              search={search} onSearch={v => { setSearch(v); setPage(1); }}
              jurusanList={jurusanList || []} filterJurusan={filterJurusan} onJurusan={v => { setFilterJurusan(v); setPage(1); }}
              labList={filteredLabs} filterLab={filterLab} onLab={v => { setFilterLab(v); setPage(1); }}
              filterStok={filterStok} onStok={v => { setFilterStok(v); setPage(1); }}
              placeholder="Cari bahan..."
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImport(true)} className="h-10 rounded-xl gap-2 text-sm">
                <Upload className="w-4 h-4" />Import CSV
              </Button>
              <Button onClick={() => open()} className="h-10 rounded-xl"><Plus className="w-4 h-4 mr-2" />Tambah Bahan</Button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari {bahan?.length || 0} bahan</span>
            {(filterJurusan || filterLab || filterStok) && (
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">Filter aktif</Badge>
            )}
          </div>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-semibold">Kode</TableHead>
              <TableHead className="font-semibold">Nama Bahan</TableHead>
              <TableHead className="font-semibold">Jurusan</TableHead>
              <TableHead className="font-semibold">Laboratorium</TableHead>
              <TableHead className="font-semibold text-center">Stok PLP</TableHead>
              <TableHead className="font-semibold text-center">Stok Gudang</TableHead>
              <TableHead className="font-semibold text-center">Min. Stok</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Tidak ada data yang sesuai filter</TableCell></TableRow>
            : pagedBahan.map(b => (
              <TableRow key={b.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="font-mono text-xs text-slate-500">{b.kode}</TableCell>
                <TableCell>
                  <div className="font-semibold">{b.nama}</div>
                  {b.stok <= b.stokMinimal && <div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" />Stok rendah</div>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{jurusanMap[b.laboratoriumId] || "—"}</TableCell>
                <TableCell className="text-sm">{b.laboratorium?.nama}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold ${b.stok <= b.stokMinimal ? "text-red-600" : "text-teal-600"}`}>{b.stok}</span>
                  <span className="text-xs text-muted-foreground ml-1">{b.satuan}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-blue-600">{(b as any).stokGudang ?? 0}</span>
                  <span className="text-xs text-muted-foreground ml-1">{b.satuan}</span>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">{b.stokMinimal} {b.satuan}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => open(b)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(b.id, b.nama)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4"/></Button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(totalPages-4,page-2))+i;return(<Button key={p} variant={p===page?"default":"outline"} size="icon" className="h-8 w-8 rounded-lg text-xs" onClick={()=>setPage(p)}>{p}</Button>);})}
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Edit Bahan" : "Tambah Bahan"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nama Bahan</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Kode</Label><Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Stok Awal</Label><Input type="number" min="0" value={form.stok} onChange={e => setForm({...form, stok: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Stok Minimal</Label><Input type="number" min="0" value={form.stokMinimal} onChange={e => setForm({...form, stokMinimal: parseInt(e.target.value)})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Satuan</Label><Input value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})} className="rounded-xl h-10" /></div>
            <div className="space-y-1.5"><Label>Laboratorium</Label>
              <Select value={form.laboratoriumId} onValueChange={v => setForm({...form, laboratoriumId: v})}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={showImport} onClose={() => setShowImport(false)} type="bahan" queryKey="/api/bahan" />
    </>
  );
}
