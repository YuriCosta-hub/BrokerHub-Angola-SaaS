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
  const onConsent = location.startsWith("/privacidade");
  const onInvite = location.startsWith("/convite");
  const onBilling = location.startsWith("/facturacao");
  const onPortal = location.startsWith("/portal");
  const homeForRole = data.role === "client" ? "/portal" : "/dashboard";

  const search = typeof window !== "undefined" ? window.location.search : "";
  const nextTarget = new URLSearchParams(search).get("next");
  const safeNext =
    nextTarget && nextTarget.startsWith("/") && !nextTarget.startsWith("//")
      ? nextTarget
      : null;

  if (needsMfa && !onMfa) {
    return <Redirect to="/seguranca-mfa" />;
  }
  if (!data.consentGranted && !onConsent && !onMfa) {
    const resume = `${location}${search}`;
    return (
      <Redirect
        to={`/privacidade?next=${encodeURIComponent(resume)}`}
      />
    );
  }
  if (data.consentGranted && onConsent) {
    if (safeNext) {
      return <Redirect to={safeNext} />;
    }
    if (!data.tenant) {
      return <Redirect to={onInvite ? location : "/onboarding"} />;
    }
    return <Redirect to={homeForRole} />;
  }
  if (data.role === "client" && data.tenant && !onPortal && !onInvite) {
    return <Redirect to="/portal" />;
  }
  if (!needsMfa && !data.tenant && !onOnboarding && !onInvite && !onConsent) {
    return <Redirect to="/onboarding" />;
  }
  if (data.subscriptionStatus === "suspended" && data.role !== "client" && !onBilling) {
    return <Redirect to="/facturacao" />;
  }
  if (data.tenant && (onOnboarding || onMfa)) {
    return <Redirect to={homeForRole} />;
  }
  if (!needsMfa && onMfa) {
    return <Redirect to={data.tenant ? homeForRole : "/onboarding"} />;
  }

  return <>{children}</>;
}
