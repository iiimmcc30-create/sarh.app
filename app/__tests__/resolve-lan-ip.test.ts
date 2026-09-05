const { resolveLanIp, isLikelyUnreachableDockerIp } = require('../scripts/resolve-lan-ip');
const { resolveExpoPort, isPortFree } = require('../scripts/resolve-expo-port');

describe('resolve-lan-ip', () => {
  const prev = process.env.EXPO_DEV_LAN_IP;

  afterEach(() => {
    if (prev === undefined) delete process.env.EXPO_DEV_LAN_IP;
    else process.env.EXPO_DEV_LAN_IP = prev;
  });

  it('respects EXPO_DEV_LAN_IP override', () => {
    process.env.EXPO_DEV_LAN_IP = '192.168.0.55';
    expect(resolveLanIp()).toBe('192.168.0.55');
  });

  it('flags dockerish 172.30 as likely unreachable', () => {
    expect(isLikelyUnreachableDockerIp('172.30.0.2')).toBe(true);
    expect(isLikelyUnreachableDockerIp('192.168.1.4')).toBe(false);
  });
});

describe('resolve-expo-port', () => {
  it('finds the next free port when preferred is taken', async () => {
    const net = require('net');
    const blocker = net.createServer();
    const preferred = 19081;

    await new Promise((resolve, reject) => {
      blocker.once('error', reject);
      blocker.listen(preferred, '0.0.0.0', resolve);
    });

    try {
      expect(await isPortFree(preferred)).toBe(false);
      const port = await resolveExpoPort(preferred, 5);
      expect(Number(port)).toBe(preferred + 1);
    } finally {
      await new Promise((resolve) => blocker.close(resolve));
    }
  });
});
