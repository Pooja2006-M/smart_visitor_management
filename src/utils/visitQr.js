export const createVisitQrUrl = (visitId) => {
  const appUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim() || window.location.origin;
  return new URL(`/visit/qr/${encodeURIComponent(visitId)}`, appUrl).toString();
};
