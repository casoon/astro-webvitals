import { defineConfig } from "astro/config";
import { webVitalsDashboard } from "@casoon/astro-webvitals/integration";

export default defineConfig({
	integrations: [webVitalsDashboard()],
});
