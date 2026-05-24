import React, { useEffect, useMemo, useState } from 'react';
import { AddonPanel, SyntaxHighlighter } from 'storybook/internal/components';
import {
  addons,
  types,
  useChannel,
  useStorybookApi,
} from 'storybook/manager-api';
import { styled, useTheme, themes, ThemeProvider, convert } from 'storybook/theming';

const ADDON_ID = 'open-task/vue-usage';
const PANEL_ID = `${ADDON_ID}/panel`;
const PARAM_KEY = 'docs';
const VUE_USAGE_SNIPPET = 'open-task/vue-usage/snippet';

const PanelRoot = styled.div({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '12px 0',
  overflow: 'auto',
  boxSizing: 'border-box',
});

const Section = styled.div({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

const SectionTitle = styled.div(({ theme }) => ({
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: theme.textMutedColor,
  padding: '0 12px 6px',
}));

const CodeWrap = styled.div({
  flex: '1 1 auto',
  minHeight: 80,
  '& > pre': {
    margin: '0 12px !important',
    maxHeight: 'none !important',
    height: 'auto !important',
  },
});

const EmptyHint = styled.p(({ theme }) => ({
  margin: '0 12px',
  fontSize: 12,
  color: theme.textMutedColor,
  fontStyle: 'italic',
}));

type UsageParts = { template: string | null; script: string | null };

function UsageCodeBlock({ code, dark }: { code: string; dark: boolean }) {
  const theme = useTheme();
  const overrideTheme = dark ? themes.dark : themes.light;

  return (
    <ThemeProvider
      theme={convert({
        ...overrideTheme,
        fontCode: theme.typography.fonts.mono,
        fontBase: theme.typography.fonts.base,
      })}
    >
      <SyntaxHighlighter language="vue" bordered copyable showLineNumbers={false}>
        {code}
      </SyntaxHighlighter>
    </ThemeProvider>
  );
}

function VueUsagePanel({ active }: { active: boolean }) {
  const api = useStorybookApi();
  const channel = api.getChannel();
  const currentStory = api.getCurrentStoryData();
  const lastEvent = channel?.last(VUE_USAGE_SNIPPET)?.[0] as
    | { template?: string; script?: string }
    | undefined;

  const [parts, setParts] = useState<UsageParts>({
    template: lastEvent?.template ?? null,
    script: lastEvent?.script ?? null,
  });
  const isDark = useTheme().base !== 'light';

  useEffect(() => {
    setParts({ template: null, script: null });
  }, [currentStory?.id]);

  useChannel({
    [VUE_USAGE_SNIPPET]: (payload: { template?: string; script?: string }) => {
      setParts({
        template: payload.template ?? null,
        script: payload.script ?? null,
      });
    },
  });

  const display = useMemo(() => parts, [parts]);

  return (
    <AddonPanel active={active}>
      <PanelRoot>
        <Section>
          <SectionTitle>Template</SectionTitle>
          {display.template ? (
            <CodeWrap>
              <UsageCodeBlock code={display.template} dark={isDark} />
            </CodeWrap>
          ) : (
            <EmptyHint>Chargement du template…</EmptyHint>
          )}
        </Section>

        <Section>
          <SectionTitle>Script</SectionTitle>
          {display.script ? (
            <CodeWrap>
              <UsageCodeBlock code={display.script} dark={isDark} />
            </CodeWrap>
          ) : (
            <EmptyHint>Chargement du script…</EmptyHint>
          )}
        </Section>
      </PanelRoot>
    </AddonPanel>
  );
}

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    title: 'Usage',
    type: types.PANEL,
    paramKey: PARAM_KEY,
    disabled: (parameters) => !parameters?.docs?.vueUsagePanel,
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => <VueUsagePanel active={!!active} />,
  });
});
