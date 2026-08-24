import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastContext";

function TestComponent() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Success!")}>Success</button>
      <button onClick={() => showToast("Error!", "error")}>Error</button>
    </div>
  );
}

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("affiche un toast de succès", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Success"));
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });

  it("affiche un toast d'erreur", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Error"));
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("le toast disparaît après le délai", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Success"));
    expect(screen.getByText("Success!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
  });

  it("affiche l'icône ✓ pour le succès", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Success"));
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("affiche l'icône ✕ pour l'erreur", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Error"));
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("lance une erreur si useToast est utilisé hors provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<TestComponent />);
    }).toThrow("useToast doit être utilisé dans ToastProvider.");
    spy.mockRestore();
  });
});
