// By default the serialisation will JSON encode so it becomes `id="1"` rather than `id=1`

export const atomWithHashOptions = {
  serialize: (s: string) => s ?? '',
  deserialize: (s: string) => s ?? '',
  setHash: 'replaceState' as const, //otherwise we get a 'double history' when changing View and ID
};
