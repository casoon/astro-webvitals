import { defineConfig } from "astro/config";
import { webVitalsDashboard } from "../../../src/integration";

export default defineConfig({
	integrations: [webVitalsDashboard()],
});
