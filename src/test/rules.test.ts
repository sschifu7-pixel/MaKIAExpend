import { describe, expect, it } from "vitest";
import { parseVoiceCommand } from "@/lib/voice-intent";
import { chatCategory } from "@/lib/chat-responses";

describe("voice orders", () => {
  it("selects Soda Web3", () => expect(parseVoiceCommand("Quiero una Soda Web3")).toEqual({ action: "SELECT_PRODUCT", productIndex: 0 }));
  it("selects Cyber Snack", () => expect(parseVoiceCommand("Dame un Cyber Snack").productIndex).toBe(1));
  it("buy phrase becomes payment", () => expect(parseVoiceCommand("Comprar Crypto Energy").action).toBe("PROCEED_PAYMENT"));
  it("cancels", () => expect(parseVoiceCommand("cancelar").action).toBe("CANCEL"));
});

describe("chat", () => {
  it("greets", () => expect(chatCategory("hola fantasma")).toBe("saludo"));
  it("tells jokes", () => expect(chatCategory("quiero una broma")).toBe("chiste"));
});
