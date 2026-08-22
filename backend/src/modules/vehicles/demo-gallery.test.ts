import assert from "node:assert/strict";
import test from "node:test";
import { demoVehicleGalleries, hasEightDemoPhotos } from "./demo-gallery.js";

test("chaque publication de démonstration possède exactement huit photos différentes", () => {
  assert.equal(demoVehicleGalleries.length, 6);

  for (const vehicle of demoVehicleGalleries) {
    assert.equal(hasEightDemoPhotos(vehicle.photos), true, `${vehicle.brand} ${vehicle.model}`);
  }
});
