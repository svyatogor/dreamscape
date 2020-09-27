import {Site, Item} from '../models'
import Promise from 'bluebird'
import {get, flatten, flattenDeep} from 'lodash'
import SearchService from '../services/search'

async function reindexCatalog(site, catalog) {
    const cursor = Item.find({ site: site.id, catalog, deleted: false }).batchSize(100).cursor()
    const schema = site.documentTypes[catalog]
    var batch = [] // declared as var on purpose
    console.error('This cose does not function anymore as toSearchbaleDocument is not asycn')
    const index = batch => {
        const body = flattenDeep(batch.map(item => {
            return site.supportedLanguages.map(l => {
                return [
                    {index: {_index: l, _type: `${catalog}-${site.id}`, _id: item.id}},
                    item.toSearchableDocument(schema, site, l)
                ]
            })
        }))
        return SearchService.bulk({body}).then((r) => {
            console.log(r.items.map(i => i.index))
        })
    }

    await cursor.eachAsync(item => {
        if (batch.length < 100) {
            batch.push(item)
            return
        }

        return index(batch).then(() => {
            batch = []
        })
    }, {parallel: 1})

    if (batch.length > 0) {
        await index(batch)
    }
}

export default async function() {
    const sites = await Site.model().find({})
    const catalogs = sites.map(site =>
        Object.keys(get(site, 'documentTypes', {})).map(catalog => ({site, catalog}))
    )
    await Promise.map(flatten(catalogs), ({site, catalog}) => {
        return reindexCatalog(site, catalog)
    }, {concurrency: 1})
}