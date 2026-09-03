import { useQuery } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import { FileText, ShieldAlert, LogOut } from "lucide-react";
import { apiJson } from "@/lib/session";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PortalPolicy = {
  id: string;
  number: string;
  insurer: string;
  type: string;
  status: string;
  endDate: string;
  premium: number;
};

type PortalClaim = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  policyNumber: string;
};

type PortalDocument = {
  id: string;
  fileName: string;
  sizeBytes: number;
};

export default function Portal() {
  const { t } = useI18n();
  const { signOut } = useClerk();
  const policies = useQuery({
    queryKey: ["portal-policies"],
    queryFn: () => apiJson<PortalPolicy[]>("/api/portal/policies"),
  });
  const claims = useQuery({
    queryKey: ["portal-claims"],
    queryFn: () => apiJson<PortalClaim[]>("/api/portal/claims"),
  });
  const documents = useQuery({
    queryKey: ["portal-documents"],
    queryFn: () => apiJson<PortalDocument[]>("/api/portal/documents"),
  });

  return (
    <div className="min-h-[100dvh] bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">{t.portal.title}</h1>
        <Button variant="ghost" onClick={() => signOut({ redirectUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          {t.nav.signOut}
        </Button>
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 p-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> {t.portal.policies}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(policies.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{t.portal.empty}</p>
            )}
            {(policies.data ?? []).map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{policy.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {policy.insurer} · {policy.type} · {policy.endDate}
                  </p>
                </div>
                <Badge>{policy.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> {t.portal.claims}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(claims.data ?? []).map((claim) => (
              <div key={claim.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{claim.reference}</p>
                <p className="text-muted-foreground">
                  {claim.policyNumber} · {claim.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.portal.documents}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(documents.data ?? []).map((doc) => (
              <a
                key={doc.id}
                className="block text-primary underline"
                href={`/api/documents/${doc.id}/file`}
              >
                {doc.fileName}
              </a>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
