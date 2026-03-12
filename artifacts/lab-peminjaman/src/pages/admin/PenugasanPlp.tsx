import { useState } from "react";
import { useGetUsers, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, UserCog, FlaskConical } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

function usePlpLaboratorium(params?: { plpId?: number; laboratoriumId?: number }) {
  return useQuery({
    queryKey: ["/api/plp-laboratorium", params],
    queryFn: async () => {
      const url = new URL("/api/plp-laboratorium", window.location.origin);
      if (params?.plpId) url.searchParams.set("plpId", String(params.plpId));
      if (params?.laboratoriumId) url.searchParams.set("laboratoriumId", String(params.laboratoriumId));
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });
}

function useAssignPlp() {
  return useMutation({
    mutationFn: async (data: { plpId: number; laboratoriumId: number }) => {
      const res = await fetch("/api/plp-laboratorium", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw json;
      return json;
    },
  });
}

function useRemoveAssignment() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/plp-laboratorium/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw await res.json();
    },
  });
}

export default function AdminPenugasanPlp() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPlp, setSelectedPlp] = useState<string>("");
  const [selectedLab, setSelectedLab] = useState<string>("");

  const { data: plps } = useGetUsers({ role: "plp" as any });
  const { data: labs } = useGetLaboratorium({});
  const { data: assignments, isLoading } = usePlpLaboratorium();
  const assignMutation = useAssignPlp();
  const removeMutation = useRemoveAssignment();

  const handleAssign = () => {
    if (!selectedPlp || !selectedLab) { toast({ variant: "destructive", title: "Pilih PLP dan Lab terlebih dahulu" }); return; }
    assignMutation.mutate({ plpId: parseInt(selectedPlp), laboratoriumId: parseInt(selectedLab) }, {
      onSuccess: () => { toast({ title: "PLP berhasil ditugaskan" }); setSelectedPlp(""); setSelectedLab(""); qc.invalidateQueries({ queryKey: ["/api/plp-laboratorium"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e.message || "Gagal menugaskan" }),
    });
  };

  const handleRemove = (id: number, plpNama: string, labNama: string) => {
    if (!confirm(`Hapus penugasan ${plpNama} dari ${labNama}?`)) return;
    removeMutation.mutate(id, {
      onSuccess: () => { toast({ title: "Penugasan dihapus" }); qc.invalidateQueries({ queryKey: ["/api/plp-laboratorium"] }); },
      onError: (e: any) => toast({ variant: "destructive", description: e.message }),
    });
  };

  // Group assignments by PLP
  const grouped = (assignments || []).reduce((acc: any, a: any) => {
    const plpId = a.plp?.id;
    if (!acc[plpId]) acc[plpId] = { plp: a.plp, labs: [] };
    acc[plpId].labs.push({ id: a.id, lab: a.laboratorium });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Penugasan PLP ke Laboratorium" description="Tentukan PLP mana yang bertanggung jawab mengelola laboratorium tertentu." />

      <Card className="p-5 border-none shadow-lg rounded-2xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Tambah Penugasan Baru</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pilih PLP</label>
            <Select value={selectedPlp} onValueChange={setSelectedPlp}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih PLP..." /></SelectTrigger>
              <SelectContent>
                {plps?.filter(u => u.status === "aktif").map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.nama}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pilih Laboratorium</label>
            <Select value={selectedLab} onValueChange={setSelectedLab}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih Lab..." /></SelectTrigger>
              <SelectContent>
                {labs?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nama} – {l.lokasi}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAssign} disabled={assignMutation.isPending} className="w-full h-10 rounded-xl">
              {assignMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><Plus className="w-4 h-4 mr-2" />Tugaskan</>}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed border-2 rounded-2xl">Belum ada penugasan PLP</Card>
        ) : Object.values(grouped).map((g: any) => (
          <Card key={g.plp?.id} className="border-none shadow-sm rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><UserCog className="text-primary w-5 h-5" /></div>
              <div>
                <p className="font-bold text-sm">{g.plp?.nama}</p>
                <p className="text-xs text-muted-foreground">{g.plp?.email}</p>
              </div>
              <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 text-xs">
                {g.labs.length} Lab
              </Badge>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {g.labs.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <FlaskConical className="text-teal-500 w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.lab?.nama}</p>
                    <p className="text-xs text-muted-foreground">{item.lab?.lokasi}</p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                    onClick={() => handleRemove(item.id, g.plp?.nama, item.lab?.nama)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
