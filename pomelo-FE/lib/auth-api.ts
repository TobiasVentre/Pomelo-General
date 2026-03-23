export function getAuthApiBase(): string {
  return (
    process.env.AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ??
    "http://localhost:8082"
  );
}
