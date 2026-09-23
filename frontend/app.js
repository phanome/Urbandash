const API = 'http://localhost:3001/api';

// Color palette per driver index
const PALETTE = [
  { color: '#00d4c8', bg: 'rgba(0,212,200,0.12)',   cls: 'driver-0' },
  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', cls: 'driver-1' },
  { color: '#ffb347', bg: 'rgba(255,179,71,0.12)',  cls: 'driver-2' },
  { color: '#ff5e7e', bg: 'rgba(255,94,126,0.12)',  cls: 'driver-3' },
  { color: '#3dffa0', bg: 'rgba(61,255,160,0.12)',  cls: 'driver-4' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '+';
  return (n === 0 ? '' : sign) + '₹' + abs.toFixed(2);
}

function fmtTotal(n) {
  return '₹' + Math.abs(n).toFixed(0);
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase();
}

function conditionTags(conditions, isRejected) {
  if (isRejected) return '<span class="tag tag-reject">REJECTED</span>';
  return conditions
    .filter(c => c !== 'normal')
    .map(c => {
      if (c === 'PEAK')           return '<span class="tag tag-peak">PEAK</span>';
      if (c === 'RAIN')           return '<span class="tag tag-rain">RAIN</span>';
      if (c === 'long-distance')  return '<span class="tag tag-dist">&gt;8km</span>';
      return `<span class="tag">${c}</span>`;
    })
    .join('') || '<span class="tag tag-normal">normal</span>';
}

function valClass(n) {
  if (n > 0) return 'val-pos';
  if (n < 0) return 'val-neg';
  return 'val-zero';
}

// ── Header date ───────────────────────────────────────────────────────────

document.getElementById('headerDate').textContent =
  new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

// ── Load driver list ──────────────────────────────────────────────────────

async function loadDrivers() {
  const loader = document.getElementById('loader');
  const grid   = document.getElementById('driverGrid');

  try {
    const res     = await fetch(`${API}/drivers`);
    const drivers = await res.json();

    // Stats bar
    const totalDeliveries = drivers.reduce((s, d) => s + d.completedDeliveries + d.rejectedDeliveries, 0);
    const totalPayout     = drivers.reduce((s, d) => s + d.grandTotal, 0);
    const avgPayout       = totalPayout / drivers.length;

    document.getElementById('statDrivers').textContent   = drivers.length;
    document.getElementById('statDeliveries').textContent = totalDeliveries;
    document.getElementById('statTotal').textContent     = '₹' + totalPayout.toFixed(0);
    document.getElementById('statAvg').textContent       = '₹' + avgPayout.toFixed(0);
    document.getElementById('statsBar').style.display    = 'grid';

    loader.style.display = 'none';

    // Render cards
    drivers.forEach((driver, i) => {
      const pal  = PALETTE[i % PALETTE.length];
      const card = document.createElement('div');
      card.className = `driver-card ${pal.cls}`;
      card.id = `card-${driver.driverId}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const warnBadge = driver.deactivationWarning
        ? '<span class="badge badge-warn">⚠ DEACTIVATION RISK</span>' : '';
      const noShiftBadge = !driver.qualifiesShiftPay
        ? '<span class="badge badge-noshift">No Shift Pay</span>' : '';

      card.innerHTML = `
        <div class="card-top">
          <div class="card-avatar" style="background:${pal.bg}; color:${pal.color}; border:2px solid ${pal.color}40;">
            ${initials(driver.name)}
          </div>
          <div class="card-badges">
            ${warnBadge}
            ${noShiftBadge}
          </div>
        </div>
        <div class="card-name">${driver.name}</div>
        <div class="card-id">${driver.driverId}</div>
        <div class="card-divider"></div>
        <div class="card-stats">
          <div>
            <div class="cstat-label">Shift Hours</div>
            <div class="cstat-value" style="color:${pal.color}">${driver.shiftHours.toFixed(1)}h</div>
          </div>
          <div>
            <div class="cstat-label">Deliveries</div>
            <div class="cstat-value">${driver.completedDeliveries} / ${driver.completedDeliveries + driver.rejectedDeliveries}</div>
          </div>
          <div>
            <div class="cstat-label">Rejections</div>
            <div class="cstat-value" style="color:${driver.rejectedDeliveries > 0 ? '#ff5e7e' : 'inherit'}">${driver.rejectedDeliveries}</div>
          </div>
          <div>
            <div class="cstat-label">Shift Pay</div>
            <div class="cstat-value">₹${driver.qualifiesShiftPay ? (driver.shiftHours * 100).toFixed(0) : '0'}</div>
          </div>
        </div>
        <div class="card-total-label">Total Earnings</div>
        <div class="card-total-value" style="color:${pal.color}">${fmtTotal(driver.grandTotal)}</div>
        <div class="card-cta">View full breakdown →</div>
      `;

      card.addEventListener('click', () => openDrawer(driver.driverId, i));
      card.addEventListener('keydown', e => { if (e.key === 'Enter') openDrawer(driver.driverId, i); });
      grid.appendChild(card);
    });

  } catch (err) {
    loader.innerHTML = `
      <div style="color:#ff5e7e; text-align:center;">
        <div style="font-size:32px; margin-bottom:12px;">⚠️</div>
        <strong>Could not connect to API</strong><br>
        <span style="font-size:13px; color:#8b9cc8;">Make sure the backend is running on port 3001</span>
      </div>`;
  }
}

// ── Drawer logic ──────────────────────────────────────────────────────────

const overlay = document.getElementById('drawerOverlay');
const drawer  = document.getElementById('detailDrawer');
const closeBtn = document.getElementById('drawerClose');

function openDrawer(driverId, paletteIdx) {
  const pal = PALETTE[paletteIdx % PALETTE.length];

  // Avatar
  const avatar = document.getElementById('drawerAvatar');
  avatar.style.background = pal.bg;
  avatar.style.color = pal.color;
  avatar.style.border = `2px solid ${pal.color}40`;

  document.getElementById('drawerName').textContent = '…';
  document.getElementById('drawerId').textContent   = driverId;

  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-loading">
      <div class="spinner"></div>
      <p>Calculating payout…</p>
    </div>`;

  overlay.classList.add('active');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  fetchPayout(driverId, pal);
}

function closeDrawer() {
  overlay.classList.remove('active');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

overlay.addEventListener('click', closeDrawer);
closeBtn.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

async function fetchPayout(driverId, pal) {
  try {
    const res  = await fetch(`${API}/payout/${driverId}`);
    const data = await res.json();
    renderDrawer(data, pal);
  } catch (err) {
    document.getElementById('drawerBody').innerHTML =
      `<p style="color:#ff5e7e; padding: 24px;">Failed to load payout data.</p>`;
  }
}

function renderDrawer(data, pal) {
  document.getElementById('drawerAvatar').textContent = initials(data.name);
  document.getElementById('drawerName').textContent   = data.name;
  document.getElementById('drawerId').textContent     = data.driverId;

  const s = data.summary;

  // Build shift display
  const shiftChips = data.shifts.map(sh =>
    `<span class="shift-chip">${sh.label ? `<em style="color:var(--text-3)">${sh.label}:</em>` : ''}
      <strong>${sh.login} – ${sh.logout}</strong></span>`
  ).join('');

  // Warnings
  const warnHTML = s.deactivationWarning
    ? `<div class="warning-banner">⚠️ <strong>Deactivation Warning:</strong> ${s.rejectedDeliveries} rejections today (max 2 allowed)</div>`
    : '';

  const noShiftHTML = !data.qualifiesShiftPay
    ? `<div class="no-shift-banner">⏱️ <strong>No Shift Pay:</strong> Logged ${data.shiftHours.toFixed(1)} hrs — minimum 4 hrs required</div>`
    : '';

  // Delivery rows
  const rows = data.deliveryBreakdown.map(d => {
    const rowClass = d.isRejected ? 'row-rejected' : (d.disputed ? 'row-disputed' : '');
    const disputeTag = d.disputed ? '<span class="tag tag-disputed">DISPUTED</span>' : '';
    const streakTag = d.streakBonus > 0 ? '<span class="tag tag-streak">🔥 STREAK</span>' : '';

    const bonusCells = d.isRejected
      ? `<td class="val-neg" colspan="4">Penalty</td>`
      : `
        <td class="${valClass(d.rainBonus)}">${d.rainBonus ? fmt(d.rainBonus) : '—'}</td>
        <td class="${valClass(d.peakBonus)}">${d.peakBonus ? fmt(d.peakBonus) : '—'}</td>
        <td class="${valClass(d.distBonus)}">${d.distBonus ? fmt(d.distBonus) : '—'}</td>
        <td class="${valClass(d.streakBonus)}">${d.streakBonus ? '₹'+d.streakBonus : '—'}</td>
      `;

    return `
      <tr class="${rowClass}" title="${d.note || ''}">
        <td>${d.number}</td>
        <td>${d.time}</td>
        <td>${d.distanceKm != null ? d.distanceKm + ' km' : '—'}</td>
        <td>${conditionTags(d.conditions, d.isRejected)} ${disputeTag} ${streakTag}</td>
        <td class="${d.isRejected ? '' : 'val-pos'}">${d.isRejected ? '—' : '₹' + d.base}</td>
        ${bonusCells}
        <td class="${valClass(d.tip)}">${d.tip ? '₹'+d.tip : '—'}</td>
        <td class="${valClass(d.rowTotal)}" style="font-weight:700">${d.isRejected ? fmt(d.penalty) : '₹'+d.rowTotal}</td>
      </tr>`;
  }).join('');

  document.getElementById('drawerBody').innerHTML = `

    <!-- Shift info -->
    <div class="shift-info">
      <span class="shift-chip">⏱ Total: <strong style="color:${pal.color}">${data.shiftHours.toFixed(1)} hrs</strong></span>
      ${shiftChips}
    </div>

    ${warnHTML}
    ${noShiftHTML}

    <!-- Top summary -->
    <div class="payout-summary">
      <div class="ps-card">
        <div class="ps-label">Shift Pay</div>
        <div class="ps-value" style="color:${pal.color}">₹${data.shiftPay.toFixed(0)}</div>
      </div>
      <div class="ps-card">
        <div class="ps-label">Delivery Earnings</div>
        <div class="ps-value">₹${(s.totalBase + s.totalRain + s.totalPeak + s.totalDistance + s.streakBonuses).toFixed(0)}</div>
      </div>
      <div class="ps-card">
        <div class="ps-label">Tips</div>
        <div class="ps-value">₹${s.totalTips.toFixed(0)}</div>
      </div>
      <div class="ps-card">
        <div class="ps-label">Completed</div>
        <div class="ps-value">${s.completedDeliveries}</div>
      </div>
      <div class="ps-card">
        <div class="ps-label">Rejected</div>
        <div class="ps-value" style="color:${s.rejectedDeliveries > 0 ? '#ff5e7e' : 'inherit'}">${s.rejectedDeliveries}</div>
      </div>
      <div class="ps-card">
        <div class="ps-label">Penalties</div>
        <div class="ps-value" style="color:${s.totalPenalty < 0 ? '#ff5e7e' : 'inherit'}">₹${Math.abs(s.totalPenalty)}</div>
      </div>
    </div>

    <!-- Delivery breakdown table -->
    <p class="section-label">Delivery Breakdown</p>
    <div style="overflow-x:auto;">
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Dist</th>
            <th>Conditions</th>
            <th>Base</th>
            <th>Rain</th>
            <th>Peak</th>
            <th>Dist+</th>
            <th>Streak</th>
            <th>Tip</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-grid">
        <div class="total-row">
          <span class="tl">Shift Pay (${data.shiftHours.toFixed(1)} hrs)</span>
          <span class="tv">₹${data.shiftPay.toFixed(0)}</span>
        </div>
        <div class="total-row">
          <span class="tl">Base (${s.completedDeliveries} × ₹35)</span>
          <span class="tv">₹${s.totalBase}</span>
        </div>
        <div class="total-row">
          <span class="tl">Rain Bonus</span>
          <span class="tv" style="color:var(--teal)">₹${s.totalRain}</span>
        </div>
        <div class="total-row">
          <span class="tl">Peak Bonus</span>
          <span class="tv" style="color:#a78bfa">₹${s.totalPeak}</span>
        </div>
        <div class="total-row">
          <span class="tl">Long-Distance Bonus</span>
          <span class="tv" style="color:#ffb347">₹${s.totalDistance}</span>
        </div>
        <div class="total-row">
          <span class="tl">Streak Bonus</span>
          <span class="tv" style="color:#3dffa0">₹${s.streakBonuses}</span>
        </div>
        <div class="total-row">
          <span class="tl">Tips</span>
          <span class="tv">₹${s.totalTips}</span>
        </div>
        <div class="total-row">
          <span class="tl">Rejection Penalties</span>
          <span class="tv" style="color:#ff5e7e">−₹${Math.abs(s.totalPenalty)}</span>
        </div>
      </div>
      <div class="grand-total-row">
        <span class="gtl">Total Payout</span>
        <span class="gtv">₹${data.grandTotal.toFixed(0)}</span>
      </div>
    </div>
  `;
}

// ── Init ──────────────────────────────────────────────────────────────────
loadDrivers();
