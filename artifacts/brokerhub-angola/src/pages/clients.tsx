import { useState } from "react";
import { useListClients, getListClientsQueryKey, useCreateClient } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { formatKwanza, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, SearchX, FileText, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();

  const { data: clients, isLoading } = useListClients({ search: debouncedSearch });
  const createClient = useCreateClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nif: "",
    email: "",
    phone: "",
    type: "individual" as "individual" | "company",
  });

  // Handle Search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate({ data: formData }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ name: "", nif: "", email: "", phone: "", type: "individual" });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey({ search: debouncedSearch }) });
        toast({ title: "Cliente criado com sucesso", description: "O novo cliente foi adicionado à base de dados." });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Erro ao criar cliente", description: err.message || "Verifique os dados inseridos." });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gerencie a sua carteira de clientes, particulares e empresas.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para adicionar um novo cliente à corretora.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Cliente</Label>
                  <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Particular (Singular)</SelectItem>
                      <SelectItem value="company">Empresa (Coletivo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome / Denominação</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nif">NIF</Label>
                    <Input id="nif" required value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending ? "A salvar..." : "Guardar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou NIF..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Cliente</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead className="text-right">Apólices</TableHead>
              <TableHead className="text-right">Prémio Total (AOA)</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  A carregar clientes...
                </TableCell>
              </TableRow>
            ) : clients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <SearchX className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                    <p className="text-sm">Tente ajustar a sua pesquisa.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients?.map((client) => (
                <TableRow key={client.id} className="cursor-pointer group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {client.type === 'company' ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <span className="font-bold text-primary">{client.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{client.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="h-5 text-[10px] uppercase font-mono">NIF: {client.nif}</Badge>
                          {client.status === 'active' && <span className="flex items-center gap-1 text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>Activo</span>}
                          {client.status === 'inactive' && <span className="flex items-center gap-1 text-red-600"><span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>Inativo</span>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.email}</div>
                    <div className="text-sm text-muted-foreground">{client.phone}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{client.policiesCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatKwanza(client.totalPremium)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
