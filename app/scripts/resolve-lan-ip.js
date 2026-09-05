/**
 * Pick the LAN IPv4 address Android/iOS can reach on the same Wi‑Fi.
 * Prefers 192.168.x over Docker/WSL bridges (172.17/172.18/172.30…).
 *
 * Override: EXPO_DEV_LAN_IP=192.168.1.42
 */
const { networkInterfaces } = require('os');

/** Interface names that are almost never the phone-reachable Wi‑Fi NIC. */
const VIRTUAL_IFACE =
  /^(lo|docker|veth|br-|virbr|vmnet|vboxnet|tun|tap|wsl|vethernet|hyper-v|npcap|npf_|cni|flannel)/i;

/** Docker Desktop / WSL / compose bridges — deprioritize vs real Wi‑Fi. */
const DOCKERISH_172_SECOND_OCTET = new Set([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);

function isIpv4Entry(entry) {
  return entry && (entry.family === 'IPv4' || entry.family === 4);
}

function scoreCandidate(iface, address) {
  let tier = 99;

  if (address.startsWith('192.168.')) tier = 1;
  else if (address.startsWith('10.')) tier = 2;
  else {
    const m = /^172\.(\d+)\./.exec(address);
    if (m) {
      const second = Number(m[1]);
      if (second >= 16 && second <= 31) {
        tier = DOCKERISH_172_SECOND_OCTET.has(second) ? 8 : 4;
      }
    }
  }

  if (tier === 99) return null;

  // Boost common Wi‑Fi / Ethernet interface names.
  if (/^(wlan|wifi|wi-fi|wireless|en0|en1|eth)/i.test(iface)) {
    tier -= 0.25;
  }

  // Penalize interfaces that look virtual even if the name slipped through.
  if (VIRTUAL_IFACE.test(iface)) {
    tier += 5;
  }

  return { address, iface, tier };
}

/**
 * @returns {string | null} Best-effort LAN IPv4 for Metro QR / --lan.
 */
function resolveLanIp() {
  const override = process.env.EXPO_DEV_LAN_IP?.trim();
  if (override) {
    return override;
  }

  const candidates = [];

  for (const [iface, entries] of Object.entries(networkInterfaces())) {
    if (VIRTUAL_IFACE.test(iface)) continue;

    for (const entry of entries ?? []) {
      if (!isIpv4Entry(entry) || entry.internal) continue;

      const scored = scoreCandidate(iface, entry.address);
      if (scored) candidates.push(scored);
    }
  }

  candidates.sort((a, b) => a.tier - b.tier || a.address.localeCompare(b.address));

  const best = candidates[0]?.address ?? null;

  // Last resort: any non-internal 192.168 (even on virtual iface names we skipped).
  if (!best) {
    for (const entries of Object.values(networkInterfaces())) {
      for (const entry of entries ?? []) {
        if (!isIpv4Entry(entry) || entry.internal) continue;
        if (entry.address.startsWith('192.168.')) return entry.address;
      }
    }
  }

  return best;
}

function isLikelyUnreachableDockerIp(ip) {
  if (!ip) return false;
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return false;
  const m = /^172\.(\d+)\./.exec(ip);
  if (!m) return false;
  return DOCKERISH_172_SECOND_OCTET.has(Number(m[1]));
}

module.exports = {
  resolveLanIp,
  isLikelyUnreachableDockerIp,
};
