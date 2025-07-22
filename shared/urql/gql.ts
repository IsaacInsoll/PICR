// This is a .js file that imports .ts and is only used by other .ts files
// I had to do this because otherwise I couldn't figure out a solution that works with app (npx expo export)
// and frontend (npm run build) as one of them would complain about imports

import { graphql as gql } from '../gql/gql';

export { gql };
