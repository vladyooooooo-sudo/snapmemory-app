import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PinModal } from "./PinModal";
import { generateSalt, hashPin } from "../../lib/pin";

async function pressDigits(user: ReturnType<typeof userEvent.setup>, digits: string) {
  for (const d of digits) {
    await user.click(screen.getByRole("button", { name: new RegExp(`^Cifra ${d}$`) }));
  }
}

// Timer reali: pushPin combina un debounce di 180ms con un hashing SHA-256
// reale (Web Crypto), quindi mescolare fake timers con quella Promise reale
// darebbe risultati intermittenti. waitFor tollera la latenza reale.
describe("PinModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un nuovo PIN e lo restituisce come hash, non in chiaro", async () => {
    const onSet = vi.fn();
    const user = userEvent.setup();
    render(<PinModal mode="set" pinHash={null} pinSalt={null} onClose={vi.fn()} onSet={onSet} onUnlock={vi.fn()} />);

    await pressDigits(user, "1234");
    await waitFor(() => expect(screen.getByText(/ripeti il pin/i)).toBeInTheDocument());
    await pressDigits(user, "1234");

    await waitFor(() => expect(onSet).toHaveBeenCalledTimes(1));
    const [salt, hash] = onSet.mock.calls[0];
    expect(hash).not.toBe("1234");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(typeof salt).toBe("string");
  });

  it("sblocca con il PIN corretto", async () => {
    const salt = generateSalt();
    const hash = await hashPin("4321", salt);
    const onUnlock = vi.fn();
    const user = userEvent.setup();
    render(<PinModal mode="ask" pinHash={hash} pinSalt={salt} onClose={vi.fn()} onSet={vi.fn()} onUnlock={onUnlock} />);

    await pressDigits(user, "4321");

    await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
  });

  it("blocca i tentativi dopo ripetuti PIN errati (rate limiting)", async () => {
    const salt = generateSalt();
    const hash = await hashPin("4321", salt);
    const onUnlock = vi.fn();
    const user = userEvent.setup();
    render(<PinModal mode="ask" pinHash={hash} pinSalt={salt} onClose={vi.fn()} onSet={vi.fn()} onUnlock={onUnlock} />);

    for (let i = 0; i < 3; i++) {
      await pressDigits(user, "0000");
      // attende che il debounce/hash del singolo tentativo si concluda prima del prossimo
      await new Promise((r) => setTimeout(r, 250));
    }

    expect(onUnlock).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/troppi tentativi/i));
  });
});
