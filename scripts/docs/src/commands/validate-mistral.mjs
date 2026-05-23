import { loadConfig } from '../core/config.mjs';
import {
  resolveMistralCredentials,
  resolveMistralRequestOptions,
  validateMistralApiKey,
} from '../services/mistral.mjs';

export async function runValidateMistral(env = process.env) {
  const config = await loadConfig();
  const { apiKey, model } = resolveMistralCredentials(env, config);
  const { retry } = resolveMistralRequestOptions(env, config);
  const fallbackModels = config.mistral.validateFallbackModels ?? [];
  const validatedModel = await validateMistralApiKey(apiKey, model, { retry, fallbackModels });
  return validatedModel;
}
