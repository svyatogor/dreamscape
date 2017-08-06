import GraphQLJSON from 'graphql-type-json'

const resolvers = {
  Query: {
    ...require('./page').default.queries,
    ...require('./static_text').default.queries,
    ...require('./site').default.queries
  },
  Mutation: {
    ...require('./page').default.mutations,
    ...require('./static_text').default.mutations
  },
  JSON: GraphQLJSON
}

export default resolvers
