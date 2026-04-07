import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCreatePermintaanBahan, useGetBahan, useGetLaboratorium, customFetch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { SearchableSelect } from "@/components/ui-custom/SearchableSelect";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, CheckCircle, Store, UserCog, AlertCircle, Info } from "lucide-react";

const schema = z.object({
  laboratoriumId: z.coerce.number().optional(),
  tujuan: z.enum(["gudang", "plp"]),
  plpId: z.coerce.number().optional(),
  tanggalDibutuhkan: z.string().min(1, "Pilih tanggal"),
  keperluan: z.string().min(5, "Keperluan terlalu singkat"),
});

export default function PermintaanBahan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const createMutation = useCreatePermintaanBahan();
  const isPLPOrAdmin = user?.role === "plp" || user?.role === "admin" || user?.role === "gudang";
  const grupJurusan = (user?.jurusan as any)?.grupJurusan as string | undefined;
  const { data: labs } = useGetLaboratorium(grupJurusan && !isPLPOrAdmin ? { grupJurusan } : {});
  const { data: bahanList } = useGetBahan({});
  const [items, setItems] = useState<{ bahanId: number; jumlahDiminta: number }[]>([]);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { keperluan: "", tujuan: "plp" },
  });

  const tujuan = form.watch("tujuan");
  const labId = form.watch("laboratoriumId");

  const { data: plpByLab } = useQuery<any[]>({
    queryKey: ["/api/plp-laboratorium", labId],
    queryFn: () => customFetch(`/api/plp-laboratorium${labId && labId > 0 ? `?laboratoriumId=${labId}` : ""}`),
    enabled: true,
  });

  const plpOptions = (plpByLab || [])
    .filter((a: any) => a.plp)
    .map((a: any) => ({ value: String(a.plp.id), label: a.plp.nama, sublabel: a.plp.email }));

  const filteredBahan = labId && labId > 0
    ? bahanList?.filter(b => b.laboratoriumId === labId)
    : bahanList;

  const labOptions = (labs || []).map(l => ({
    value: String(l.id),
    label: l.nama,
    sublabel: (l as any).jurusan?.nama,
  }));

  // Check if PLP has stock for a given bahan
  const getPlpStock = (bahanId: number) => {
    const b = bahanList?.find(b => b.id === bahanId);
    return b?.stok ?? 0;
  };
  const getGudangStock = (bahanId: number) => {
    const b = bahanList?.find(b => b.id === bahanId);
    return (b as any)?.stokGudang ?? 0;
  };

  // Auto-suggest tujuan based on selected items stock
  const suggestTujuan = () => {
    if (items.length === 0) return null;
    const allHavePlpStock = items.every(i => getPlpStock(i.bahanId) >= i.jumlahDiminta);
    const noneHavePlpStock = items.every(i => getPlpStock(i.bahanId) === 0);
    if (allHavePlpStock) return "plp";
    if (noneHavePlpStock) return "gudang";
    return null; // mixed
  };

  const suggestion = suggestTujuan();

  const bahanOptions = (filteredBahan || [])
    .filter(b => !items.find(i => i.bahanId === b.id))
    .map(b => {
      const stokPlp = b.stok;
      const stokGudang = (b as any).stokGudang ?? 0;
      return {
        value: String(b.id),
        label: b.nama,
        sublabel: `PLP: ${stokPlp} | Gudang: ${stokGudang} ${b.satuan}`,
      };
    });

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
    if (data.tujuan === "plp" && !data.plpId) { toast({ variant: "destructive", title: "Pilih PLP tujuan terlebih dahulu" }); return; }
    createMutation.mutate({ data: { ...data, items } }, {
      onSuccess: () => { setSuccess(true); form.reset(); setItems([]); },
      onError: (e: any) => toast({ variant: "destructive", title: "Gagal", description: e?.data?.message || e.message }),
    });
  };

  if (success) return (
    <div className="max-w-md mx-auto mt-16 text-center space-y-4">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold">Permintaan Diajukan!</h2>
      <p className="text-muted-foreground">Permintaan bahan Anda sedang diproses. Cek riwayat untuk melihat statusnya.</p>
      <Button onClick={() => setSuccess(false)} className="rounded-xl">Buat Permintaan Baru</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Permintaan Bahan Habis Pakai" description="Ajukan permintaan bahan untuk kegiatan praktikum ke PLP atau Gudang." />

      {/* Panduan alur */}
      <Card className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <Info className="text-blue-500 shrink-0 mt-0.5 w-5 h-5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Panduan Permintaan Bahan:</p>
            {isPLPOrAdmin ? (
              <>
                <p><span className="font-medium">1. Ke PLP Lab:</span> Jika stok tersedia di PLP laboratorium tujuan.</p>
                <p className="mt-0.5"><span className="font-medium">2. Ke Gudang:</span> Jika stok PLP habis. Gudang akan mengambilkan dari stok pusat.</p>
              </>
            ) : (
              <p>Permintaan bahan diajukan langsung ke PLP Laboratorium. PLP akan menyiapkan bahan yang Anda butuhkan.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 md:p-8 rounded-3xl border-none shadow-xl shadow-slate-100">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Pilih Lab dulu untuk lihat stok */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Lab Terkait <span className="text-muted-foreground font-normal">(pilih untuk filter bahan)</span></Label>
            <SearchableSelect
              options={labOptions}
              value={labId ? String(labId) : undefined}
              onValueChange={(v) => { form.setValue("laboratoriumId", parseInt(v)); form.setValue("plpId", undefined); }}
              placeholder="Pilih laboratorium..."
              searchPlaceholder="Cari lab..."
            />
          </div>

          {/* Tabel stok bahan lab tersebut */}
          {labId && labId > 0 && filteredBahan && filteredBahan.length > 0 && (
            <Card className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <h3 className="font-semibold text-sm">Ketersediaan Bahan di Lab Ini</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {filteredBahan.map(b => {
                  const stokPlp = b.stok;
                  const stokGudang = (b as any).stokGudang ?? 0;
                  return (
                    <div key={b.id} className="flex items-center justify-between px-4 py-2 text-sm">
                      <div>
                        <span className="font-medium">{b.nama}</span>
                        <span className="text-xs text-muted-foreground ml-2">{b.satuan}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs">
                          PLP: <span className={`font-bold ${stokPlp === 0 ? "text-red-500" : "text-teal-600"}`}>{stokPlp}</span>
                        </span>
                        <span className="text-xs">
                          Gudang: <span className={`font-bold ${stokGudang === 0 ? "text-red-500" : "text-blue-600"}`}>{stokGudang}</span>
                        </span>
                        {stokPlp === 0 && stokGudang === 0 && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Habis</Badge>
                        )}
                        {stokPlp > 0 && (
                          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-600 border-teal-200">Tersedia di PLP</Badge>
                        )}
                        {stokPlp === 0 && stokGudang > 0 && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">Hanya di Gudang</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Pilih tujuan permintaan */}
          <div className="space-y-2">
            <Label className="font-semibold text-base">Kirim Permintaan Ke</Label>
            {isPLPOrAdmin ? (
              <>
                {suggestion && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl text-xs text-blue-700">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Disarankan: <strong>{suggestion === "plp" ? "Ke PLP (stok PLP cukup)" : "Ke Gudang (stok PLP habis)"}</strong>
                    <Button type="button" size="sm" variant="ghost" className="h-6 text-xs ml-auto rounded-lg text-blue-700 hover:bg-blue-100"
                      onClick={() => form.setValue("tujuan", suggestion)}>Terapkan</Button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(["plp", "gudang"] as const).map(opt => (
                    <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${tujuan === opt ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}
                      onClick={() => { form.setValue("tujuan", opt); if (opt === "gudang") form.setValue("plpId", undefined); }}>
                      <input type="radio" name="tujuan" value={opt} checked={tujuan === opt} onChange={() => {}} className="sr-only" />
                      <div>
                        <div className="flex items-center gap-2">
                          {opt === "plp" ? <UserCog className="w-4 h-4 text-teal-600" /> : <Store className="w-4 h-4 text-blue-600" />}
                          <span className="font-semibold">{opt === "plp" ? "PLP Lab" : "Gudang"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opt === "plp" ? "Stok tersedia di lab → minta ke PLP" : "Stok PLP habis → minta ke gudang pusat"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5">
                <UserCog className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold text-sm">PLP Laboratorium</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Permintaan bahan Anda akan diproses oleh PLP laboratorium</p>
                </div>
              </div>
            )}
          </div>

          {/* PLP selector */}
          {tujuan === "plp" && (
            <div className="space-y-1.5">
              <Label className="font-semibold">Pilih PLP Tujuan *</Label>
              {!labId || labId === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Pilih laboratorium terlebih dahulu
                </div>
              ) : plpOptions.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Tidak ada PLP di lab ini. Hubungi Admin.
                </div>
              ) : (
                <SearchableSelect
                  options={plpOptions}
                  value={form.watch("plpId") ? String(form.watch("plpId")) : undefined}
                  onValueChange={(v) => form.setValue("plpId", parseInt(v))}
                  placeholder="Pilih PLP yang bertanggung jawab..."
                  searchPlaceholder="Cari nama PLP..."
                />
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="font-semibold">Tanggal Dibutuhkan</Label>
              <Input type="date" {...form.register("tanggalDibutuhkan")} className="h-11 rounded-xl bg-slate-50 border-slate-200" min={new Date().toISOString().split("T")[0]} />
              {form.formState.errors.tanggalDibutuhkan && <p className="text-xs text-destructive">{form.formState.errors.tanggalDibutuhkan.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="font-semibold">Keperluan / Tujuan Penggunaan</Label>
              <Textarea {...form.register("keperluan")} className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} placeholder="Contoh: Praktikum Kimia Dasar Semester 3" />
              {form.formState.errors.keperluan && <p className="text-xs text-destructive">{form.formState.errors.keperluan.message}</p>}
            </div>
          </div>

          {/* Daftar bahan */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <h3 className="font-bold text-base">Daftar Bahan yang Diminta</h3>
            {items.map((item, idx) => {
              const b = bahanList?.find(b => b.id === item.bahanId);
              const stokPlp = b?.stok ?? 0;
              const stokGudang = (b as any)?.stokGudang ?? 0;
              const stockForTujuan = tujuan === "plp" ? stokPlp : stokGudang;
              const exceedsStock = item.jumlahDiminta > stockForTujuan && stockForTujuan > 0;
              return (
                <div key={idx} className={`flex items-start gap-3 bg-white p-3 rounded-xl border shadow-sm ${exceedsStock ? "border-amber-300" : "border-slate-200"}`}>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{b?.nama}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-teal-600">PLP: <strong>{stokPlp}</strong></span>
                      <span className="text-xs text-blue-600">Gudang: <strong>{stokGudang}</strong></span>
                      <span className="text-xs text-muted-foreground">{b?.satuan}</span>
                    </div>
                    {exceedsStock && (
                      <p className="text-xs text-amber-600 mt-0.5">Melebihi stok {tujuan === "plp" ? "PLP" : "gudang"} ({stockForTujuan} {b?.satuan})</p>
                    )}
                    {stockForTujuan === 0 && (
                      <p className="text-xs text-red-500 mt-0.5">Stok {tujuan === "plp" ? "PLP" : "gudang"} habis</p>
                    )}
                  </div>
                  <Input type="number" min="1" value={item.jumlahDiminta} onChange={e => updateQty(idx, parseInt(e.target.value))} className="h-9 w-20 rounded-lg text-center" />
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              );
            })}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tambah Bahan</Label>
              <SearchableSelect
                options={bahanOptions}
                value={undefined}
                onValueChange={addItem}
                placeholder="Pilih bahan dari daftar..."
                searchPlaceholder="Cari nama bahan..."
                emptyMessage={labId && labId > 0 ? "Tidak ada bahan di lab ini" : "Pilih lab untuk filter bahan"}
              />
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
