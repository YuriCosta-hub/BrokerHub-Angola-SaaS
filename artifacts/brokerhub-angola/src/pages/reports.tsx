import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, PieChart, BarChart } from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { formatKwanza } from "@/lib/utils";

export default function Reports() {
  const { data: summary } = useGetDashboardSummary();

  const handleDownload = () => {
    alert("Funcionalidade de exportação Excel/PDF simulada.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Análise de produção, comissões e estado da carteira.</p>
        </div>
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar Tudo
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={handleDownload}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" /> Distribuição de Carteira
            </CardTitle>
            <CardDescription>Resumo por ramo e seguradora</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Apólices</span>
                <span className="font-medium">{summary?.activePolicies || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volume de Prémios</span>
                <span className="font-medium">{formatKwanza(summary?.portfolioValue || 0)}</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary">Gerar Relatório</Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={handleDownload}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" /> Mapa de Comissões
            </CardTitle>
            <CardDescription>Produção e corretagem gerada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comissões (Mês)</span>
                <span className="font-medium text-green-600">{formatKwanza(summary?.commissionValue || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Média</span>
                <span className="font-medium">12.5%</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary">Gerar Relatório</Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={handleDownload}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> Sinistralidade
            </CardTitle>
            <CardDescription>Rácio de sinistros por prémio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sinistros Abertos</span>
                <span className="font-medium">{summary?.openClaims || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rácio (YTD)</span>
                <span className="font-medium text-warning">48%</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary">Gerar Relatório</Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 bg-muted/30 p-8 rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <BarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Motor de Relatórios Avançados</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          O módulo avançado de reporting permite criar vistas customizadas, cruzar dados com seguradoras e gerar dashboards em PDF.
        </p>
        <Button className="mt-6">Explorar Módulo Avançado</Button>
      </div>
    </div>
  );
}
