/**
 * Wi‑Fi dev: start Metro + generate QR for the installed سرح dev app.
 * Usage: npm run start:qr
 */
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const { resolveDevApiUrlsAsync } = require('./resolve-dev-api-urls');
const { resolveLanIp, isLikelyUnreachableDockerIp } = require('./resolve-lan-ip');
const { resolveExpoPort } = require('./resolve-expo-port');

const API_PORT = 3001;
const SOCKET_PORT = 3002;
const DEFAULT_EXPO_PORT = 8081;
/** Expo project slug (EAS). Dev-client URLs use exp+{slug}, not the store scheme. */
const EXPO_SLUG = 'safat';
const ROOT = path.join(__dirname, '..');
const QR_PATH = path.join(ROOT, 'expo-qr.png');

function buildDevClientUrl(lanIp, port) {
  const metroUrl = `http://${lanIp}:${port}`;
  return `exp+${EXPO_SLUG}://expo-development-client/?url=${encodeURIComponent(metroUrl)}`;
}

function buildExpoGoUrl(lanIp, port) {
  return `exp://${lanIp}:${port}`;
}

function downloadQr(data, outPath) {
  return new Promise((resolve, reject) => {
    const url =
      'https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=' +
      encodeURIComponent(data);
    const file = fs.createWriteStream(outPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`QR download failed: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(outPath)));
      })
      .on('error', reject);
  });
}

function openFile(filePath) {
  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', filePath], () => {});
  } else if (process.platform === 'darwin') {
    execFile('open', [filePath], () => {});
  } else {
    execFile('xdg-open', [filePath], () => {});
  }
}

function killProjectMetro() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve();
      return;
    }
    const timer = setTimeout(() => resolve(), 8000);
    execFile(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `$root = '${ROOT.replace(/'/g, "''")}'; ` +
          'Get-CimInstance Win32_Process -Filter "Name=\'node.exe\'" -ErrorAction SilentlyContinue | ' +
          'Where-Object { $_.CommandLine -and ($_.CommandLine -like "*$root*") -and ($_.CommandLine -match "expo|metro|@expo/cli") } | ' +
          'ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }',
      ],
      () => {
        clearTimeout(timer);
        resolve();
      },
    ).on('error', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function clearMetroCache() {
  const targets = [
    path.join(ROOT, '.expo'),
    path.join(ROOT, 'node_modules', '.cache'),
  ];
  for (const target of targets) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

async function main() {
  const lanIp = resolveLanIp();
  if (!lanIp) {
    console.error('[start:qr] لم يُعثر على IP للشبكة المحلية (Wi‑Fi).');
    console.error('[start:qr] تأكد أن الكمبيوتر متصل بالواي فاي، أو عيّن:');
    console.error('[start:qr]   set EXPO_DEV_LAN_IP=192.168.x.x   (Windows)');
    console.error('[start:qr]   export EXPO_DEV_LAN_IP=192.168.x.x (macOS/Linux)');
    process.exit(1);
  }

  if (isLikelyUnreachableDockerIp(lanIp)) {
    console.warn(
      `[start:qr] تحذير: ${lanIp} يبدو IP جسر Docker/WSL — Android قد لا يصل إليه.`,
    );
    console.warn('[start:qr] عيّن IP الواي فاي يدوياً: EXPO_DEV_LAN_IP=192.168.x.x');
  }

  await killProjectMetro();

  const preferredPort = Number(process.env.EXPO_PORT) || DEFAULT_EXPO_PORT;
  const expoPort = await resolveExpoPort(preferredPort);
  if (expoPort !== String(preferredPort)) {
    console.log(`[start:qr] المنفذ ${preferredPort} مشغول — استخدام ${expoPort}`);
  }

  clearMetroCache();

  const devClientUrl = buildDevClientUrl(lanIp, expoPort);
  const expoGoUrl = buildExpoGoUrl(lanIp, expoPort);
  const resolved = await resolveDevApiUrlsAsync(lanIp);
  const apiUrl = resolved.apiUrl;
  const socketUrl = resolved.socketUrl;
  const mode = resolved.mode;
  const webSameOrigin = mode === 'remote' ? 'false' : process.env.EXPO_PUBLIC_WEB_SAME_ORIGIN;

  try {
    await downloadQr(devClientUrl, QR_PATH);
    openFile(QR_PATH);
    console.log('[start:qr] تم إنشاء QR:', QR_PATH);
  } catch (err) {
    console.warn('[start:qr] تعذّر إنشاء صورة QR:', err instanceof Error ? err.message : err);
  }

  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  سرح — Metro + QR (Android Dev Client)');
  console.log('══════════════════════════════════════════');
  console.log('  LAN IP (للجوال):', lanIp);
  console.log('  Metro port:     ', expoPort);
  console.log('  Dev app (QR):   ', devClientUrl);
  console.log('  Expo Go:        ', expoGoUrl);
  const remoteLabel =
    mode === 'remote' || mode === 'render-fallback' ? '(production)' : '';
  console.log('  API:            ', apiUrl, remoteLabel);
  console.log('  Socket:         ', socketUrl, remoteLabel);
  console.log('  DevTools:       ', `http://localhost:${expoPort}`);
  console.log('');
  console.log('  1) Development Build (ليس Preview APK)');
  console.log('  2) نفس شبكة Wi‑Fi للهاتف والكمبيوتر');
  console.log('  3) امسح expo-qr.png من تطبيق سرح');
  console.log('  4) أو USB: npm run android:dev');
  console.log('══════════════════════════════════════════');
  console.log('');

  const expo = spawn(
    'npx',
    [
      'expo',
      'start',
      '--dev-client',
      '--lan',
      '--clear',
      '--port',
      expoPort,
      '--max-workers',
      '2',
    ],
    {
      stdio: 'inherit',
      shell: true,
      cwd: ROOT,
      env: {
        ...process.env,
        EXPO_PUBLIC_API_URL: apiUrl,
        EXPO_PUBLIC_SOCKET_URL: socketUrl,
        EXPO_PUBLIC_WEB_SAME_ORIGIN: webSameOrigin ?? 'false',
        EXPO_NO_DOTENV: '1',
        EXPO_NO_METRO_WORKSPACE_ROOT: '1',
        EXPO_PORT: expoPort,
        RCT_METRO_PORT: expoPort,
        /** Forces Metro QR/deep-link to use Wi‑Fi IP, not Docker/WSL bridge. */
        REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
        WATCHMAN_DISABLE: '1',
        METRO_DISABLE_WATCHMAN: '1',
        CHOKIDAR_USEPOLLING: '0',
      },
    },
  );

  expo.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[start:qr]', err instanceof Error ? err.message : err);
  process.exit(1);
});
