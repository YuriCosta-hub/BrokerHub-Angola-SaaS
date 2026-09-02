import { useState } from "react";
import { useListPolicies, getListPoliciesQueryKey, useCreatePolicy, useListClients } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { formatKwanza, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, SearchX, FileText, Filter, Car, Stethoscope, Briefcase, Activity, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Policies() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<any>(undefined);
  const { toast } = useToast();

  const { data: policies, isLoading } = useListPolicies({ search: debouncedSearch, status: statusFilter });
  const { data: clients } = useListClients();
  const createPolicy = useCreatePolicy();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    insurer: "ENSA",
    type: "auto" as "auto" | "health" | "accident" | "property" | "life",
    premium: 0,
    commission: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  // Handle Search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPolicy.mutate({ data: formData }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListPoliciesQueryKey({ search: debouncedSearch, status: statusFilter }) });
        toast({ title: "Apólice criada com sucesso", description: "A nova apólice foi registada no sistema." });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Erro ao criar apólice", description: err.message || "Verifique os dados inseridos." });
      }
    });
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'auto': return <Car className="h-4 w-4 text-blue-600" />;
      case 'health': return <Stethoscope className="h-4 w-4 text-green-600" />;
      case 'accident': return <Activity className="h-4 w-4 text-red-600" />;
      case 'property': return <Briefcase className="h-4 w-4 text-orange-600" />;
      case 'life': return <Shield className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPolicyTypeLabel = (type: string) => {
    switch (type) {
      case 'auto': return 'Automóvel';
      case 'health': return 'Saúde';
      case 'accident': return 'A. de Trabalho';
      case 'property': return 'Multirriscos';
      case 'life': return 'Vida';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Activa</Badge>;
      case 'renewal': return <Badge variant="warning">Em Renovação</Badge>;
      case 'expired': return <Badge variant="destructive">Expirada</Badge>;
      case 'cancelled': return <Badge variant="outline">Cancelada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Apólices</h2>
          <p className="text-muted-foreground">Gestão de carteira e apólices emitidas.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Nova Apólice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Nova Apólice</DialogTitle>
                <DialogDescription>
                  Registe uma nova apólice de seguro associada a um cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Cliente Segurado</Label>
                  <Select value={formData.clientId} onValueChange={(val: string) => setFormData({...formData, clientId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pesquise o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name} (NIF: {client.nif})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="insurer">Seguradora</Label>
                    <Select value={formData.insurer} onValueChange={(val: string) => setFormData({...formData, insurer: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seguradora..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENSA">ENSA Seguros de Angola</SelectItem>
                        <SelectItem value="NOSSO Seguros">NOSSO Seguros</SelectItem>
                        <SelectItem value="Sanlam Angola">Sanlam Angola</SelectItem>
                        <SelectItem value="Fidelidade Angola">Fidelidade Angola</SelectItem>
                        <SelectItem value="BIC Seguros">BIC Seguros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Ramo</Label>
                    <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ramo de seguro..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automóvel</SelectItem>
                        <SelectItem value="health">Saúde</SelectItem>
                        <SelectItem value="property">Multirriscos</SelectItem>
                        <SelectItem value="accident">Acidentes de Trabalho</SelectItem>
                        <SelectItem value="life">Vida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="premium">Prémio (AOA)</Label>
                    <Input id="premium" type="number" min="0" step="0.01" required value={formData.premium || ''} onChange={e => setFormData({...formData, premium: Number(e.target.value)})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="commission">Comissão (AOA)</Label>
                    <Input id="commission" type="number" min="0" step="0.01" required value={formData.commission || ''} onChange={e => setFormData({...formData, commission: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input id="startDate" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input id="endDate" type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={createPolicy.isPending || !formData.clientId}>
                  {createPolicy.isPending ? "A processar..." : "Registar Apólice"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nº, cliente ou NIF..." 
              className="pl-9 bg-background w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="renewal">Em Renovação</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[120px]">Apólice / Ramo</TableHead>
              <TableHead>Cliente & Seguradora</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead className="text-right">Prémio Total</TableHead>
              <TableHead className="w-[120px] text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  A carregar apólices...
                </TableCell>
              </TableRow>
            ) : policies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <SearchX className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhuma apólice encontrada</p>
                    <p className="text-sm">Tente ajustar os seus filtros de pesquisa.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              policies?.map((policy) => (
                <TableRow key={policy.id} className="cursor-pointer group">
                  <TableCell>
                    <div className="font-mono font-semibold text-sm mb-1">{policy.number}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getPolicyIcon(policy.type)}
                      {getPolicyTypeLabel(policy.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{policy.clientName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span className="font-medium text-foreground">{policy.insurer}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(policy.startDate)}</div>
                    <div className="text-xs text-muted-foreground">Até {formatDate(policy.endDate)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{formatKwanza(policy.premium)}</div>
                    <div className="text-xs text-muted-foreground text-green-600 font-medium">Comissão: {formatKwanza(policy.commission)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(policy.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
