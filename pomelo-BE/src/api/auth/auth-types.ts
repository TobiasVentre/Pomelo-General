export const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
export const NAME_ID_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

export interface AuthenticatedUser {
  token: string;
  userId: string | null;
  role: string | null;
  email: string | null;
  claims: Record<string, unknown>;
}
