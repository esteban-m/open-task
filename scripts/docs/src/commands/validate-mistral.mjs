import { loadConfig } from '../core/config.mjs';
import { resolveMistralCredentials, validateMistralApiKey } from '../services/mistral.mjs';

export async function runValidateMistral(env = process.env) {
  const config = await loadConfig();
  const { apiKey, model } = resolveMistralCredentials(env, config);
  await validateMistralApiKey(apiKey, model);
  return model;
}
