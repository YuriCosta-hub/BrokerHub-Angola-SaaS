export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "TENANT_REQUIRED"
  | "MFA_REQUIRED"
  | "ORIGIN_DENIED"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONSENT_REQUIRED"
  | "SUBSCRIPTION_SUSPENDED"
  | "RETENTION_HOLD";

export type ApiErrorBody = {
  error: string;
  code: ApiErrorCode;
};

export function errorBody(code: ApiErrorCode, error: string): ApiErrorBody {
  return { code, error };
}
