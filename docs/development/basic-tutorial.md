# Basic Tutorial

This is just a few basic guides and tips for somebody getting started with this project. 

This isn't how things _must_ be done, but if you aren't sure how to do something then this way works 🙂

## Example: Add `latestComment` field to `File`

We could calculate this every time, but it's easier to just add this field and then sorting by latest comment is easy and fast.

### Add field to database
Edit `backend/models/File.ts` which is our database model (powered by Sequelize) to add the field. 
Either review sequelize docs or just find a simlar field that already exists (in this case I copied from `lastModified` which was also a DateTime field)

```
@Column
declare latestComment: Date;
```

If you are running the dev server then saving this file should cause an instant server restart

**RESULT**: `File` table in the postgres server will have the `lastModified` column if you inspect it using DB tools

### Add field to GraphQL
GraphQL is the API we use to communicate between the backend and the frontend. 
These files are typically named `<Model>Type` so lets edit `backend/graphql/types/fileType.ts`

Whoops! This is a bad example as `File` implements `FileInterface` which has all the fields on it.
We did this so that `Video` and `Image` could also use `FileInterface` and get all those fields and more. 
Let's open `backend/graphql/interfaces/fileInterface.ts`

```javascript
{ 
  fileLastModified: { type: new GraphQLNonNull(GraphQLDateTime) } //existed already
  latestComment: { type: GraphQLDateTime } //just added
}
```

There are only a few GraphQL base types and luckily this field is one of them (`GraphQLDateTime`). 
Note that you usually wrap a type inside a `new GraphQLNonNull(<type>)` if it's non-nullable. 
We try and use non-null as much as we can as it's clearer but in this case we definitely want nullable as the 
file might not have a comment at all.

Once you save the file, our GQL server will now be showing that it offers this extra field. 
We want to update all the stuff that needs to know about this, so run `npm run gql` to do a GraphQL Codegen 
which should then show some updated auto-generated files:
- `schema.graphql` this is what your IDE uses to autocomplete/validate the GraphQL queries you write in the frontend
- `graphql-types.ts` this is typescript types of what is in graphQL which we can use to type things we are working with
- `graphql.schema.json` used by URQL to do amazing caching work

You can check `codegen.ts` if you want to learn more. 
You will never need to edit these files manually but they should be commited when you make changes to graphql. 

**RESULT**: If you use a graphQL client (Either built into your IDE or standalone like Altair) you should see the extra field is available in our GraphQL API

### Resolve the field in GraphQL

Now we have a field in the database we can use, and our API offers a field (presumably with the same name).

Our next step is to plumb them together so the API knows where to look for that field. We would also do authentication/validation here (IE: check if user has permission for this particular field)

Check `backend/graphql/queries/file.ts` and we can see that currently we are returning almost all the fields from the DB already so there is no need to add anything here. 
There would be work required if we were adding a relationship, dynamically calculated data, or per-user result info.

### Update the frontend to ask for the data

There are two operations done in GraphQL: queries (read) or mutation (create/modify/delete)
Additionally, to prevent us rewriting the same queries over and over we try to use `Fragments` which is a 'snippet' of commonly queried fields. 
All references to `File` in our queries just use `FileFragment` which is stored in `frontend/src/urql/fragments/fileFragment.tsx`
As you start typing the field name it should autocomplete if your graphql plugin is working correctly in the IDE and you have done the previous steps correctly. 

Now, do a `npm run gql` again which will update the typescript types for the result of this query. 
Note that you could have skipped the previous codegen run, edited this fragment, then run the codegen once to do all necessary changes, but you wouldn't have learned as much and wouldn't have got the autocomplete in this step. 

### Use that data in the frontend

Now every file we query has that new `latestComment` field, so lets update the UI to show it, or maybe allow sorting by it. 
This will involve editing some `*.tsx` file in the `frontend` but where you go from here depends on what you are trying to achieve, good luck! 

