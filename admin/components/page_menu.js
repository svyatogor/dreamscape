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
import {map, get, find} from 'lodash'
import {graphql} from 'react-apollo'
import {push} from 'react-router-redux'
import addBlock from '../graphql/addBlock.gql'
import removeBlock from '../graphql/removeBlock.gql'

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
        {map(layout.sections, this.renderSection.bind(this))}
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
    const {modules, page: {sections, id: pageId}} = this.props
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
              {map(modules, ({name}, type) => <MenuItem primaryText={name} key={type} onTouchTap={() => this.addBlock(section, type)} />)}
            </IconMenu>
          </Subheader>

          {map(blocks, ({_type, ref}) => (
            <ListItem
              key={ref}
              leftIcon={<i className="mdi mdi-view-dashboard" style={{fontSize: 24, top: 4, color: '#757575'}}/>}
              primaryText={modules[_type].name}
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

const mapStateToProps = ({site}, ownProps) => {
  return {
    locale: site.locale,
    layout: site.layouts[ownProps.page.layout],
    modules: site.modules,
  }
}

const enhance = compose(
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
