import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Onboarding } from "./Onboarding";

describe("Onboarding", () => {
  it("bug corretto: 'Salta tutto' con nome vuoto completa comunque l'onboarding con nome 'Tu'", async () => {
    const onFinish = vi.fn();
    render(<Onboarding onFinish={onFinish} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /iniziamo/i }));
    // Step 1: nome vuoto, click diretto su "Salta tutto"
    await user.click(screen.getByRole("button", { name: /salta tutto/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith("Tu", "", [], false);
  });

  it("completa l'onboarding con il nome inserito quando si salta dopo averlo scritto", async () => {
    const onFinish = vi.fn();
    render(<Onboarding onFinish={onFinish} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /iniziamo/i }));
    await user.type(screen.getByPlaceholderText("Il tuo nome"), "Giulia");
    await user.click(screen.getByRole("button", { name: /salta tutto/i }));

    expect(onFinish).toHaveBeenCalledWith("Giulia", "", [], false);
  });

  it("percorso completo fino allo scatto immediato passa firstSnap=true", async () => {
    const onFinish = vi.fn();
    render(<Onboarding onFinish={onFinish} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /iniziamo/i }));
    await user.type(screen.getByPlaceholderText("Il tuo nome"), "Marco");
    await user.click(screen.getByRole("button", { name: /avanti/i }));

    await user.click(screen.getByRole("button", { name: /spesa/i }));
    await user.click(screen.getByRole("button", { name: /luogo/i }));
    await user.click(screen.getByRole("button", { name: /avanti/i }));

    await user.click(screen.getByRole("button", { name: /scatta ora/i }));

    expect(onFinish).toHaveBeenCalledWith("Marco", "", expect.arrayContaining(["spesa", "luogo"]), true);
  });
});
