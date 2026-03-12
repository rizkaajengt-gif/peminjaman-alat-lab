import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePermintaanBahan, useGetBahan, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, CheckCircle } from "lucide-react";

const schema = z.object({
  laboratoriumId: z.coerce.number().optional(),
  tanggalDibutuhkan: z.string().min(1, "Pilih tanggal"),
  keperluan: z.string().min(5, "Keperluan terlalu singkat"),
});

export default function PermintaanBahan() {
  const { toast } = useToast();
  const createMutation = useCreatePermintaanBahan();
  const { data: labs } = useGetLaboratorium({});
  const { data: bahanList } = useGetBahan({});
  const [items, setItems] = useState<{ bahanId: number; jumlahDiminta: number }[]>([]);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { keperluan: "" } });

  const addItem = (bahanId: string) => {
    const id = parseInt(bahanId);
    if (!items.find(i => i.bahanId === id)) setItems([...items, { bahanId: id, jumlahDiminta: 1 }]);
  };

  const updateQty = (idx: number, qty: number) => {
    const newItems = [...items];
    newItems[idx].jumlahDiminta = qty;
    setItems(newItems);
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    if (items.length === 0) { toast({ variant: "destructive", title: "Pilih minimal 1 bahan" }); return; }
    createMutation.mutate({ data: { ...data, items } }, {
      onSuccess: () => { setSuccess(true); form.reset(); setItems([]); },
      onError: (e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message }),
    });
  };

  if (success) return (
    <div className="max-w-md mx-auto mt-16 text-center space-y-4">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold">Permintaan Diajukan!</h2>
      <p className="text-muted-foreground">Permintaan bahan Anda sedang diproses oleh tim gudang.</p>
      <Button onClick={() => setSuccess(false)} className="rounded-xl">Buat Permintaan Baru</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Permintaan Bahan Habis Pakai" description="Ajukan permintaan bahan untuk kegiatan praktikum." />
      <Card className="p-6 md:p-8 rounded-3xl border-none shadow-xl shadow-slate-100">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="font-semibold">Tanggal Dibutuhkan</Label>
              <Input type="date" {...form.register("tanggalDibutuhkan")} className="h-11 rounded-xl bg-slate-50 border-slate-200" min={new Date().toISOString().split("T")[0]} />
              {form.formState.errors.tanggalDibutuhkan && <p className="text-xs text-destructive">{form.formState.errors.tanggalDibutuhkan.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Laboratorium (Opsional)</Label>
              <Select onValueChange={(v) => form.setValue("laboratoriumId", parseInt(v))}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih lab..." /></SelectTrigger>
                <SelectContent>{labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="font-semibold">Keperluan</Label>
              <Textarea {...form.register("keperluan")} className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} placeholder="Contoh: Praktikum Kimia Dasar Semester 3" />
              {form.formState.errors.keperluan && <p className="text-xs text-destructive">{form.formState.errors.keperluan.message}</p>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <h3 className="font-bold text-base">Daftar Bahan yang Diminta</h3>
            {items.map((item, idx) => {
              const b = bahanList?.find(b => b.id === item.bahanId);
              return (
                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{b?.nama}</div>
                    <div className="text-xs text-muted-foreground">Stok: {b?.stok} {b?.satuan}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="1" max={b?.stok || 999} value={item.jumlahDiminta} onChange={e => updateQty(idx, parseInt(e.target.value))} className="h-9 w-20 rounded-lg text-center" />
                    <span className="text-xs text-muted-foreground">{b?.satuan}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-9 w-9" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              );
            })}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tambah Bahan</Label>
              <Select onValueChange={addItem}>
                <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Pilih bahan dari daftar..." /></SelectTrigger>
                <SelectContent>
                  {bahanList?.filter(b => !items.find(i => i.bahanId === b.id)).map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.nama} (Stok: {b.stok} {b.satuan})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={createMutation.isPending} className="w-full h-13 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
            {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Ajukan Permintaan Bahan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
