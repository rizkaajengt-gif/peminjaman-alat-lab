import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customFetch,
  useCreateBerita,
  useCreateDokumen,
  useCreateGaleri,
  useDeleteBerita,
  useDeleteDokumen,
  useDeleteGaleri,
  useGetBerita,
  useGetDokumen,
  useGetGaleri,
  useGetLaboratorium,
  useUpdateBerita,
  getGetBeritaQueryKey,
  getGetDokumenQueryKey,
  getGetGaleriQueryKey,
  type Berita,
  type CreateBeritaRequest,
  type CreateDokumenRequest,
  type CreateGaleriRequest,
  type Dokumen,
  type Galeri,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FilePenLine,
  FileText,
  Filter,
  FlaskConical,
  Images,
  LibraryBig,
  Link2,
  Loader2,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

type ContentType = "berita" | "galeri" | "dokumen";
type ContentItem = Berita | Galeri | Dokumen;
type FormValues = {
  judul: string;
  konten: string;
  kategori: string;
  thumbnail: string;
  deskripsi: string;
  tipe: "foto" | "video";
  url: string;
  nama: string;
  tipeDokumen: string;
  laboratoriumId: string;
};

type UpdateGaleriPayload = Partial<CreateGaleriRequest>;
type UpdateDokumenPayload = Partial<CreateDokumenRequest>;

type DeleteTarget = {
  type: ContentType;
  id: number;
  label: string;
};

const emptyForm: FormValues = {
  judul: "",
  konten: "",
  kategori: "",
  thumbnail: "",
  deskripsi: "",
  tipe: "foto",
  url: "",
  nama: "",
  tipeDokumen: "",
  laboratoriumId: "",
};

const contentMeta: Record<ContentType, { label: string; singular: string; description: string }> = {
  berita: {
    label: "Berita",
    singular: "berita",
    description: "Informasi dan pengumuman yang tampil di kanal institusi.",
  },
  galeri: {
    label: "Galeri",
    singular: "media",
    description: "Koleksi foto dan video kegiatan laboratorium.",
  },
  dokumen: {
    label: "Dokumen",
    singular: "dokumen",
    description: "Referensi, panduan, dan berkas penting untuk civitas.",
  },
};

