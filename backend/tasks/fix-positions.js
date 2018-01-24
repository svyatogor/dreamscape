import {Item} from '../models'
import Promise from 'bluebird'

export default async function() {
  const items = await Item.where({folder: process.argv[3]})
  await Promise.map(items, (item, index) => {
    item.set('position', index)
    return item.save()
  })
}