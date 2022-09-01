/* eslint-disable vue/one-component-per-file */
import { roundedButtonClassName, buttonClassName, iconStandaloneClassName } from '../styles/shared';
import { classNames } from '../utils/classNames';
import { ConsoleIcon } from '../icons';
import { SandpackTests } from '../components/tests';
import { css } from '../styles';
import { SandpackLayout, SandpackStack } from '../common';
import { SandpackProvider } from '../contexts/sandpackContext';
import {
  CodeEditorProps,
  SandpackCodeEditor,
  SandpackConsole,
  SandpackPreview,
} from '../components';
import {
  computed,
  DefineComponent,
  defineComponent,
  Fragment,
  PropType,
  ref,
} from 'vue';
import {
  SandpackFiles,
  SandpackInternal,
  SandpackInternalOptions,
  SandpackInternalProps,
  SandpackPredefinedTemplate,
  SandpackSetup,
  SandpackThemeProp,
  TemplateFiles,
} from '../types';
import { SANDBOX_TEMPLATES } from '..';

const SandpackPropValues = {
  files: {
    type: Object as PropType<SandpackFiles>,
    required: false,
    default: undefined,
  },
  template: {
    type: String as PropType<SandpackPredefinedTemplate>,
    required: false,
    default: undefined,
  },
  customSetup: {
    type: Object as PropType<SandpackSetup>,
    required: false,
    default: undefined,
  },
  theme: {
    type: [String, Object] as PropType<SandpackThemeProp>,
    required: false,
    default: undefined,
  },
  options: {
    type: Object,
    required: false,
    default: undefined,
  },
};

/**
 * Sandpack component
 */
