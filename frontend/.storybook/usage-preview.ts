import type { Decorator } from '@storybook/vue3';
import { addons, useEffect } from 'storybook/preview-api';

import { resolveVueUsage } from './usage-registry';

export const VUE_USAGE_SNIPPET = 'open-task/vue-usage/snippet';

/** Émet template + script complets pour le panneau Usage (registre, pas le générateur SB). */
export const usageSnippetDecorator: Decorator = (storyFn, context) => {
  const story = storyFn();

  useEffect(() => {
    const override = context.parameters?.docs?.vueUsage as
      | { template: string; script: string }
      | undefined;

    const parts =
      override ??
      resolveVueUsage(context.id, (context.args ?? {}) as Record<string, unknown>);

    if (parts?.template && parts?.script) {
      addons.getChannel().emit(VUE_USAGE_SNIPPET, {
        id: context.id,
        template: parts.template,
        script: parts.script,
      });
    }
  }, [context.id, context.parameters?.docs?.vueUsage, JSON.stringify(context.args)]);

  return story;
};
