import type { Config } from "drizzle-kit";

export default {
	schema: "./src/db/schema.ts",
	out: "./migrations",
	driver: "d1",
	dbCredentials: {
		wranglerConfigPath: "wrangler.toml",
		dbName: "my-next-app-db",
	},
} satisfies Config;
