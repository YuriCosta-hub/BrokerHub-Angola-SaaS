import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, UserPlus, UserCog } from "lucide-react";
import { useUser } from "@clerk/react";

export default function Team() {
  const { user } = useUser();
  
  const mockTeam = [
    { id: 1, name: user?.fullName || "Utilizador Atual", email: user?.primaryEmailAddress?.emailAddress || "user@brokerhub.co.ao", role: "admin", status: "active" },
    { id: 2, name: "Maria Fernandes", email: "maria.f@brokerhub.co.ao", role: "manager", status: "active" },
    { id: 3, name: "João Silva", email: "joao.s@brokerhub.co.ao", role: "agent", status: "active" },
    { id: 4, name: "Ana Paulo", email: "ana.p@brokerhub.co.ao", role: "agent", status: "offline" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipa</h2>
          <p className="text-muted-foreground">Gestão de acessos, mediadores e permissões.</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Corretora</CardTitle>
          <CardDescription>
            Defina papéis para controlar o acesso à carteira e relatórios financeiros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTeam.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium">{member.name} {member.id === 1 && "(Tu)"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.role === 'admin' && <Badge variant="default"><Shield className="mr-1 h-3 w-3"/> Administrador</Badge>}
                    {member.role === 'manager' && <Badge variant="secondary">Gestor</Badge>}
                    {member.role === 'agent' && <Badge variant="outline">Mediador</Badge>}
                  </TableCell>
                  <TableCell>
                    {member.status === 'active' ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <span className="h-2 w-2 rounded-full bg-green-600"></span> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground"></span> Offline
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" disabled={member.id === 1}>
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
