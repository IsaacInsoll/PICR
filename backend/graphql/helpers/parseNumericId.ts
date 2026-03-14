import { GraphQLError } from 'graphql';

export const parseNumericId = (
  value: number | string | null | undefined,
  fieldName: string,
): number => {
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  throw new GraphQLError(`Invalid ${fieldName}`);
};
