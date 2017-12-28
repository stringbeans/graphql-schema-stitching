import * as express from 'express'
import * as bodyParser from 'body-parser'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'

import {
  makeExecutableSchema,
  makeRemoteExecutableSchema,
  addMockFunctionsToSchema,
  mergeSchemas,
  introspectSchema
} from 'graphql-tools'

import { HttpLink } from 'apollo-link-http'
import * as fetch from 'node-fetch'
import { setContext } from 'apollo-link-context';

const createLocalSchema = () => {
  const typeDefs = `
    type Query {
      hello: String
    }
  `

  const resolvers = {
    Query: {
      hello: (_, args, context) => {
        return 'world'
      }
    }
  }

  return makeExecutableSchema({
    typeDefs,
    resolvers
  })
}

const startServer = (schema) => {
  const PORT = 3000

  const app = express();

  // bodyParser is needed just for POST.
  app.use('/graphql', bodyParser.json(), (req, res, next) => {
    return graphqlExpress({
      schema,
      context: {
        headers: req.headers
      }
    })(req, res, next)
  })

  app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

  app.listen(PORT);
}

const getRemoteExecutableSchema = async () => {
  const http = new HttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch
  })
  
  const link = setContext((request, previousContext) => {
    const headers = (previousContext && previousContext.graphqlContext && previousContext.graphqlContext.headers) || {}
    // passthrough original authorization headers to the schema-stitched request so that the other server can perform authentication properly
    return {
      headers: {
        authorization: headers.authorization
      }
    }
  }).concat(http)

  const remoteSchema = await introspectSchema(link)
  
  return makeRemoteExecutableSchema({
    schema: remoteSchema,
    link
  })
}

getRemoteExecutableSchema()
  .then((remoteExecutableSchema) => {
    startServer(mergeSchemas({
      schemas: [createLocalSchema(), remoteExecutableSchema]
    }))
  })