// @ts-ignore
const Sandpack = defineComponent({
  name: 'Sandpack',
  props: SandpackPropValues,
  setup(props: SandpackInternalProps<unknown, SandpackPredefinedTemplate>) {
    const codeEditorOptions = computed<CodeEditorProps>(() => ({
      showTabs: props.options?.showTabs,
      showLineNumbers: props.options?.showLineNumbers,
      showInlineErrors: props.options?.showInlineErrors,
      wrapContent: props.options?.wrapContent,
      closableTabs: props.options?.closableTabs,
      initMode: props.options?.initMode,
      extensions: props.options?.codeEditor?.extensions,
      extensionsKeymap: props.options?.codeEditor?.extensionsKeymap,
      readOnly: props.options?.readOnly,
      showReadOnly: props.options?.showReadOnly,
      id: props.options?.id,
    }));

    const providerOptions = computed<SandpackInternalOptions<SandpackFiles, SandpackPredefinedTemplate>>(() => ({
      /**
       * TS-why: Type 'string | number | symbol' is not assignable to type 'string'
       */
      activeFile: props.options?.activeFile as unknown as string,
      visibleFiles: props.options?.visibleFiles as unknown as string[],
      recompileMode: props.options?.recompileMode,
      recompileDelay: props.options?.recompileDelay,
      autorun: props.options?.autorun,
      bundlerURL: props.options?.bundlerURL,
      startRoute: props.options?.startRoute,
      skipEval: props.options?.skipEval,
      fileResolver: props.options?.fileResolver,
      initMode: props.options?.initMode,
      initModeObserverOptions: props.options?.initModeObserverOptions,
      externalResources: props.options?.externalResources,
      logLevel: props.options?.logLevel,
      classes: props.options?.classes,
    }));

    const consoleVisibility = ref(props.options?.showConsole ?? false);
    const counter = ref(0);

    /**
     * Parts are set as `flex` values, so they set the flex shrink/grow
     * Cannot use width percentages as it doesn't work with
     * the automatic layout break when the component is under 700px
     */
    const editorPart = computed(() => props.options?.editorWidthPercentage || 50);
    const previewPart = computed(() => 100 - editorPart.value);
    // const editorHeight = computed(() => {
    //   let height: string | number | undefined = props.options?.editorHeight;
    //   if (height) {
    //     height = typeof height === 'number' ? `${height}px` : height;
    //   }
    //   return props.options?.editorHeight ? height : undefined;
    // });

    const RightColumn = computed(() => props.options?.showConsole || props.options?.showConsoleButton
      ? SandpackStack
      : Fragment);

    const rightColumnStyle = computed(() => ({
      flexGrow: previewPart.value,
      flexShrink: previewPart.value,
      minWidth: 700 * (previewPart.value / (previewPart.value + editorPart.value)),
      gap: consoleVisibility.value ? 1 : 0,
      height: props.options?.editorHeight, // use the original editor height
      flex: 1,
    }));

    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const templateFiles = computed(() => SANDBOX_TEMPLATES[props.template!] ?? {});
    const mode = computed(() => 'mode' in templateFiles.value ? templateFiles.value.mode : 'preview');

    const actionsChildren = computed(() => props.options?.showConsoleButton ? (
      <ConsoleCounterButton
        counter={counter.value}
        onClick={() => { consoleVisibility.value = !consoleVisibility.value; }}
      />
    ) : undefined);

    return () => (
      <SandpackProvider
        customSetup={props.customSetup}
        files={props.files as TemplateFiles<SandpackPredefinedTemplate>}
        options={providerOptions.value}
        template={props.template as SandpackPredefinedTemplate}
        theme={props.theme}
      >
        <SandpackLayout>
          <SandpackCodeEditor
            {...codeEditorOptions.value}
            style={{
              height: props.options?.editorHeight, // use the original editor height
              flexGrow: editorPart.value,
              flexShrink: editorPart.value,
              minWidth: 700 * (editorPart.value / (previewPart.value + editorPart.value)),
            }}
          />
          {/* @ts-ignore */}
          <RightColumn.value style={rightColumnStyle}>
            {mode.value === 'preview' && (
              <SandpackPreview
                actionsChildren={actionsChildren.value}
                showNavigator={props.options?.showNavigator}
                showRefreshButton={props.options?.showRefreshButton}
                style={rightColumnStyle}
              />
            )}
            {mode.value === 'tests' && (
              <SandpackTests
                actionsChildren={actionsChildren.value}
                style={rightColumnStyle.value}
              />
            )}

            {(props.options?.showConsoleButton || consoleVisibility) && (
              <div
                class={consoleWrapper.toString()}
                style={{
                  flex: consoleVisibility.value ? 0.5 : 0,
                }}
              >
                <SandpackConsole
                  onLogsChange={(logs) => { counter.value = logs.length; }}
                  showHeader={false}
                />
              </div>
            )}
          </RightColumn.value>
        </SandpackLayout>
      </SandpackProvider>
    );
  },
}) as SandpackInternal;

interface IConsoleCounterButtonProp {
  onClick: () => void;
  counter: number;
}

const ConsoleCounterButton = defineComponent({
  props: {
    onClick: {
      type: Function,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
    },
  },
  // @ts-ignore
  setup(props: IConsoleCounterButtonProp) {
    return () => (
      <button
        class={classNames(
          buttonClassName,
          iconStandaloneClassName,
          roundedButtonClassName,
          buttonCounter,
        )}
        onClick={() => { props.onClick(); }}
      >
        <ConsoleIcon />
        {props.counter > 0 && <span>{props.counter}</span>}
      </button>
    );
  },
}) as DefineComponent<IConsoleCounterButtonProp>;

const buttonCounter = css({
  position: 'relative',

  span: {
    background: '$colors$clickable',
    color: '$colors$surface1',
    minWidth: 12,
    height: 12,
    padding: '0 2px',
    borderRadius: 12,
    fontSize: 8,
    lineHeight: '12px',
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

const consoleWrapper = css({
  transition: 'flex $transitions$default',
  width: '100%',
  overflow: 'hidden',
});

export { Sandpack };
