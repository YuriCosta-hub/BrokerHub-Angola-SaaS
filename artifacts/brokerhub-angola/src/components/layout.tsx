import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldAlert,
  RefreshCcw,
  BarChart3,
  LogOut,
  UsersRound,
  Settings,
  Bell
} from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Apólices", href: "/apolices", icon: FileText },
    { label: "Sinistros", href: "/sinistros", icon: ShieldAlert },
    { label: "Renovações", href: "/renovacoes", icon: RefreshCcw },
    { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  ];

  const adminItems = [
    { label: "Equipa", href: "/equipa", icon: UsersRound },
    { label: "Configurações", href: "/configuracoes", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 w-64 flex-col border-r bg-sidebar text-sidebar-foreground hidden md:flex">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border bg-sidebar-accent/50">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-primary">
            <ShieldAlert className="h-6 w-6" />
            <span>BrokerHub</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
          <div className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
            Operacional
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          <div className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mt-6 mb-2">
            Administração
          </div>
          {adminItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold text-sm">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.fullName || 'Utilizador'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Terminar sessão
          </Button>
        </div>
      </aside>
      <main className="flex-1 md:pl-64 flex flex-col min-h-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
          <h1 className="text-xl font-semibold flex-1 tracking-tight">
            {navItems.find(i => location.startsWith(i.href))?.label || adminItems.find(i => location.startsWith(i.href))?.label || 'CRM'}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
