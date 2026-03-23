export interface ShippingQuoteInput {
  postalCode: string;
  itemsCount: number;
  subtotalArs: number;
}

export interface ShippingQuoteResult {
  provider: "oca";
  serviceCode: string;
  serviceName: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  priceArs: number;
  currency: "ARS";
  notes?: string;
}

export interface CreateShipmentInput {
  orderId: string;
  productCode: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientProvince: string;
  recipientPostalCode: string;
  packageWeightKg: number;
  packageVolumeCm3: number;
  declaredValueArs: number;
  itemsDescription: string;
}

export interface CreateShipmentResult {
  provider: "oca";
  shipmentId: string;
  labelUrl?: string;
  raw: unknown;
}

export interface ShipmentTrackingEvent {
  date: string | null;
  status: string;
  detail?: string;
}

export interface TrackShipmentResult {
  provider: "oca";
  shipmentId: string;
  currentStatus: string;
  history: ShipmentTrackingEvent[];
  raw: unknown;
}

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult>;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment(shipmentId: string): Promise<TrackShipmentResult>;
}
