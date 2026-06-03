import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Build OFS Script
 * description: Build an OFS request string using ${applicationName}, ${version}, ${function}, ${processOrValidate}, ${username}, ${password}, ${company}, ${txnId}, and ${msgData} and store it in $[ofsScript]
 * actionType: custom_build_ofs_script
 * context: web
 * needsLocator: false
 * category: Utility
 */
export async function buildOfsScript(ctx: WalnutContext) {
  // Arguments:
  // ctx.args[0] = applicationName
  // ctx.args[1] = version
  // ctx.args[2] = function
  // ctx.args[3] = processOrValidate (PROCESS | VALIDATE)
  // ctx.args[4] = username
  // ctx.args[5] = password
  // ctx.args[6] = company
  // ctx.args[7] = txnId (optional)
  // ctx.args[8] = msgData (optional)
  // ctx.args[9] = output variable name (optional, defaults to "ofsScript")

  const applicationName = String(ctx.args[0] || '').trim();
  const version = String(ctx.args[1] || '').trim();
  const func = String(ctx.args[2] || '').trim();
  const processOrValidate = String(ctx.args[3] || '').trim().toUpperCase();
  const username = String(ctx.args[4] || '').trim();
  const password = String(ctx.args[5] || '').trim();
  const company = String(ctx.args[6] || '').trim();
  const txnId = String(ctx.args[7] || '').trim();
  const msgData = String(ctx.args[8] || '').trim();
  const outputVar = String(ctx.args[9] || 'ofsScript');

  // Validation
  if (!applicationName) {
    throw new Error('applicationName is required.');
  }

  if (!version) {
    throw new Error('version is required.');
  }

  if (!func) {
    throw new Error('function is required.');
  }

  if (!processOrValidate) {
    throw new Error('processOrValidate is required.');
  }

  if (!['PROCESS', 'VALIDATE'].includes(processOrValidate)) {
    throw new Error(
      'processOrValidate must be either "PROCESS" or "VALIDATE".'
    );
  }

  if (!username) {
    throw new Error('username is required.');
  }

  if (!password) {
    throw new Error('password is required.');
  }

  if (!company) {
    throw new Error('company is required.');
  }

  const applicationSection = `${applicationName},${version}/${func}/${processOrValidate}`;
  const credentialSection = `${username}/${password}/${company}`;

  const ofsScript = [
    applicationSection,
    credentialSection,
    txnId,
    msgData
  ].join(',');

  ctx.log(`Generated OFS Script: ${ofsScript}`);

  ctx.setVariable(outputVar, ofsScript);

  ctx.log(
    `Stored OFS script into runtime variable $[${outputVar}]`
  );
}