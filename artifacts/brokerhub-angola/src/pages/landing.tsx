import { Link } from "wouter";
import { ShieldAlert, ArrowRight, Activity, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight text-primary">BrokerHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#vantagens" className="hover:text-primary transition-colors">Vantagens</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-semibold">Entrar</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-semibold">Começar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-24 md:py-32 lg:py-40 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              CRM para Mediação de Seguros em Angola
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
              A sua corretora,<br/> 
              <span className="text-primary">mais rápida e inteligente.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              O BrokerHub centraliza clientes, apólices, sinistros e comissões num único sistema feito à medida para o mercado angolano. 
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                  Criar conta gratuita
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-semibold border-2">
                  Agendar demonstração
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Controlo total da sua carteira</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Tudo o que uma corretora de seguros necessita para operar com eficiência e não perder nenhuma renovação.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-muted/50 border hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Gestão de Clientes</h3>
                <p className="text-muted-foreground">Visão 360º de cada cliente, seja particular ou empresa. NIF, contactos e histórico de apólices integrados.</p>
              </div>
              <div className="p-8 rounded-2xl bg-muted/50 border hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Apólices e Renovações</h3>
                <p className="text-muted-foreground">Monitorização de datas de fim, alertas de renovação e registo detalhado de prémios e comissões (Kz).</p>
              </div>
              <div className="p-8 rounded-2xl bg-muted/50 border hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Sinistros em Tempo Real</h3>
                <p className="text-muted-foreground">Acompanhe a evolução de cada participação de sinistro e reduza o tempo de resposta junto da seguradora.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-foreground py-12 text-muted">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4 text-white">
              <ShieldAlert className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight">BrokerHub</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              O CRM feito para corretoras e mediadores de seguros em Angola. Desenvolvido para simplificar a gestão operacional diária.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Funcionalidades</li>
              <li>Preços</li>
              <li>Segurança</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Termos de Uso</li>
              <li>Privacidade</li>
              <li>Contactos</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
