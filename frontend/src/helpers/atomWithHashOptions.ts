// By default the serialisation will JSON encode so it becomes `id="1"` rather than `id=1`

const optionalReplaceState = (searchParams: string): void => {
  console.log(searchParams);
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}#${searchParams}`,
  );
};

export const atomWithHashOptions = {
  serialize: (s) => s ?? '',
  deserialize: (s) => s ?? '',
  setHash: optionalReplaceState, //'replaceState', //otherwise we get a 'double history' when changing View and ID
};
