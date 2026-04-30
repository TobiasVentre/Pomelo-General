import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentTrackingEvent,
  ShippingProvider,
  ShippingQuoteInput,
  ShippingQuoteResult,
  TrackShipmentResult
} from "../../application/contracts/gateways/shipping-provider";
import type { ILogger } from "../../application/contracts/logger";
import { UpstreamError } from "../../application/errors/upstream-error";

export interface OcaShippingProviderConfig {
  apiBaseUrl: string;
  loginPath: string;
  createShipmentPath: string;
  trackCurrentStatusPath: string;
  trackHistoryPath: string;
  client: string;
  user: string;
  password: string;
  productCode: string;
  logger?: ILogger;
}

type OcaLoginResponse = {
  success?: boolean;
  message?: string;
  result?: { token?: string } | string | null;
};

type OcaApiResponse = {
  success?: boolean;
  message?: string;
  result?: unknown;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export class OcaShippingProvider implements ShippingProvider {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly config: OcaShippingProviderConfig) {}

  private buildUrl(path: string): string {
    return `${normalizeBaseUrl(this.config.apiBaseUrl)}${normalizePath(path)}`;
  }

  private async authenticate(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.accessTokenExpiresAt > now + 20_000) {
      return this.accessToken;
    }

    const response = await fetch(this.buildUrl(this.config.loginPath), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: this.config.client,
        user: this.config.user,
        usuario: this.config.user,
        password: this.config.password
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new UpstreamError("OCA", `login failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as OcaLoginResponse;
    if (json.success === false) {
      throw new UpstreamError("OCA", `login rejected: ${json.message ?? "unknown error"}`);
    }

    let token: string | null = null;
    if (typeof json.result === "string") {
      token = json.result;
    } else if (json.result && typeof json.result === "object") {
      token = readString(json.result as Record<string, unknown>, ["token", "accessToken"]);
    }

    if (!token) {
      throw new UpstreamError("OCA", "login response without token");
    }

    this.accessToken = token;
    this.accessTokenExpiresAt = Date.now() + 10 * 60_000;
    return token;
  }

  private async callOca<T>(
    path: string,
    payload: Record<string, unknown>
  ): Promise<T> {
    const token = await this.authenticate();
    const response = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new UpstreamError("OCA", `request failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as OcaApiResponse;
    if (json.success === false) {
      throw new UpstreamError("OCA", `request rejected: ${json.message ?? "unknown error"}`);
    }

    return (json.result ?? json) as T;
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
    const zip = Number(input.postalCode.replace(/\D/g, ""));
    const zoneMultiplier = Number.isFinite(zip)
      ? zip >= 1000 && zip <= 1999
        ? 1
        : 1.2
      : 1.15;

    const base = 5200;
    const perItem = 900 * Math.max(input.itemsCount, 1);
    const subtotalFactor = input.subtotalArs > 100_000 ? 0.92 : 1;
    const price = Math.round((base + perItem) * zoneMultiplier * subtotalFactor);

    return {
      provider: "oca",
      serviceCode: this.config.productCode,
      serviceName: "OCA Epak",
      estimatedDaysMin: 2,
      estimatedDaysMax: 6,
      priceArs: price,
      currency: "ARS",
      notes:
        "Cotizacion estimada para demo. La creacion y tracking del envio se realizan contra OCA test."
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const payload = {
      retrocompatibilidad: false,
      idFranja: 0,
      idOperativa: 1,
      remito: input.orderId,
      producto: input.productCode || this.config.productCode,
      pesoTotal: input.packageWeightKg,
      volumenTotal: input.packageVolumeCm3,
      valorDeclarado: input.declaredValueArs,
      cantidadBultos: 1,
      observaciones: input.itemsDescription,
      destinatario: {
        nombre: input.recipientName,
        calle: input.recipientAddress,
        codigoPostal: input.recipientPostalCode,
        localidad: input.recipientCity,
        provincia: input.recipientProvince,
        telefono: input.recipientPhone,
        email: input.recipientEmail
      }
    };

    const result = await this.callOca<unknown>(this.config.createShipmentPath, payload);
    const data = asObject(result);
    const shipmentId =
      readString(data, ["numeroPieza", "idPieza", "pieza", "trackingNumber"]) ??
      input.orderId;

    const labelUrl = readString(data, ["etiqueta", "labelUrl", "urlEtiqueta"]);

    return {
      provider: "oca",
      shipmentId,
      labelUrl: labelUrl ?? undefined,
      raw: result
    };
  }

  async trackShipment(shipmentId: string): Promise<TrackShipmentResult> {
    const basePayload = {
      retrocompatibilidad: false,
      idTipoProducto: this.config.productCode,
      idProducto: this.config.productCode,
      numeroPieza: shipmentId
    };

    const [currentResult, historyResult] = await Promise.all([
      this.callOca<unknown>(this.config.trackCurrentStatusPath, basePayload),
      this.callOca<unknown>(this.config.trackHistoryPath, basePayload)
    ]);

    const currentRecord = asObject(currentResult);
    const currentStatus =
      readString(currentRecord, ["estado", "status", "descripcionEstado"]) ?? "En proceso";

    const historyArray = Array.isArray(historyResult)
      ? historyResult
      : [historyResult];
    const history: ShipmentTrackingEvent[] = historyArray.map((event) => {
      const eventRecord = asObject(event);
      return {
        date: readString(eventRecord, ["fecha", "fechaEvento", "timestamp"]),
        status:
          readString(eventRecord, ["estado", "status", "descripcionEstado"]) ?? "Evento",
        detail: readString(eventRecord, ["detalle", "descripcion", "sucursal"]) ?? undefined
      };
    });

    return {
      provider: "oca",
      shipmentId,
      currentStatus,
      history,
      raw: {
        current: currentResult,
        history: historyResult
      }
    };
  }
}
