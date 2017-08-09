import React from 'react'
import PropTypes from 'prop-types'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {
  List,
  ListItem,
  Paper,
  Subheader,
  Divider,
  MenuItem,
  IconMenu,
  IconButton,
  makeSelectable,
} from 'material-ui'
import {map, get} from 'lodash'
import {humanize, underscore} from 'inflection'
import {graphql} from 'react-apollo'
import {push} from 'react-router-redux'
import * as modules from './modules'
import addBlock from '../graphql/addBlock.gql'
import removeBlock from '../graphql/removeBlock.gql'
import site from '../graphql/site.gql'

let SelectableList = makeSelectable(List)

class PageMenu extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  }

  addBlock(section, type) {
    const {page} = this.props
    const block = {page: page.id, section, _type: type}
    this.props.addBlock({variables: {block}})
    .then(({data: {addBlock}}) => {
      this.props.push(`/site/page/${this.props.page.id}/block/${addBlock}`)
    })
  }

  removeBlock(ref) {
    const {page} = this.props
    const block = {page: page.id, ref}
    this.props.removeBlock({variables: {block}})
    .then(() => {
      this.props.push(`/site/page/${this.props.page.id}/settings`)
    })
  }

  componentWillMount() {
    this.state = {
      selectedBlock: this.props.selectedBlock,
    }
  }

  render() {
    const {layout} = this.props
    return (
      <Paper zDepth={0}>
        <SelectableList value={this.state.selectedBlock}>
          <ListItem
            leftIcon={<i className="mdi mdi-settings" style={{fontSize: 24, top: 4, color: '#757575'}}/>}
            primaryText="Settings"
            value="settings"
            onTouchTap={() => {
              this.props.push(`/site/page/${this.props.page.id}/settings`)
              // this.setState({selectedBlock: `${key}-${blockKey}`})
            }}
          />
        </SelectableList>
        {map(get(layout, 'sections'), this.renderSection.bind(this))}
      </Paper>
    )
  }

  renderSection({name}, section) {
    const smallIcon = {width: 24, height: 24}
    const small = {
      width: 36,
      height: 36,
      padding: 2,
      right: 5,
      top: 10,
    }
    const {page: {sections, id: pageId}} = this.props
    const blocks = get(sections, section, [])
    return (
      <div key={section}>
        <SelectableList value={this.state.selectedBlock}>
          <Subheader key={section}>
            {name}
            <IconMenu
              iconButtonElement={<IconButton><i className="material-icons">add</i></IconButton>}
              style={{float: 'right'}}
            >
              {map(modules, (_, type) => <MenuItem primaryText={humanize(underscore(type))} key={type} onTouchTap={() => this.addBlock(section, type)} />)}
            </IconMenu>
          </Subheader>

          {map(blocks, ({_type, ref}) => (
            <ListItem
              key={ref}
              leftIcon={<i className="mdi mdi-view-dashboard" style={{fontSize: 24, top: 4, color: '#757575'}}/>}
              primaryText={_type}
              value={ref}
              onTouchTap={() => {
                this.context.router.history.push(`/site/page/${pageId}/block/${ref}`)
                this.setState({selectedBlock: ref})
              }}
              rightIconButton={
                <IconButton
                  iconStyle={smallIcon}
                  onTouchTap={() => this.removeBlock(ref)}
                  style={small} tooltip="delete the block"
                >
                  <i className="material-icons">delete_forever</i>
                </IconButton>
              }
            />
          ))}
        </SelectableList>
        <Divider />
      </div>
    )
  }
}

const mapStateToProps = ({app}, {data: {site}, page}) => {
  return {
    locale: app.locale,
    layout: get(site, ['layouts', page.layout]),
  }
}

const enhance = compose(
  graphql(site),
  graphql(addBlock, {
    name: 'addBlock',
    options: {
      refetchQueries: [
        'page',
      ],
    }
  }),
  graphql(removeBlock, {
    name: 'removeBlock',
    options: {
      refetchQueries: [
        'page',
      ],
    }
  }),
  connect(mapStateToProps, {push}),
)


export default enhance(PageMenu)
