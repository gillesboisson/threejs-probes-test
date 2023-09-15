import { ShaderBuilder } from './ShaderBuilder';
import { ShaderBuilderLineOperator, ShaderBuilderBlockOperatorkData, ShaderBuilderContext, ShaderBlock } from './type';

export const shaderNameLine: ShaderBuilderLineOperator = {
  name: 'shader_name',
  pattern: /[\t ]*@shader_name\([\t ]*'?([a-zA-Z0-9\/\_\- ]+)'?[\t ]*\)[\t ;]*/,

  exec(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    context: ShaderBuilderContext
  ): ShaderBlock[] {
    const [res, name] = matches;

    return [`#define SHADER_NAME ${name}`];
  },
};
