import { ENV } from "./_core/env.js";

/**
 * HuggingFace Inference Providers client for meta-llama/Llama-3.1-8B-Instruct
 *
 * Uses the HuggingFace Router (https://router.huggingface.co/v1) which is the
 * current recommended endpoint as of 2025.
 *
 * Llama 3.1 8B Instruct is NOT supported by the "hf-inference" provider.
 * Supported providers: Cerebras, SambaNova, Novita, Fireworks, Featherless AI,
 * Nscale, Nebius AI, OVHcloud, Scaleway.
 *
 * We use Cerebras as the primary provider (fastest: ~1,936 tokens/sec),
 * with Novita as a fallback.
 *
 * Docs: https://huggingface.co/docs/inference-providers/en/tasks/chat-completion
 * Model: https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct
 */
export const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
export const HF_PROVIDER = "cerebras"; // fastest provider for Llama 3.1 8B

const HF_ROUTER_BASE = "https://router.huggingface.co/v1";
const HF_CHAT_URL = `${HF_ROUTER_BASE}/chat/completions`;

/**
 * Invoke Llama 3.1 8B Instruct via HuggingFace Router.
 * The model name must include the provider suffix: "meta-llama/Llama-3.1-8B-Instruct:cerebras"
 *
 * @param {Object} params
 * @param {Array<{role: string, content: string}>} params.messages
 * @param {number} [params.maxTokens]
 * @param {number} [params.temperature]
 * @param {{type: string}} [params.responseFormat]
 * @param {string} [params.provider]
 * @returns {Promise<Object>}
 */
export async function invokeLlama(params) {
  const apiKey = ENV.huggingFaceApiKey;
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not configured");
  }

  const provider = params.provider ?? HF_PROVIDER;
  const modelWithProvider = `${HF_MODEL}:${provider}`;

  const payload = {
    model: modelWithProvider,
    messages: params.messages,
    max_tokens: params.maxTokens ?? 512,
    temperature: params.temperature ?? 0.1,
    stream: false,
  };

  if (params.responseFormat) {
    payload.response_format = params.responseFormat;
  }

  const response = await fetch(HF_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // If Cerebras fails, try Novita as fallback
    if (provider === "cerebras") {
      console.warn(
        `[Llama] Cerebras failed (${response.status}), trying Novita fallback...`
      );
      return invokeLlama({ ...params, provider: "novita" });
    }
    throw new Error(
      `HuggingFace Llama API error (${provider}): ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Quick connectivity test — sends a minimal prompt to verify the API key
 * and model access are working correctly.
 *
 * @returns {Promise<{ok: boolean, model: string, provider: string, error?: string}>}
 */
export async function testLlamaConnection() {
  try {
    const result = await invokeLlama({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Reply with one word only.",
        },
        { role: "user", content: "Say: OK" },
      ],
      maxTokens: 10,
      temperature: 0,
    });
    return {
      ok: true,
      model: result.model ?? `${HF_MODEL}:${HF_PROVIDER}`,
      provider: HF_PROVIDER,
    };
  } catch (err) {
    return {
      ok: false,
      model: HF_MODEL,
      provider: HF_PROVIDER,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
