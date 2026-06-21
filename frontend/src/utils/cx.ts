/** Combine CSS module class names, filtering out falsy values. */
export function cx(...classes: (string | undefined | false | null | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}
