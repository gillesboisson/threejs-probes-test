import { ShaderBuilder } from './ShaderBuilder';
import {
  ShaderBuilderLineOperator,
  ShaderBuilderBlockOperatorkData,
  ShaderBuilderContext,
  ShaderBlock,
} from './type';

export const importLine: ShaderBuilderLineOperator = {
  name: 'import',
  pattern: /[\t ]*@import[_]?(once)?\([\t ]*'?([a-zA-Z0-9\/\_\- ]+)'?[\t ]*\)[\t ;]*/,

  exec(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    context: ShaderBuilderContext
  ): ShaderBlock[] {
    const [res, once, name] = matches;

    if (!once || !context.imported[name]) {
      context.imported[name] = true;

      return builder.build(builder.getPackage(name),context);
    } else {
      return [];
    }
  },
};

