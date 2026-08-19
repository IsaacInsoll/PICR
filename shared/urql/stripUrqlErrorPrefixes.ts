const urqlErrorPrefixes = /^(?:\[(?:GraphQL|Network)\] )+/gm;

export const stripUrqlErrorPrefixes = (message: string): string =>
  message.replace(urqlErrorPrefixes, '');
