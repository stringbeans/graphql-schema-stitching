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
        resolve() {
          console.log('resolving!')
          return 'hello'
        }
      }
    }
  })
})

const PORT = 4000

const app = express();

// bodyParser is needed just for POST.
app.use('/graphql', bodyParser.json(), graphqlExpress({
  schema
}))

app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

app.listen(PORT);