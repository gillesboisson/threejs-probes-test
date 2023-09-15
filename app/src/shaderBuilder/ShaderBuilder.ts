import { contentBlock } from './contentBlock'
import { importLine } from './importLine'
import { sectionBlock } from './sectionBlock'
import { shaderNameLine } from './shaderNameLine'
import { templateBlock } from './templateBlock'
import {
  ShaderBuilderLineOperator,
  ShaderBuilderBlockOperator,
  ShaderBlock,
  ShaderBuilderBlockOperatorkData,
  ShaderBuilderContext,
} from './type'
import { yieldLine } from './yieldLine'

const anyType = '[a-zA-Z0-9_]+'
const anyName = '[a-zA-Z0-9_]+'
const optionnalArgs = '[a-zA-Z0-9_, \\t]*'
const optionalSpace = '[\\t ]*'
const anySpace = '[\\t ]+'
const varName =
  '[ \\t=\\/\\%+\\-\\*\\(\\)\\,](__varname__)[ \\t=\\/\\%+\\-\\*\\(\\);\\.\\,]'
const anyVarName = varName.split('__varname__').join(anyName)

function varNameRegExp(customVarname = anyVarName) {
  const exp = varName.split('__varname__').join(customVarname);
  console.log('exp',exp);
  return new RegExp(exp, '')
}

export interface ShaderArgDeclaration {
  inout: string
  type: String
  name: string
}

export interface ShaderFunc {
  returnType: string
  name: string
  args: ShaderArgDeclaration[]
  body: string[]
}

export class ShaderBuilder {
  private static _instance?: ShaderBuilder

  public static getInstance(): ShaderBuilder {
    if (this._instance === undefined) {
      this._instance = new ShaderBuilder()
    }

    return this._instance
  }

  protected imports: string[] = []
  protected templates: Record<string, string> = {}
  protected packages: Record<string, string> = {}

  protected functions: Record<string, ShaderFunc> = {}

  protected lineOperators: ShaderBuilderLineOperator[] = [
    yieldLine,
    importLine,
    shaderNameLine,
  ]
  protected blockOperators: ShaderBuilderBlockOperator[] = [
    sectionBlock,
    templateBlock,
    contentBlock,
  ]

  constructor() {}

  registerTemplate(name: string, templateSource: string, failIfExist = true) {
    if (this.templates[name] === undefined || !failIfExist) {
      this.templates[name] = templateSource
    } else {
      throw new Error(
        'ShaderBuilder::registerTemplate : shader template with ' +
          name +
          ' already exists'
      )
    }
  }

  registerPackage(name: string, templateSource: string, failIfExist = true) {
    if (this.packages[name] === undefined || !failIfExist) {
      this.packages[name] = templateSource
    } else {
      throw new Error(
        'ShaderBuilder::registerPackage : shader template with ' +
          name +
          ' already exists'
      )
    }
  }

  registerPackages(sources: Record<string, string>, failIfExist = true) {
    for (let name in sources) {
      this.registerPackage(name, sources[name], failIfExist)
    }
  }

  private parseArgs(args: string[]): ShaderArgDeclaration[] {
    const argExp = new RegExp(
      '((in|out|inout)' +
        anySpace +
        ')*(' +
        anyType +
        ')' +
        anySpace +
        '(' +
        anyName +
        ')' +
        optionalSpace,
      'i'
    )
    return args.map<ShaderArgDeclaration>((arg) => {
      const m = arg.match(argExp)

      return {
        inout: m[2] || null,
        type: m[3],
        name: m[4],
      }
    })
  }

  // inlineFunction(funcName: string) {
  //   const func = this.functions[funcName]
  //   if (func === undefined) {
  //     throw new Error(
  //       'ShaderBuilder::inlineFunction : function ' +
  //         funcName +
  //         ' does not exist'
  //     )
  //   }
  // }

  // registerFunctions(source: string) {
  //   const lines = source.split(`\n`)

  //   const funcLine =
  //     '(' +
  //     anyType +
  //     ')' +
  //     anySpace +
  //     '(' +
  //     anyName +
  //     ')' +
  //     optionalSpace +
  //     '\\((' +
  //     optionnalArgs +
  //     ')\\)' +
  //     optionalSpace +
  //     '\\{' +
  //     optionalSpace +
  //     ''

  //   const funcLineExpression = new RegExp(funcLine)

  //   let func: ShaderFunc

  //   let blocksIteration = 0
  //   let lastFuncInd = 0

  //   for (let i = 0; i < lines.length; i++) {
  //     const line = lines[i]

  //     const matches = line.match(funcLineExpression)

  //     if (matches) {
  //       const [m, returnType, name, argsStr] = matches
  //       const args = this.parseArgs(argsStr.split(`,`))
  //       blocksIteration = 1
  //       lastFuncInd = i + 1

