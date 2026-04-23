const THEMES = {
  'Мята': {
    name: 'mint',
    formBg: 'bg-emerald-50',
    formBorder: 'border-emerald-200',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    focusRing: 'focus:ring-emerald-500',
    headingText: 'text-emerald-800',
    cardBorder: 'border-emerald-200',
    cardAccent: 'bg-emerald-500',
    payBg: 'bg-emerald-50',
    payText: 'text-emerald-800',
    diffText: 'text-emerald-700',
  },
  'Тушино-Спартак': {
    name: 'spartak',
    formBg: 'bg-red-50',
    formBorder: 'border-red-200',
    button: 'bg-red-600 hover:bg-red-700',
    focusRing: 'focus:ring-red-500',
    headingText: 'text-red-800',
    cardBorder: 'border-red-200',
    cardAccent: 'bg-red-600',
    payBg: 'bg-red-50',
    payText: 'text-red-800',
    diffText: 'text-red-700',
  },
};

const DEFAULT_THEME = {
  name: 'default',
  formBg: 'bg-zinc-50',
  formBorder: 'border-zinc-200',
  button: 'bg-blue-600 hover:bg-blue-700',
  focusRing: 'focus:ring-blue-500',
  headingText: 'text-zinc-900',
  cardBorder: 'border-zinc-200',
  cardAccent: 'bg-blue-500',
  payBg: 'bg-blue-50',
  payText: 'text-blue-700',
  diffText: 'text-emerald-600',
};

export function getTheme(complex) {
  return THEMES[complex] ?? DEFAULT_THEME;
}
