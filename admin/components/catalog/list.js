import React from 'react'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
  Card,
  CardTitle,
  IconMenu,
  IconButton,
  MenuItem,
} from 'material-ui'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import {grey500} from 'material-ui/styles/colors'
import {omit, map, sortBy} from 'lodash'
import {humanize} from 'inflection'

class List extends React.Component {
  state = {
    selected: [1],
  };

  isSelected = (index) => {
    return this.state.selected.indexOf(index) !== -1;
  };

  handleRowSelection = (selectedRows) => {
    this.setState({
      selected: selectedRows,
    });
  };

  get configurationMenu() {
    const {fields, labelField} = this.props.catalog
    const controllableFields = omit(fields, ({type}, key) =>
      type === 'html' || type === 'image'
    )
    console.log(controllableFields);
    return (
      <IconMenu
        iconButtonElement={<IconButton><MoreVertIcon color={grey500} /></IconButton>}
        anchorOrigin={{horizontal: 'right', vertical: 'top'}}
        targetOrigin={{horizontal: 'right', vertical: 'top'}}
        style={{marginLeft: 'auto', marginTop: -5}}
      >
        {Object.keys(controllableFields).sort().map(key =>
          <MenuItem
            primaryText={humanize(key)}
            key={key}
            style={{paddingLeft: key === labelField ? 50 : 35}}
            disabled={key === labelField}
            checked={key === labelField}
          />
        )}

      </IconMenu>
    )
  }

  render() {
    return (
      <Card>
        <CardTitle title="Card title" style={{display: 'flex'}}>
          {this.configurationMenu}
        </CardTitle>
        <Table onRowSelection={this.handleRowSelection}>
          <TableHeader>
            <TableRow>
              <TableHeaderColumn>ID</TableHeaderColumn>
              <TableHeaderColumn>Name</TableHeaderColumn>
              <TableHeaderColumn>Status</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow selected={this.isSelected(0)}>
              <TableRowColumn>1</TableRowColumn>
              <TableRowColumn>John Smith</TableRowColumn>
              <TableRowColumn>Employed</TableRowColumn>
            </TableRow>
            <TableRow selected={this.isSelected(1)}>
              <TableRowColumn>2</TableRowColumn>
              <TableRowColumn>Randal White</TableRowColumn>
              <TableRowColumn>Unemployed</TableRowColumn>
            </TableRow>
            <TableRow selected={this.isSelected(2)}>
              <TableRowColumn>3</TableRowColumn>
              <TableRowColumn>Stephanie Sanders</TableRowColumn>
              <TableRowColumn>Employed</TableRowColumn>
            </TableRow>
            <TableRow selected={this.isSelected(3)}>
              <TableRowColumn>4</TableRowColumn>
              <TableRowColumn>Steve Brown</TableRowColumn>
              <TableRowColumn>Employed</TableRowColumn>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    );
  }
}

export default List