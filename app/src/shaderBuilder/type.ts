import { ShaderBuilder } from './ShaderBuilder';

export interface ShaderBuilderTemplate {}


export type ShaderBlock = string;

export interface ShaderBuilderContext {
  content?: ShaderBlock[],
  sections?: Record<string,ShaderBlock[]>,
  imported: Record<string,boolean>
}

export interface ShaderBuilderLineOperator {
  name: string;
  pattern: RegExp;

  exec(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    context: ShaderBuilderContext
  ): ShaderBlock[];
}

export interface ShaderBuilderBlockOperatorkData {
  data?: any;
  operator: ShaderBuilderBlockOperator;
  inMatches: string[];
}

export interface ShaderBuilderBlockOperator {
  name: string;
  patternIn: RegExp;
  patternOut: RegExp;

  execIn(
    builder: ShaderBuilder,
    sourceSegment: string,
    matches: string[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    operatorData: ShaderBuilderBlockOperatorkData,
    context: ShaderBuilderContext
  ): ShaderBlock[];
  execOut(
    builder: ShaderBuilder,
    sourceSegment: string,
    inMatches: string[],
    data: ShaderBlock[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    operatorData: ShaderBuilderBlockOperatorkData,
    context: ShaderBuilderContext
  ): ShaderBlock[];
}


