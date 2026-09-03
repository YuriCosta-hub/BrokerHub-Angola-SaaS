import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useMe } from "@/hooks/use-me";
import { Skeleton } from "@/components/ui/skeleton";

export function SessionGate({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (isError || !data) {
    return <Redirect to="/sign-in" />;
  }

  const needsMfa = data.mfa.required && !data.mfa.satisfied;
  const onMfa = location.startsWith("/seguranca-mfa");
  const onOnboarding = location.startsWith("/onboarding");

  if (needsMfa && !onMfa) {
    return <Redirect to="/seguranca-mfa" />;
  }
  if (!needsMfa && !data.tenant && !onOnboarding) {
    return <Redirect to="/onboarding" />;
  }
  if (data.tenant && (onOnboarding || onMfa)) {
    return <Redirect to="/dashboard" />;
  }
  if (!needsMfa && onMfa) {
    return <Redirect to={data.tenant ? "/dashboard" : "/onboarding"} />;
  }

  return <>{children}</>;
}
