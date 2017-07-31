import mongoose from 'mongoose'
import {query, mutation} from './utils'
import {Page} from '../models'

export default class {
  @query
  static staticText(context, {ref: {page, section, block}}) {
    return Page.aggregate([
        {$match: {"_id": mongoose.Types.ObjectId(page),}},
        {$unwind : "$sections"},
        {$project: {'sections.blocks': 1, 'sections.key': 1}},
        {$unwind : {path: "$sections.blocks", includeArrayIndex: "position"}} ,
        {
          $match: {
            "sections.key": section,
            position: block,
          }
        },
    ]).then(data => {
      return data[0].sections.blocks
    })
  }

  static queries = {}
  static mutations = {}
}