import { useState } from "react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePeminjamanAlat, useGetLaboratorium, useGetAlat } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Simplified schema for frontend validation
const formSchema = z.object({
  laboratoriumId: z.coerce.number().min(1, "Pilih laboratorium"),
  tanggalPinjam: z.string().min(1, "Pilih tanggal"),
  tanggalKembali: z.string().min(1, "Pilih tanggal"),
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
    defaultValues: { keperluan: "" }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Pilih minimal 1 alat" });
      return;
    }
    
    createMutation.mutate({
      data: {
        ...data,
        items
      }
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
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Laboratorium</Label>
              <Select onValueChange={(v) => {
                const id = parseInt(v);
                form.setValue("laboratoriumId", id);
                setSelectedLab(id);
                setItems([]); // reset items when lab changes
              }}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Pilih Lab..." />
                </SelectTrigger>
                <SelectContent>
                  {labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Keperluan</Label>
              <Input {...form.register("keperluan")} className="h-12 rounded-xl bg-slate-50 border-slate-200" placeholder="Contoh: Praktikum Mikrobiologi 1" />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Tanggal Pinjam</Label>
              <Input type="date" {...form.register("tanggalPinjam")} className="h-12 rounded-xl bg-slate-50 border-slate-200" />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Tanggal Kembali</Label>
              <Input type="date" {...form.register("tanggalKembali")} className="h-12 rounded-xl bg-slate-50 border-slate-200" />
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

                <div className="flex items-end gap-4 pt-2">
                   <div className="flex-1 space-y-2">
                      <Label>Tambah Alat</Label>
                      <Select onValueChange={(v) => {
                        const id = parseInt(v);
                        if (!items.find(i => i.alatId === id)) {
                          setItems([...items, { alatId: id, jumlah: 1 }]);
                        }
                      }}>
                        <SelectTrigger className="h-12 rounded-xl bg-white">
                          <SelectValue placeholder="Pilih alat dari lab ini..." />
                        </SelectTrigger>
                        <SelectContent>
                          {alatList?.filter(a => a.stokTersedia > 0).map(a => (
                            <SelectItem key={a.id} value={a.id.toString()}>{a.nama} (Tersedia: {a.stokTersedia} {a.satuan})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
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
