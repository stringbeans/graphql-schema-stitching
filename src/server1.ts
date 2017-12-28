import * as express from 'express'
import * as bodyParser from 'body-parser'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import {
  makeExecutableSchema,
  makeRemoteExecutableSchema,
  addMockFunctionsToSchema,
  mergeSchemas,
  introspectSchema
} from 'graphql-tools'

import { HttpLink } from 'apollo-link-http'
import * as fetch from 'node-fetch'

const link = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  fetch
})

const localSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          console.log('resolving!')
          return 'world'
        }
      }
    }
  })
})

const startServer = (schema) => {
  const PORT = 3000

  const app = express();

  // bodyParser is needed just for POST.
  app.use('/graphql', bodyParser.json(), graphqlExpress({
    schema
  }))

  app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

  app.listen(PORT);
}

introspectSchema(link)
  .then((remoteSchema) => {
    const executableSchema = makeRemoteExecutableSchema({
      schema: remoteSchema,
      link
    })
    
    startServer(mergeSchemas({
      schemas: [localSchema, executableSchema]
    }))
  })