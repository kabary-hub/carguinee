import assert from "node:assert/strict";
import test from "node:test";
import {
  canAddPhotos,
  isAllowedPhotoMimeType,
  MAX_PHOTOS_PER_VEHICLE,
  MAX_PHOTO_SIZE_BYTES,
  photoLimitError,
  remainingPhotoSlots,
} from "./photo-limits.js";

test("un véhicule accepte au maximum 8 photos", () => {
  assert.equal(MAX_PHOTOS_PER_VEHICLE, 8);
  assert.equal(canAddPhotos(0, 8), true);
  assert.equal(canAddPhotos(1, 7), true);
  assert.equal(canAddPhotos(8, 0), true);
  assert.equal(canAddPhotos(8, 1), false, "la neuvième photo est refusée");
  assert.equal(canAddPhotos(5, 4), false);
});

test("le nombre de photos restantes ne descend jamais sous zéro", () => {
  assert.equal(remainingPhotoSlots(0), 8);
  assert.equal(remainingPhotoSlots(3), 5);
  assert.equal(remainingPhotoSlots(8), 0);
  assert.equal(remainingPhotoSlots(12), 0);
});

test("l'erreur de limite est explicite et absente quand l'ajout est valide", () => {
  assert.equal(photoLimitError(0, 8), null);
  assert.equal(
    photoLimitError(8, 1),
    "Un véhicule ne peut pas avoir plus de 8 photos.",
  );
  assert.equal(photoLimitError(0, 0), "Au moins une photo est requise.");
});

test("seuls les formats JPG, PNG et WEBP sont acceptés", () => {
  assert.equal(isAllowedPhotoMimeType("image/jpeg"), true);
  assert.equal(isAllowedPhotoMimeType("image/png"), true);
  assert.equal(isAllowedPhotoMimeType("image/webp"), true);
  assert.equal(isAllowedPhotoMimeType("image/gif"), false);
  assert.equal(isAllowedPhotoMimeType("application/pdf"), false);
});

test("la taille maximale d'une photo est de 2 Mo", () => {
  assert.equal(MAX_PHOTO_SIZE_BYTES, 2 * 1024 * 1024);
});
