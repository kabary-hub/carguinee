import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

// IMPORTANT : le dossier d'upload doit être défini AVANT l'import du middleware
// (il lit la variable au moment de l'import). Le runner `node --test` isole
// chaque fichier dans son propre processus, donc ce dossier temporaire n'est
// partagé avec aucun autre test et ne touche jamais backend/uploads/vehicles.
const TEST_UPLOAD_DIR = path.join(
  os.tmpdir(),
  `carguinee-upload-test-${process.pid}`,
);
process.env.VEHICLE_UPLOAD_DIR = TEST_UPLOAD_DIR;

const {
  vehiclePhotoUpload,
  vehiclePhotoUploadErrorHandler,
  getVehiclePhotoUrl,
  vehicleUploadDirectory,
} = await import("../../middleware/vehicle-upload.js");

// Application Express minimale reproduisant le montage réel des routes photos :
// même middleware multer et même gestionnaire d'erreurs que l'API.
const app = express();
app.post(
  "/api/vehicles/:id/photos",
  vehiclePhotoUpload.array("photos", 8),
  (request, response) => {
    const files = request.files as Express.Multer.File[] | undefined;
    response.status(201).json({
      status: "ok",
      data: {
        count: files?.length ?? 0,
        filenames: files?.map((file) => file.filename) ?? [],
      },
    });
  },
);
app.use(vehiclePhotoUploadErrorHandler);

let server: Server;
let baseUrl: string;

before(async () => {
  await fs.mkdir(TEST_UPLOAD_DIR, { recursive: true });
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  // Nettoyage du dossier temporaire de test uniquement.
  await fs.rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
});

/** Crée un fichier de test avec la taille et le type MIME souhaités. */
function photoFile(name: string, type: string, size: number): File {
  return new File([Buffer.alloc(size, 0xab)], name, { type });
}

/** Envoie une requête multipart réelle via fetch vers le serveur de test. */
async function postPhotos(files: File[]): Promise<Response> {
  const form = new FormData();
  for (const file of files) {
    form.append("photos", file);
  }
  return fetch(`${baseUrl}/api/vehicles/6b49dc95-3f3f-4b2a-8f6a-3d0f1c2e5a01/photos`, {
    method: "POST",
    body: form,
  });
}

test("accepte un envoi multipart de photos valides (JPG, PNG, WEBP) et les écrit sur disque", async () => {
  const files = [
    photoFile("voiture.jpg", "image/jpeg", 1024),
    photoFile("voiture.png", "image/png", 2048),
    photoFile("voiture.webp", "image/webp", 512),
  ];

  const response = await postPhotos(files);

  assert.equal(response.status, 201);
  const payload = (await response.json()) as {
    data: { count: number; filenames: string[] };
  };
  assert.equal(payload.data.count, 3);

  // Chaque fichier est bien stocké sur disque et accessible via l'URL publique.
  for (const filename of payload.data.filenames) {
    assert.equal(vehicleUploadDirectory, TEST_UPLOAD_DIR);
    await assert.doesNotReject(fs.access(path.join(TEST_UPLOAD_DIR, filename)));
    assert.equal(getVehiclePhotoUrl(filename), `/uploads/vehicles/${filename}`);
  }
});

test("refuse l'envoi d'une neuvième photo en une seule requête", async () => {
  const files = Array.from({ length: 9 }, (_, index) =>
    photoFile(`photo-${index + 1}.jpg`, "image/jpeg", 1024),
  );

  const response = await postPhotos(files);

  assert.equal(response.status, 400);
  const payload = (await response.json()) as { message: string };
  assert.equal(payload.message, "Vous pouvez envoyer au maximum 8 photos.");
});

test("refuse une photo de plus de 2 Mo mais accepte une photo de 2 Mo exactement", async () => {
  const oversized = await postPhotos([
    photoFile("trop-lourd.jpg", "image/jpeg", 2 * 1024 * 1024 + 1),
  ]);
  assert.equal(oversized.status, 400);
  const oversizedPayload = (await oversized.json()) as { message: string };
  assert.equal(
    oversizedPayload.message,
    "Chaque photo doit faire au maximum 2 Mo.",
  );

  const exact = await postPhotos([
    photoFile("limite.jpg", "image/jpeg", 2 * 1024 * 1024),
  ]);
  assert.equal(exact.status, 201);
});

test("refuse un format de fichier non autorisé (GIF)", async () => {
  const response = await postPhotos([
    photoFile("animation.gif", "image/gif", 1024),
  ]);

  assert.equal(response.status, 400);
  const payload = (await response.json()) as { message: string };
  assert.equal(payload.message, "Seuls les fichiers JPG, PNG et WEBP sont acceptés.");
});
