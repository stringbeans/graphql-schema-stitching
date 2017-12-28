import * as express from 'express'
import * as bodyParser from 'body-parser'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      world: {
        type: GraphQLString,
        resolve(_, args, context) {
          console.log('context', context)
          return 'hello'
        }
      }
    }
  })
})

const PORT = 4000

const app = express();

// bodyParser is needed just for POST.
app.use('/graphql', bodyParser.json(), (req, res, next) => {
  console.log('headers', req.headers, req.something)
  graphqlExpress({
    schema
  })(req, res, next)
})

app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

app.listen(PORT);