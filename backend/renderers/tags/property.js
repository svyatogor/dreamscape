export class property {
  constructor(renderContext) {
    this.tags = ['property']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, 'run', args, [undefined]);
  }

  run({ctx}, prop, args) {
    if (ctx.inspect) {
      ctx.properties[prop] = {...args, key: prop}
    }
  }
}