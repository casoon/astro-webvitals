import { webVitalsDashboard } from "@casoon/astro-webvitals/integration";
import { defineConfig } from "astro/config";

// Demo project for the website showcase. `node examples/capture.mjs` builds it and
// writes what the component and the integration generate to examples/output/.
export default defineConfig({
	integrations: [webVitalsDashboard()],
});
