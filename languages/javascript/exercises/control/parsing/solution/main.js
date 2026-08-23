// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A stack machine four commands wide, and the control flow around it.
 */

export function run(program) {
  const stack = [];

  for (const [index, instruction] of program.entries()) {
    const [command, argument] = instruction.split(' ');

    switch (command) {
      case 'push': {
        const value = Number(argument);
        // Number('') is 0 and Number(undefined) is NaN; isFinite refuses
        // NaN and the infinities in one check. parseInt would accept '3x'.
        if (argument === undefined || argument === '' || !Number.isFinite(value)) {
          throw new SyntaxError(`at ${index}: push needs a number`);
        }
        stack.push(value);
        break;
      }

      case 'add': {
        if (stack.length < 2) {
          throw new RangeError(`at ${index}: add needs two values`);
        }
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left + right);
        break;
      }

      case 'dup': {
        if (stack.length < 1) {
          throw new RangeError(`at ${index}: dup needs a value`);
        }
        stack.push(stack[stack.length - 1]);
        break;
      }

      case 'drop': {
        if (stack.length < 1) {
          throw new RangeError(`at ${index}: drop needs a value`);
        }
        stack.pop();
        break;
      }

      case 'halt':
        // Returning here is the early exit; a flag would be the same
        // decision stored in an extra variable.
        return stack;

      default:
        throw new SyntaxError(`at ${index}: unknown command ${command}`);
    }
  }

  return stack;
}

export function firstError(program) {
  try {
    run(program);
    return null;
  } catch (error) {
    return error.message;
  }
}
