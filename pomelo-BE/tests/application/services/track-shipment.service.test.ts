import assert from "node:assert/strict";
import test from "node:test";
import { TrackShipmentService } from "../../../src/application/services/track-shipment.service";
import type { TrackShipmentResult } from "../../../src/application/contracts/gateways/shipping-provider";

const trackResult: TrackShipmentResult = {
  provider: "oca", shipmentId: "PIEZA-001",
  currentStatus: "En tránsito",
  history: [{ date: "2026-04-29", status: "Ingresado", detail: "Centro CABA" }],
  raw: {}
};

test("TrackShipmentService delegates to provider and returns result", async () => {
  const provider = { quote: async () => { throw new Error(); }, createShipment: async () => { throw new Error(); }, trackShipment: async () => trackResult };
  const result = await new TrackShipmentService(provider).execute("PIEZA-001");
  assert.deepEqual(result, trackResult);
});

test("TrackShipmentService propagates provider error", async () => {
  const provider = { quote: async () => { throw new Error(); }, createShipment: async () => { throw new Error(); }, trackShipment: async () => { throw new Error("OCA error"); } };
  await assert.rejects(new TrackShipmentService(provider).execute("PIEZA-001"), /OCA error/);
});
