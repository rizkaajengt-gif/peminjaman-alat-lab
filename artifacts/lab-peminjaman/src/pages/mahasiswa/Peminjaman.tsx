import { useState } from "react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePeminjamanAlat, useGetLaboratorium, useGetAlat } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui-custom/SearchableSelect";
import { Loader2, Trash2, Clock, BookOpen, FlaskConical, Heart, Building2 } from "lucide-react";

const KATEGORI_ALAT = [
  { value: "pembelajaran", label: "Pembelajaran / Praktikum", desc: "Kegiatan belajar mengajar & praktikum", icon: BookOpen, color: "border-blue-200 bg-blue-50", activeColor: "border-blue-500 bg-blue-50", iconColor: "text-blue-600" },
  { value: "penelitian",   label: "Penelitian",               desc: "Penelitian ilmiah / skripsi / KTI",   icon: FlaskConical, color: "border-teal-200 bg-teal-50", activeColor: "border-teal-500 bg-teal-50", iconColor: "text-teal-600" },
  { value: "pengabdian_masyarakat", label: "Pengabdian Masyarakat", desc: "Kegiatan pengabdian masyarakat", icon: Heart, color: "border-rose-200 bg-rose-50", activeColor: "border-rose-500 bg-rose-50", iconColor: "text-rose-600" },
  { value: "sewa_eksternal", label: "Sewa Eksternal", desc: "Penggunaan oleh pihak luar / instansi eksternal", icon: Building2, color: "border-amber-200 bg-amber-50", activeColor: "border-amber-500 bg-amber-50", iconColor: "text-amber-600" },
] as const;

const formSchema = z.object({
  laboratoriumId: z.coerce.number().min(1, "Pilih laboratorium"),
  kategori: z.enum(["pembelajaran", "penelitian", "pengabdian_masyarakat", "sewa_eksternal"]),
  tanggalPinjam: z.string().min(1, "Pilih tanggal"),
  jamPinjam: z.string().optional(),
  tanggalKembali: z.string().min(1, "Pilih tanggal"),
  jamKembali: z.string().optional(),
  keperluan: z.string().min(5, "Keperluan terlalu singkat"),
});

