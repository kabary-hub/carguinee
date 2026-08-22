export function normalizeGuineaPhone(input: string): string {
  const compact = input.replace(/[\s().-]/g, "");

  if (compact.startsWith("+224")) {
    const nationalNumber = compact.slice(4);

    if (!/^\d{9}$/.test(nationalNumber)) {
      throw new Error("Numéro guinéen invalide.");
    }

    return `+224${nationalNumber}`;
  }

  if (compact.startsWith("00224")) {
    const nationalNumber = compact.slice(5);

    if (!/^\d{9}$/.test(nationalNumber)) {
      throw new Error("Numéro guinéen invalide.");
    }

    return `+224${nationalNumber}`;
  }

  if (/^\d{9}$/.test(compact)) {
    return `+224${compact}`;
  }

  throw new Error("Utilisez un numéro guinéen valide au format local ou +224.");
}
