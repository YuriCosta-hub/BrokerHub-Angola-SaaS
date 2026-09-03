import { UserProfile } from "@clerk/react";
import { Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MfaRequired() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="mb-8 w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Autenticação de dois factores
          </CardTitle>
          <CardDescription>
            Perfis administrativos e financeiros (Broker Master e Super Admin)
            exigem 2FA. Active TOTP na conta Clerk abaixo e volte a iniciar
            sessão se o factor ainda não estiver verificado.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Depois de configurar o segundo factor, recarregue esta página. O CRM
          só abre quando a sessão Clerk reportar o factor satisfeito.
        </CardContent>
      </Card>
      <UserProfile />
    </div>
  );
}
