import {
  createIntl,
  createIntlCache,
  type IntlShape,
} from '@braw/extended-intl'
import { computed, type ComputedRef, ref } from 'vue'
import type { MessagesMap } from '../types/messages.js'
import { defineRefGetters } from '../utils/definer.js'
import { createHashMap as createHashmap } from '../utils/hashmap.js'
import type { ReverseMap } from '../utils/types.js'
import { observe } from '../utils/vue.js'
import type { ControllerConfiguration } from './config.js'

const formatAliases = {
  formatCompactNumber: 'compactNumber',
  formatCustomMessage: 'customMessage',
  formatDate: 'date',
  formatDateTimeRange: 'dateTimeRange',
  formatDateToParts: 'dateToParts',
  formatDisplayName: 'displayName',
  formatList: 'list',
  formatListToParts: 'listToParts',
  formatMessage: 'message',
  formatNumber: 'number',
  formatNumberToParts: 'numberToParts',
  formatPlural: 'plural',
  formatRelativeTime: 'relativeTime',
  formatTime: 'time',
  formatTimeToParts: 'timeToParts',
  $ago: '$ago',
  formatTimeDifference: 'timeDifference',
} as const satisfies Partial<Record<keyof IntlShape, string>>
// ~~~~~~~
// NOTE: You might need to remove as const so auto-complete works, also you can't place it after satisfier, that's not supported :(

type InvertedMapping = ReverseMap<typeof formatAliases>

/**
 * Represents a map of formatting functions taken from {@link IntlShape} under a
 * shorter name. This is used to define `$fmt` global variable in Vue components
 * when the plugin is installed, as well as a return value for the
 * `useFormatters` runtime function.
 */
export type FormatAliases<T> = {
  [K in keyof InvertedMapping]: IntlShape<T>[InvertedMapping[K]]
}

export interface IntlPartial<T> {
  /**
   * Read-only map of formatting functions taken from {@link IntlShape}.
   *
   * @see {@link FormatAliases} for details.
   */
  get formats(): FormatAliases<T>

  /** Active {@link IntlShape} instance. */
  get intl(): IntlShape<T>
}

export function useIntlPartial<ControllerType>(
  $config: ControllerConfiguration<ControllerType>,
  $messages: ComputedRef<Partial<MessagesMap>>,
): IntlPartial<ControllerType> {
  const $formats = ref(createHashmap() as FormatAliases<ControllerType>)

  const intlCache = createIntlCache()

  const $intl = computed(() =>
    createIntl<ControllerType>(
      {
        locale: $config.locale,
        defaultLocale: $config.defaultLocale,
        messages: $messages.value as MessagesMap,
      },
      intlCache,
    ),
  )

  observe($intl, (intl) => {
    const formats = $formats.value as Record<keyof InvertedMapping, unknown>
    for (const [intlProp, alias] of Object.entries(formatAliases)) {
      formats[alias] = intl[intlProp as keyof IntlShape<ControllerType>]
    }
  })

  return defineRefGetters({ $formats, $intl })
}