import { 
  useGetDashboardSummary, 
  useListActivities 
} from "@workspace/api-client-react";
import { formatKwanza } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, ShieldAlert, TrendingUp, Activity as ActivityIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: isLoadingActivities } = useListActivities({ limit: 5 });

  const metrics = [
    {
      title: "Clientes Activos",
      value: summary?.activeClients || 0,
      icon: Users,
      trend: "+12% este mês",
    },
    {
      title: "Apólices Ativas",
      value: summary?.activePolicies || 0,
      icon: FileText,
      trend: `${summary?.renewalsThisMonth || 0} renovações`,
    },
    {
      title: "Volume da Carteira",
      value: summary?.portfolioValue ? formatKwanza(summary.portfolioValue) : formatKwanza(0),
      icon: TrendingUp,
      trend: "Total em prémios",
    },
    {
      title: "Sinistros Abertos",
      value: summary?.openClaims || 0,
      icon: ShieldAlert,
      trend: "-2 desde ontem",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.trend}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Composição da Carteira</CardTitle>
            <CardDescription>
              Distribuição de apólices por ramo (Agosto 2024)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-4">
            {isLoadingSummary ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <div className="space-y-6">
                {summary?.policyMix?.map((mix) => (
                  <div key={mix.type} className="flex items-center">
                    <div className="w-24 text-sm font-medium">
                      {mix.type === 'auto' && 'Automóvel'}
                      {mix.type === 'health' && 'Saúde'}
                      {mix.type === 'property' && 'Multirriscos'}
                      {mix.type === 'accident' && 'A. de Trabalho'}
                      {mix.type === 'life' && 'Vida'}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${mix.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm text-muted-foreground ml-4">
                      {mix.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações da sua equipa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${activity.tone === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                      ${activity.tone === 'green' ? 'bg-green-100 text-green-700' : ''}
                      ${activity.tone === 'red' ? 'bg-red-100 text-red-700' : ''}
                      ${activity.tone === 'orange' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${activity.tone === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                    `}>
                      {activity.initials}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(activity.timestamp).toLocaleString('pt-AO', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
