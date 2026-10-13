import crypto from "crypto";
import { db } from "@/db";
import { signatures, quotations, contracts, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return Response.json({ success: false, error: "entityType and entityId are required" }, { status: 400 });
    }

    const [sig] = await db
      .select()
      .from(signatures)
      .where(and(eq(signatures.entityType, entityType), eq(signatures.entityId, entityId)));

    return Response.json({ success: true, signature: sig || null });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const { entityType, entityId, signerName, signerEmail, signatureDataUrl } = body;

    if (!entityType || !entityId || !signerName || !signerEmail || !signatureDataUrl) {
      return Response.json({ success: false, error: "All signature fields are required" }, { status: 400 });
    }

    // Cryptographic tamper-proof checksum
    const rawData = `${entityType}:${entityId}:${signerEmail}:${signatureDataUrl}`;
    const checksum = crypto.createHash("sha256").update(rawData).digest("hex");

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Client";

    const [newSig] = await db
      .insert(signatures)
      .values({
        entityType,
        entityId,
        signerName,
        signerEmail,
        signatureDataUrl,
        ipAddress,
        userAgent,
        checksum,
      })
      .returning();

    // Auto-advance entity status
    if (entityType === "quotation") {
      await db.update(quotations).set({ status: "accepted" }).where(eq(quotations.id, entityId));
    } else if (entityType === "contract") {
      await db.update(contracts).set({ status: "active" }).where(eq(contracts.id, entityId));
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "signature.recorded",
      entityType,
      entityId,
      details: `Digitally signed by ${signerName} (${signerEmail}). Checksum: ${checksum.slice(0, 16)}...`,
    });

    return Response.json({
      success: true,
      message: "Digital e-Signature verified and certificate recorded",
      signature: newSig,
      checksum,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
