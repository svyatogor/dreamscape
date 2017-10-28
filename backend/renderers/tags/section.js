import {underscore} from 'inflection'

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

  run({ctx}, sectionName, body, callback) {
    if (ctx.inspect) {
      ctx.sections.push(sectionName)
      return callback(null, null)
    }
    section.render(sectionName, ctx)
      .then((data) => callback(null, data))
      .catch(err => callback(err))
  }


  static render(sectionName, context) {
    const {page} = context
    if (!page.sections || !page.sections[sectionName]) {
      return Promise.resolve()
    }

    return Promise.all(page.sections[sectionName].map(block => {
      try {
        return require('./index')[underscore(block._type)].render(block, context)
      } catch (e) {
        console.log(`Cannot render block:`, block, e);
      }
    })).then(results => results.join(''))
  }
}