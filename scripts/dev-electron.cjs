const { spawn } = require('child_process');
const waitOn = require('wait-on');

async function main() {
  try {
    await waitOn({
      resources: ['tcp:127.0.0.1:5173'],
      timeout: 30000,
      tcpTimeout: 1000,
      interval: 250,
      window: 1000,
    });
  } catch (error) {
    console.error('Electron launcher: dev server nao ficou disponivel em 127.0.0.1:5173');
    console.error(error.message || error);
    process.exit(1);
  }

  let electronBinary;

  try {
    electronBinary = require('electron');
  } catch (error) {
    console.error('Electron launcher: nao foi possivel localizar o binario do Electron');
    console.error(error.message || error);
    process.exit(1);
  }

  const child = spawn(electronBinary, ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DEV_SERVER: 'true',
    },
  });

  child.on('error', (error) => {
    console.error('Electron launcher: falha ao iniciar o processo do Electron');
    console.error(error.message || error);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main();