export default function FormPeminjaman() {
  const { toast } = useToast();
  const createMutation = useCreatePeminjamanAlat();
  const { data: labs } = useGetLaboratorium({});
  
  const [selectedLab, setSelectedLab] = useState<number | null>(null);
  const { data: alatList } = useGetAlat({ laboratoriumId: selectedLab || undefined }, { query: { enabled: !!selectedLab } });
  
  const [items, setItems] = useState<{alatId: number, jumlah: number}[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { keperluan: "", kategori: "pembelajaran" }
  });

  const kategori = form.watch("kategori");

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Pilih minimal 1 alat" });
      return;
    }
    
    createMutation.mutate({
      data: {
        ...data,
        items
      } as any
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Pengajuan peminjaman berhasil dibuat, menunggu verifikasi PLP." });
        form.reset();
        setItems([]);
        setSelectedLab(null);
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Gagal", description: err.message })
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Ajukan Peminjaman Alat" 
        description="Pilih laboratorium dan alat yang dibutuhkan untuk praktikum."
      />

      <Card className="p-6 md:p-8 rounded-3xl border-none shadow-xl shadow-slate-100 bg-white">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Kategori Penggunaan */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">Kategori Penggunaan</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KATEGORI_ALAT.map(kat => {
                const Icon = kat.icon;
                const active = kategori === kat.value;
                return (
                  <button key={kat.value} type="button"
                    onClick={() => form.setValue("kategori", kat.value as any)}
                    className={`relative flex flex-col items-start p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${active ? kat.activeColor + " border-opacity-100 shadow-sm" : kat.color + " border-opacity-60 hover:border-opacity-100"}`}>
                    <Icon className={`w-5 h-5 mb-1.5 ${kat.iconColor}`} />
                    <div className="text-sm font-semibold text-slate-800 leading-tight">{kat.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-tight">{kat.desc}</div>
                    {active && <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${kat.iconColor.replace("text-", "bg-")}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Laboratorium</Label>
              <SearchableSelect
                options={(labs || []).map(l => ({ value: l.id.toString(), label: l.nama, sublabel: (l as any).jurusan?.nama }))}
                value={selectedLab ? String(selectedLab) : undefined}
                onValueChange={(v) => { const id = parseInt(v); form.setValue("laboratoriumId", id); setSelectedLab(id); setItems([]); }}
                placeholder="Pilih Lab..."
                searchPlaceholder="Cari nama lab..."
              />
              {form.formState.errors.laboratoriumId && (
                <p className="text-xs text-destructive">{form.formState.errors.laboratoriumId.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Keperluan / Keterangan</Label>
              <Input {...form.register("keperluan")} className="h-12 rounded-xl bg-slate-50 border-slate-200" placeholder={kategori === "sewa_eksternal" ? "Nama instansi / pihak penyewa" : "Contoh: Praktikum Mikrobiologi 1"} />
              {form.formState.errors.keperluan && (
                <p className="text-xs text-destructive">{form.formState.errors.keperluan.message}</p>
              )}
            </div>

            {/* Tanggal & Jam Pinjam */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Tanggal Peminjaman</Label>
              <div className="flex gap-2">
                <Input type="date" {...form.register("tanggalPinjam")} className="h-12 rounded-xl bg-slate-50 border-slate-200 flex-1" />
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input type="time" {...form.register("jamPinjam")} className="h-12 rounded-xl bg-slate-50 border-slate-200 pl-9 w-32" placeholder="--:--" />
                </div>
              </div>
              {form.formState.errors.tanggalPinjam && (
                <p className="text-xs text-destructive">{form.formState.errors.tanggalPinjam.message}</p>
              )}
            </div>

            {/* Tanggal & Jam Kembali */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Tanggal Pengembalian</Label>
              <div className="flex gap-2">
                <Input type="date" {...form.register("tanggalKembali")} className="h-12 rounded-xl bg-slate-50 border-slate-200 flex-1" />
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input type="time" {...form.register("jamKembali")} className="h-12 rounded-xl bg-slate-50 border-slate-200 pl-9 w-32" placeholder="--:--" />
                </div>
              </div>
              {form.formState.errors.tanggalKembali && (
                <p className="text-xs text-destructive">{form.formState.errors.tanggalKembali.message}</p>
              )}
            </div>
          </div>

          {/* Items Selection UI */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-lg mb-4">Daftar Alat</h3>
            
            {selectedLab ? (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const alatObj = alatList?.find(a => a.id === item.alatId);
                  return (
                    <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex-1 font-medium">{alatObj?.nama || 'Unknown'}</div>
                      <div className="w-24">
                        <Input 
                          type="number" min="1" max={alatObj?.stokTersedia || 1} 
                          value={item.jumlah}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].jumlah = parseInt(e.target.value);
                            setItems(newItems);
                          }}
                          className="h-10 rounded-lg text-center"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}

                <div className="space-y-2 pt-2">
                  <Label>Tambah Alat</Label>
                  <SearchableSelect
                    options={(alatList?.filter(a => a.stokTersedia > 0 && !items.find(i => i.alatId === a.id)) || []).map(a => ({
                      value: a.id.toString(),
                      label: a.nama,
                      sublabel: `Tersedia: ${a.stokTersedia} ${a.satuan}`,
                    }))}
                    value={undefined}
                    onValueChange={(v) => { const id = parseInt(v); if (!items.find(i => i.alatId === id)) setItems([...items, { alatId: id, jumlah: 1 }]); }}
                    placeholder="Pilih alat dari lab ini..."
                    searchPlaceholder="Cari nama alat..."
                    emptyMessage="Tidak ada alat tersedia di lab ini"
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Silakan pilih laboratorium terlebih dahulu.</p>
            )}
          </div>

          <Button type="submit" disabled={createMutation.isPending} className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all bg-primary hover:bg-primary/90">
            {createMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : "Ajukan Peminjaman"}
          </Button>

        </form>
      </Card>
    </div>
  );
}
