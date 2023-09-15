import { ShaderBuilder } from './ShaderBuilder';
import {
  ShaderBlock,
  ShaderBuilderBlockOperator,
  ShaderBuilderBlockOperatorkData,
  ShaderBuilderContext,
} from './type';

export const templateBlock: ShaderBuilderBlockOperator = {
  execIn(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    operatorData: ShaderBuilderBlockOperatorkData,
    context: ShaderBuilderContext
  ): ShaderBlock[] {
    const name = matches[1];

    operatorData.data = { template: builder.getTemplate(name), sections: {...context.sections} };
    return [];
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
      data.splice(0, data.length);

  

    return builder.build(operatorData.data.template, {
      content: content,
      sections: operatorData.data.sections,
      imported: context.imported,
    });
  },

  name: 'template',
  patternIn: /[\t ]*@template\([\t ]*'?([a-zA-Z0-9\/\_\- ]+)'?[\t ]*\)[\t ;]*/,
  patternOut: /[\t ]*@end_template[\t ;]*/,
};
