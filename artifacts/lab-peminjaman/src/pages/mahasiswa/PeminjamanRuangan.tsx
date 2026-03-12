import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useCreatePeminjamanRuangan, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const schema = z.object({
  laboratoriumId: z.coerce.number().min(1, "Pilih ruangan"),
  tanggalMulai: z.string().min(1, "Pilih tanggal"),
  tanggalSelesai: z.string().min(1, "Pilih tanggal"),
  waktuMulai: z.string().min(1, "Pilih waktu"),
  waktuSelesai: z.string().min(1, "Pilih waktu"),
  keperluan: z.string().min(5, "Keperluan terlalu singkat"),
  jumlahPeserta: z.coerce.number().min(1),
});

export default function PeminjamanRuangan() {
  const { toast } = useToast();
  const createMutation = useCreatePeminjamanRuangan();
  const { data: labs } = useGetLaboratorium({});
  const [success, setSuccess] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { jumlahPeserta: 1, keperluan: "" } });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createMutation.mutate({ data }, {
      onSuccess: () => { setSuccess(true); form.reset(); },
      onError: (e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message || e.message }),
    });
  };

  if (success) return (
    <div className="max-w-md mx-auto mt-16 text-center space-y-4">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold">Pengajuan Berhasil!</h2>
      <p className="text-muted-foreground">Peminjaman ruangan Anda sedang menunggu konfirmasi PLP.</p>
      <Button onClick={() => setSuccess(false)} className="rounded-xl">Buat Pengajuan Baru</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Peminjaman Ruangan Lab" description="Ajukan peminjaman ruangan laboratorium untuk kegiatan praktikum atau penelitian." />
      <Card className="p-6 md:p-8 rounded-3xl border-none shadow-xl shadow-slate-100">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <Label className="font-semibold">Ruangan / Laboratorium</Label>
            <Select onValueChange={(v) => form.setValue("laboratoriumId", parseInt(v))}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih ruangan..." /></SelectTrigger>
              <SelectContent>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama} – {l.lokasi} (Kapasitas: {l.kapasitas})</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.laboratoriumId && <p className="text-xs text-destructive">Pilih ruangan terlebih dahulu</p>}
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5"><Label className="font-semibold">Tanggal Mulai</Label><Input type="date" {...form.register("tanggalMulai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" /></div>
            <div className="space-y-1.5"><Label className="font-semibold">Tanggal Selesai</Label><Input type="date" {...form.register("tanggalSelesai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" /></div>
            <div className="space-y-1.5"><Label className="font-semibold">Waktu Mulai</Label><Input type="time" {...form.register("waktuMulai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" /></div>
            <div className="space-y-1.5"><Label className="font-semibold">Waktu Selesai</Label><Input type="time" {...form.register("waktuSelesai")} className="h-11 rounded-xl bg-slate-50 border-slate-200" /></div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5"><Label className="font-semibold">Jumlah Peserta</Label><Input type="number" min="1" {...form.register("jumlahPeserta")} className="h-11 rounded-xl bg-slate-50 border-slate-200" /></div>
            <div className="space-y-1.5 col-span-1">
              <Label className="font-semibold">Keperluan</Label>
              <Textarea {...form.register("keperluan")} rows={2} className="rounded-xl bg-slate-50 border-slate-200 resize-none" placeholder="Tujuan penggunaan ruangan..." />
            </div>
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full h-13 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
            {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Ajukan Peminjaman Ruangan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
