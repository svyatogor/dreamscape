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
    console.log(args)
    return this.client.index(args)
  }

  search(args) {
    return this.client.search(args)
  }

  simple_search(q, type, locale) {
    return this.search({
      index: locale,
      type,
      size: 10000,
      default_operator: 'AND',
      q,
    })
  }

  bulk(args) {
    return this.client.bulk(args)
  }
}

export default new Search()