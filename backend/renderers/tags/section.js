import {renderSection} from '../../renderers'

export class section {
  constructor(renderContext) {
    this.tags = ['section']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    let body
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    // const body = parser.parseUntilBlocks('endsection');
    // parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  run(context, sectionName, body, callback) {
    renderSection(sectionName, context.ctx).then((data) => callback(null, data)).catch(err => callback(err))
  }
}