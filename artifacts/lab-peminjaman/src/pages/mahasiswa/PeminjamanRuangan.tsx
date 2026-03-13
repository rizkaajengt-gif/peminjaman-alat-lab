import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useCreatePeminjamanRuangan, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { SearchableSelect } from "@/components/ui-custom/SearchableSelect";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, BookOpen, FlaskConical, Heart, Building2 } from "lucide-react";

const schema = z.object({
  laboratoriumId: z.coerce.number().min(1, "Pilih ruangan"),
  kategori: z.enum(["pembelajaran", "penelitian", "pengabdian_masyarakat", "sewa_eksternal"]),
  judulKegiatan: z.string().optional(),
  tanggalMulai: z.string().min(1, "Pilih tanggal"),
  tanggalSelesai: z.string().min(1, "Pilih tanggal"),
  waktuMulai: z.string().min(1, "Pilih waktu"),
  waktuSelesai: z.string().min(1, "Pilih waktu"),
  keperluan: z.string().min(5, "Keperluan terlalu singkat"),
  jumlahPeserta: z.coerce.number().min(1),
});

const KATEGORI = [
  {
    value: "pembelajaran",
    label: "Pembelajaran / Praktikum",
    desc: "Kegiatan belajar mengajar dan praktikum mata kuliah",
    icon: BookOpen,
    color: "border-blue-300 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-50",
    iconColor: "text-blue-600",
    placeholder: "Contoh: Praktikum Anatomi Tubuh Manusia Semester 3",
    fieldLabel: "Nama Mata Kuliah / Topik Praktikum",
  },
  {
    value: "penelitian",
    label: "Penelitian",
    desc: "Kegiatan penelitian ilmiah / skripsi / KTI",
    icon: FlaskConical,
    color: "border-teal-300 bg-teal-50",
    activeColor: "border-teal-500 bg-teal-50",
    iconColor: "text-teal-600",
    placeholder: "Contoh: Pengaruh Kadar Hemoglobin terhadap Tekanan Darah",
    fieldLabel: "Judul Penelitian",
  },
  {
    value: "pengabdian_masyarakat",
    label: "Pengabdian Masyarakat",
    desc: "Kegiatan pengabdian kepada masyarakat",
    icon: Heart,
    color: "border-rose-300 bg-rose-50",
    activeColor: "border-rose-500 bg-rose-50",
    iconColor: "text-rose-600",
    placeholder: "Contoh: Penyuluhan Gizi dan Pemeriksaan Kesehatan Gratis",
    fieldLabel: "Judul Kegiatan Pengabdian",
  },
  {
    value: "sewa_eksternal",
    label: "Sewa Eksternal",
    desc: "Penggunaan oleh pihak luar / instansi eksternal",
    icon: Building2,
    color: "border-amber-300 bg-amber-50",
    activeColor: "border-amber-500 bg-amber-50",
    iconColor: "text-amber-600",
    placeholder: "Contoh: Pelatihan Klinik dari RS Umum Tasikmalaya",
    fieldLabel: "Nama Instansi / Kegiatan",
  },
] as const;

export default function PeminjamanRuangan() {
  const { toast } = useToast();
  const createMutation = useCreatePeminjamanRuangan();
  const { data: labs } = useGetLaboratorium({});
  const [success, setSuccess] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { jumlahPeserta: 1, keperluan: "", kategori: "pembelajaran" }
  });

  const kategori = form.watch("kategori");
  const selectedKat = KATEGORI.find(k => k.value === kategori);

  const onSubmit = (data: z.infer<typeof schema>) => {
    createMutation.mutate({ data: data as any }, {
      onSuccess: () => { setSuccess(true); form.reset({ jumlahPeserta: 1, keperluan: "", kategori: "pembelajaran" }); },
      onError: (e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message || e.message }),
    });
  };

  if (success) return (
    <div className="max-w-md mx-auto mt-16 text-center space-y-4">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold">Pengajuan Berhasil!</h2>
      <p className="text-muted-foreground">Peminjaman ruangan Anda sedang menunggu konfirmasi PLP. Anda akan diberitahu jika ada perubahan status.</p>
      <Button onClick={() => setSuccess(false)} className="rounded-xl">Buat Pengajuan Baru</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Peminjaman Ruangan Lab" description="Ajukan peminjaman ruangan laboratorium untuk kegiatan akademik." />
      <Card className="p-6 md:p-8 rounded-3xl border-none shadow-xl shadow-slate-100">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Kategori Kegiatan */}
          <div className="space-y-2">
            <Label className="font-semibold text-base">Kategori Kegiatan</Label>
            <RadioGroup
              defaultValue="pembelajaran"
              onValueChange={(v) => form.setValue("kategori", v as any)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {KATEGORI.map(kat => (
                <label
                  key={kat.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${kategori === kat.value ? kat.activeColor + " border-opacity-100" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                >
                  <RadioGroupItem value={kat.value} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <kat.icon className={`w-4 h-4 ${kat.iconColor}`} />
                      <span className="font-semibold text-sm">{kat.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{kat.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Judul Kegiatan berdasarkan kategori */}
          <div className="space-y-1.5">
            <Label className="font-semibold">{selectedKat?.fieldLabel}</Label>
            <Input
              {...form.register("judulKegiatan")}
              className="h-11 rounded-xl bg-slate-50 border-slate-200"
              placeholder={selectedKat?.placeholder}
            />
          </div>

          {/* Ruangan */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Ruangan / Laboratorium</Label>
            <SearchableSelect
              options={(labs || []).map(l => ({
                value: l.id.toString(),
                label: l.nama,
                sublabel: `${l.lokasi} · Kapasitas ${l.kapasitas} orang`,
              }))}
              value={form.watch("laboratoriumId") ? String(form.watch("laboratoriumId")) : undefined}
              onValueChange={(v) => form.setValue("laboratoriumId", parseInt(v))}
              placeholder="Pilih ruangan yang akan dipinjam..."
              searchPlaceholder="Cari nama ruangan atau lokasi..."
            />
            {form.formState.errors.laboratoriumId && <p className="text-xs text-destructive">Pilih ruangan terlebih dahulu</p>}
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="font-semibold">Tanggal Mulai</Label>
              <Input type="date" {...form.register("tanggalMulai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" min={new Date().toISOString().split("T")[0]} />
              {form.formState.errors.tanggalMulai && <p className="text-xs text-destructive">{form.formState.errors.tanggalMulai.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Tanggal Selesai</Label>
              <Input type="date" {...form.register("tanggalSelesai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Waktu Mulai</Label>
              <Input type="time" {...form.register("waktuMulai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Waktu Selesai</Label>
              <Input type="time" {...form.register("waktuSelesai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="font-semibold">Jumlah Peserta</Label>
              <Input type="number" min="1" {...form.register("jumlahPeserta")} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Keperluan / Keterangan Tambahan</Label>
              <Textarea {...form.register("keperluan")} rows={2} className="rounded-xl bg-slate-50 border-slate-200 resize-none text-sm" placeholder="Informasi tambahan yang perlu diketahui PLP..." />
              {form.formState.errors.keperluan && <p className="text-xs text-destructive">{form.formState.errors.keperluan.message}</p>}
            </div>
          </div>

          <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
            {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Ajukan Peminjaman Ruangan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
