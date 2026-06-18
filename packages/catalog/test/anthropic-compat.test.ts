import { describe, expect, it } from "bun:test";
import { buildAnthropicCompat } from "@oh-my-pi/pi-catalog/compat/anthropic";
import type { ModelSpec } from "@oh-my-pi/pi-catalog/types";

/**
 * Coverage for `buildAnthropicCompat`'s `replayUnsignedThinking` resolution.
 *
 * The contract: unsigned thinking blocks are replayed natively only on
 * endpoints that actually accept them. The canonical `anthropic` provider always
 * fronts the real Anthropic API — even when its baseUrl is overridden to a
 * corporate gateway (e.g. AMD's `llm-api.amd.com/Anthropic`) — which rejects
 * unsigned/empty-signature thinking with HTTP 400. Replaying it natively there
 * (instead of text-demoting) breaks mid-conversation model switches, because
 * `transform-messages` strips the foreign signature on the switch and the
 * encoder would then emit `signature: ""`.
 */

const base: Omit<ModelSpec<"anthropic-messages">, "provider" | "baseUrl"> = {
	api: "anthropic-messages",
	id: "claude-opus-4-8",
	name: "Claude Opus 4.8",
	input: ["text", "image"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	maxTokens: 32_000,
	contextWindow: 200_000,
	reasoning: true,
};

function spec(
	overrides: Pick<ModelSpec<"anthropic-messages">, "provider" | "baseUrl">,
): ModelSpec<"anthropic-messages"> {
	return { ...base, ...overrides };
}

describe("buildAnthropicCompat — replayUnsignedThinking", () => {
	it("keeps the canonical anthropic provider non-replaying behind a custom gateway baseUrl", () => {
		// Regression: AMD LLM gateway override. Non-official baseUrl, reasoning
		// model, but provider id is still canonical `anthropic`.
		const compat = buildAnthropicCompat(
			spec({ provider: "anthropic", baseUrl: "https://llm-api.amd.com/Anthropic" }),
		);
		expect(compat.officialEndpoint).toBe(false);
		expect(compat.replayUnsignedThinking).toBe(false);
	});

	it("keeps official anthropic non-replaying", () => {
		const compat = buildAnthropicCompat(spec({ provider: "anthropic", baseUrl: "https://api.anthropic.com" }));
		expect(compat.officialEndpoint).toBe(true);
		expect(compat.replayUnsignedThinking).toBe(false);
	});

	it("replays unsigned thinking for a custom non-official reasoning provider", () => {
		// A genuinely Anthropic-compatible reasoning endpoint declared under its
		// own provider id (the `spec.reasoning && !official` catch-all) keeps the
		// reasoning chain native on continuation.
		const compat = buildAnthropicCompat(
			spec({ provider: "my-anthropic-proxy", baseUrl: "https://proxy.example.com/anthropic" }),
		);
		expect(compat.officialEndpoint).toBe(false);
		expect(compat.replayUnsignedThinking).toBe(true);
	});

	it("does not replay unsigned thinking for a non-reasoning custom provider", () => {
		const compat = buildAnthropicCompat({
			...base,
			provider: "my-anthropic-proxy",
			baseUrl: "https://proxy.example.com/anthropic",
			reasoning: false,
		});
		expect(compat.replayUnsignedThinking).toBe(false);
	});
});
