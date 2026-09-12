export function buildWhatsAppLink(phone: string, productName: string, ownerName = 'Gustavo'): string {
  const message = `Hola ${ownerName}! Estoy interesado en: ${productName}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}