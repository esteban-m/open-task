import type { Decorator } from '@storybook/vue3';
import { addons, useEffect } from 'storybook/preview-api';

import { resolveVueUsage } from './vue-usage';

export const VUE_USAGE_SNIPPET = 'open-task/vue-usage/snippet';

/** Émet le snippet défini dans `parameters.docs.vueUsage` (meta ou story). */
export const usageSnippetDecorator: Decorator = (storyFn, context) => {
  const story = storyFn();

  useEffect(() => {
    const snippet = resolveVueUsage(context.parameters, (context.args ?? {}) as Record<string, unknown>);
    if (snippet?.template && snippet?.script) {
      addons.getChannel().emit(VUE_USAGE_SNIPPET, {
        id: context.id,
        template: snippet.template,
        script: snippet.script,
      });
    }
  }, [context.id, context.parameters, JSON.stringify(context.args)]);

  return story;
};
