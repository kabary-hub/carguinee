/**
 * Utilitaire de chiffrement AES-256-GCM pour les données sensibles.
 *
 * Utilise le module crypto natif de Node.js (pas de dépendance externe).
 * Chaque chiffrement génère un IV (vecteur d'initialisation) aléatoire
 * et un tag d'authentification pour garantir l'intégrité des données.
 *
 * Cas d'usage :
 * - Email et téléphone dans la base de données
 * - Documents d'identité (CIN, passeport, permis)
 * - Informations bancaires
 * - Carte grise du véhicule
 *
 * La clé de chiffrement doit être définie dans les variables d'environnement
 * via ENCRYPTION_KEY (32 octets en hexadécimal = 64 caractères).
 */

import crypto from "crypto";
import { env } from "../config/env.js";

// Algorithme utilisé : AES-256-GCM (authenticated encryption)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const ENCODING = "hex" as const;

/**
 * Retourne la clé de chiffrement en Buffer.
 * La clé doit faire 32 octets (256 bits) pour AES-256.
 */
function getEncryptionKey(): Buffer {
  const keyHex = env.ENCRYPTION_KEY;
  const key = Buffer.from(keyHex, ENCODING);

  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY doit faire 64 caractères hexadécimaux (32 octets). Actuellement : ${key.length} octets.`,
    );
  }

  return key;
}

/**
 * Chiffre une chaîne de caractères en clair.
 *
 * @param plaintext - La donnée à chiffrer (ex: "jean@example.com")
 * @returns La donnée chiffrée au format : iv:tag:ciphertext (tout en hexadécimal)
 *
 * @example
 * const chiffré = encrypter("jean@example.com");
 * // "a1b2c3d4e5f6...:1a2b3c...:3d4e5f..."
 */
export function encrypter(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format : iv (hex) : authTag (hex) : ciphertext (hex)
  return [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(":");
}

/**
 * Déchiffre une chaîne préalablement chiffrée avec encrypter().
 *
 * @param encryptedData - La donnée chiffrée au format iv:tag:ciphertext
 * @returns La donnée en clair
 * @throws Si la donnée est corrompue ou la clé incorrecte
 *
 * @example
 * const clair = dechiffrer(chiffré);
 * // "jean@example.com"
 */
export function dechiffrer(encryptedData: string): string {
  if (!encryptedData) return encryptedData;

  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Format de données chiffrées invalide. Attendu : iv:tag:ciphertext");
  }

  const [ivHex, tagHex, ciphertextHex] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(tagHex, ENCODING);
  const ciphertext = Buffer.from(ciphertextHex, ENCODING);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Vérifie si une donnée est déjà chiffrée.
 * Utile pour la migration progressive des données existantes.
 *
 * Une donnée chiffrée a le format : 3 groupes hex séparés par des « : ».
 */
export function estChiffre(data: string): boolean {
  if (!data) return false;
  const parts = data.split(":");
  return (
    parts.length === 3 &&
    parts.every((part) => /^[0-9a-f]+$/i.test(part))
  );
}

/**
 * Chiffre de manière transparente : retourne la donnée chiffrée
 * uniquement si elle n'est pas déjà chiffrée.
 * Utile pour les migrations de données existantes.
 */
export function encrypterSiNecessaire(plaintext: string): string {
  if (estChiffre(plaintext)) return plaintext;
  return encrypter(plaintext);
}

/**
 * Déchiffre de manière transparente : retourne la donnée déchiffrée
 * uniquement si elle est chiffrée. Sinon retourne la donnée telle quelle.
 */
export function dechiffrerSiNecessaire(data: string): string {
  if (estChiffre(data)) return dechiffrer(data);
  return data;
}
