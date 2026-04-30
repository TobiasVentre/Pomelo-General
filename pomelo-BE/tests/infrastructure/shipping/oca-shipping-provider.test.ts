import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import { OcaShippingProvider } from "../../../src/infrastructure/shipping/oca-shipping-provider";
import { UpstreamError } from "../../../src/application/errors/upstream-error";

const config = {
  apiBaseUrl: "https://oca-test.example.com",
  loginPath: "/login",
  createShipmentPath: "/shipments",
  trackCurrentStatusPath: "/track/current",
  trackHistoryPath: "/track/history",
  client: "TEST_CLIENT",
  user: "test_user",
  password: "test_pass",
  productCode: "OCA_TEST"
};

type FetchMock = (url: string, init?: RequestInit) => Promise<Response>;
let originalFetch: typeof globalThis.fetch;

function mockFetch(handler: FetchMock) {
  globalThis.fetch = handler as typeof globalThis.fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// --- authenticate ---

test("OcaShippingProvider caches token within 10-min window", async () => {
  let loginCalls = 0;
  mockFetch(async (url) => {
    if (url.includes("/login")) {
      loginCalls++;
      return jsonResponse({ success: true, result: { token: "token-abc" } });
    }
    return jsonResponse({ success: true, result: { numeroPieza: "P1" } });
  });

  const provider = new OcaShippingProvider(config);
  const input = {
    orderId: "ORD-1", productCode: "OCA_TEST",
    recipientName: "Juan", recipientEmail: "j@test.com", recipientPhone: "111",
    recipientAddress: "Av 1", recipientCity: "CABA", recipientProvince: "BA",
    recipientPostalCode: "1000", packageWeightKg: 1, packageVolumeCm3: 100,
    declaredValueArs: 1000, itemsDescription: "Remera"
  };
  await provider.createShipment(input);
  await provider.createShipment(input);
  assert.equal(loginCalls, 1, "should call login only once within cache window");
});

test("OcaShippingProvider throws UpstreamError when login success=false", async () => {
  mockFetch(async () => jsonResponse({ success: false, message: "Invalid credentials" }));
  const provider = new OcaShippingProvider(config);
  await assert.rejects(
    provider.createShipment({ orderId: "ORD-1", productCode: "OCA_TEST", recipientName: "J", recipientEmail: "j@t.com", recipientPhone: "1", recipientAddress: "A", recipientCity: "C", recipientProvince: "B", recipientPostalCode: "1000", packageWeightKg: 1, packageVolumeCm3: 100, declaredValueArs: 0, itemsDescription: "X" }),
    (err) => err instanceof UpstreamError && err.httpStatus === 502
  );
});

test("OcaShippingProvider throws UpstreamError when login returns no token", async () => {
  mockFetch(async () => jsonResponse({ success: true, result: null }));
  const provider = new OcaShippingProvider(config);
  await assert.rejects(
    provider.createShipment({ orderId: "ORD-1", productCode: "OCA_TEST", recipientName: "J", recipientEmail: "j@t.com", recipientPhone: "1", recipientAddress: "A", recipientCity: "C", recipientProvince: "B", recipientPostalCode: "1000", packageWeightKg: 1, packageVolumeCm3: 100, declaredValueArs: 0, itemsDescription: "X" }),
    (err) => err instanceof UpstreamError
  );
});

test("OcaShippingProvider throws UpstreamError on HTTP login error", async () => {
  mockFetch(async () => new Response("Unauthorized", { status: 401 }));
  const provider = new OcaShippingProvider(config);
  await assert.rejects(
    provider.createShipment({ orderId: "ORD-1", productCode: "OCA_TEST", recipientName: "J", recipientEmail: "j@t.com", recipientPhone: "1", recipientAddress: "A", recipientCity: "C", recipientProvince: "B", recipientPostalCode: "1000", packageWeightKg: 1, packageVolumeCm3: 100, declaredValueArs: 0, itemsDescription: "X" }),
    (err) => err instanceof UpstreamError
  );
});

// --- quote ---

test("OcaShippingProvider.quote uses zone multiplier 1.0 for CP 1000-1999", async () => {
  const provider = new OcaShippingProvider(config);
  const result = await provider.quote({ postalCode: "1426", itemsCount: 1, subtotalArs: 10000 });
  assert.equal(result.provider, "oca");
  // base=5200, perItem=900, zone=1.0 → (5200+900)*1 = 6100
  assert.equal(result.priceArs, 6100);
});

test("OcaShippingProvider.quote uses zone multiplier 1.2 for CP outside 1000-1999", async () => {
  const provider = new OcaShippingProvider(config);
  const result = await provider.quote({ postalCode: "5000", itemsCount: 1, subtotalArs: 10000 });
  // base=5200, perItem=900, zone=1.2 → (5200+900)*1.2 = 7320
  assert.equal(result.priceArs, 7320);
});

test("OcaShippingProvider.quote applies 8% discount for subtotal > 100000", async () => {
  const provider = new OcaShippingProvider(config);
  const result = await provider.quote({ postalCode: "1000", itemsCount: 1, subtotalArs: 150000 });
  // base=6100, discount=0.92 → Math.round(6100*0.92) = 5612
  assert.equal(result.priceArs, 5612);
});

// --- createShipment ---

test("OcaShippingProvider.createShipment extracts numeroPieza from response", async () => {
  mockFetch(async (url) => {
    if (url.includes("/login")) return jsonResponse({ success: true, result: { token: "tok" } });
    return jsonResponse({ success: true, result: { numeroPieza: "PIEZA-999" } });
  });
  const provider = new OcaShippingProvider(config);
  const result = await provider.createShipment({
    orderId: "ORD-1", productCode: "OCA_TEST", recipientName: "Juan",
    recipientEmail: "j@test.com", recipientPhone: "111", recipientAddress: "Av 1",
    recipientCity: "CABA", recipientProvince: "BA", recipientPostalCode: "1000",
    packageWeightKg: 1, packageVolumeCm3: 100, declaredValueArs: 1000, itemsDescription: "Remera"
  });
  assert.equal(result.shipmentId, "PIEZA-999");
  assert.equal(result.provider, "oca");
});

test("OcaShippingProvider.createShipment falls back to orderId when no numeroPieza", async () => {
  mockFetch(async (url) => {
    if (url.includes("/login")) return jsonResponse({ success: true, result: { token: "tok" } });
    return jsonResponse({ success: true, result: {} });
  });
  const provider = new OcaShippingProvider(config);
  const result = await provider.createShipment({
    orderId: "ORD-FALLBACK", productCode: "OCA_TEST", recipientName: "Juan",
    recipientEmail: "j@test.com", recipientPhone: "111", recipientAddress: "Av 1",
    recipientCity: "CABA", recipientProvince: "BA", recipientPostalCode: "1000",
    packageWeightKg: 1, packageVolumeCm3: 100, declaredValueArs: 1000, itemsDescription: "Remera"
  });
  assert.equal(result.shipmentId, "ORD-FALLBACK");
});

// --- trackShipment ---

test("OcaShippingProvider.trackShipment combines currentStatus and history", async () => {
  let callCount = 0;
  mockFetch(async (url) => {
    if (url.includes("/login")) return jsonResponse({ success: true, result: { token: "tok" } });
    callCount++;
    if (callCount === 1) {
      return jsonResponse({ success: true, result: { estado: "En tránsito" } });
    }
    return jsonResponse({ success: true, result: [{ fecha: "2026-04-29", estado: "Ingresado", sucursal: "CABA" }] });
  });
  const provider = new OcaShippingProvider(config);
  const result = await provider.trackShipment("PIEZA-001");
  assert.equal(result.currentStatus, "En tránsito");
  assert.equal(result.history.length, 1);
  assert.equal(result.history[0].status, "Ingresado");
});
