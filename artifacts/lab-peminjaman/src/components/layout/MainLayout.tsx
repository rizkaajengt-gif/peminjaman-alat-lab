import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLogout } from "@workspace/api-client-react";
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
  BellRing,
  FlaskConical,
  BookOpenCheck,
  Building2,
  PackageSearch,
  CalendarCheck,
  Beaker,
  ClipboardList,
  Warehouse,
  ChevronRight,
} from "lucide-react";
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

  // Admin group
  { title: "Data Pengguna", href: "/admin/users", icon: Users, roles: ["admin"], group: "Administrasi" },
  { title: "Data Laboratorium", href: "/admin/laboratorium", icon: Building2, roles: ["admin"], group: "Administrasi" },
  { title: "Inventaris Alat & Bahan", href: "/admin/inventaris", icon: Database, roles: ["admin", "plp"], group: "Administrasi" },
  { title: "Verifikasi Pengajuan", href: "/plp/verifikasi", icon: BookOpenCheck, roles: ["admin", "plp"], group: "Administrasi" },
  { title: "Laporan", href: "/admin/laporan", icon: BarChart3, roles: ["admin"], group: "Administrasi" },

  // Mahasiswa/Dosen group
  { title: "Pinjam Alat", href: "/mahasiswa/peminjaman", icon: ClipboardList, roles: ["mahasiswa", "dosen"], group: "Layanan" },
  { title: "Pinjam Ruangan", href: "/mahasiswa/ruangan", icon: CalendarCheck, roles: ["mahasiswa", "dosen"], group: "Layanan" },
  { title: "Minta Bahan", href: "/mahasiswa/permintaan", icon: FlaskConical, roles: ["mahasiswa", "plp", "dosen"], group: "Layanan" },
  { title: "Riwayat Saya", href: "/mahasiswa/riwayat", icon: FileBox, roles: ["mahasiswa", "dosen"], group: "Layanan" },

  // Gudang group
  { title: "Stok & Verifikasi Bahan", href: "/gudang/manajemen", icon: Warehouse, roles: ["gudang", "admin"], group: "Gudang" },
];

const GROUP_LABELS: Record<string, string> = {
  Administrasi: "Administrasi",
  Layanan: "Layanan Mahasiswa",
  Gudang: "Gudang",
};

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

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
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap truncate">
                SIPE<span className="text-primary">LAB</span>
              </span>
            )}
          </div>
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
        <div className="p-3 border-t border-slate-100 shrink-0">
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
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <BellRing size={18} />
            </Button>

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
