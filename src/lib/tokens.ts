import { createHash, randomBytes, createHmac } from "crypto";
export function randomToken(bytes=32){ return randomBytes(bytes).toString("base64url"); }
export function hashToken(t:string){ return createHash("sha256").update(t).digest("hex"); }
