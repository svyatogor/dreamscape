import Promise from 'bluebird'

export class SetAsync {
  constructor() {
    this.tags = ['setAsync']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endsetAsync');
    parser.advanceAfterBlockEnd();
    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  async run({ctx}, variableName, body, callback) {
    const asyncBody = Promise.promisify(body)
    const value = await asyncBody()
    ctx[variableName] = value
    console.log({variableName, value, body})
    return callback(null, null)
  }
}