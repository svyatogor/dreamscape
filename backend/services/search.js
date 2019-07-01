import elasticsearch from 'elasticsearch'

class Search {
  constructor() {
    this.client = new elasticsearch.Client({
      host: process.env.BONSAI_URL,
    })
  }

  get indices() {
    return this.client.indices
  }

  index(args) {
    return this.client.index(args)
  }

  search(args) {
    return this.client.search(args)
  }

  delete(args) {
    return this.client.delete(args)
  }

  simple_search(query, type, locale, fields) {
    const params = {
      index: locale,
      type,
      size: 10000,
      body: {
        query: {
          simple_query_string: {
            default_operator: 'AND',
            query,
          }
        }
      }
    }

    if (fields) {
      params.body.query.simple_query_string.fields = fields
    }
    return this.search(params).then(r =>
      r.hits.hits.map((r) => r._id)
    )
  }

  bulk(args) {
    return this.client.bulk(args)
  }
}

export default new Search()