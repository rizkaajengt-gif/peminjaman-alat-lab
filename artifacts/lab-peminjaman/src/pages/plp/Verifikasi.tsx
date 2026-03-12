import { useGetPeminjamanAlat, useUpdatePeminjamanAlatStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifikasiPlp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetPeminjamanAlat({ status: "menunggu" });
  const updateStatus = useUpdatePeminjamanAlatStatus();

  const handleVerifikasi = (id: number, status: string) => {
    updateStatus.mutate({
      id,
      data: { status, catatan: "Verifikasi sistem" }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: `Status peminjaman diubah menjadi ${status}` });
        queryClient.invalidateQueries({ queryKey: ["/api/peminjaman-alat"] });
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Verifikasi Peminjaman Alat" 
        description="Daftar pengajuan peminjaman yang membutuhkan persetujuan Anda."
      />

      <Card className="border-none shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-slate-100">
              <TableHead className="h-14 font-semibold text-slate-700">No. Peminjaman</TableHead>
              <TableHead className="font-semibold text-slate-700">Peminjam</TableHead>
              <TableHead className="font-semibold text-slate-700">Detail Pinjaman</TableHead>
              <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-primary" /></TableCell></TableRow>
            ) : data?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Tidak ada permintaan menunggu verifikasi.</TableCell></TableRow>
            ) : (
              data?.map(item => (
                <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="font-medium">{item.noPeminjaman}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.user?.nama}</div>
                    <div className="text-xs text-muted-foreground">{item.user?.nim}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">Lab: {item.laboratorium?.nama}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.items.map(i => `${i.alat?.nama} (${i.jumlah})`).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(item.tanggalPinjam).toLocaleDateString('id-ID')} -</div>
                    <div className="text-sm">{new Date(item.tanggalKembali).toLocaleDateString('id-ID')}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
                        onClick={() => handleVerifikasi(item.id, 'ditolak')}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Tolak
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20"
                        onClick={() => handleVerifikasi(item.id, 'disetujui')}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
