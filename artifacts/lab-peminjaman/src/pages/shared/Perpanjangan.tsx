import { useMemo, useState } from "react";
import { customFetch, useGetPeminjamanAlat } from "@workspace/api-client-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CalendarClock, CheckCircle2, XCircle, ClipboardList, Ghost, Building2, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Loan = {
  id: number;
  noPeminjaman: string;
  tanggalPinjam: string;
  tanggalKembali: string;
  status: string;
  keperluan: string;
  laboratorium?: { nama?: string } | null;
  items?: Array<{ jumlah?: number; alat?: { nama?: string } | null; phantom?: { nama?: string } | null }>;
};

type ExtensionRequest = {
  id: number;
  jenis: "alat" | "phantom";
  peminjamanId: number;
  noPeminjaman?: string | null;
  pemohonNama: string;
  pemohonNim?: string | null;
  laboratoriumNama?: string | null;
  tanggalPinjam?: string | null;
  tanggalKembaliLama: string;
  tanggalKembaliBaru: string;
  alasan: string;
  status: "menunggu" | "disetujui" | "ditolak";
  catatan?: string | null;
  createdAt: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function errorMessage(error: any) {
  return error?.data?.message || error?.message || "Terjadi kesalahan. Coba lagi.";
}

function loanName(loan: Loan, type: "alat" | "phantom") {
  return loan.items?.map((item) => `${type === "alat" ? item.alat?.nama : item.phantom?.nama} (${item.jumlah ?? 1})`).join(", ") || "Detail item belum tersedia";
}

export default function Perpanjangan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isReviewer = ["admin", "plp", "kepala_laboratorium"].includes(user?.role || "");
  const [selectedLoan, setSelectedLoan] = useState<{ loan: Loan; type: "alat" | "phantom" } | null>(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState<ExtensionRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const alatQuery = useGetPeminjamanAlat({});
  const phantomQuery = useQuery<Loan[]>({
    queryKey: ["/api/peminjaman-phantom"],
    queryFn: () => customFetch("/api/peminjaman-phantom"),
    enabled: !isReviewer,
  });
  const requestQuery = useQuery<ExtensionRequest[]>({
    queryKey: ["/api/perpanjangan-peminjaman", isReviewer ? "review" : "mine"],
    queryFn: () => customFetch(`/api/perpanjangan-peminjaman${isReviewer ? "?status=menunggu" : ""}`),
  });

  const requestMutation = useMutation({
    mutationFn: (data: { jenis: "alat" | "phantom"; peminjamanId: number; tanggalKembaliBaru: string; alasan: string }) =>
      customFetch("/api/perpanjangan-peminjaman", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({ title: "Pengajuan perpanjangan terkirim", description: "Pengajuan akan ditinjau oleh pengelola laboratorium." });
      setSelectedLoan(null);
      setReason("");
      setNewDate("");
      void queryClient.invalidateQueries({ queryKey: ["/api/perpanjangan-peminjaman"] });
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal mengajukan perpanjangan", description: errorMessage(error) }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, catatan }: { id: number; status: "disetujui" | "ditolak"; catatan?: string }) =>
      customFetch(`/api/perpanjangan-peminjaman/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, catatan: catatan || null }) }),
    onSuccess: (_, variables) => {
      toast({ title: variables.status === "disetujui" ? "Perpanjangan disetujui" : "Perpanjangan ditolak" });
      setRejecting(null);
      setReviewNote("");
      void queryClient.invalidateQueries({ queryKey: ["/api/perpanjangan-peminjaman"] });
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal memproses pengajuan", description: errorMessage(error) }),
  });

  const activeLoans = useMemo(() => {
    const alat = ((alatQuery.data || []) as Loan[]).filter((loan) => ["disetujui", "dipinjam"].includes(loan.status)).map((loan) => ({ loan, type: "alat" as const }));
    const phantom = (phantomQuery.data || []).filter((loan) => ["disetujui", "dipinjam"].includes(loan.status)).map((loan) => ({ loan, type: "phantom" as const }));
    return [...alat, ...phantom];
  }, [alatQuery.data, phantomQuery.data]);

  const submitRequest = () => {
    if (!selectedLoan || !newDate || !reason.trim()) {
      toast({ variant: "destructive", title: "Lengkapi pengajuan", description: "Tanggal baru dan alasan wajib diisi." });
      return;
    }
    if (newDate <= selectedLoan.loan.tanggalKembali) {
      toast({ variant: "destructive", title: "Tanggal tidak valid", description: "Tanggal baru harus setelah tanggal kembali saat ini." });
      return;
    }
    requestMutation.mutate({ jenis: selectedLoan.type, peminjamanId: selectedLoan.loan.id, tanggalKembaliBaru: newDate, alasan: reason.trim() });
  };

  const review = (request: ExtensionRequest, status: "disetujui" | "ditolak") => {
    if (status === "ditolak") {
      setRejecting(request);
      return;
    }
    reviewMutation.mutate({ id: request.id, status });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isReviewer ? "Persetujuan Perpanjangan" : "Perpanjangan Peminjaman"}
        description={isReviewer ? "Tinjau pengajuan perpanjangan dari peminjam di laboratorium yang menjadi tanggung jawab Anda." : "Ajukan tambahan waktu pengembalian alat atau phantom yang sedang Anda pinjam."}
      />

      {isReviewer ? (
        <ReviewList requests={requestQuery.data || []} loading={requestQuery.isLoading} onReview={review} pending={reviewMutation.isPending} />
      ) : (
        <>
          <section className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarClock className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-lg font-bold">Peminjaman aktif</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Pilih peminjaman, tentukan tanggal kembali yang baru, dan jelaskan alasannya. Pengajuan tetap menunggu persetujuan sampai ditinjau.</p>
              </div>
            </div>
          </section>
          <Tabs defaultValue="aktif">
            <TabsList className="rounded-xl bg-muted/70 p-1">
              <TabsTrigger value="aktif" className="gap-2 rounded-lg"><ClipboardList className="h-4 w-4" />Peminjaman aktif</TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-2 rounded-lg"><CalendarClock className="h-4 w-4" />Riwayat pengajuan</TabsTrigger>
            </TabsList>
            <TabsContent value="aktif" className="mt-4">
              {alatQuery.isLoading || phantomQuery.isLoading ? <Loading /> : activeLoans.length === 0 ? <Empty text="Tidak ada peminjaman aktif yang dapat diperpanjang." /> : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {activeLoans.map(({ loan, type }) => (
                    <LoanCard key={`${type}-${loan.id}`} loan={loan} type={type} onRequest={() => { setSelectedLoan({ loan, type }); setNewDate(""); setReason(""); }} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="riwayat" className="mt-4">
              {requestQuery.isLoading ? <Loading /> : <RequestHistory requests={requestQuery.data || []} />}
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajukan perpanjangan</DialogTitle>
            <DialogDescription>{selectedLoan?.loan.noPeminjaman} · deadline saat ini {formatDate(selectedLoan?.loan.tanggalKembali)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/60 p-3 text-sm"><p className="font-semibold">{selectedLoan && loanName(selectedLoan.loan, selectedLoan.type)}</p><p className="mt-1 text-muted-foreground">{selectedLoan?.loan.laboratorium?.nama || "Laboratorium belum tercatat"}</p></div>
            <div className="space-y-2">
              <Label htmlFor="tanggal-kembali-baru">Tanggal kembali baru</Label>
              <Input id="tanggal-kembali-baru" type="date" min={selectedLoan ? nextDate(selectedLoan.loan.tanggalKembali) : undefined} value={newDate} onChange={(event) => setNewDate(event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alasan-perpanjangan">Alasan perpanjangan</Label>
              <Textarea id="alasan-perpanjangan" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: praktikum belum selesai dan membutuhkan tambahan waktu..." className="min-h-28 resize-y rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLoan(null)} className="rounded-xl">Batal</Button>
            <Button onClick={submitRequest} disabled={requestMutation.isPending} className="rounded-xl">{requestMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim</> : "Kirim pengajuan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle>Tolak pengajuan perpanjangan</DialogTitle><DialogDescription>Berikan catatan agar peminjam memahami keputusan ini.</DialogDescription></DialogHeader>
          <Textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Catatan untuk peminjam (opsional)" className="min-h-24 rounded-xl" />
          <DialogFooter><Button variant="outline" onClick={() => setRejecting(null)} className="rounded-xl">Batal</Button><Button variant="destructive" onClick={() => rejecting && reviewMutation.mutate({ id: rejecting.id, status: "ditolak", catatan: reviewNote })} disabled={reviewMutation.isPending} className="rounded-xl">Tolak pengajuan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function Loading() {
  return <Card className="flex h-36 items-center justify-center rounded-2xl border-border/70"><Loader2 className="h-5 w-5 animate-spin text-primary" /></Card>;
}

function Empty({ text }: { text: string }) {
  return <Card className="flex min-h-36 items-center justify-center rounded-2xl border-dashed p-6 text-center text-sm text-muted-foreground">{text}</Card>;
}

function LoanCard({ loan, type, onRequest }: { loan: Loan; type: "alat" | "phantom"; onRequest: () => void }) {
  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{type === "alat" ? <ClipboardList className="h-5 w-5" /> : <Ghost className="h-5 w-5" />}</div><div className="min-w-0"><p className="font-mono text-xs font-semibold text-primary">{loan.noPeminjaman}</p><h3 className="mt-1 truncate font-semibold">{loan.laboratorium?.nama || "Laboratorium"}</h3></div></div>
        <StatusBadge status={loan.status} />
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{loanName(loan, type)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-xs"><div><span className="text-muted-foreground">Dipinjam</span><p className="mt-1 font-semibold">{formatDate(loan.tanggalPinjam)}</p></div><div><span className="text-muted-foreground">Deadline</span><p className="mt-1 font-semibold text-orange-700">{formatDate(loan.tanggalKembali)}</p></div></div>
      <Button onClick={onRequest} className="mt-4 w-full rounded-xl gap-2"><CalendarClock className="h-4 w-4" />Ajukan perpanjangan</Button>
    </Card>
  );
}

function RequestHistory({ requests }: { requests: ExtensionRequest[] }) {
  if (!requests.length) return <Empty text="Belum ada riwayat pengajuan perpanjangan." />;
  return <div className="space-y-3">{requests.map((request) => <Card key={request.id} className="rounded-2xl border-border/70 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs font-semibold text-primary">{request.noPeminjaman || `Peminjaman #${request.peminjamanId}`}</p><p className="mt-1 text-sm font-semibold">{formatDate(request.tanggalKembaliLama)} <span className="font-normal text-muted-foreground">→</span> {formatDate(request.tanggalKembaliBaru)}</p><p className="mt-2 text-sm text-muted-foreground">{request.alasan}</p></div><StatusBadge status={request.status} /></div>{request.catatan && <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">Catatan: {request.catatan}</p>}</Card>)}</div>;
}

function ReviewList({ requests, loading, onReview, pending }: { requests: ExtensionRequest[]; loading: boolean; onReview: (request: ExtensionRequest, status: "disetujui" | "ditolak") => void; pending: boolean }) {
  if (loading) return <Loading />;
  if (!requests.length) return <Empty text="Tidak ada pengajuan perpanjangan yang menunggu." />;
  return <div className="space-y-4">{requests.map((request) => <Card key={request.id} className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="gap-1.5 rounded-lg"><UserRound className="h-3 w-3" />{request.pemohonNama}{request.pemohonNim ? ` · ${request.pemohonNim}` : ""}</Badge><Badge variant="outline" className="gap-1.5 rounded-lg"><Building2 className="h-3 w-3" />{request.laboratoriumNama || "Laboratorium"}</Badge><Badge variant="outline" className="rounded-lg">{request.jenis === "alat" ? "Alat" : "Phantom"}</Badge></div><p className="mt-3 font-mono text-xs font-semibold text-primary">{request.noPeminjaman || `Peminjaman #${request.peminjamanId}`}</p><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span>Deadline {formatDate(request.tanggalKembaliLama)}</span><span className="text-muted-foreground">→</span><span className="font-semibold text-primary">{formatDate(request.tanggalKembaliBaru)}</span></div><p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">{request.alasan}</p></div><div className="flex shrink-0 gap-2 xl:pt-1"><Button onClick={() => onReview(request, "ditolak")} disabled={pending} variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5"><XCircle className="h-4 w-4" />Tolak</Button><Button onClick={() => onReview(request, "disetujui")} disabled={pending} className="rounded-xl"><CheckCircle2 className="h-4 w-4" />Setujui</Button></div></div></Card>)}</div>;
}