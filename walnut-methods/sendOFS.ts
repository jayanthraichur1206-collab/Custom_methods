import type { WalnutContext } from './walnut';
import { Client } from 'ssh2';

/** @walnut_method
 * name: Execute T24 SSH Command
 * description: Executes SSH login, sudo switch, T24 setup, tRun execution, and user query
 * actionType: custom_execute_ssh_t24
 * context: web
 * needsLocator: false
 * category: Utility
 */
export async function executeSshT24(ctx: WalnutContext) {
  // args:
  // [0] host
  // [1] sshUser
  // [2] sshPassword
  // [3] sudoUser
  // [4] sudoPassword
  // [5] javaHome
  // [6] tafjBinPath
  // [7] query

  const host = String(ctx.args[0] || '').trim();
  const sshUser = String(ctx.args[1] || '').trim();
  const sshPassword = String(ctx.args[2] || '').trim();
  const sudoUser = String(ctx.args[3] || '').trim();
  const sudoPassword = String(ctx.args[4] || '').trim();
  const javaHome = String(ctx.args[5] || '').trim();
  const tafjBinPath = String(ctx.args[6] || '').trim();
  const query = String(ctx.args[7] || '').trim();

  if (!host) throw new Error('host is required.');
  if (!sshUser) throw new Error('sshUser is required.');
  if (!sshPassword) throw new Error('sshPassword is required.');
  if (!sudoUser) throw new Error('sudoUser is required.');
  if (!sudoPassword) throw new Error('sudoPassword is required.');
  if (!tafjBinPath) throw new Error('tafjBinPath is required.');
  if (!query) throw new Error('query is required.');

  const conn = new Client();

  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
      ctx.log('SSH connection established');

      conn.shell((err, stream) => {
        if (err) return reject(err);

        let output = '';

        stream.on('data', (data: Buffer) => {
          const text = data.toString();
          output += text;
          ctx.log(text);
        });

        stream.on('close', () => {
          conn.end();
          resolve(output);
        });

        // ---------------- FLOW ----------------

        // 1. sudo switch
        stream.write(`sudo su - ${sudoUser}\n`);

        setTimeout(() => {
          stream.write(`${sudoPassword}\n`);
        }, 800);

        // 2. set JAVA_HOME
        setTimeout(() => {
          if (javaHome) {
            stream.write(`export JAVA_HOME=${javaHome}\n`);
          }
        }, 1500);

        // 3. move to tafj bin path
        setTimeout(() => {
          stream.write(`cd ${tafjBinPath}\n`);
        }, 2200);

        // 4. run tRun
        setTimeout(() => {
          stream.write(`./tRun tSS TWS\n`);
        }, 3000);

        // 5. run user query
        setTimeout(() => {
          stream.write(`${query}\n`);
        }, 4500);

        // 6. exit
        setTimeout(() => {
          stream.write(`exit\n`);
          stream.end();
        }, 7000);
      });
    });

    conn.on('error', (err) => {
      ctx.log(`SSH error: ${err.message}`);
      reject(err);
    });

    conn.connect({
      host,
      port: 22,
      username: sshUser,
      password: sshPassword,
    });
  });
}