const gallery = (folder: string, extensions: string[] = ["jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg"]) =>
  extensions.map(
    (extension, index) =>
      `/demo-vehicles/${folder}/${String(index + 1).padStart(2, "0")}.${extension}`,
  );

export const demoVehicleGalleries = [
  { brand: "Renault", model: "Clio", photos: gallery("renault-clio", ["jpg", "jpg", "jpg", "jpg", "jpg", "webp", "jpg", "jpg"]) },
  { brand: "Toyota", model: "RAV4", photos: gallery("toyota-rav4", ["jpg", "jpg", "jpg", "jpeg", "jpg", "jpg", "png", "jpg"]) },
  { brand: "Toyota", model: "Hiace", photos: gallery("toyota-hiace", ["png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "jpg"]) },
  { brand: "Nissan", model: "Navara", photos: gallery("nissan-navara") },
  { brand: "Toyota", model: "Land Cruiser", photos: gallery("toyota-land-cruiser") },
  { brand: "Kia", model: "Sportage", photos: gallery("kia-sportage") },
] as const;

export function hasEightDemoPhotos(photos: readonly string[]) {
  return photos.length === 8 && new Set(photos).size === 8;
}
