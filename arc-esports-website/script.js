import {
  createPlatformLinkElement,
  detectPlatform,
  normalizeUrl,
} from './platform-icons.js';

const STORAGE_KEY = 'arc-esports-members';

const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
const membersGrid = document.getElementById('members-grid');
const memberForm = document.getElementById('member-form');
const resetBtn = document.getElementById('reset-members');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function roleLabel(role) {
  return role === 'voice' ? 'صوت' : 'نجم';
}

function roleBadgeClass(role) {
  return role === 'voice' ? 'badge-voice' : 'badge-star';
}

function renderMembers(members) {
  if (!membersGrid) return;
  membersGrid.innerHTML = '';

  if (!members.length) {
    membersGrid.innerHTML = '<p class="empty-state">لا يوجد أعضاء بعد. أضف رابط منصة من النموذج أدناه.</p>';
    return;
  }

  for (const member of members) {
    const card = document.createElement('article');
    card.className = 'member-card';
    card.dataset.id = member.id;

    const header = document.createElement('div');
    header.className = 'member-header';

    const badge = document.createElement('span');
    badge.className = `member-badge ${roleBadgeClass(member.role)}`;
    badge.textContent = roleLabel(member.role);

    const titleWrap = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = member.name;
    const game = document.createElement('p');
    game.className = 'member-game';
    game.textContent = member.game || '';
    titleWrap.append(name, game);

    header.append(badge, titleWrap);
    card.append(header);

    const linksRow = document.createElement('div');
    linksRow.className = 'platform-links';

    const uniqueLinks = [...new Set((member.links || []).map(normalizeUrl).filter(Boolean))];
    for (const url of uniqueLinks) {
      const icon = createPlatformLinkElement(url);
      if (icon) linksRow.append(icon);
    }

    if (!uniqueLinks.length) {
      const empty = document.createElement('p');
      empty.className = 'member-no-links';
      empty.textContent = 'لا توجد روابط';
      linksRow.append(empty);
    }

    card.append(linksRow);
    membersGrid.append(card);
  }
}

async function loadDefaultMembers() {
  const res = await fetch('data/members.json');
  if (!res.ok) throw new Error('failed to load members');
  return res.json();
}

function loadStoredMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

async function initMembers() {
  const stored = loadStoredMembers();
  const members = stored ?? (await loadDefaultMembers());
  renderMembers(members);
  return members;
}

let currentMembers = [];

initMembers()
  .then((members) => {
    currentMembers = members;
  })
  .catch(() => {
    if (membersGrid) {
      membersGrid.innerHTML = '<p class="empty-state">تعذر تحميل الأعضاء.</p>';
    }
  });

if (memberForm) {
  memberForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('member-name');
    const roleInput = document.getElementById('member-role');
    const gameInput = document.getElementById('member-game');
    const linkInput = document.getElementById('member-link');

    const name = nameInput?.value.trim();
    const role = roleInput?.value === 'voice' ? 'voice' : 'star';
    const game = gameInput?.value.trim() || (role === 'voice' ? 'Content' : 'Player');
    const link = normalizeUrl(linkInput?.value);

    if (!name || !link) return;

    const platform = detectPlatform(link);
    const existing = currentMembers.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() && m.role === role,
    );

    if (existing) {
      if (!existing.links.includes(link)) existing.links.push(link);
    } else {
      currentMembers.push({
        id: `custom-${Date.now()}`,
        name,
        role,
        game,
        links: [link],
      });
    }

    saveMembers(currentMembers);
    renderMembers(currentMembers);

    if (linkInput) linkInput.value = '';
    linkInput?.focus();

    const toast = document.createElement('p');
    toast.className = 'form-toast';
    toast.textContent = `تمت الإضافة — أيقونة ${platform.label}`;
    memberForm.append(toast);
    setTimeout(() => toast.remove(), 2500);
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    localStorage.removeItem(STORAGE_KEY);
    currentMembers = await loadDefaultMembers();
    renderMembers(currentMembers);
  });
}
