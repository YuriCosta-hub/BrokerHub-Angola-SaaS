import { type ComponentType, useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import Landing from "@/pages/landing";
import { Layout } from "@/components/layout";
import { SessionGate } from "@/components/session-gate";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Policies from "@/pages/policies";
import Claims from "@/pages/claims";
import Renewals from "@/pages/renewals";
import Reports from "@/pages/reports";
import Team from "@/pages/team";
import Settings from "@/pages/settings";
import Onboarding from "@/pages/onboarding";
import MfaRequired from "@/pages/mfa-required";
import Consent from "@/pages/consent";
import Portal from "@/pages/portal";
import InviteAccept from "@/pages/invite-accept";
import Billing from "@/pages/billing";
import Documents from "@/pages/documents";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/i18n";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(164 86% 16%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-gray-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientInstance = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientInstance.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientInstance]);

  return null;
}

function ProtectedRoute({
  component: Component,
  withLayout = true,
}: {
  component: ComponentType;
  withLayout?: boolean;
}) {
  return (
    <>
      <Show when="signed-in">
        <SessionGate>
          {withLayout ? (
            <Layout>
              <Component />
            </Layout>
          ) : (
            <Component />
          )}
        </SessionGate>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

export function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return <Landing />;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Bem-vindo ao BrokerHub",
            subtitle: "Aceda à sua conta de mediador",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route
            path="/onboarding"
            component={() => (
              <ProtectedRoute component={Onboarding} withLayout={false} />
            )}
          />
          <Route
            path="/seguranca-mfa"
            component={() => (
              <ProtectedRoute component={MfaRequired} withLayout={false} />
            )}
          />
          <Route
            path="/privacidade"
            component={() => (
              <ProtectedRoute component={Consent} withLayout={false} />
            )}
          />
          <Route
            path="/convite"
            component={() => (
              <ProtectedRoute component={InviteAccept} withLayout={false} />
            )}
          />
          <Route
            path="/portal"
            component={() => (
              <ProtectedRoute component={Portal} withLayout={false} />
            )}
          />
          
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/clientes" component={() => <ProtectedRoute component={Clients} />} />
          <Route path="/apolices" component={() => <ProtectedRoute component={Policies} />} />
          <Route path="/sinistros" component={() => <ProtectedRoute component={Claims} />} />
          <Route path="/renovacoes" component={() => <ProtectedRoute component={Renewals} />} />
          <Route path="/relatorios" component={() => <ProtectedRoute component={Reports} />} />
          <Route path="/equipa" component={() => <ProtectedRoute component={Team} />} />
          <Route path="/documentos" component={() => <ProtectedRoute component={Documents} />} />
          <Route path="/facturacao" component={() => <ProtectedRoute component={Billing} />} />
          <Route path="/configuracoes" component={() => <ProtectedRoute component={Settings} />} />
          
          <Route>
            <div className="flex h-screen items-center justify-center flex-col">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="mb-4">Página não encontrada</p>
              <a href="/" className="text-primary hover:underline">Voltar ao início</a>
            </div>
          </Route>
        </Switch>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <I18nProvider>
      <WouterRouter base={basePath}>
        {clerkPubKey ? <ClerkProviderWithRoutes /> : <Landing />}
      </WouterRouter>
    </I18nProvider>
  );
}

export default App;
