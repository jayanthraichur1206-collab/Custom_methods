import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Arithmetic Operation
 * description: Perform ${operator} on ${operand1} and ${operand2} and store result in $[result]
 * actionType: custom_arithmetic_operation
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function arithmeticOperation(ctx: WalnutContext) {
  // ctx.args[0] = operator   (from ${operator}  — arithmetic operator: +, -, *, /)
  // ctx.args[1] = operand1   (from ${operand1}  — first operand; auto-detects runtime variable or raw value)
  // ctx.args[2] = operand2   (from ${operand2}  — second operand; auto-detects runtime variable or raw value)
  // ctx.args[3] = "result"   (from $[result]    — runtime variable name to store the computed result)

  const operator: string = ctx.args[0]?.trim();
  const operand1Raw: string = ctx.args[1];
  const operand2Raw: string = ctx.args[2];
  const resultVarName: string = ctx.args[3];

  // --- Validate operator ---
  const supportedOperators = ['+', '-', '*', '/'];
  if (!operator || !supportedOperators.includes(operator)) {
    throw new Error(
      `Unsupported operator "${operator}". Supported operators: ${supportedOperators.join(', ')}.`
    );
  }

  // --- Validate result variable name ---
  if (!resultVarName || resultVarName.trim() === '') {
    throw new Error('Result variable name is empty — provide a runtime variable name via $[result].');
  }

  // --- Smart resolve: try runtime variable first, fall back to raw value ---
  function resolveValue(raw: string, argIndex: number): string {
    if (!raw || raw.trim() === '') {
      throw new Error(`operand${argIndex} (ctx.args[${argIndex}]) is empty or not provided.`);
    }
    const fromRuntime = ctx.getVariable(raw);
    if (fromRuntime !== null && fromRuntime !== undefined && String(fromRuntime).trim() !== '') {
      ctx.log(`operand${argIndex}: resolved from runtime variable $[${raw}] = "${fromRuntime}"`);
      return String(fromRuntime).trim();
    }
    ctx.log(`operand${argIndex}: using raw value "${raw}"`);
    return String(raw).trim();
  }

  const operand1Str: string = resolveValue(operand1Raw, 1);
  const operand2Str: string = resolveValue(operand2Raw, 2);

  // --- Parse operands as numbers ---
  const operand1: number = parseFloat(operand1Str);
  const operand2: number = parseFloat(operand2Str);

  if (isNaN(operand1)) {
    throw new Error(`operand1 "${operand1Str}" is not a valid number.`);
  }
  if (isNaN(operand2)) {
    throw new Error(`operand2 "${operand2Str}" is not a valid number.`);
  }

  ctx.log(`Operation  : ${operand1} ${operator} ${operand2}`);

  // --- Perform arithmetic ---
  let result: number;

  switch (operator) {
    case '+':
      result = operand1 + operand2;
      break;

    case '-':
      result = operand1 - operand2;
      break;

    case '*':
      result = operand1 * operand2;
      break;

    case '/':
      if (operand2 === 0) {
        throw new Error('Division by zero is not allowed — operand2 resolved to 0.');
      }
      result = operand1 / operand2;
      break;

    default:
      throw new Error(`Unhandled operator "${operator}".`);
  }

  // --- Format result to fixed 2 decimal places ---
  const resultValue: string = result.toFixed(2);

  ctx.log(`Result     : ${operand1} ${operator} ${operand2} = ${resultValue}`);

  // --- Store into runtime variable ---
  ctx.setVariable(resultVarName, resultValue);

  ctx.log(`Stored "${resultValue}" into runtime variable $[${resultVarName}].`);
}
