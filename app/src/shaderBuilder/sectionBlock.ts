import { ShaderBuilder } from './ShaderBuilder';
import { ShaderBlock, ShaderBuilderBlockOperator, ShaderBuilderBlockOperatorkData, ShaderBuilderContext } from './type';

export const sectionBlock: ShaderBuilderBlockOperator = {
  execIn(
    builder,
    sourceSegment,
    matches,
    blockOperators,
    operatorData,
    context
  ) {
    const name = matches[1];
    operatorData.data = { name };

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
      data.splice(0, data.length) || operatorData.data.content.content;

    const { name } = operatorData.data;

    return context.sections  && context.sections[name] 
      ? context.sections[name]
      : content;
  },

  name: 'section',
  patternIn: /[\t ]*@section\([\t ]*'?([a-zA-Z0-9\/\_\- ]+)'?[\t ]*\)[\t ;]*/,
  patternOut: /[\t ]*@end_section[\t ;]*/,
};
