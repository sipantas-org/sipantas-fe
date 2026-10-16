import { useDark, useToggle } from '@vueuse/core'

// Imported in main.ts so the dark class is set before first render.
export const isDark = useDark({ storageKey: 'sipantas.mode', valueLight: 'light' })
export const toggleDark = useToggle(isDark)