function formatDate(value?: string | null) {
  if (!value) return "Belum tercatat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum tercatat";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Terjadi kesalahan.");
  }
  return "Terjadi kesalahan. Coba lagi.";
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function updateGaleri(id: number, data: UpdateGaleriPayload) {
  return customFetch<Galeri>(`/api/galeri/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function updateDokumen(id: number, data: UpdateDokumenPayload) {
  return customFetch<Dokumen>(`/api/dokumen/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

function TypeIcon({ type, className = "h-5 w-5" }: { type: ContentType; className?: string }) {
  if (type === "berita") return <Newspaper className={className} />;
  if (type === "galeri") return <Images className={className} />;
  return <FileText className={className} />;
}

function CountCard({
  type,
  count,
  active,
  onClick,
}: {
  type: ContentType;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`button-filter-${type}`}
      className={`group relative flex min-h-[124px] w-full flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[0_16px_28px_-18px_hsl(var(--primary))]"
          : "border-border/80 bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-primary-foreground/15" : "bg-primary/10 text-primary"}`}>
          <TypeIcon type={type} />
        </span>
        <ArrowUpRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{contentMeta[type].label}</p>
          <p className="mt-1 font-display text-3xl font-bold leading-none" data-testid={`text-count-${type}`}>{count}</p>
        </div>
        <span className={`mb-0.5 text-xs ${active ? "text-primary-foreground/65" : "text-muted-foreground"}`}>kelola</span>
      </div>
      {active && <span className="absolute -bottom-8 -right-4 h-24 w-24 rounded-full border-[12px] border-primary-foreground/10" aria-hidden="true" />}
    </button>
  );
}

function EmptyState({ type, onAdd }: { type: ContentType; onAdd: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center" data-testid={`empty-${type}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <TypeIcon type={type} className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl font-bold">Belum ada {contentMeta[type].singular}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{contentMeta[type].description} Tambahkan item pertama untuk mulai mengisi kanal ini.</p>
      <Button onClick={onAdd} data-testid={`button-empty-add-${type}`} className="mt-5 rounded-xl">
        <Plus className="h-4 w-4" />
        Tambah {contentMeta[type].singular}
      </Button>
    </div>
  );
}

function LoadingState({ type }: { type: ContentType }) {
  return (
    <div className="space-y-3 p-4 sm:p-5" aria-label={`Memuat ${contentMeta[type].label.toLowerCase()}`} data-testid={`loading-${type}`}>
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex animate-pulse items-center gap-4 rounded-xl border border-border/60 p-4">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-muted" />
            <div className="h-2.5 w-3/5 rounded bg-muted" />
          </div>
          <div className="h-8 w-16 rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ type, message, onRetry }: { type: ContentType; message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-12 text-center" data-testid={`error-${type}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-bold">Konten belum dapat dimuat</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry} data-testid={`button-retry-${type}`} className="mt-5 rounded-xl">
        <RefreshCw className="h-4 w-4" />
        Coba lagi
      </Button>
    </div>
  );
}

function ActionButtons({ type, id, label, onEdit, onDelete }: { type: ContentType; id: number; label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${label}`} title={`Edit ${label}`} data-testid={`button-edit-${type}-${id}`} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Hapus ${label}`} title={`Hapus ${label}`} data-testid={`button-delete-${type}-${id}`} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ContentDialog({
  open,
  onOpenChange,
  type,
  item,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ContentType;
  item: ContentItem | null;
  onSubmit: (values: FormValues) => Promise<void>;
  isPending: boolean;
}) {
  const form = useForm<FormValues>({ defaultValues: emptyForm });
  const isEditing = Boolean(item);
  const values = form.watch();

  useEffect(() => {
    if (!open) return;
    const next: FormValues = { ...emptyForm };
    if (type === "berita" && item && "judul" in item) {
      const beritaItem = item as Berita;
      next.judul = beritaItem.judul;
      next.konten = beritaItem.konten;
      next.kategori = beritaItem.kategori ?? "";
      next.thumbnail = beritaItem.thumbnail ?? "";
    }
    if (type === "galeri" && item && "url" in item && "tipe" in item && "judul" in item) {
      next.judul = item.judul;
      next.deskripsi = item.deskripsi ?? "";
      next.tipe = item.tipe;
      next.url = item.url;
    }
    if (type === "dokumen" && item && "nama" in item) {
      next.nama = item.nama;
      next.deskripsi = item.deskripsi ?? "";
      next.url = item.url;
      next.tipeDokumen = item.tipe ?? "";
      next.laboratoriumId = item.laboratoriumId?.toString() ?? "";
    }
    form.reset(next);
  }, [form, item, open, type]);

  const submit = async (formValues: FormValues) => {
    const requiredField = type === "dokumen" ? formValues.nama : formValues.judul;
    if (!requiredField.trim()) {
      form.setError(type === "dokumen" ? "nama" : "judul", { type: "required", message: type === "dokumen" ? "Nama dokumen wajib diisi." : "Judul wajib diisi." });
      return;
    }
    if (type === "berita" && !formValues.konten.trim()) {
      form.setError("konten", { type: "required", message: "Isi berita wajib diisi." });
      return;
    }
    if ((type === "galeri" || type === "dokumen") && (!formValues.url.trim() || !isValidUrl(formValues.url.trim()))) {
      form.setError("url", { type: "validate", message: "Masukkan URL lengkap, contoh: https://sipelab.poltekkestasikmalaya.ac.id/media." });
      return;
    }
    await onSubmit(formValues);
  };

  const errorFor = (field: keyof FormValues) => form.formState.errors[field]?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl border-border/80 bg-card p-0 shadow-[var(--shadow-lg)] sm:max-w-2xl">
        <DialogHeader className="border-b border-border/70 bg-primary/[0.045] px-6 py-5 pr-12 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><TypeIcon type={type} /></span>
            <div>
              <DialogTitle className="font-display text-xl">{isEditing ? `Edit ${contentMeta[type].singular}` : `Tambah ${contentMeta[type].singular}`}</DialogTitle>
              <DialogDescription className="mt-1">{isEditing ? "Perbarui informasi agar kanal tetap akurat." : contentMeta[type].description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5 px-6 py-6" data-testid={`form-${type}`}>
            {type === "berita" && (
              <>
                <Field label="Judul berita" htmlFor="berita-judul" required error={errorFor("judul")}>
                  <Input id="berita-judul" {...form.register("judul")} placeholder="Tulis judul yang ringkas dan informatif" data-testid="input-berita-judul" className="h-11 rounded-xl" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Kategori" htmlFor="berita-kategori" hint="Opsional">
                    <Input id="berita-kategori" {...form.register("kategori")} placeholder="Contoh: Kegiatan" data-testid="input-berita-kategori" className="h-11 rounded-xl" />
                  </Field>
                  <Field label="URL thumbnail" htmlFor="berita-thumbnail" hint="Opsional · URL">
                    <Input id="berita-thumbnail" {...form.register("thumbnail")} placeholder="https://..." data-testid="input-berita-thumbnail" className="h-11 rounded-xl" />
                  </Field>
                </div>
                <Field label="Isi berita" htmlFor="berita-konten" required error={errorFor("konten")}>
                  <Textarea id="berita-konten" {...form.register("konten")} placeholder="Tulis isi berita di sini..." data-testid="textarea-berita-konten" className="min-h-[180px] resize-y rounded-xl leading-6" />
                </Field>
              </>
            )}
            {type === "galeri" && (
              <>
                <Field label="Judul media" htmlFor="galeri-judul" required error={errorFor("judul")}>
                  <Input id="galeri-judul" {...form.register("judul")} placeholder="Contoh: Praktikum Mikrobiologi" data-testid="input-galeri-judul" className="h-11 rounded-xl" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Jenis media" htmlFor="galeri-tipe">
                    <Select value={values.tipe} onValueChange={(value) => form.setValue("tipe", value as "foto" | "video")}>
                      <SelectTrigger id="galeri-tipe" data-testid="select-galeri-tipe" className="h-11 rounded-xl"><SelectValue placeholder="Pilih jenis media" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="foto">Foto</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="URL media" htmlFor="galeri-url" required hint="URL, bukan unggah berkas" error={errorFor("url")}>
                    <Input id="galeri-url" {...form.register("url")} placeholder="https://..." data-testid="input-galeri-url" className="h-11 rounded-xl" />
                  </Field>
                </div>
                <Field label="Deskripsi" htmlFor="galeri-deskripsi" hint="Opsional">
                  <Textarea id="galeri-deskripsi" {...form.register("deskripsi")} placeholder="Tambahkan konteks singkat tentang media ini" data-testid="textarea-galeri-deskripsi" className="min-h-[110px] resize-y rounded-xl leading-6" />
                </Field>
                <p className="flex items-center gap-2 rounded-xl bg-accent/50 px-3 py-2.5 text-xs leading-5 text-accent-foreground"><Link2 className="h-3.5 w-3.5 shrink-0" /> Referensi media disimpan sebagai URL oleh sistem.</p>
              </>
            )}
            {type === "dokumen" && (
              <>
                <Field label="Nama dokumen" htmlFor="dokumen-nama" required error={errorFor("nama")}>
                  <Input id="dokumen-nama" {...form.register("nama")} placeholder="Contoh: Panduan Keselamatan Laboratorium" data-testid="input-dokumen-nama" className="h-11 rounded-xl" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Tipe dokumen" htmlFor="dokumen-tipe" hint="Opsional">
                    <Input id="dokumen-tipe" {...form.register("tipeDokumen")} placeholder="PDF, DOCX, atau lainnya" data-testid="input-dokumen-tipe" className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Laboratorium" htmlFor="dokumen-laboratorium" hint="Opsional">
                    <Select value={values.laboratoriumId || "lintas-lab"} onValueChange={(value) => form.setValue("laboratoriumId", value === "lintas-lab" ? "" : value)}>
                      <SelectTrigger id="dokumen-laboratorium" data-testid="select-dokumen-laboratorium" className="h-11 rounded-xl"><SelectValue placeholder="Pilih laboratorium" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lintas-lab">Lintas laboratorium</SelectItem>
                        <LaboratoriumOptions />
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="URL dokumen" htmlFor="dokumen-url" required hint="URL, bukan unggah berkas" error={errorFor("url")}>
                  <Input id="dokumen-url" {...form.register("url")} placeholder="https://..." data-testid="input-dokumen-url" className="h-11 rounded-xl" />
                </Field>
                <Field label="Deskripsi" htmlFor="dokumen-deskripsi" hint="Opsional">
                  <Textarea id="dokumen-deskripsi" {...form.register("deskripsi")} placeholder="Jelaskan isi atau kegunaan dokumen" data-testid="textarea-dokumen-deskripsi" className="min-h-[110px] resize-y rounded-xl leading-6" />
                </Field>
                <p className="flex items-center gap-2 rounded-xl bg-accent/50 px-3 py-2.5 text-xs leading-5 text-accent-foreground"><Link2 className="h-3.5 w-3.5 shrink-0" /> Referensi dokumen disimpan sebagai URL oleh sistem.</p>
              </>
            )}
            <DialogFooter className="gap-2 border-t border-border/70 pt-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid={`button-cancel-${type}`} className="rounded-xl">Batal</Button>
              <Button type="submit" disabled={isPending} data-testid={`button-save-${type}`} className="min-w-28 rounded-xl">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan</> : <><CheckCircle2 className="h-4 w-4" /> Simpan</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, required, hint, error, children }: { label: string; htmlFor: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-sm font-semibold">{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function LaboratoriumOptions() {
  const { data } = useGetLaboratorium({});
  return <>{data?.map((lab) => <SelectItem key={lab.id} value={String(lab.id)}>{lab.nama}</SelectItem>)}</>;
}

export default function AdminKonten() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<ContentType>("berita");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("semua");
  const [galleryFilter, setGalleryFilter] = useState("semua");
  const [labFilter, setLabFilter] = useState("semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const beritaQuery = useGetBerita();
  const galeriQuery = useGetGaleri();
  const dokumenQuery = useGetDokumen();
  const { data: laboratories } = useGetLaboratorium({});
  const createBerita = useCreateBerita();
  const updateBerita = useUpdateBerita();
  const deleteBerita = useDeleteBerita();
  const createGaleri = useCreateGaleri();
  const deleteGaleri = useDeleteGaleri();
  const createDokumen = useCreateDokumen();
  const deleteDokumen = useDeleteDokumen();
  const updateGaleriMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGaleriPayload }) => updateGaleri(id, data),
  });
  const updateDokumenMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDokumenPayload }) => updateDokumen(id, data),
  });

  const berita = beritaQuery.data ?? [];
  const galeri = galeriQuery.data ?? [];
  const dokumen = dokumenQuery.data ?? [];
  const categories = useMemo(() => Array.from(new Set(berita.map((item) => item.kategori).filter((value): value is string => Boolean(value)))).sort(), [berita]);

  const filteredBerita = useMemo(() => berita.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.judul, item.konten, item.kategori ?? "", item.penulis?.nama ?? ""].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (categoryFilter === "semua" || item.kategori === categoryFilter);
  }), [berita, categoryFilter, search]);
  const filteredGaleri = useMemo(() => galeri.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.judul, item.deskripsi ?? "", item.url].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (galleryFilter === "semua" || item.tipe === galleryFilter);
  }), [galeri, galleryFilter, search]);
  const filteredDokumen = useMemo(() => dokumen.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.nama, item.deskripsi ?? "", item.tipe ?? "", item.url].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (labFilter === "semua" || String(item.laboratoriumId ?? "") === labFilter);
  }), [dokumen, labFilter, search]);

  const currentLoading = activeType === "berita" ? beritaQuery.isLoading : activeType === "galeri" ? galeriQuery.isLoading : dokumenQuery.isLoading;
  const currentError = activeType === "berita" ? beritaQuery.error : activeType === "galeri" ? galeriQuery.error : dokumenQuery.error;
  const currentItems = activeType === "berita" ? filteredBerita : activeType === "galeri" ? filteredGaleri : filteredDokumen;

  const openCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };
  const openEdit = (item: ContentItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const invalidate = async (type: ContentType) => {
    const queryKey = type === "berita" ? getGetBeritaQueryKey() : type === "galeri" ? getGetGaleriQueryKey() : getGetDokumenQueryKey();
    await queryClient.invalidateQueries({ queryKey });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (activeType === "berita") {
        const payload: CreateBeritaRequest = {
          judul: values.judul.trim(),
          konten: values.konten.trim(),
          kategori: values.kategori.trim() || null,
          thumbnail: values.thumbnail.trim() || null,
        };
        if (editingItem) await updateBerita.mutateAsync({ id: editingItem.id, data: payload });
        else await createBerita.mutateAsync({ data: payload });
      } else if (activeType === "galeri") {
        const payload: CreateGaleriRequest = {
          judul: values.judul.trim(),
          deskripsi: values.deskripsi.trim() || null,
          tipe: values.tipe,
          url: values.url.trim(),
        };
        if (editingItem) await updateGaleriMutation.mutateAsync({ id: editingItem.id, data: payload });
        else await createGaleri.mutateAsync({ data: payload });
      } else {
        const payload: CreateDokumenRequest = {
          nama: values.nama.trim(),
          deskripsi: values.deskripsi.trim() || null,
          url: values.url.trim(),
          tipe: values.tipeDokumen.trim() || null,
          laboratoriumId: values.laboratoriumId ? Number(values.laboratoriumId) : null,
        };
        if (editingItem) await updateDokumenMutation.mutateAsync({ id: editingItem.id, data: payload });
        else await createDokumen.mutateAsync({ data: payload });
      }
      await invalidate(activeType);
      toast({ title: editingItem ? "Konten diperbarui" : "Konten ditambahkan", description: `${contentMeta[activeType].label} berhasil disimpan.` });
      setDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan konten", description: getErrorMessage(error) });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "berita") await deleteBerita.mutateAsync({ id: deleteTarget.id });
      if (deleteTarget.type === "galeri") await deleteGaleri.mutateAsync({ id: deleteTarget.id });
      if (deleteTarget.type === "dokumen") await deleteDokumen.mutateAsync({ id: deleteTarget.id });
      await invalidate(deleteTarget.type);
      toast({ title: "Konten dihapus", description: `${deleteTarget.label} telah dihapus dari daftar.` });
      setDeleteTarget(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus konten", description: getErrorMessage(error) });
    }
  };

  const deletePending = deleteBerita.isPending || deleteGaleri.isPending || deleteDokumen.isPending;
  const savePending = createBerita.isPending || updateBerita.isPending || createGaleri.isPending || updateGaleriMutation.isPending || createDokumen.isPending || updateDokumenMutation.isPending;
  const retry = () => {
    if (activeType === "berita") void beritaQuery.refetch();
    if (activeType === "galeri") void galeriQuery.refetch();
    if (activeType === "dokumen") void dokumenQuery.refetch();
  };

  return (
    <div className="min-h-[100dvh] space-y-6 pb-10">
      <PageHeader
        title="Konten institusi"
        description="Kelola informasi publik SIPELAB Poltekkes Kemenkes Tasikmalaya."
        action={<Button onClick={openCreate} data-testid="button-add-content" className="h-11 rounded-xl px-4 shadow-[0_10px_18px_-14px_hsl(var(--primary))]"><Plus className="h-4 w-4" /> Tambah konten</Button>}
      />

      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-primary px-6 py-6 text-primary-foreground shadow-[0_18px_42px_-28px_hsl(var(--primary))] sm:px-8 sm:py-7" data-testid="content-overview">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70"><ShieldCheck className="h-4 w-4" /> Ruang kerja terverifikasi</div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Satu tempat untuk menjaga kabar tetap hidup.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">Pastikan setiap berita, media, dan dokumen yang dibagikan kepada civitas selalu relevan, tertata, dan mudah ditemukan.</p>
        </div>
        <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[28px] border-primary-foreground/10" aria-hidden="true" />
        <div className="absolute -bottom-20 right-20 h-36 w-36 rounded-full border border-primary-foreground/15" aria-hidden="true" />
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan konten">
        <CountCard type="berita" count={berita.length} active={activeType === "berita"} onClick={() => { setActiveType("berita"); setSearch(""); }} />
        <CountCard type="galeri" count={galeri.length} active={activeType === "galeri"} onClick={() => { setActiveType("galeri"); setSearch(""); }} />
        <CountCard type="dokumen" count={dokumen.length} active={activeType === "dokumen"} onClick={() => { setActiveType("dokumen"); setSearch(""); }} />
      </section>

      <Card className="overflow-hidden rounded-2xl border-border/75 bg-card shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><TypeIcon type={activeType} /></div>
            <div>
              <h3 className="font-display text-lg font-bold">{contentMeta[activeType].label}</h3>
              <p className="text-xs text-muted-foreground">{currentItems.length} dari {activeType === "berita" ? berita.length : activeType === "galeri" ? galeri.length : dokumen.length} item ditampilkan</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Cari ${contentMeta[activeType].singular}...`} aria-label={`Cari ${contentMeta[activeType].singular}`} data-testid="input-search-content" className="h-10 rounded-xl pl-9 pr-9" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Hapus pencarian" data-testid="button-clear-search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <Button onClick={openCreate} data-testid={`button-add-${activeType}`} className="h-10 rounded-xl sm:px-3"><Plus className="h-4 w-4" /><span className="sm:hidden">Tambah</span><span className="hidden sm:inline">Tambah {contentMeta[activeType].singular}</span></Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-primary/[0.025] px-4 py-3 sm:px-5">
          <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
          {activeType === "berita" && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-filter-berita" className="h-8 w-auto min-w-32 rounded-lg bg-card text-xs"><SelectValue placeholder="Semua kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua kategori</SelectItem>
                {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {activeType === "galeri" && (
            <Select value={galleryFilter} onValueChange={setGalleryFilter}>
              <SelectTrigger data-testid="select-filter-galeri" className="h-8 w-auto min-w-28 rounded-lg bg-card text-xs"><SelectValue placeholder="Semua media" /></SelectTrigger>
              <SelectContent><SelectItem value="semua">Semua media</SelectItem><SelectItem value="foto">Foto</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
            </Select>
          )}
          {activeType === "dokumen" && (
            <Select value={labFilter} onValueChange={setLabFilter}>
              <SelectTrigger data-testid="select-filter-dokumen" className="h-8 w-auto min-w-40 rounded-lg bg-card text-xs"><SelectValue placeholder="Semua laboratorium" /></SelectTrigger>
              <SelectContent><SelectItem value="semua">Semua laboratorium</SelectItem>{laboratories?.map((lab) => <SelectItem key={lab.id} value={String(lab.id)}>{lab.nama}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {(search || categoryFilter !== "semua" || galleryFilter !== "semua" || labFilter !== "semua") && <button type="button" onClick={() => { setSearch(""); setCategoryFilter("semua"); setGalleryFilter("semua"); setLabFilter("semua"); }} data-testid="button-reset-filters" className="ml-auto text-xs font-semibold text-primary hover:underline">Reset filter</button>}
        </div>

        {currentLoading ? <LoadingState type={activeType} /> : currentError ? <ErrorState type={activeType} message={getErrorMessage(currentError)} onRetry={retry} /> : currentItems.length === 0 ? <EmptyState type={activeType} onAdd={openCreate} /> : (
          <>
            {activeType === "berita" && <BeritaList items={filteredBerita} onEdit={openEdit} onDelete={(item) => setDeleteTarget({ type: "berita", id: item.id, label: item.judul })} />}
            {activeType === "galeri" && <GaleriList items={filteredGaleri} onEdit={openEdit} onDelete={(item) => setDeleteTarget({ type: "galeri", id: item.id, label: item.judul })} />}
            {activeType === "dokumen" && <DokumenList items={filteredDokumen} onEdit={openEdit} onDelete={(item) => setDeleteTarget({ type: "dokumen", id: item.id, label: item.nama })} />}
          </>
        )}
      </Card>

      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground"><MoreHorizontal className="h-4 w-4" /> Perubahan tersimpan ke sistem setelah aksi berhasil.</div>

      <ContentDialog open={dialogOpen} onOpenChange={setDialogOpen} type={activeType} item={editingItem} onSubmit={handleSubmit} isPending={savePending} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deletePending) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl border-border/80 bg-card shadow-[var(--shadow-lg)]">
          <AlertDialogHeader>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 className="h-5 w-5" /></div>
            <AlertDialogTitle className="font-display text-xl">Hapus konten ini?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">Item <span className="font-semibold text-foreground">“{deleteTarget?.label}”</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deletePending} data-testid="button-cancel-delete" className="mt-0 rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleDelete(); }} disabled={deletePending} data-testid="button-confirm-delete" className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletePending ? <><Loader2 className="h-4 w-4 animate-spin" /> Menghapus</> : <><Trash2 className="h-4 w-4" /> Hapus permanen</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BeritaList({ items, onEdit, onDelete }: { items: Berita[]; onEdit: (item: Berita) => void; onDelete: (item: Berita) => void }) {
  return (
    <div className="divide-y divide-border/60" data-testid="list-berita">
      <div className="hidden grid-cols-[minmax(0,1fr)_150px_145px_84px] gap-4 bg-muted/35 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground md:grid">
        <span>Judul berita</span><span>Kategori</span><span>Dibuat</span><span className="text-right">Aksi</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="grid gap-3 px-4 py-4 transition-colors hover:bg-primary/[0.025] sm:px-5 md:grid-cols-[minmax(0,1fr)_150px_145px_84px] md:items-center md:gap-4" data-testid={`row-berita-${item.id}`}>
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FilePenLine className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="truncate font-semibold" data-testid={`text-berita-title-${item.id}`}>{item.judul}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.konten}</p>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground md:hidden"><UserRound className="h-3 w-3" /> {item.penulis?.nama ?? "Admin"} <span className="text-border">·</span> {formatDate(item.createdAt)}</p>
            </div>
          </div>
          <div>{item.kategori ? <Badge variant="outline" className="border-primary/20 bg-primary/5 font-medium text-primary">{item.kategori}</Badge> : <span className="text-xs text-muted-foreground">Tanpa kategori</span>}</div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(item.createdAt)}</div>
          <ActionButtons type="berita" id={item.id} label={item.judul} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
        </div>
      ))}
    </div>
  );
}

