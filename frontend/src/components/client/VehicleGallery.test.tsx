import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import { VehicleGallery } from "./VehicleGallery";

describe("VehicleGallery", () => {
  const emptyPhotos: { id: string; url: string; sortOrder: number }[] = [];
  const singlePhoto = [{ id: "1", url: "/demo-vehicles/test.jpg", sortOrder: 0 }];
  const multiPhotos = [
    { id: "1", url: "/demo-vehicles/1.jpg", sortOrder: 0 },
    { id: "2", url: "/demo-vehicles/2.jpg", sortOrder: 1 },
    { id: "3", url: "/demo-vehicles/3.jpg", sortOrder: 2 },
  ];

  it("affiche un emoji quand il n'y a pas de photos", () => {
    renderWithProviders(<VehicleGallery photos={emptyPhotos} brand="Toyota" model="Corolla" />);
    expect(screen.getByText("🚗")).toBeInTheDocument();
  });

  it("affiche une image", () => {
    renderWithProviders(<VehicleGallery photos={singlePhoto} brand="Toyota" model="Corolla" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
  });

  it("affiche le compteur de photos pour plusieurs images", () => {
    renderWithProviders(<VehicleGallery photos={multiPhotos} brand="Toyota" model="Corolla" />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("rend les images avec le bon src", () => {
    renderWithProviders(<VehicleGallery photos={singlePhoto} brand="Toyota" model="Corolla" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/demo-vehicles/test.jpg");
  });

  it("affiche la navigation (prev/next) pour plusieurs photos", () => {
    renderWithProviders(<VehicleGallery photos={multiPhotos} brand="Toyota" model="Corolla" />);
    // Les boutons de navigation
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