  //       func = {
  //         args,
  //         name,
  //         returnType,
  //         body: [],
  //       }

  //       // console.log('func',func);
  //     } else {
  //       const nbOpenBrackets = line.split('{').length - 1
  //       const nbCloseBrackets = line.split('}').length - 1

  //       // console.log(nbOpenBrackets,nbCloseBrackets );

  //       if (nbOpenBrackets !== 0 || nbCloseBrackets !== 0) {
  //         blocksIteration = blocksIteration + nbOpenBrackets - nbCloseBrackets
  //         if (blocksIteration === 0) {
  //           let body = lines.slice(lastFuncInd, i - lastFuncInd + 1).join('\n')

  //           for (let arg of func.args) {
  //             const exp = varNameRegExp(arg.name)

  //             let nameIndex: number

  //             for (let f = 0; f < 100; f++) {
  //               nameIndex = body.search(exp)
  //               if (nameIndex !== -1) {
  //                 body =
  //                   body.slice(0, nameIndex) +
  //                   '__' +
  //                   arg.name +
  //                   '__' +
  //                   body.slice(nameIndex + arg.name.length, body.length)
  //               } else {
  //                 break
  //               }
  //             }

  //             console.log('nameIndex', nameIndex)
  //           }

  //           func.body = lines.slice(lastFuncInd, i - lastFuncInd + 1)
  //           this.functions[func.name] = func

  //           console.log(
  //             'this.functionsDeclaration[func.name]',
  //             this.functions[func.name]
  //           )
  //         }
  //       }
  //     }
  //   }

  //   // for (let line of lines) {

  //   // }
  // }

  getTemplate(name: string): string {
    if (this.templates[name] === undefined) {
      throw new Error(
        'ShaderBuilder::getTemplate : shader template with ' +
          name +
          ' does not exist'
      )
    }

    return this.templates[name]
  }

  getPackage(name: string): string {
    if (this.packages[name] === undefined) {
      throw new Error(
        'ShaderBuilder::getPackage : shader package with ' +
          name +
          ' does not exist'
      )
    }

    return this.packages[name]
  }

  buildSegment(
    segments: string[],
    ind: number,
    data: ShaderBlock[],
    blockOperators: ShaderBuilderBlockOperatorkData[],
    context: any
  ): number {
    // get amount of operator at starting point in order to automatically close
    // leftovers in the end of this recursion

    const blockOperatorsCountAtStart = blockOperators.length
    while (ind < segments.length) {
      let matches: string[] | null = null

      const segment = segments[ind]
      let didMatch = false

      for (let { pattern, exec } of this.lineOperators) {
        if ((matches = segment.match(pattern))) {
          data.push(...exec(this, segment, matches, blockOperators, context))
          didMatch = true
          break
        }
      }

      if (didMatch === false) {
        for (let operator of this.blockOperators) {
          if ((matches = segment.match(operator.patternIn))) {
            const blockOperatorData = { operator, inMatches: matches }
            blockOperators.push(blockOperatorData)
            const subData: ShaderBlock[] = operator.execIn(
              this,
              segment,
              matches,
              blockOperators,
              blockOperatorData,
              context
            )
            ind = this.buildSegment(
              segments,
              ind + 1,
              subData,
              blockOperators,
              context
            )
            didMatch = true
            data.push(...subData)
            break
          }

          if ((matches = segment.match(operator.patternOut))) {
            const lastOperatorData = blockOperators.pop()

            if (
              lastOperatorData === undefined ||
              lastOperatorData.operator.name !== operator.name
            ) {
              console.error(
                'Operator',
                lastOperatorData,
                '>',
                operator.name,
                data.slice(0, ind).join('\n'),
                'at',
                ind
              )
              throw new Error(
                'Shader build : closing operator doesn t match last open operator'
              )
            }

            data.push(
              ...operator.execOut(
                this,
                segment,
                matches,
                data,
                blockOperators,
                lastOperatorData,
                context
              )
            )
            return ind
          }
        }
      }

      if (didMatch === false) {
        data.push(segment)
      }
      ind++
    }

    // automatically close leftovers
    while (blockOperators.length > blockOperatorsCountAtStart) {
      const operatorData = blockOperators.pop()
      data.push(
        ...operatorData.operator.execOut(
          this,
          '',
          [],
          data,
          blockOperators,
          operatorData,
          context
        )
      )
    }

    return ind
  }

  build(
    shaderSource: string,
    context: ShaderBuilderContext = { imported: {} }
  ) {
    const segments = shaderSource.split('\n')
    const data: any[] = []
    const operatorBlocks: ShaderBuilderBlockOperatorkData[] = []

    this.buildSegment(segments, 0, data, operatorBlocks, context)
    return data
  }
}
