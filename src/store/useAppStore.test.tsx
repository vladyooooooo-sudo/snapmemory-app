import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "./useAppStore";
import type { ParsedCapture } from "../lib/parseCapture";

const memory: ParsedCapture = { cat: "idea", title: "Test", summary: "Test", ocr: "Test", tags: [], locked: false };

describe("useAppStore · streak", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("il primo ricordo del giorno porta la streak a 1", () => {
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.saveMemory(memory);
    });
    expect(result.current.streak).toBe(1);
  });

  it("un secondo ricordo nello stesso giorno non incrementa la streak", () => {
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.saveMemory(memory);
    });
    act(() => {
      result.current.saveMemory(memory);
    });
    expect(result.current.streak).toBe(1);
  });

  it("un ricordo il giorno dopo incrementa la streak", () => {
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.saveMemory(memory);
    });
    vi.setSystemTime(new Date("2026-07-21T09:00:00"));
    act(() => {
      result.current.saveMemory(memory);
    });
    expect(result.current.streak).toBe(2);
  });

  it("saltare un giorno azzera e riparte da 1", () => {
    vi.setSystemTime(new Date("2026-07-20T10:00:00"));
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.saveMemory(memory);
    });
    vi.setSystemTime(new Date("2026-07-22T09:00:00")); // salta il 21
    act(() => {
      result.current.saveMemory(memory);
    });
    expect(result.current.streak).toBe(1);
  });

  it("una milestone (7, 30, 100) genera una celebrazione con titolo dedicato", () => {
    vi.setSystemTime(new Date("2026-07-01T10:00:00"));
    const { result } = renderHook(() => useAppStore());
    for (let day = 0; day < 6; day++) {
      act(() => {
        result.current.saveMemory(memory);
      });
      vi.setSystemTime(new Date(2026, 6, 2 + day, 10, 0, 0));
    }
    const holder: { celebrate: { title: string; sub: string } | null } = { celebrate: null };
    act(() => {
      holder.celebrate = result.current.saveMemory(memory).celebrate;
    });
    expect(result.current.streak).toBe(7);
    expect(holder.celebrate?.title).toContain("7 giorni");
  });
});
