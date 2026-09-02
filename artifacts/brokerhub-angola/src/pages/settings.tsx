import type * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Building, Building2, BellRing, Save } from "lucide-react";

export default function Settings() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Definições guardadas com sucesso.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Ajustes da conta, corretora e preferências de sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Perfil da Corretora
                </CardTitle>
                <CardDescription>
                  Estes dados serão utilizados em recibos, relatórios e comunicações com o cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input id="companyName" defaultValue="BrokerHub Mediadores de Seguros, Lda." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nif">NIF</Label>
                    <Input id="nif" defaultValue="5000000000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="licence">Licença ARSEG</Label>
                    <Input id="licence" defaultValue="MED-0001/24" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Endereço (Sede)</Label>
                  <Input id="address" defaultValue="Rua da Missão, Edifício TTA, Luanda, Angola" />
                </div>
                <Button type="submit" className="mt-4">
                  <Save className="mr-2 h-4 w-4" /> Guardar Perfil
                </Button>
              </CardContent>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" /> Notificações e Alertas
              </CardTitle>
              <CardDescription>
                Configure os alertas automáticos gerados pelo CRM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Alertas de Renovação (30 dias)</h4>
                  <p className="text-sm text-muted-foreground">Será notificado com 30 dias de antecedência.</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Avisos a Clientes</h4>
                  <p className="text-sm text-muted-foreground">Enviar SMS/Email automático para o cliente.</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Relatório Semanal</h4>
                  <p className="text-sm text-muted-foreground">Receber um resumo da produção às Segundas.</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Shield className="h-4 w-4" /> Conta Segura
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-4">
                A sua conta está protegida com os padrões de segurança Clerk. Os seus dados são cifrados em repouso e em trânsito.
              </p>
              <Button variant="outline" className="w-full bg-white">Gerir Segurança</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" /> Seguradoras Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between items-center">
                  <span>ENSA</span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </li>
                <li className="flex justify-between items-center">
                  <span>NOSSO Seguros</span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Sanlam</span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Fidelidade</span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </li>
                <li className="flex justify-between items-center">
                  <span>BIC Seguros</span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </li>
              </ul>
              <Button variant="link" className="w-full mt-4 p-0 h-auto text-primary">Gerir Integrações</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
