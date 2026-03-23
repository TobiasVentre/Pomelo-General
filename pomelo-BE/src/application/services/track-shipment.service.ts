import type {
  ShippingProvider,
  TrackShipmentResult
} from "../contracts/gateways/shipping-provider";

export class TrackShipmentService {
  constructor(private readonly shippingProvider: ShippingProvider) {}

  async execute(shipmentId: string): Promise<TrackShipmentResult> {
    return this.shippingProvider.trackShipment(shipmentId);
  }
}
