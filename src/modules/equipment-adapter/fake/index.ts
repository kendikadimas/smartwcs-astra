import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { applyTaskStatusChange } from "../../task/apply-status-change";
import type { EquipmentAdapter } from "../contract";
import type {
  AdapterCapabilities,
  DispatchCommand,
  DispatchResult,
  InboundMessage,
  InboundResult,
  MissionRef,
  SyncResourcesResult,
} from "../types";

/**
 * Adapter tiruan -- robot "in-memory", tanpa tabel sendiri (tidak ada
 * padanan Pudu*), tanpa menyebut vendor manapun. Bukti bahwa kontrak
 * benar-benar netral: adapter ini dites lewat rangkaian yang sama dengan
 * adapter PUDU (contract.test-suite.ts), dan WCS core (route/worker/API)
 * bisa memakainya tanpa tahu bedanya.
 *
 * Protokol "raw" fiktif (dibuat untuk demo, bukan standar apa pun):
 * header `x-fake-token: ok` + body { callback_type: "statusUpdate", data: { missionId, status } }.
 * `status` sudah berupa status netral WCS -- adapter fiktif ini tidak
 * punya vocabulary status vendor sendiri untuk diterjemahkan.
 */

interface FakeMissionState {
  externalTaskId: string;
  status: string;
}

const missions = new Map<string, FakeMissionState>();

const callbackEnvelopeSchema = z
  .object({ callback_type: z.string().min(1), data: z.unknown().optional() })
  .passthrough();

const statusUpdateSchema = z.object({ missionId: z.string().min(1), status: z.string().min(1) }).passthrough();

let counter = 0;
function nextFakeTaskId(): string {
  counter += 1;
  return `fake-task-${counter}`;
}

/**
 * Error berbentuk sama dengan DispatchRejectedError PUDU (nama + properti
 * `failureCode`), TANPA mengimpor apa pun dari folder pudu/ -- dicek lewat
 * duck-typing di src/modules/task/dispatch-rejection.ts. Dipakai test E2E
 * untuk memicu jalur "penolakan adapter" (Bagian 1 Fase D) tanpa PUDU sama
 * sekali, lewat sentinel `targetPoint === "REJECT_NO_RESOURCE"`.
 */
class FakeDispatchRejectedError extends Error {
  constructor(
    message: string,
    public readonly failureCode: string,
  ) {
    super(message);
    this.name = "DispatchRejectedError";
  }
}

async function dispatch(_tx: Prisma.TransactionClient, command: DispatchCommand): Promise<DispatchResult> {
  if (command.targetPoint === "REJECT_NO_RESOURCE") {
    throw new FakeDispatchRejectedError("Robot fiktif sengaja menolak dispatch (test)", "NO_RESOURCE_AVAILABLE");
  }
  const externalTaskId = nextFakeTaskId();
  missions.set(command.missionId, { externalTaskId, status: "DISPATCHED" });
  return { externalTaskId, status: "DISPATCHED" };
}

async function cancel(_tx: Prisma.TransactionClient, missionRef: MissionRef): Promise<void> {
  const state = missions.get(missionRef.missionId);
  if (!state) return; // tidak ada task fiktif untuk mission ini -- sama seperti PUDU, diam saja
  state.status = "CANCELLED";
}

async function syncResources(): Promise<SyncResourcesResult> {
  return { robots: [{ serialNumber: "FAKE-001", name: "Fake Robot 1" }], locationsSynced: 1 };
}

async function handleInbound(tx: Prisma.TransactionClient, message: InboundMessage): Promise<InboundResult> {
  if (message.kind === "queued") {
    if (message.messageType !== "statusUpdate") {
      throw new Error(`Tidak ada parser untuk callback_type "${message.messageType}"`);
    }
    const parsed = statusUpdateSchema.parse(message.data);
    const state = missions.get(parsed.missionId);
    if (state) state.status = parsed.status;
    await applyTaskStatusChange(tx, {
      missionId: parsed.missionId,
      missionStatus: parsed.status,
      taskStatus: parsed.status,
      integrationLogId: message.integrationLogId,
      occurredAt: message.occurredAt,
    });
    return { kind: "processed" };
  }

  // message.kind === "raw"
  const traceId = message.headers["x-trace-id"] ?? null;
  if (message.headers["x-fake-token"] !== "ok") {
    return { kind: "unauthorized", reason: "x-fake-token tidak valid", traceId };
  }

  let body: unknown = null;
  try {
    body = message.rawBody ? JSON.parse(message.rawBody) : null;
  } catch {
    body = null;
  }

  const parsedEnvelope = callbackEnvelopeSchema.safeParse(body);
  if (!parsedEnvelope.success) {
    return {
      kind: "invalid",
      reason: "Body bukan JSON valid atau callback_type kosong",
      traceId,
      payload: body && typeof body === "object" ? body : { raw: message.rawBody },
    };
  }

  return {
    kind: "queue",
    traceId,
    messageType: parsedEnvelope.data.callback_type,
    payload: parsedEnvelope.data,
  };
}

function capabilities(): AdapterCapabilities {
  return { canCancel: true, canReportPosition: false, supportedDispatchKinds: ["CALL", "DELIVERY"] };
}

export const fakeAdapter: EquipmentAdapter = {
  key: "fake",
  dispatch,
  cancel,
  syncResources,
  handleInbound,
  capabilities,
};

/** Dipakai test untuk mereset state in-memory antar kasus uji. */
export function resetFakeAdapterState(): void {
  missions.clear();
  counter = 0;
}
