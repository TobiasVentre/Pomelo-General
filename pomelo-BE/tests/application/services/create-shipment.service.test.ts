import assert from "node:assert/strict";
import test from "node:test";
import { CreateShipmentService } from "../../../src/application/services/create-shipment.service";
import type { CreateShipmentResult } from "../../../src/application/contracts/gateways/shipping-provider";

const input = {
  orderId: "ORD-001", productCode: "OCA_TEST",
  recipientName: "Juan", recipientEmail: "juan@test.com", recipientPhone: "1122334455",
  recipientAddress: "Av Test 123", recipientCity: "CABA", recipientProvince: "Buenos Aires",
  recipientPostalCode: "1000", packageWeightKg: 1, packageVolumeCm3: 500,
  declaredValueArs: 45000, itemsDescription: "Remera"
};

const shipmentResult: CreateShipmentResult = {
  provider: "oca", shipmentId: "PIEZA-001", raw: {}
};

test("CreateShipmentService delegates to provider and returns result", async () => {
  const provider = { quote: async () => { throw new Error(); }, createShipment: async () => shipmentResult, trackShipment: async () => { throw new Error(); } };
  const result = await new CreateShipmentService(provider).execute(input);
  assert.deepEqual(result, shipmentResult);
});

test("CreateShipmentService propagates provider error", async () => {
  const provider = { quote: async () => { throw new Error(); }, createShipment: async () => { throw new Error("OCA error"); }, trackShipment: async () => { throw new Error(); } };
  await assert.rejects(new CreateShipmentService(provider).execute(input), /OCA error/);
});
