/**
 * Tests unitaires pour l'utilitaire de chiffrement AES-256-GCM.
 *
 * Ces tests vérifient :
 * - Le chiffrement et déchiffrement de données
 * - La détection de données déjà chiffrées
 * - La gestion des chaînes vides
 * - L'intégrité des données (altération détectée)
 */

import assert from "node:assert/strict";
import test from "node:test";
import crypto from "crypto";

// Générer une clé de test valide (32 octets en hexadécimal)
const TEST_KEY = crypto.randomBytes(32).toString("hex");
process.env.ENCRYPTION_KEY = TEST_KEY;

test("chiffrement: chiffre et déchiffre une chaîne simple", async () => {
  const { encrypter, dechiffrer } = await import("../../src/lib/encryption.js");

  const texte = "jean.diallo@example.com";
  const chiffré = encrypter(texte);

  // Le résultat chiffré est différent du texte en clair
  assert.notEqual(chiffré, texte);
  // Le résultat a le format iv:tag:ciphertext
  assert.equal(chiffré.split(":").length, 3);

  // Déchiffrement
  const déchiffré = dechiffrer(chiffré);
  assert.equal(déchiffré, texte);
});

test("chiffrement: gère les chaînes vides", async () => {
  const { encrypter, dechiffrer } = await import("../../src/lib/encryption.js");

  assert.equal(encrypter(""), "");
  assert.equal(dechiffrer(""), "");
});

test("chiffrement: chaque chiffrement produit un résultat différent (IV aléatoire)", async () => {
  const { encrypter } = await import("../../src/lib/encryption.js");

  const texte = "test@exemple.com";
  const chiffré1 = encrypter(texte);
  const chiffré2 = encrypter(texte);

  // Deux chiffréments du même texte donnent des résultats différents (IV aléatoire)
  assert.notEqual(chiffré1, chiffré2);
  // Mais les deux se déchiffrent correctement
  const { dechiffrer } = await import("../../src/lib/encryption.js");
  assert.equal(dechiffrer(chiffré1), texte);
  assert.equal(dechiffrer(chiffré2), texte);
});

test("chiffrement: détecte les données déjà chiffrées", async () => {
  const { encrypter, estChiffre } = await import("../../src/lib/encryption.js");

  const texte = "test@example.com";
  const chiffré = encrypter(texte);

  assert.equal(estChiffre(chiffré), true);
  assert.equal(estChiffre(texte), false);
  assert.equal(estChiffre(""), false);
});

test("chiffrement: encryption transparente ne rechiffre pas", async () => {
  const { encrypter, encrypterSiNecessaire, dechiffrerSiNecessaire, estChiffre } = await import("../../src/lib/encryption.js");

  const texte = "test@example.com";
  const chiffré = encrypter(texte);

  // encrypterSiNecessaire ne rechiffre pas une donnée déjà chiffrée
  const résultat = encrypterSiNecessaire(chiffré);
  assert.equal(résultat, chiffré);
  assert.equal(estChiffre(résultat), true);

  // dechiffrerSiNecessaire déchiffre une donnée chiffrée
  const déchiffré = dechiffrerSiNecessaire(chiffré);
  assert.equal(déchiffré, texte);

  // dechiffrerSiNecessaire retourne telle quelle une donnée non chiffrée
  const nonChiffré = dechiffrerSiNecessaire(texte);
  assert.equal(nonChiffré, texte);
});

test("chiffrement: échoue avec une clé incorrecte", async () => {
  // Ce test vérifie que le déchiffrement avec une clé incorrecte
  // lève une erreur. On le teste en manipulant directement le module crypto.
  const ALGORITHM = "aes-256-gcm";
  const IV_LENGTH = 16;
  const TAG_LENGTH = 16;
  const ENCODING = "hex" as const;

  // Chiffrer avec la clé correcte
  const bonneCle = Buffer.from(TEST_KEY, ENCODING);
  const texte = "secret@exemple.com";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, bonneCle, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(texte, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const chiffré = [iv.toString(ENCODING), authTag.toString(ENCODING), encrypted.toString(ENCODING)].join(":");

  // Déchiffrer avec une clé DIFFÉRENTE
  const mauvaiseCle = crypto.randomBytes(32);
  const [ivHex, tagHex, ciphertextHex] = chiffré.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, mauvaiseCle, Buffer.from(ivHex, ENCODING), { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(Buffer.from(tagHex, ENCODING));

  assert.throws(() => {
    Buffer.concat([decipher.update(Buffer.from(ciphertextHex, ENCODING)), decipher.final()]);
  });
});

test("chiffrement: format invalide levé une erreur", async () => {
  const { dechiffrer } = await import("../../src/lib/encryption.js");

  assert.throws(() => {
    dechiffrer("format-invalide");
  }, /Format de données chiffrées invalide/);
});
