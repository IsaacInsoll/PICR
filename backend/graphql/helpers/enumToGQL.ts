export const enumToGQL = (
  name: string,
  options: readonly string[],
  lowerCaseValues?: boolean,
) => {
  const values = options.reduce((a, v) => {
    const vl = lowerCaseValues ? v.toLowerCase() : v;
    return { ...a, [vl]: { value: vl } };
  }, {});
  return { name, values };
};
