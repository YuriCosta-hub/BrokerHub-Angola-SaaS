const individual = /^\d{9}[A-Z]{2}\d{3}$/;
const company = /^\d{10}$/;

export function isValidAngolaNif(nif: string): boolean {
  const normalized = nif.trim().toUpperCase();
  return individual.test(normalized) || company.test(normalized);
}

export function normalizeNif(nif: string): string {
  return nif.trim().toUpperCase();
}
