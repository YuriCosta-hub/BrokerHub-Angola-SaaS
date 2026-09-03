import { useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { grantConsent } from "@/lib/session";
import { meQueryKey } from "@/hooks/use-me";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Consent() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [marketing, setMarketing] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      await grantConsent({ purpose: "privacy_notice" });
      if (marketing) {
        await grantConsent({ purpose: "marketing" });
      }
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
      const next = params.get("next");
      setLocation(
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/dashboard",
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: t.consent.title,
        description: err instanceof Error ? err.message : t.consent.body,
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
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t.consent.title}
          </CardTitle>
          <CardDescription>{t.consent.body}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
              />
              {t.consent.marketing}
            </label>
            <Button type="submit" className="w-full" disabled={pending}>
              {t.consent.accept}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
