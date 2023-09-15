import { ShaderBuilder } from './ShaderBuilder';
import {
  ShaderBlock,
  ShaderBuilderBlockOperator,
  ShaderBuilderBlockOperatorkData,
  ShaderBuilderContext,
} from './type';

export const contentBlock: ShaderBuilderBlockOperator = {
  execIn(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    operatorData: ShaderBuilderBlockOperatorkData,
    context: ShaderBuilderContext
  ): ShaderBlock[] {
    const name = matches[1];

    for (let ind = blockOperators.length - 1; ind >= 0; ind--) {
      const templateOperatorData = blockOperators[ind];

      if (templateOperatorData.operator.name === 'template') {
        operatorData.data = { template: templateOperatorData, name };
        return [];
        // return operatorData.data.content[name] || [];
      }
    }

    throw new Error('shader section : no template defined for content ' + name);
  },

  execOut(
    builder: ShaderBuilder,
    sourceSegment: string,
    inMatches: string[],
    data: ShaderBlock[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    operatorData: ShaderBuilderBlockOperatorkData,
    context: ShaderBuilderContext
  ): ShaderBlock[] {
    const content =
      data.splice(0, data.length) || operatorData.data.content.content;

    const { template, name } = operatorData.data;
    
    template.data.sections[name] = content;

    return [];
  },

  name: 'content',
  patternIn: /[\t ]*@content\([\t ]*'?([a-zA-Z0-9\/\_\- ]+)'?[\t ]*\)[\t ;]*/,
  patternOut: /[\t ]*@end_content[\t ;]*/,
};
