import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { ConfirmDialog } from "./ConfirmDialog";
import i18n from "../lib/i18n";

describe("ConfirmDialog", () => {
  beforeEach(() => {
    i18n.changeLanguage("fr");
  });

  const defaultProps = {
    open: true,
    title: "Confirmer",
    message: "Êtes-vous sûr ?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("n'affiche rien quand open=false", () => {
    const { container } = renderWithProviders(
      <ConfirmDialog {...defaultProps} open={false} />,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("affiche le titre et le message", () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Confirmer" })).toBeInTheDocument();
    expect(screen.getByText("Êtes-vous sûr ?")).toBeInTheDocument();
  });

  it("appelle onConfirm au clic sur le bouton vert", () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />,
    );
    // Le bouton de confirmation est le dernier bouton (vert)
    const buttons = screen.getAllByRole("button");
    const confirmBtn = buttons[buttons.length - 1];
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("appelle onCancel au clic sur le premier bouton", () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />,
    );
    const buttons = screen.getAllByRole("button");
    // Premier bouton = annuler (outlined)
    fireEvent.click(buttons[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it("appelle onCancel au clic sur l'overlay", () => {
    const onCancel = vi.fn();
    const { container } = renderWithProviders(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />,
    );
    const overlay = container.querySelector('[role="dialog"]');
    fireEvent.click(overlay!);
    expect(onCancel).toHaveBeenCalled();
  });

  it("utilise le label personnalisé", () => {
    renderWithProviders(
      <ConfirmDialog {...defaultProps} confirmLabel="Oui, supprimer" />,
    );
    expect(screen.getByRole("heading", { name: "Confirmer" })).toBeInTheDocument();
  });

  it("affiche un champ raison si requireReason=true", () => {
    renderWithProviders(
      <ConfirmDialog {...defaultProps} requireReason={true} />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("empêche la confirmation sans raison si requireReason", () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        {...defaultProps}
        requireReason={true}
        onConfirm={onConfirm}
      />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("accepte une raison et confirme", () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        {...defaultProps}
        requireReason={true}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ma raison" },
    });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onConfirm).toHaveBeenCalledWith("Ma raison");
  });

  it("le role dialog a aria-modal", () => {
    const { container } = renderWithProviders(
      <ConfirmDialog {...defaultProps} />,
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
