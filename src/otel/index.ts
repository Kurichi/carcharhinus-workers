import { ResolveConfigFn, instrument } from "@microlabs/otel-cf-workers";

export interface Env {
	HONEYCOMB_API_KEY: string;
}

export const config: ResolveConfigFn = (env: Env, _trigger) => {
	return {
		exporter: {
			url: "https://api.honeycomb.io/v1/traces",
			headers: { "x-honeycomb-team": env.HONEYCOMB_API_KEY },
		},
		service: { name: "carcharhinus" },
	};
};
