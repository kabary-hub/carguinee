import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { resolvePhotoUrl } from "../lib/api";

type GalleryPhoto = { id: string; url: string; sortOrder: number };

export function VehicleGallery({ photos, vehicleName }: { photos: GalleryPhoto[]; vehicleName: string }) {
  const { t } = useTranslation();
  const orderedPhotos = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const selectedPhoto = orderedPhotos[selectedIndex];

  const previous = () => setSelectedIndex((index) => (index - 1 + orderedPhotos.length) % orderedPhotos.length);
  const next = () => setSelectedIndex((index) => (index + 1) % orderedPhotos.length);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, orderedPhotos.length]);

  if (!selectedPhoto) {
    return <div className="flex h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 text-7xl dark:from-slate-900 dark:to-slate-700">🚗</div>;
  }

  return <div>
    <button type="button" onClick={() => setIsFullscreen(true)} className="group relative block h-80 w-full overflow-hidden rounded-3xl bg-slate-900 text-left" aria-label={t("vehicles.details.photos", { count: orderedPhotos.length })}>
      <img src={resolvePhotoUrl(selectedPhoto.url)} alt={`${vehicleName} — photo ${selectedIndex + 1}`} className="vehicle-photo h-full w-full object-cover" />
      <span className="absolute right-4 top-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white">{selectedIndex + 1} / {orderedPhotos.length}</span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-5 pb-5 pt-12 text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">{t("vehicles.details.viewFullscreen")}</span>
    </button>
    {orderedPhotos.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={t("vehicles.details.thumbnails")}>{orderedPhotos.map((photo, index) => <button key={photo.id} type="button" onClick={() => setSelectedIndex(index)}        className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${index === selectedIndex ? "border-emerald-600" : "border-transparent opacity-70 hover:opacity-100"}`} aria-label={t("vehicles.details.showPhoto", { count: index + 1 })}><img src={resolvePhotoUrl(photo.url)} alt="" className="h-full w-full object-cover" /></button>)}</div>}
    {isFullscreen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4" role="dialog" aria-modal="true" aria-label={t("vehicles.details.gallery", { name: vehicleName })}>
      <button type="button" onClick={() => setIsFullscreen(false)} className="absolute right-5 top-5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25">{t("common.close")}</button>
      {orderedPhotos.length > 1 && <button type="button" onClick={previous} className="absolute left-3 rounded-full bg-white/15 px-4 py-3 text-2xl text-white hover:bg-white/25 sm:left-8" aria-label={t("vehicles.details.previousPhoto")}>‹</button>}
      <img src={resolvePhotoUrl(selectedPhoto.url)} alt={`${vehicleName} — photo ${selectedIndex + 1}`} className="max-h-[84vh] max-w-[88vw] rounded-xl object-contain shadow-2xl" />
      {orderedPhotos.length > 1 && <button type="button" onClick={next} className="absolute right-3 rounded-full bg-white/15 px-4 py-3 text-2xl text-white hover:bg-white/25 sm:right-8" aria-label={t("vehicles.details.nextPhoto")}>›</button>}
      <p className="absolute bottom-5 text-sm font-semibold text-white">{t("vehicles.details.photoCount", { current: selectedIndex + 1, total: orderedPhotos.length })}</p>
    </div>}
  </div>;
}