function GaleriList({ items, onEdit, onDelete }: { items: Galeri[]; onEdit: (item: Galeri) => void; onDelete: (item: Galeri) => void }) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3" data-testid="list-galeri">
      {items.map((item) => (
        <article key={item.id} className="group overflow-hidden rounded-2xl border border-border/70 bg-background/50 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow)]" data-testid={`card-galeri-${item.id}`}>
          <div className="relative flex h-36 items-center justify-center overflow-hidden bg-primary/[0.07]">
            {item.tipe === "foto" ? <img src={item.url} alt={item.judul} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Video className="h-7 w-7" /></div>}
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm"><span className={`h-1.5 w-1.5 rounded-full ${item.tipe === "foto" ? "bg-primary" : "bg-accent-foreground"}`} /> {item.tipe === "foto" ? "Foto" : "Video"}</span>
            <a href={item.url} target="_blank" rel="noreferrer" aria-label={`Buka URL ${item.judul}`} data-testid={`link-galeri-url-${item.id}`} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-card/90 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-primary"><ExternalLink className="h-4 w-4" /></a>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <h4 className="line-clamp-1 font-semibold" data-testid={`text-galeri-title-${item.id}`}>{item.judul}</h4>
              <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{item.deskripsi || "Tidak ada deskripsi."}</p>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" /> {formatDate(item.createdAt)}</span>
              <ActionButtons type="galeri" id={item.id} label={item.judul} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function DokumenList({ items, onEdit, onDelete }: { items: Dokumen[]; onEdit: (item: Dokumen) => void; onDelete: (item: Dokumen) => void }) {
  return (
    <div className="divide-y divide-border/60" data-testid="list-dokumen">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-primary/[0.025] sm:flex-row sm:items-center sm:px-5" data-testid={`row-dokumen-${item.id}`}>
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/60 text-accent-foreground"><LibraryBig className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="truncate font-semibold" data-testid={`text-dokumen-name-${item.id}`}>{item.nama}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.deskripsi || "Tidak ada deskripsi."}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {item.tipe && <Badge variant="outline" className="h-5 border-border px-1.5 text-[10px] uppercase">{item.tipe}</Badge>}
                {item.laboratorium?.nama && <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" /> {item.laboratorium.nama}</span>}
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(item.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
            <a href={item.url} target="_blank" rel="noreferrer" data-testid={`link-dokumen-url-${item.id}`} className="flex min-w-0 max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{item.url}</span></a>
            <ActionButtons type="dokumen" id={item.id} label={item.nama} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
          </div>
        </div>
      ))}
    </div>
  );
}