import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "./lib/auth-context";
import { MainLayout } from "./components/layout/MainLayout";

import Landing from "./pages/public/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardHome from "./pages/dashboard/Home";

import AdminUsers from "./pages/admin/Users";
import AdminLaboratorium from "./pages/admin/Laboratorium";
import AdminInventaris from "./pages/admin/Inventaris";
import AdminLaporan from "./pages/admin/Laporan";
import AdminJurusan from "./pages/admin/Jurusan";
import AdminPenugasanPlp from "./pages/admin/PenugasanPlp";

import FormPeminjaman from "./pages/mahasiswa/Peminjaman";
import PeminjamanRuangan from "./pages/mahasiswa/PeminjamanRuangan";
import PermintaanBahan from "./pages/mahasiswa/PermintaanBahan";
import Riwayat from "./pages/mahasiswa/Riwayat";
import JadwalRuangan from "./pages/mahasiswa/JadwalRuangan";

import PlpVerifikasi from "./pages/plp/VerifikasiLengkap";
import PlpLaporan from "./pages/plp/Laporan";
import PlpRiwayatPengembalian from "./pages/plp/RiwayatPengembalian";
import PlpStokLab from "./pages/plp/StokLab";
import GudangManajemen from "./pages/gudang/ManajemenBahan";
import AdminNotifikasi from "./pages/admin/Notifikasi";

import PeminjamanPhantom from "./pages/mahasiswa/PeminjamanPhantom";
import PrintPermintaan from "./pages/shared/PrintPermintaan";
import PrintPeminjaman from "./pages/shared/PrintPeminjaman";
import PrintPeminjamanPhantom from "./pages/shared/PrintPeminjamanPhantom";
import Profil from "./pages/profil/Profil";

import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30000 } }
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Redirect to="/dashboard" />;
  return <MainLayout><Component /></MainLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Print views - no sidebar */}
      <Route path="/print/permintaan-bahan/:id" component={PrintPermintaan} />
      <Route path="/print/peminjaman-alat/:id" component={PrintPeminjaman} />
      <Route path="/print/peminjaman-phantom/:id" component={PrintPeminjamanPhantom} />

      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardHome} />}</Route>

      {/* Admin */}
      <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsers} roles={["admin"]} />}</Route>
      <Route path="/admin/jurusan">{() => <ProtectedRoute component={AdminJurusan} roles={["admin"]} />}</Route>
      <Route path="/admin/laboratorium">{() => <ProtectedRoute component={AdminLaboratorium} roles={["admin"]} />}</Route>
      <Route path="/admin/inventaris">{() => <ProtectedRoute component={AdminInventaris} roles={["admin", "plp"]} />}</Route>
      <Route path="/admin/plp-penugasan">{() => <ProtectedRoute component={AdminPenugasanPlp} roles={["admin"]} />}</Route>
      <Route path="/admin/laporan">{() => <ProtectedRoute component={AdminLaporan} roles={["admin"]} />}</Route>
      <Route path="/admin/notifikasi">{() => <ProtectedRoute component={AdminNotifikasi} roles={["admin"]} />}</Route>

      {/* Mahasiswa / Dosen */}
      <Route path="/mahasiswa/peminjaman">{() => <ProtectedRoute component={FormPeminjaman} roles={["mahasiswa", "dosen"]} />}</Route>
      <Route path="/mahasiswa/ruangan">{() => <ProtectedRoute component={PeminjamanRuangan} roles={["mahasiswa", "dosen"]} />}</Route>
      <Route path="/mahasiswa/permintaan">{() => <ProtectedRoute component={PermintaanBahan} roles={["mahasiswa", "plp", "dosen"]} />}</Route>
      <Route path="/mahasiswa/phantom">{() => <ProtectedRoute component={PeminjamanPhantom} roles={["mahasiswa", "dosen", "plp"]} />}</Route>
      <Route path="/mahasiswa/riwayat">{() => <ProtectedRoute component={Riwayat} roles={["mahasiswa", "dosen"]} />}</Route>
      <Route path="/jadwal-ruangan">{() => <ProtectedRoute component={JadwalRuangan} roles={["mahasiswa", "dosen", "plp", "admin"]} />}</Route>

      {/* PLP */}
      <Route path="/plp/pengembalian">{() => <ProtectedRoute component={PlpRiwayatPengembalian} roles={["plp", "admin"]} />}</Route>
      <Route path="/plp/stok">{() => <ProtectedRoute component={PlpStokLab} roles={["plp"]} />}</Route>
      <Route path="/plp/verifikasi">{() => <ProtectedRoute component={PlpVerifikasi} roles={["plp", "admin"]} />}</Route>
      <Route path="/plp/inventaris">{() => <ProtectedRoute component={AdminInventaris} roles={["plp"]} />}</Route>
      <Route path="/plp/permintaan">{() => <ProtectedRoute component={GudangManajemen} roles={["plp"]} />}</Route>
      <Route path="/plp/laporan">{() => <ProtectedRoute component={PlpLaporan} roles={["plp"]} />}</Route>

      {/* Gudang */}
      <Route path="/gudang/manajemen">{() => <ProtectedRoute component={GudangManajemen} roles={["gudang", "admin"]} />}</Route>

      {/* Profil (semua role) */}
      <Route path="/profil">{() => <ProtectedRoute component={Profil} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
