
export type ShaderReplaceFunction = (
  shader: string,
  shaderType: string
) => string

const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm

export function replaceShaderSourceIncludes(
  shaderSource: string,
  shaderChunks: { [key: string]: string },
  exclude: string[] = []
): string {
  let resultShaderSource = shaderSource

  resultShaderSource = resultShaderSource.replace(
    includePattern,
    (match: string, include: string) => {
      let string = shaderChunks[include]
      if (string && exclude.indexOf(include) === -1) {
        // include name is excluded only in sub call in order to avoid infinite loop and allow using legacy includes
        return replaceShaderSourceIncludes(string, shaderChunks, [
          ...exclude,
          include,
        ])
      } else {
        return match
      }
    }
  )
  return resultShaderSource
}

export function shaderReplaceInclude(shaderChunks: {
  [key: string]: string
}): ShaderReplaceFunction {
  return (shader) => replaceShaderSourceIncludes(shader, shaderChunks)
}

export function ssInclude(name: string) {
  return `#include <${name}>`
}

export function ssIfDefInclude(
  constant: string,
  include: string,
  elseInclude: string = null
) {
  return `#ifdef ${constant}
    ${ssInclude(include)}
  ${
    elseInclude !== null
      ? `#else
    ${ssInclude(elseInclude)}`
      : ''
  }
  #endif`
}

export function ssIfNdefInclude(constant: string, include: string) {
  return `#ifndef ${constant}
    ${ssInclude(include)}
 
  #endif`
}