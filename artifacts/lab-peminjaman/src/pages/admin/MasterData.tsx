import { useState } from "react";
import { useGetUsers, useGetAlat, useGetBahan, useGetJurusan, useGetLaboratorium } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, MoreHorizontal } from "lucide-react";

export default function MasterData() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Master Data" 
        description="Kelola seluruh entitas inti dalam sistem laboratorium."
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-6 shadow-sm">
          <TabsTrigger value="users" className="rounded-lg px-6 py-2.5 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Pengguna</TabsTrigger>
          <TabsTrigger value="alat" className="rounded-lg px-6 py-2.5 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Inventaris Alat</TabsTrigger>
          <TabsTrigger value="bahan" className="rounded-lg px-6 py-2.5 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Inventaris Bahan</TabsTrigger>
          <TabsTrigger value="lab" className="rounded-lg px-6 py-2.5 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Laboratorium</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="alat"><AlatTab /></TabsContent>
        <TabsContent value="bahan">
           <Card className="p-12 text-center text-muted-foreground border-dashed border-2">Panel Bahan (Under Construction)</Card>
        </TabsContent>
        <TabsContent value="lab">
           <Card className="p-12 text-center text-muted-foreground border-dashed border-2">Panel Laboratorium (Under Construction)</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useGetUsers({ search });

  return (
    <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Cari nama atau email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
        <Button className="h-11 rounded-xl shadow-md bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Tambah User
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700 h-12">Nama Lengkap</TableHead>
              <TableHead className="font-semibold text-slate-700">Peran</TableHead>
              <TableHead className="font-semibold text-slate-700">Jurusan</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : users?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Tidak ada data ditemukan</TableCell></TableRow>
            ) : (
              users?.map((u) => (
                <TableRow key={u.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{u.nama}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>{u.jurusan?.nama || '-'}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary rounded-lg"><MoreHorizontal className="w-5 h-5" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function AlatTab() {
  const { data: alat, isLoading } = useGetAlat({});

  return (
    <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
      <div className="p-6 border-b border-slate-100 flex justify-between">
        <h3 className="font-semibold text-lg">Daftar Alat Laboratorium</h3>
        <Button className="rounded-xl shadow-md"><Plus className="w-4 h-4 mr-2" /> Tambah Alat</Button>
      </div>
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow className="border-slate-100">
            <TableHead>Kode</TableHead>
            <TableHead>Nama Alat</TableHead>
            <TableHead>Laboratorium</TableHead>
            <TableHead>Kondisi</TableHead>
            <TableHead className="text-right">Stok (Tersedia)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>}
          {alat?.map(a => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-xs">{a.kode}</TableCell>
              <TableCell className="font-medium">{a.nama}</TableCell>
              <TableCell>{a.laboratorium?.nama}</TableCell>
              <TableCell><span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs">{a.kondisi.replace('_',' ')}</span></TableCell>
              <TableCell className="text-right font-semibold">{a.stok} ({a.stokTersedia}) {a.satuan}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
