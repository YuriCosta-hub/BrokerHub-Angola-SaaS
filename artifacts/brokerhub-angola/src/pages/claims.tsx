import * as React from "react";
import { useState } from "react";
import { useListClaims, getListClaimsQueryKey, useCreateClaim, useListPolicies } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { formatKwanza, formatDate, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, SearchX, Filter, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Claims() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<any>(undefined);
  const { toast } = useToast();

  const { data: claims, isLoading } = useListClaims({ search: debouncedSearch, status: statusFilter });
  const { data: policies } = useListPolicies();
  const createClaim = useCreateClaim();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    policyId: "",
    type: "Colisão Automóvel",
    amount: 0,
    description: "",
  });

  // Handle Search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createClaim.mutate({ data: formData }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListClaimsQueryKey({ search: debouncedSearch, status: statusFilter }) });
        toast({ title: "Sinistro participado", description: "O novo sinistro foi registado." });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Erro na participação", description: err.message || "Verifique os dados inseridos." });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="warning"><AlertTriangle className="mr-1 h-3 w-3"/>Aberto</Badge>;
      case 'in_review': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>Em Análise</Badge>;
      case 'approved': return <Badge variant="info"><CheckCircle2 className="mr-1 h-3 w-3"/>Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejeitado</Badge>;
      case 'paid': return <Badge variant="success">Pago</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sinistros</h2>
          <p className="text-muted-foreground">Participações de sinistros e acompanhamento.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Participar Sinistro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Participação de Sinistro</DialogTitle>
                <DialogDescription>
                  Registe uma nova participação de sinistro para um cliente/apólice existente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="policy">Apólice Afetada</Label>
                  <Select value={formData.policyId} onValueChange={(val: string) => setFormData({...formData, policyId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pesquise a apólice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {policies?.map(policy => (
                        <SelectItem key={policy.id} value={policy.id}>{policy.number} - {policy.clientName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo de Sinistro</Label>
                    <Input id="type" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="Ex: Colisão Automóvel" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Valor Estimado (AOA)</Label>
                    <Input id="amount" type="number" min="0" step="0.01" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição da Ocorrência</Label>
                  <Textarea 
                    id="description" 
                    required 
                    className="min-h-[120px]"
                    placeholder="Descreva detalhadamente o que ocorreu..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={createClaim.isPending || !formData.policyId}>
                  {createClaim.isPending ? "A registar..." : "Registar Participação"}
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
              placeholder="Pesquisar por referência ou apólice..." 
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
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_review">Em Análise</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[140px]">Ref. Sinistro</TableHead>
              <TableHead>Apólice / Cliente</TableHead>
              <TableHead>Ocorrência</TableHead>
              <TableHead className="text-right">Valor Estimado</TableHead>
              <TableHead className="text-center w-[140px]">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  A carregar sinistros...
                </TableCell>
              </TableRow>
            ) : claims?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <SearchX className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum sinistro encontrado</p>
                    <p className="text-sm">Tente ajustar os seus filtros de pesquisa.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              claims?.map((claim) => (
                <TableRow key={claim.id} className="cursor-pointer group">
                  <TableCell>
                    <div className="font-mono font-semibold text-sm mb-1">{claim.reference}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(claim.createdAt).split(',')[0]}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-foreground">{claim.policyNumber}</div>
                    <div className="font-medium mt-0.5">{claim.clientName}</div>
                    <div className="text-xs text-muted-foreground">{claim.insurer}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{claim.type}</div>
                    <div className="text-xs text-destructive font-medium mt-1">Aberto há {claim.daysOpen} dias</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatKwanza(claim.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(claim.status)}
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
