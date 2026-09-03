import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Mail, UserPlus } from "lucide-react";
import { apiJson } from "@/lib/session";
import { useI18n } from "@/i18n";
import { useToast } from "@/hooks/use-toast";
import { useMe } from "@/hooks/use-me";

type MemberRow = {
  id: string;
  email: string | null;
  role: string;
  clerkUserId: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
};

export default function Team() {
  const { t } = useI18n();
  const { data: me } = useMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "broker_master" | "client">("agent");
  const [clientId, setClientId] = useState("");
  const [lastToken, setLastToken] = useState<string | null>(null);

  const members = useQuery({
    queryKey: ["members"],
    queryFn: () => apiJson<MemberRow[]>("/api/members"),
  });
  const invites = useQuery({
    queryKey: ["invites"],
    queryFn: () => apiJson<InviteRow[]>("/api/invites"),
  });

  const invite = useMutation({
    mutationFn: () =>
      apiJson<{ token: string }>("/api/invites", {
        method: "POST",
        body: JSON.stringify({
          email,
          role,
          clientId: role === "client" ? clientId : undefined,
        }),
      }),
    onSuccess: (data) => {
      setLastToken(data.token);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["invites"] });
      toast({
        title: "Convite criado",
        description: "Copie o token. Não será mostrado outra vez.",
      });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: err.message }),
  });

  const handleInvite = (event: FormEvent) => {
    event.preventDefault();
    invite.mutate();
  };

  const canInvite =
    me?.role === "broker_master" || me?.role === "super_admin";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.nav.team}</h2>
          <p className="text-muted-foreground">
            Convites reais por email. O token só é visível no momento da criação.
          </p>
        </div>
        {canInvite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> {t.team.invite}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{t.team.invite}</DialogTitle>
                  <DialogDescription>
                    O convidado deve criar conta Clerk com o mesmo email.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t.team.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t.team.role}</Label>
                  <Select
                    value={role}
                    onValueChange={(value) =>
                      setRole(value as "agent" | "broker_master" | "client")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Mediador</SelectItem>
                      <SelectItem value="broker_master">Master</SelectItem>
                      <SelectItem value="client">Tomador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {role === "client" && (
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">ID do cliente</Label>
                    <Input
                      id="clientId"
                      required
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                    />
                  </div>
                )}
                <Button type="submit" disabled={invite.isPending}>
                  Enviar convite
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {lastToken && (
        <Card>
          <CardHeader>
            <CardTitle>Token do convite</CardTitle>
            <CardDescription>
              Partilhe `/convite?token=...` por canal seguro. Não fica guardado em claro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block break-all rounded bg-muted p-3 text-xs">
              {`${window.location.origin}/convite?token=${lastToken}`}
            </code>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(members.data ?? []).map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email ?? member.clerkUserId}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.role === "broker_master" || member.role === "super_admin" ? (
                      <Badge>
                        <Shield className="mr-1 h-3 w-3" /> {member.role}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{member.role}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invites.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
