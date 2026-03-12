import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLogout, customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Database,
  CalendarDays,
  FileBox,
  Newspaper,
  BarChart3,
  Menu,
  LogOut,
  ChevronDown,
  FlaskConical,
  BookOpenCheck,
  Building2,
  PackageSearch,
  CalendarCheck,
  Beaker,
  ClipboardList,
  Warehouse,
  ChevronRight,
  GraduationCap,
  UserCog,
  BellRing,
  UserCircle,
  Package,
} from "lucide-react";
import { useGetStatistik } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "mahasiswa", "plp", "gudang", "dosen"] },

  // Admin group - Master Data
  { title: "Data Pengguna", href: "/admin/users", icon: Users, roles: ["admin"], group: "Master Data" },
  { title: "Data Jurusan", href: "/admin/jurusan", icon: GraduationCap, roles: ["admin"], group: "Master Data" },
  { title: "Data Laboratorium", href: "/admin/laboratorium", icon: Building2, roles: ["admin"], group: "Master Data" },
  { title: "Penugasan PLP", href: "/admin/plp-penugasan", icon: UserCog, roles: ["admin"], group: "Master Data" },

  // Admin group - Operasional
  { title: "Inventaris Alat & Bahan", href: "/admin/inventaris", icon: Database, roles: ["admin", "plp"], group: "Operasional" },
  { title: "Verifikasi Pengajuan", href: "/plp/verifikasi", icon: BookOpenCheck, roles: ["admin", "plp"], group: "Operasional" },
  { title: "Riwayat & Pengembalian", href: "/plp/riwayat-pengembalian", icon: FileBox, roles: ["plp", "admin"], group: "Operasional" },
  { title: "Laporan & Statistik", href: "/admin/laporan", icon: BarChart3, roles: ["admin"], group: "Operasional" },
  { title: "Kirim Notifikasi", href: "/admin/notifikasi", icon: BellRing, roles: ["admin"], group: "Operasional" },
  { title: "Laporan Lab Saya", href: "/plp/laporan", icon: BarChart3, roles: ["plp"], group: "Operasional" },
  { title: "Stok Lab & Transfer", href: "/plp/stok-lab", icon: Package, roles: ["plp"], group: "Operasional" },

  // Mahasiswa/Dosen group
  { title: "Pinjam Alat", href: "/mahasiswa/peminjaman", icon: ClipboardList, roles: ["mahasiswa", "dosen"], group: "Layanan" },
  { title: "Pinjam Ruangan", href: "/mahasiswa/ruangan", icon: CalendarCheck, roles: ["mahasiswa", "dosen"], group: "Layanan" },
  { title: "Jadwal Ruangan", href: "/jadwal-ruangan", icon: CalendarDays, roles: ["mahasiswa", "dosen", "plp", "admin"], group: "Layanan" },
  { title: "Minta Bahan", href: "/mahasiswa/permintaan", icon: FlaskConical, roles: ["mahasiswa", "plp", "dosen"], group: "Layanan" },
  { title: "Riwayat Saya", href: "/mahasiswa/riwayat", icon: FileBox, roles: ["mahasiswa", "dosen"], group: "Layanan" },

  // Gudang group
  { title: "Stok & Verifikasi Bahan", href: "/gudang/manajemen", icon: Warehouse, roles: ["gudang", "admin"], group: "Gudang" },
];

const GROUP_LABELS: Record<string, string> = {
  "Master Data": "Master Data",
  Operasional: "Operasional",
  Layanan: "Layanan",
  Gudang: "Gudang",
};

function NotifikasiBell({ role, stats }: { role: string; stats: any }) {
  const { data: notifikasi } = useQuery({
    queryKey: ["/api/notifikasi"],
    queryFn: () => customFetch("/api/notifikasi"),
    refetchInterval: 60000,
  });
  const list = (notifikasi as any[]) || [];
  const pendingVerif = (["admin", "plp"].includes(role)) ? ((stats?.peminjamanAlatMenunggu || 0) + (stats?.peminjamanRuanganMenunggu || 0)) : 0;
  const totalBadge = list.length + pendingVerif;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
          <BellRing size={18} />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl" align="end">
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Notifikasi</span>
        </div>
        <ScrollArea className="max-h-72">
          {(["admin", "plp"].includes(role)) && pendingVerif > 0 && (
            <Link href="/plp/verifikasi">
              <div className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <div>
                    <p className="text-xs font-semibold">Ada {pendingVerif} pengajuan menunggu verifikasi</p>
                    <p className="text-xs text-muted-foreground">Klik untuk ke halaman verifikasi</p>
                  </div>
                </div>
              </div>
            </Link>
          )}
          {list.length === 0 && pendingVerif === 0 && (
            <div className="py-8 text-center text-muted-foreground text-xs">Tidak ada notifikasi</div>
          )}
          {list.map((n: any) => (
            <div key={n.id} className="px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0"></span>
                <div>
                  <p className="text-xs font-semibold">{n.judul}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.pesan}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const { data: stats } = useGetStatistik();

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        toast({ title: "Berhasil logout", description: "Sampai jumpa kembali!" });
        window.location.href = "/";
      },
    },
  });

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const groups = ["", ...Array.from(new Set(filteredNav.map((n) => n.group || "")))].filter(
    (v, i, a) => a.indexOf(v) === i && v !== ""
  );
  const ungrouped = filteredNav.filter((n) => !n.group);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location === item.href || location.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
          isActive
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
            : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        }`}
      >
        <item.icon
          size={18}
          className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}
          strokeWidth={isActive ? 2.5 : 2}
        />
        {isSidebarOpen && <span className="font-medium text-sm truncate">{item.title}</span>}
        {isActive && isSidebarOpen && <ChevronRight size={14} className="ml-auto text-primary-foreground/70" />}
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: isSidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="z-20 hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0">
          {isSidebarOpen ? (
            <img src={`${import.meta.env.BASE_URL}logo-poltekkes.png`} alt="Poltekkes Tasikmalaya" className="h-9 object-contain" />
          ) : (
            <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
              <Building2 size={18} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-0.5">
          {ungrouped.map((item) => <NavLink key={item.href} item={item} />)}

          {groups.map((group) => {
            const items = filteredNav.filter((n) => n.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mt-4">
                {isSidebarOpen && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1.5">{GROUP_LABELS[group] || group}</p>
                )}
                {items.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-2">
          <div className={`flex items-center gap-2 px-2 py-2 bg-slate-50 rounded-xl ${isSidebarOpen ? "" : "justify-center"}`}>
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {user.nama.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user.nama}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <p className="text-[9px] text-center text-slate-300 leading-tight pb-0.5">
              Design by <span className="text-teal-400 font-medium">Rizka Ajeng Trikusumah</span>
            </p>
          )}
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 z-10 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <Menu size={20} />
            </Button>
            <h2 className="font-bold text-base md:text-lg text-foreground hidden sm:block">
              {[...filteredNav].reverse().find((n) => location.startsWith(n.href))?.title || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <NotifikasiBell role={user.role} stats={stats} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 pl-2 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full h-10"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user.nama.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user.nama.split(" ")[0]}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 mb-1 bg-slate-50 rounded-lg mx-2">
                  <p className="text-sm font-semibold">{user.nama}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-primary capitalize font-medium mt-0.5">{user.role}</p>
                </div>
                <Link href="/profil">
                  <DropdownMenuItem className="cursor-pointer mx-2 rounded-lg gap-2">
                    <UserCircle className="h-4 w-4 text-teal-600" />
                    <span>Profil & Keamanan</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer mx-2 mb-1 rounded-lg"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/80 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
