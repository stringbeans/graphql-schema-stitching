# graphql-schema-stitching
My experiment to learn schema stitching in graphql

## Setup Instructions
1. `npm i`
2. `gulp build`
3. start server2 by running `node dist/server2.js`
4. in a separate prompt, start server1 by running `note dist/server1.js`
5. navigate to `localhost:3000/graphiql`

## Findings
* `graphql-tools` provides an easy way to "stitch" together multiple schemas into a single schema. The multiple schemas can be EITHER local schemas or remote schemas. 
* you can "extend" graphql types and provide resolvers that will query remote schemas: https://www.apollographql.com/docs/graphql-tools/schema-stitching.html#adding-resolvers
* there is currently no way to run a resolver BEFORE executing a root query to a remote schema.
* in a microserviced graphql architecture, authentication should ideally take place on each microserviced graphql server (and not centrally in the "gateway" server)... this is achieved by having the gateway just pass along the authorization header when stitching together the schemas and requests

## Relevant links
* https://www.apollographql.com/docs/graphql-tools/remote-schemas.html
* https://www.apollographql.com/docs/graphql-tools/schema-stitching.html
