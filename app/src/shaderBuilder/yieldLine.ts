import {
  ShaderBuilderLineOperator,
  ShaderBuilderBlockOperatorkData,
  ShaderBuilderContext,
  ShaderBlock,
} from './type';
import { ShaderBuilder } from './ShaderBuilder';

export const yieldLine: ShaderBuilderLineOperator = {
  name: 'yield',
  pattern: /[\t ]*@yield\([\t ]*'?([a-zA-Z0-9\/\_\- ]+)'?[\t ]*\)[\t ;]*/,

  exec(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    context: ShaderBuilderContext
  ): ShaderBlock[] {
    const name = matches[1];

    return context.sections && context.sections[name] ? context.sections[name] : [];
  },
};


