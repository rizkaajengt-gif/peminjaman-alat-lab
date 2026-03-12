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
  Image as ImageIcon,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronDown,
  BellRing,
  FlaskConical,
  BookOpenCheck,
  Building2,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "mahasiswa", "plp", "gudang", "dosen"] },
  { title: "Master Data", href: "/admin/master", icon: Database, roles: ["admin"] },
  { title: "Verifikasi", href: "/plp/verifikasi", icon: BookOpenCheck, roles: ["plp"] },
  { title: "Peminjaman", href: "/mahasiswa/peminjaman", icon: CalendarDays, roles: ["mahasiswa"] },
  { title: "Permintaan Bahan", href: "/mahasiswa/permintaan", icon: FlaskConical, roles: ["mahasiswa"] },
  { title: "Riwayat", href: "/mahasiswa/riwayat", icon: FileBox, roles: ["mahasiswa"] },
  { title: "Stok & Verifikasi", href: "/gudang/manajemen", icon: PackageSearch, roles: ["gudang"] },
  { title: "Publikasi", href: "/admin/publikasi", icon: Newspaper, roles: ["admin", "dosen", "plp"] },
  { title: "Laporan", href: "/admin/laporan", icon: BarChart3, roles: ["admin"] },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        toast({ title: "Berhasil logout", description: "Sampai jumpa kembali!" });
        window.location.href = "/";
      }
    }
  });

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: isSidebarOpen ? 260 : 0 }}
        className="z-20 hidden md:flex flex-col bg-white border-r border-border shrink-0"
      >
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Building2 size={24} strokeWidth={2.5} />
            </div>
            {isSidebarOpen && (
              <span className="font-display font-bold text-lg text-foreground tracking-tight whitespace-nowrap">
                SIPE<span className="text-primary">LAB</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5 custom-scrollbar">
          {filteredNav.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }
              `}>
                <item.icon size={20} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 bg-secondary rounded-xl">
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {user.nama.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.nama}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 glass z-10 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:flex text-muted-foreground hover:text-foreground">
              <Menu size={20} />
            </Button>
            {/* Mobile menu trigger could go here */}
            <h2 className="font-display font-bold text-lg md:text-xl text-foreground hidden sm:block">
              {filteredNav.find(n => location.startsWith(n.href))?.title || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <BellRing size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3 bg-white hover:bg-secondary border border-border/50 rounded-full h-10">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user.nama.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user.nama.split(' ')[0]}</span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 mb-2 bg-secondary rounded-lg mx-2 mt-1">
                  <p className="text-sm font-medium">{user.nama}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-6 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
