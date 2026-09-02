import { useListPolicies } from "@workspace/api-client-react";
import { formatKwanza, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCcw, Send, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Renewals() {
  const { data: policies, isLoading } = useListPolicies({ status: 'renewal' });

  // Mock processing logic since there's no endpoint for it in the schema directly
  const processRenewal = () => {
    alert("Funcionalidade de processamento simulada - necessita endpoint.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Renovações</h2>
        <p className="text-muted-foreground">Acompanhamento e processamento de apólices a expirar.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">A Expirar em 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{policies?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Apólices necessitam de ação</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prémio de Renovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatKwanza(policies?.reduce((sum, p) => sum + p.premium, 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total projetado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissão Projetada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatKwanza(policies?.reduce((sum, p) => sum + p.commission, 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Se 100% renovarem</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-warning text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Requer Ação Imediata
          </div>
          <Button variant="outline" size="sm" onClick={processRenewal}>
            <Send className="mr-2 h-4 w-4" /> Enviar Avisos
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Cliente & Apólice</TableHead>
              <TableHead>Seguradora / Ramo</TableHead>
              <TableHead>Fim de Vigência</TableHead>
              <TableHead className="text-right">Prémio de Renovação</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  A carregar dados...
                </TableCell>
              </TableRow>
            ) : policies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarClock className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Não há apólices a expirar</p>
                    <p className="text-sm">A sua carteira está totalmente regularizada.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              policies?.map((policy) => (
                <TableRow key={policy.id} className="group">
                  <TableCell>
                    <div className="font-medium">{policy.clientName}</div>
                    <div className="font-mono text-sm text-muted-foreground">{policy.number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{policy.insurer}</div>
                    <div className="text-xs text-muted-foreground uppercase">{policy.type}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning" className="mb-1">{formatDate(policy.endDate)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatKwanza(policy.premium)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={processRenewal} className="text-primary hover:text-primary hover:bg-primary/10">
                      <RefreshCcw className="mr-2 h-4 w-4" /> Processar
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
