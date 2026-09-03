import type { FormEvent } from "react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { createTenant } from "@/lib/session";
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

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [nif, setNif] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      await createTenant({ name, nif });
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
      toast({
        title: "Corretora registada",
        description: "A carteira começa vazia. Sem dados de demonstração.",
      });
      setLocation("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não foi possível criar a corretora",
        description:
          err instanceof Error
            ? err.message
            : "Verifique o NIF e tente novamente.",
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
            <Building2 className="h-5 w-5 text-primary" />
            Registar corretora
          </CardTitle>
          <CardDescription>
            Onboarding sem dados fictícios. Indique o nome legal e o NIF
            angolano (colectivo: 10 dígitos; particular: 9 dígitos + 2 letras +
            3 dígitos).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da corretora</Label>
              <Input
                id="name"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mediação de Seguros, Lda."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nif">NIF</Label>
              <Input
                id="nif"
                required
                value={nif}
                onChange={(event) => setNif(event.target.value.toUpperCase())}
                placeholder="5410098872"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "A criar…" : "Criar corretora"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
