import type {
  ShippingProvider,
  ShippingQuoteInput,
  ShippingQuoteResult
} from "../contracts/gateways/shipping-provider";

export class QuoteShippingService {
  constructor(private readonly shippingProvider: ShippingProvider) {}

  async execute(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
    return this.shippingProvider.quote(input);
  }
}
