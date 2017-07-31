const resolvers = {
  Query: {
    ...require('./page').default.queries,
    ...require('./static_text').default.queries
  },
  Mutation: {
    ...require('./page').default.mutations,
    ...require('./static_text').default.mutations
  },
}

export default resolvers
