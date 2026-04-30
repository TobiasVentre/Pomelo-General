import assert from "node:assert/strict";
import test from "node:test";
import { QuoteShippingService } from "../../../src/application/services/quote-shipping.service";
import type { ShippingQuoteResult } from "../../../src/application/contracts/gateways/shipping-provider";

const quoteResult: ShippingQuoteResult = {
  provider: "oca", serviceCode: "OCA_TEST", serviceName: "OCA Epak",
  estimatedDaysMin: 2, estimatedDaysMax: 6, priceArs: 8000, currency: "ARS"
};

test("QuoteShippingService delegates to provider and returns quote", async () => {
  const provider = { quote: async () => quoteResult, createShipment: async () => { throw new Error(); }, trackShipment: async () => { throw new Error(); } };
  const result = await new QuoteShippingService(provider).execute({ postalCode: "1000", itemsCount: 2, subtotalArs: 50000 });
  assert.deepEqual(result, quoteResult);
});

test("QuoteShippingService propagates provider error", async () => {
  const provider = { quote: async () => { throw new Error("OCA error"); }, createShipment: async () => { throw new Error(); }, trackShipment: async () => { throw new Error(); } };
  await assert.rejects(new QuoteShippingService(provider).execute({ postalCode: "1000", itemsCount: 1, subtotalArs: 0 }), /OCA error/);
});
