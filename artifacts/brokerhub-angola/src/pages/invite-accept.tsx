import { useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { apiJson } from "@/lib/session";
import { meQueryKey } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function InviteAccept() {
  const [, setLocation] = useLocation();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      await apiJson("/api/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
      toast({ title: "Convite aceite" });
      setLocation("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não foi possível aceitar o convite",
        description: err instanceof Error ? err.message : "Token inválido",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Aceitar convite
          </CardTitle>
          <CardDescription>
            Entre com a mesma conta de email para a qual o convite foi enviado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              Entrar na corretora
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
