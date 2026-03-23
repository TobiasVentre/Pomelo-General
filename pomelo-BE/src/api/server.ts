import { buildApp } from "./app";
import { env } from "../infrastructure/config/env";

const app = buildApp();

app.listen(env.appPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Pomelo-BE running on port ${env.appPort}`);
});
