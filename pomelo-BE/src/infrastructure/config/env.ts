import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appPort: Number(process.env.APP_PORT ?? 4000),
  mysqlHost: required("MYSQL_HOST"),
  mysqlPort: Number(process.env.MYSQL_PORT ?? 3306),
  mysqlDatabase: required("MYSQL_DATABASE"),
  mysqlUser: required("MYSQL_USER"),
  mysqlPassword: required("MYSQL_PASSWORD"),
  ocaApiBaseUrl: process.env.OCA_API_BASE_URL ?? "https://testsvc.oca.com.ar/WS_OEP_TEST",
  ocaLoginPath: process.env.OCA_LOGIN_PATH ?? "/OCAGEOApiController/Login",
  ocaCreateShipmentPath:
    process.env.OCA_CREATE_SHIPMENT_PATH ?? "/Oep_TrackEPak.asmx/IngresarOrdenRetiro",
  ocaTrackCurrentStatusPath:
    process.env.OCA_TRACK_CURRENT_STATUS_PATH ?? "/Oep_TrackEPak.asmx/EstadoActual",
  ocaTrackHistoryPath:
    process.env.OCA_TRACK_HISTORY_PATH ?? "/Oep_TrackEPak.asmx/HistorialSeguimiento",
  ocaClient: process.env.OCA_CLIENT ?? "OCA_APIGEO",
  ocaUser: process.env.OCA_USER ?? "OCA_APIGEO",
  ocaPassword: process.env.OCA_PASSWORD ?? "oca",
  ocaProductCode: process.env.OCA_PRODUCT_CODE ?? "OCA_TEST"
};
