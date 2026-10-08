export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "MISSING_API_KEY"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
  details?: Array<{ field: string; message: string }>;
}
