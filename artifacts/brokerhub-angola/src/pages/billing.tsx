import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { apiJson } from "@/lib/session";
import { useI18n } from "@/i18n";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Billing = {
  status: string;
  plan: string;
  currentPeriodEnd: string;
  stripeEnabled: boolean;
  multicaixaReference: string | null;
};

export default function Billing() {
  const { t } = useI18n();
  const { data: me } = useMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const billing = useQuery({
    queryKey: ["billing"],
    queryFn: () => apiJson<Billing>("/api/billing"),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (params.get("stripe") !== "success" || !sessionId) return;
    void apiJson("/api/billing/stripe/confirm", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["billing"] }))
      .catch((err: unknown) => {
        toast({
          variant: "destructive",
          title: err instanceof Error ? err.message : "Stripe",
        });
      });
  }, [queryClient, toast]);

  const multicaixa = useMutation({
    mutationFn: () =>
      apiJson<{ reference: string; entity: string }>("/api/billing/multicaixa", {
        method: "POST",
        body: JSON.stringify({ plan: "monthly" }),
      }),
    onSuccess: (data) => {
      toast({
        title: "Referência Multicaixa",
        description: `Entidade ${data.entity} · Ref. ${data.reference}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: err.message }),
  });

  const stripe = useMutation({
    mutationFn: () =>
      apiJson<{ url: string }>("/api/billing/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "monthly" }),
      }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: err.message }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.billing.title}</h2>
        <p className="text-muted-foreground">
          Mensal, semestral ou anual em AOA. Residência de facturação na mesma
          topologia da carteira.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Estado
            <Badge>{billing.data?.status ?? me?.subscriptionStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Plano {billing.data?.plan ?? "monthly"} · válido até{" "}
            {billing.data?.currentPeriodEnd
              ? new Date(billing.data.currentPeriodEnd).toLocaleDateString("pt-AO")
              : "—"}
          </p>
          {billing.data?.multicaixaReference && (
            <p className="font-mono text-sm">
              Multicaixa: {billing.data.multicaixaReference}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => multicaixa.mutate()} disabled={multicaixa.isPending}>
              {t.billing.multicaixa}
            </Button>
            <Button
              variant="outline"
              onClick={() => stripe.mutate()}
              disabled={stripe.isPending || billing.data?.stripeEnabled === false}
            >
              {t.billing.stripe}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
