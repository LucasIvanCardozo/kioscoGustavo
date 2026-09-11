export const ADMIN_REJECTED_QUERY = 'rejected=1';

export function buildAdminRejectedUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('rejected', '1');
  return url.toString();
}