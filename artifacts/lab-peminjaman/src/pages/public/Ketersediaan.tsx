import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Clock3,
  HardHat,
  LibraryBig,
  LocateFixed,
  LogIn,
  RefreshCw,
  Search,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useGetPublicKetersediaan } from "@workspace/api-client-react";
import type {
  PublicJadwalKetersediaan,
  PublicLaboratoriumKetersediaan,
} from "@workspace/api-client-react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function parseDate(value: string) {
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return new Date(value);
}

function formatDate(value: string) {
  const parsed = parseDate(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

function formatUpdatedAt(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTimeFormatter.format(parsed);
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scheduleSortValue(schedule: PublicJadwalKetersediaan) {
  return `${schedule.tanggalMulai}T${schedule.waktuMulai}`;
}

function isUpcoming(schedule: PublicJadwalKetersediaan) {
  return new Date(scheduleSortValue(schedule)).getTime() >= Date.now() - 86_400_000;
}

function getNextSchedule(lab: PublicLaboratoriumKetersediaan) {
  return [...lab.jadwal]
    .filter(isUpcoming)
    .sort((a, b) => scheduleSortValue(a).localeCompare(scheduleSortValue(b)))[0];
}

function LoadingState() {
  return (
    <div className="space-y-5" data-testid="loading-availability">
      {[1, 2, 3].map((item) => (
        <div
          className="rounded-[1.6rem] border border-border/70 bg-card/80 p-5 shadow-[var(--shadow-sm)]"
          key={item}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-7 w-64 max-w-[62vw] animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-44 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AvailabilityPill({
  available,
  total,
}: {
  available: number;
  total: number;
}) {
  const none = available === 0;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        none
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
      data-testid={`status-stock-${total}-${available}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${none ? "bg-rose-500" : "availability-live-dot bg-emerald-500"}`}
      />
      {none ? "Tidak tersedia" : `${available} dari ${total} tersedia`}
    </span>
  );
}

function LabCard({
  lab,
  expanded,
  onToggle,
}: {
  lab: PublicLaboratoriumKetersediaan;
  expanded: boolean;
  onToggle: () => void;
}) {
  const nextSchedule = getNextSchedule(lab);
  const availableEquipment = lab.alat.reduce(
    (sum, item) => sum + item.stokTersedia,
    0,
  );
  const totalEquipment = lab.alat.reduce((sum, item) => sum + item.stok, 0);

  return (
    <article
      className={`availability-rise rounded-[1.7rem] border bg-card/90 shadow-[var(--shadow)] transition-all duration-300 ${
        expanded
          ? "border-primary/35 shadow-[var(--shadow-md)]"
          : "border-border/75 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-md)]"
      }`}
      data-testid={`card-laboratorium-${lab.id}`}
    >
      <button
        className="block w-full cursor-pointer p-5 text-left sm:p-6"
        data-testid={`button-toggle-laboratorium-${lab.id}`}
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary px-2 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-primary-foreground">
                {lab.kode}
              </span>
              {lab.jurusanNama && (
                <span className="rounded-md bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-[0.11em] text-accent-foreground">
                  {lab.jurusanNama}
                </span>
              )}
            </div>
            <h2 className="font-display text-[1.55rem] leading-tight text-foreground sm:text-[1.7rem]">
              {lab.nama}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <LocateFixed className="h-4 w-4 shrink-0 text-primary" />
              <span data-testid={`text-location-${lab.id}`}>{lab.lokasi}</span>
            </p>
            <div className="mt-3">
              <AvailabilityPill
                available={availableEquipment}
                total={totalEquipment}
              />
            </div>
          </div>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 ${
              expanded
                ? "rotate-180 border-primary/30 bg-primary text-primary-foreground"
                : "border-border bg-background text-primary"
            }`}
          >
            <ChevronDown className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-background/80 px-4 py-3">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
              <UsersRound className="h-3.5 w-3.5 text-primary" />
              Kapasitas
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {lab.kapasitas} orang
            </p>
          </div>
          <div className="rounded-2xl bg-background/80 px-4 py-3">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 text-primary" />
              Peralatan
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {lab.alat.length} jenis
            </p>
          </div>
          <div className="rounded-2xl bg-background/80 px-4 py-3">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              Agenda
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {lab.jadwal.length} kegiatan
            </p>
          </div>
        </div>

        {nextSchedule && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-primary/12 bg-primary/[0.045] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Clock3 className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-semibold text-foreground">
                {nextSchedule.judulKegiatan || titleCase(nextSchedule.kategori)}
              </span>
            </div>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {formatDate(nextSchedule.tanggalMulai)} ·{" "}
              {formatTime(nextSchedule.waktuMulai)}
            </span>
          </div>
        )}
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/70 px-5 pb-6 pt-5 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
              <section>
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                      Inventaris ringkas
                    </p>
                    <h3 className="mt-1 font-display text-xl text-foreground">
                      Peralatan di lab ini
                    </h3>
                  </div>
                  <span className="text-right text-xs text-muted-foreground">
                    {availableEquipment} tersedia
                    <br />
                    dari {totalEquipment} unit
                  </span>
                </div>
                {lab.alat.length > 0 ? (
                  <div className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-background/55">
                    {lab.alat.map((item) => (
                      <div
                        className="flex items-start justify-between gap-4 px-4 py-3.5"
                        data-testid={`row-equipment-${item.id}`}
                        key={item.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {item.nama}
                          </p>
                          <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                            {item.kode} · {titleCase(item.kondisi)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-foreground">
                            {item.stokTersedia}{" "}
                            <span className="font-normal text-muted-foreground">
                              {item.satuan}
                            </span>
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            dari {item.stok} {item.satuan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    Belum ada data peralatan untuk laboratorium ini.
                  </p>
                )}
              </section>

              <section>
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                    Agenda disetujui
                  </p>
                  <h3 className="mt-1 font-display text-xl text-foreground">
                    Jadwal penggunaan
                  </h3>
                </div>
                {lab.jadwal.length > 0 ? (
                  <div className="space-y-2.5">
                    {[...lab.jadwal]
                      .sort((a, b) =>
                        scheduleSortValue(a).localeCompare(scheduleSortValue(b)),
                      )
                      .map((schedule) => (
                        <div
                          className="rounded-2xl border border-border/70 bg-background/55 p-4"
                          data-testid={`row-schedule-${schedule.id}`}
                          key={schedule.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold leading-snug text-foreground">
                              {schedule.judulKegiatan ||
                                titleCase(schedule.kategori)}
                            </p>
                            <span className="shrink-0 rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-foreground">
                              {titleCase(schedule.kategori)}
                            </span>
                          </div>
                          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" />
                            {formatDate(schedule.tanggalMulai)}
                            {schedule.tanggalSelesai !== schedule.tanggalMulai &&
                              ` — ${formatDate(schedule.tanggalSelesai)}`}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5 text-primary" />
                            {formatTime(schedule.waktuMulai)}—
                            {formatTime(schedule.waktuSelesai)}
                            <span className="text-border">|</span>
                            <UsersRound className="h-3.5 w-3.5 text-primary" />
                            {schedule.jumlahPeserta} peserta
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground"
                    data-testid={`empty-schedule-${lab.id}`}
                  >
                    Belum ada agenda penggunaan yang disetujui.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Ketersediaan() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetPublicKetersediaan();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("Semua jurusan");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const laboratories = data?.laboratorium ?? [];
  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          laboratories
            .map((lab) => lab.jurusanNama)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [laboratories],
  );

  const filteredLaboratories = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return laboratories.filter((lab) => {
      const searchable = [
        lab.nama,
        lab.kode,
        lab.lokasi,
        lab.jurusanNama || "",
        ...lab.alat.map((item) => item.nama),
      ]
        .join(" ")
        .toLocaleLowerCase("id");
      return (
        (!needle || searchable.includes(needle)) &&
        (department === "Semua jurusan" || lab.jurusanNama === department)
      );
    });
  }, [department, laboratories, query]);

  const totalAvailable = laboratories.reduce(
    (sum, lab) =>
      sum + lab.alat.reduce((equipmentSum, item) => equipmentSum + item.stokTersedia, 0),
    0,
  );
  const upcomingCount = laboratories.reduce(
    (sum, lab) => sum + lab.jadwal.filter(isUpcoming).length,
    0,
  );
  const lastUpdated = data?.generatedAt ? formatUpdatedAt(data.generatedAt) : "";

  return (
    <div className="availability-page min-h-[100dvh] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link
            className="group flex min-w-0 items-center gap-3"
            data-testid="link-home-logo"
            href="/"
          >
            <img
              alt="Poltekkes Kemenkes Tasikmalaya"
              className="h-9 w-auto object-contain sm:h-10"
              src={`${import.meta.env.BASE_URL}logo-poltekkes.png`}
            />
            <span className="hidden h-7 w-px bg-border sm:block" />
            <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-primary sm:block">
              SIPELAB
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              className="hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary sm:flex"
              data-testid="link-back-home"
              href="/"
            >
              <ArrowLeft className="h-4 w-4" />
              Beranda
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-card px-4 text-sm font-bold text-primary shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
              data-testid="link-login"
              href="/login"
            >
              <LogIn className="h-4 w-4" />
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="availability-grid border-b border-border/60">
          <div className="mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-20">
            <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_.95fr]">
              <div className="availability-rise">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                  <span className="availability-live-dot h-2 w-2 rounded-full bg-primary" />
                  Data terbuka untuk publik
                </div>
                <h1 className="max-w-3xl font-display text-[2.9rem] leading-[0.98] text-foreground sm:text-6xl lg:text-[4.7rem]">
                  Kenali ruang belajar yang{" "}
                  <span className="text-primary">siap digunakan.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Pantau laboratorium, peralatan, dan agenda kegiatan yang telah
                  disetujui di lingkungan Poltekkes Kemenkes Tasikmalaya.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CircleAlert className="h-4 w-4 text-primary" />
                    Ketersediaan diperbarui berkala
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-primary" />
                    Informasi resmi SIPELAB
                  </span>
                </div>
              </div>

              <div className="availability-rise availability-delay-1 relative overflow-hidden rounded-[1.8rem] border border-primary/15 bg-primary p-6 text-primary-foreground shadow-[var(--shadow-md)] sm:p-8">
                <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border-[22px] border-primary-foreground/10" />
                <div className="absolute -bottom-20 right-16 h-40 w-40 rounded-full border-[18px] border-primary-foreground/10" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.17em] text-primary-foreground/70">
                      Ringkasan saat ini
                    </p>
                    <LibraryBig className="h-5 w-5 text-primary-foreground/70" />
                  </div>
                  {isLoading ? (
                    <div className="mt-7 grid animate-pulse grid-cols-3 gap-3">
                      {[1, 2, 3].map((item) => (
                        <div className="h-20 rounded-2xl bg-primary-foreground/15" key={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-7 grid grid-cols-3 gap-3">
                      <div data-testid="stat-laboratories">
                        <p className="font-display text-4xl">{laboratories.length}</p>
                        <p className="mt-1 text-[11px] font-semibold leading-tight text-primary-foreground/70">
                          laboratorium
                        </p>
                      </div>
                      <div data-testid="stat-equipment">
                        <p className="font-display text-4xl">{totalAvailable}</p>
                        <p className="mt-1 text-[11px] font-semibold leading-tight text-primary-foreground/70">
                          unit tersedia
                        </p>
                      </div>
                      <div data-testid="stat-schedules">
                        <p className="font-display text-4xl">{upcomingCount}</p>
                        <p className="mt-1 text-[11px] font-semibold leading-tight text-primary-foreground/70">
                          agenda dekat
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="mt-8 border-t border-primary-foreground/15 pt-4 text-xs text-primary-foreground/75">
                    {lastUpdated ? (
                      <span data-testid="text-last-updated">
                        Pembaruan terakhir · {lastUpdated}
                      </span>
                    ) : (
                      <span>Menyiapkan informasi terbaru...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Direktori laboratorium
              </p>
              <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
                Pilih ruang yang ingin kamu lihat
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Menampilkan</span>
              <strong className="text-foreground" data-testid="text-results-count">
                {filteredLaboratories.length} dari {laboratories.length}
              </strong>
              <span className="hidden sm:inline">laboratorium</span>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary disabled:cursor-wait disabled:opacity-60"
                data-testid="button-refresh-availability"
                disabled={isFetching}
                onClick={() => void refetch()}
                type="button"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Segarkan
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-3 rounded-[1.35rem] border border-border/70 bg-card/70 p-3 shadow-[var(--shadow-sm)] sm:flex-row">
            <label className="relative flex min-w-0 flex-1 items-center">
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-primary" />
              <input
                className="h-11 w-full rounded-xl border border-transparent bg-background pl-11 pr-10 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground/75 focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
                data-testid="input-search-laboratorium"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama lab, kode, lokasi, atau peralatan..."
                type="search"
                value={query}
              />
              {query && (
                <button
                  aria-label="Hapus pencarian"
                  className="absolute right-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  data-testid="button-clear-search"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <div className="flex gap-2 overflow-x-auto pb-0.5 sm:max-w-[50%]">
              {["Semua jurusan", ...departments].map((item) => (
                <button
                  className={`shrink-0 rounded-xl px-3.5 text-xs font-bold transition-colors ${
                    department === item
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`button-filter-${item.replaceAll(" ", "-").toLocaleLowerCase("id")}`}
                  key={item}
                  onClick={() => setDepartment(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {isLoading && <LoadingState />}

          {isError && (
            <div
              className="rounded-[1.7rem] border border-rose-200 bg-rose-50/80 p-8 text-center"
              data-testid="error-availability"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <CircleAlert className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-rose-950">
                Informasi belum dapat dimuat
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-800/80">
                Koneksi ke layanan SIPELAB sedang mengalami kendala. Coba
                segarkan halaman dalam beberapa saat.
                {error instanceof Error && error.message
                  ? ` (${error.message})`
                  : ""}
              </p>
              <button
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                data-testid="button-retry-availability"
                onClick={() => void refetch()}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Coba lagi
              </button>
            </div>
          )}

          {!isLoading && !isError && laboratories.length === 0 && (
            <div
              className="rounded-[1.7rem] border border-dashed border-primary/25 bg-card/70 px-6 py-16 text-center"
              data-testid="empty-availability"
            >
              <LibraryBig className="mx-auto h-10 w-10 text-primary/65" />
              <h3 className="mt-5 font-display text-2xl text-foreground">
                Belum ada laboratorium yang ditampilkan
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Data publik akan muncul di sini setelah informasi laboratorium
                tersedia.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            laboratories.length > 0 &&
            filteredLaboratories.length === 0 && (
              <div
                className="rounded-[1.7rem] border border-dashed border-border bg-card/70 px-6 py-16 text-center"
                data-testid="empty-filtered-availability"
              >
                <Search className="mx-auto h-10 w-10 text-primary/65" />
                <h3 className="mt-5 font-display text-2xl text-foreground">
                  Tidak ada hasil yang cocok
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Coba gunakan kata kunci lain atau pilih semua jurusan.
                </p>
                <button
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  data-testid="button-reset-filters"
                  onClick={() => {
                    setQuery("");
                    setDepartment("Semua jurusan");
                  }}
                  type="button"
                >
                  Reset filter
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            )}

          {!isLoading && !isError && filteredLaboratories.length > 0 && (
            <div className="space-y-5">
              {filteredLaboratories.map((lab, index) => (
                <div
                  className={`availability-delay-${Math.min(index + 1, 3)}`}
                  key={lab.id}
                >
                  <LabCard
                    expanded={expandedId === lab.id}
                    lab={lab}
                    onToggle={() =>
                      setExpandedId((current) =>
                        current === lab.id ? null : lab.id,
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border/70 bg-primary py-8 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p className="font-semibold">
            SIPELAB · Poltekkes Kemenkes Tasikmalaya
          </p>
          <p className="text-xs text-primary-foreground/70">
            Informasi publik laboratorium untuk civitas akademika dan pengunjung.
          </p>
        </div>
      </footer>
    </div>
  );
}