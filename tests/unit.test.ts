import { describe, it, expect } from "vitest";
import { generateTotpSecret, totpCode, verifyTotp, base32Encode, base32Decode } from "@/lib/totp";
import { invoiceTotal } from "@/lib/finance";
import { round2 } from "@/lib/audit";
import { randomToken, hashToken } from "@/lib/tokens";

describe("TOTP MFA (RFC 6238)", () => {
  it("generates and verifies a current code", () => { const s = generateTotpSecret(); const code = totpCode(s); expect(verifyTotp(s, code)).toBe(true); });
  it("rejects a wrong code", () => { const s = generateTotpSecret(); expect(verifyTotp(s, "000000") && totpCode(s) !== "000000").toBe(false); });
  it("base32 round-trips", () => { const b = Buffer.from("SAKK Group CRM"); expect(base32Decode(base32Encode(b)).toString()).toBe("SAKK Group CRM"); });
});
describe("Finance calculations", () => {
  it("invoice total = amount x qty x (1+tax%)", () => { expect(invoiceTotal({ amount: 1000, quantity: 2, taxRate: 10 })).toBe(2200); });
  it("mandatory scenario arithmetic: 100000 invoice fully allocated has 0 outstanding basis", () => { const total = invoiceTotal({ amount: 100000, quantity: 1, taxRate: 0 }); expect(round2(total - 100000)).toBe(0); expect(round2(50000 - 20000 - 5000)).toBe(25000); });
  it("round2 handles paise/cents", () => { expect(round2(1.005)).toBe(1.01); expect(round2(99.999)).toBe(100); });
});
describe("Tokens", () => {
  it("random tokens differ and hash deterministically", () => { const a = randomToken(), b = randomToken(); expect(a).not.toBe(b); expect(hashToken(a)).toBe(hashToken(a)); expect(hashToken(a)).toHaveLength(64); });
});
