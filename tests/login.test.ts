import { expect, test } from 'vitest';
import { graphql } from 'graphql';

import { schema } from '../backend/graphql/schema';

test('Login Mutation Works', async () => {
  // const response = await fetch('http://localhost:6969/graphql', {
  //   headers: {
  //     'content-type': 'application/json',
  //   },
  //   body: '{"operationName":"login","query":"mutation login($username: String!, $password: String!) {\\n  auth(user: $username, password: $password)\\n}","variables":{"password":"cd","username":"ab"}}',
  //   method: 'POST',
  // });
  // const text = await response.json();
  //
  // console.log(text);

  const query = `mutation login($username: String!, $password: String!) {
  auth(user: $username, password: $password)
  }`;

  const variables = { username: 'ab', password: 'cd' };

  const result = await graphql({
    schema: schema,
    source: query,
    variableValues: variables,
  });

  console.log(result);

  expect(result.data.user).to.deep.equal({
    name: 'John',
    email: 'john@example.com',
  });
});
