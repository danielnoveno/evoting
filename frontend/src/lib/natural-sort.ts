export const naturalSort = new Intl.Collator('id-ID', { numeric: true, sensitivity: 'base' })

export function compareNatural(left: string | number, right: string | number) {
  return naturalSort.compare(String(left), String(right))
}
