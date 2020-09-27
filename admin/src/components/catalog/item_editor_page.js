import React from 'react'
import {Paper} from 'material-ui'
import ItemEditor from './item_editor'

export function ItemEditorPage(params) {
  return (
    <Paper style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}} className="flexContainer">
      <div style={{flex: 1, paddingLeft: 70, marginBottom: 20}}>
        <h1 style={{marginBottom: 20}}>New {params.catalogKey}</h1>
        <ItemEditor {...params} />
      </div>
    </Paper>)
}