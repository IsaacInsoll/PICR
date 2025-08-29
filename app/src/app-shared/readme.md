This is stuff that is already in `../shared` that is used by `../frontend` but because it uses React or URQL which expects only one instance to be running it's not working. 

I'm trying to fix this with a monorepo setup but whatever I do doesn't seem to work with metro bundler. 

Minimum steps to reproduce issue: import `useRequery` from shared instead of here for the app and see it crash with `import {useEffect} on null` error

