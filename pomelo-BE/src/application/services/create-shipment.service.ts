import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShippingProvider
} from "../contracts/gateways/shipping-provider";

export class CreateShipmentService {
  constructor(private readonly shippingProvider: ShippingProvider) {}

  async execute(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    return this.shippingProvider.createShipment(input);
  }
}
