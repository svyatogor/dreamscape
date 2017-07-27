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
import {map} from 'lodash'

let SelectableList = makeSelectable(List)

class PageMenu extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  }

  componentWillMount() {
    this.state = {
      selectedBlock: `${this.props.section}-${this.props.block}`,
    }
  }

  render() {
    const {layout} = this.props
    return (
      <Paper zDepth={0}>
        {map(layout.sections, this.renderSection.bind(this))}
      </Paper>
    )
  }

  renderSection({name}, key) {
    const smallIcon = {width: 24, height: 24}
    const small = {
      width: 36,
      height: 36,
      padding: 2,
      right: 5,
      top: 10,
    }
    const {modules, page: {sections, id}} = this.props
    return (
      <div key={key}>
        <SelectableList value={this.state.selectedBlock}>
          <Subheader key={key}>
            {name}
            <IconMenu
              iconButtonElement={<IconButton><i className="material-icons">add</i></IconButton>}
              style={{float: 'right'}}
            >
              {map(modules, ({name}, key) => <MenuItem primaryText={name} key={key} />)}
            </IconMenu>
          </Subheader>

          {map(sections[key], ({module}, blockKey) => (
            <ListItem
              key={blockKey}
              primaryText={modules[module].name}
              value={`${key}-${blockKey}`}
              onTouchTap={() => {
                this.context.router.history.push(`/site/${id}/section/${key}/block/${blockKey}`)
                this.setState({selectedBlock: `${key}-${blockKey}`})
              }}
              rightIconButton={
                <IconButton
                  iconStyle={smallIcon}
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

const mapStateToProps = ({site, page}, ownProps) => {
  return {
    locale: site.locale,
    page,
    layout: site.layouts[page.layout],
    modules: site.modules,
  }
}

const enhance = compose(
  connect(mapStateToProps),
)


export default enhance(PageMenu)
