import { GraphQLEnumType } from 'graphql';

export const themeModeEnum = new GraphQLEnumType({
  name: 'ThemeMode',
  values: {
    auto: { value: 'auto' },
    light: { value: 'light' },
    dark: { value: 'dark' },
  },
});

export const primaryColorEnum = new GraphQLEnumType({
  name: 'PrimaryColor',
  values: {
    dark: { value: 'dark' },
    gray: { value: 'gray' },
    red: { value: 'red' },
    pink: { value: 'pink' },
    grape: { value: 'grape' },
    violet: { value: 'violet' },
    indigo: { value: 'indigo' },
    blue: { value: 'blue' },
    cyan: { value: 'cyan' },
    green: { value: 'green' },
    lime: { value: 'lime' },
    yellow: { value: 'yellow' },
    orange: { value: 'orange' },
    teal: { value: 'teal' },
  },
});
