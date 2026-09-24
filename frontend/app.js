const API = 'https://urbandash.onrender.com/api';
const AVATAR_COLORS = [
  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  { bg: '#fdf2f8', color: '#9d174d', border: '#fbcfe8' },
];
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function rupee(n) {
  if (n == null || n === 0) return '—';
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}
function rupeeSign(n) {
  if (!n) return '<span class="val-zero">—</span>';
  const cls = n > 0 ? 'val-pos' : 'val-neg';
  const sign = n > 0 ? '+' : '−';
  return `<span class="${cls}">${sign}₹${Math.abs(n)}</span>`;
}
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function shiftDuration(login, logout) {
  const mins = toMinutes(logout) - toMinutes(login);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
document.getElementById('headerDate').textContent =
  new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
let allDrivers = [];
let paletteMap = {};
async function loadDrivers() {
  try {
    const res = await fetch(`${API}/drivers`);
    allDrivers = await res.json();
    allDrivers.forEach((d, i) => {
      paletteMap[d.driverId] = AVATAR_COLORS[i % AVATAR_COLORS.length];
    });
    renderStats(allDrivers);
    renderTable(allDrivers);
  } catch (err) {
    document.getElementById('driverTbody').innerHTML = `
      <tr class="loader-row">
        <td colspan="7" style="color:#dc2626;">
          Could not connect to API at ${API}. Make sure the backend is running.
        </td>
      </tr>`;
  }
}
function renderStats(drivers) {
  const totalDel    = drivers.reduce((s, d) => s + d.completedDeliveries + d.rejectedDeliveries, 0);
  const totalRej    = drivers.reduce((s, d) => s + d.rejectedDeliveries, 0);
  const totalPayout = drivers.reduce((s, d) => s + d.grandTotal, 0);
  const avgPayout   = totalPayout / drivers.length;
  document.getElementById('statDrivers').textContent   = drivers.length;
  document.getElementById('statDeliveries').textContent = totalDel;
  document.getElementById('statRejected').textContent  = `${totalRej} rejection${totalRej !== 1 ? 's' : ''}`;
  document.getElementById('statTotal').textContent     = '₹' + totalPayout.toLocaleString('en-IN');
  document.getElementById('statAvg').textContent       = '₹' + Math.round(avgPayout).toLocaleString('en-IN');
  document.getElementById('statsRow').style.display    = 'grid';
  document.getElementById('driverCount').textContent   = `${drivers.length} drivers`;
}
function renderTable(drivers) {
  const tbody = document.getElementById('driverTbody');
  tbody.innerHTML = '';
  drivers.forEach((driver, i) => {
    const pal = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const shiftText = driver.shifts
      ? driver.shifts.map(s => `${s.login}–${s.logout}`).join(', ')
      : '—';
    let statusBadge = '';
    if (driver.deactivationWarning) {
      statusBadge = `<span class="badge badge-red"> At risk</span>`;
    } else if (!driver.qualifiesShiftPay) {
      statusBadge = `<span class="badge badge-amber">No shift pay</span>`;
    } else {
      statusBadge = `<span class="badge badge-green">Active</span>`;
    }
    const pct = Math.min((driver.shiftHours / 12) * 100, 100);
    const barColor = driver.qualifiesShiftPay ? '#2563eb' : '#f59e0b';
    const tr = document.createElement('tr');
    tr.id = `row-${driver.driverId}`;
    tr.innerHTML = `
      <td>
        <div class="driver-cell">
          <div class="driver-avatar" style="background:${pal.bg}; color:${pal.color}; border:1.5px solid ${pal.border};">
            ${initials(driver.name)}
          </div>
          <div>
            <div class="driver-name">${driver.name}</div>
            <div class="driver-id-small">${driver.driverId}</div>
          </div>
        </div>
      </td>
      <td class="text-muted mono" style="font-size:12.5px;">${shiftText}</td>
      <td>
        <div class="hours-bar-wrap">
          <div class="hours-bar-bg">
            <div class="hours-bar-fill" style="width:${pct}%; background:${barColor};"></div>
          </div>
          <span class="mono" style="font-size:12.5px; color:var(--text-2);">${driver.shiftHours}h</span>
        </div>
      </td>
      <td>
        <span class="count-pill mono">
          ${driver.completedDeliveries}
          ${driver.rejectedDeliveries > 0
            ? `<span class="count-rejected">${driver.rejectedDeliveries} rejected</span>`
            : ''}
        </span>
      </td>
      <td>${statusBadge}</td>
      <td style="text-align:right;">
        <span class="mono" style="font-weight:600; font-size:14px; color:var(--text-1);">
          ₹${driver.grandTotal.toLocaleString('en-IN')}
        </span>
      </td>
      <td class="chevron-cell"></td>
      <td class="delete-cell">
        <button class="delete-driver-btn" data-id="${driver.driverId}" title="Delete driver" aria-label="Delete ${driver.name}">Delete</button>
      </td>
    `;
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.delete-driver-btn')) return; 
      openDrawer(driver.driverId, i);
    });
    tr.querySelector('.delete-driver-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDelete(driver.driverId, driver.name);
    });
    tbody.appendChild(tr);
  });
}
const overlay   = document.getElementById('drawerOverlay');
const drawer    = document.getElementById('detailDrawer');
const closeBtn  = document.getElementById('drawerClose');
let currentPayoutData = null;
let activeTab = 'breakdown';
function openDrawer(driverId, idx) {
  const pal = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const avatar = document.getElementById('drawerAvatar');
  avatar.style.background = pal.bg;
  avatar.style.color      = pal.color;
  avatar.style.border     = `1.5px solid ${pal.border}`;
  avatar.textContent      = '…';
  document.getElementById('drawerName').textContent = '…';
  document.getElementById('drawerId').textContent   = driverId;
  document.getElementById('drawerBody').innerHTML   = `<div class="drawer-loading"><span class="spinner"></span> Calculating payout…</div>`;
  activeTab = 'breakdown';
  document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tabBreakdown').classList.add('active');
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
document.querySelectorAll('.drawer-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    if (currentPayoutData) renderDrawerContent(currentPayoutData);
  });
});
async function fetchPayout(driverId, pal) {
  try {
    const res  = await fetch(`${API}/payout/${driverId}`);
    const data = await res.json();
    currentPayoutData = data;
    document.getElementById('drawerAvatar').textContent = initials(data.name);
    document.getElementById('drawerName').textContent   = data.name;
    document.getElementById('drawerId').textContent     = `${data.driverId} · ${data.shiftHours}h logged`;
    renderDrawerContent(data);
  } catch (err) {
    document.getElementById('drawerBody').innerHTML =
      `<div class="alert alert-red">Failed to load payout data.</div>`;
  }
}
function renderDrawerContent(data) {
  if (activeTab === 'breakdown') renderBreakdownTab(data);
  else renderSummaryTab(data);
}
function renderBreakdownTab(data) {
  const s = data.summary;
  let alerts = '';
  if (s.deactivationWarning) {
    alerts += `<div class="alert alert-red"><div><strong>Deactivation Warning</strong> — ${s.rejectedDeliveries} rejections today (limit: 2/day)</div>
    </div>`;
  }
  if (!data.qualifiesShiftPay) {
    alerts += `<div class="alert alert-amber"><div><strong>No Shift Pay</strong> — Logged ${data.shiftHours.toFixed(1)} hrs. Minimum 4 hrs required.</div>
    </div>`;
  }
  if (data.deliveryBreakdown.some(d => d.disputed)) {
    alerts += `<div class="alert alert-blue"><div><strong>Disputed Delivery</strong> — One or more deliveries are under investigation. Treated as completed.</div>
    </div>`;
  }
  const shiftHTML = data.shifts.map(s => `
    <div class="shift-block">
      ${s.label ? `<span class="shift-block-label">${s.label}</span>` : ''}
      <span class="shift-block-time">${s.login} to ${s.logout}</span>
      <span class="shift-block-hrs">${shiftDuration(s.login, s.logout)}</span>
    </div>
  `).join('');
  const kpiHTML = `
    <div class="payout-kpi-grid">
      <div class="kpi-cell">
        <div class="kpi-label">Shift Pay</div>
        <div class="kpi-value">₹${data.shiftPay.toFixed(0)}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Delivery Earnings</div>
        <div class="kpi-value">₹${(s.totalBase + s.totalRain + s.totalPeak + s.totalDistance + s.streakBonuses).toFixed(0)}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Tips</div>
        <div class="kpi-value">₹${s.totalTips}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Completed</div>
        <div class="kpi-value">${s.completedDeliveries}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Rejected</div>
        <div class="kpi-value" style="color:${s.rejectedDeliveries > 0 ? 'var(--red)' : 'inherit'}">${s.rejectedDeliveries}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Penalties</div>
        <div class="kpi-value" style="color:${s.totalPenalty < 0 ? 'var(--red)' : 'inherit'}">
          ${s.totalPenalty < 0 ? '−' : ''}₹${Math.abs(s.totalPenalty)}
        </div>
      </div>
    </div>`;
  const rows = data.deliveryBreakdown.map(d => {
    const rowClass = d.isRejected ? 'row-rejected' : (d.disputed ? 'row-disputed' : '');
    let tags = '';
    if (d.isRejected) {
      tags = `<span class="ct ct-reject">Rejected</span>`;
    } else {
      const condList = d.conditions.filter(c => c !== 'normal');
      if (condList.length === 0) {
        tags = `<span class="ct-normal">—</span>`;
      } else {
        tags = condList.map(c => {
          if (c === 'PEAK')          return `<span class="ct ct-peak">Peak</span>`;
          if (c === 'RAIN')          return `<span class="ct ct-rain">Rain</span>`;
          if (c === 'long-distance') return `<span class="ct ct-dist">&gt;8km</span>`;
          return `<span class="ct">${c}</span>`;
        }).join('');
      }
      if (d.disputed) tags += ` <span class="ct ct-disputed">Disputed</span>`;
      if (d.streakBonus > 0) tags += ` <span class="ct ct-streak">Streak ×5</span>`;
    }
    const rowTotal = d.isRejected
      ? `<span class="val-neg">−₹${Math.abs(d.penalty)}</span>`
      : `<span class="val-bold">₹${d.rowTotal}</span>`;
    return `<tr class="${rowClass}" title="${d.note || ''}">
      <td class="cell-num">${d.number}</td>
      <td class="cell-time">${d.time}</td>
      <td class="cell-dist">${d.distanceKm != null ? d.distanceKm + ' km' : '—'}</td>
      <td><div class="cond-tags">${tags}</div></td>
      <td>${d.isRejected ? '<span class="val-zero">—</span>' : `<span class="val-pos">+₹${d.base}</span>`}</td>
      <td>${d.rainBonus  ? `<span class="val-pos">+₹${d.rainBonus}</span>`  : '<span class="val-zero">—</span>'}</td>
      <td>${d.peakBonus  ? `<span class="val-pos">+₹${d.peakBonus}</span>`  : '<span class="val-zero">—</span>'}</td>
      <td>${d.distBonus  ? `<span class="val-pos">+₹${d.distBonus}</span>`  : '<span class="val-zero">—</span>'}</td>
      <td>${d.tip        ? `<span>₹${d.tip}</span>`                         : '<span class="val-zero">—</span>'}</td>
      <td>${rowTotal}</td>
    </tr>`;
  }).join('');
  document.getElementById('drawerBody').innerHTML = `
    ${alerts}
    <div class="shift-blocks">${shiftHTML}</div>
    ${kpiHTML}
    <div class="section-divider">
      <span class="section-divider-label">Per-Delivery Breakdown</span>
      <div class="section-divider-line"></div>
    </div>
    <div class="breakdown-wrap">
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Distance</th>
            <th>Conditions</th>
            <th>Base</th>
            <th>Rain</th>
            <th>Peak</th>
            <th>Dist+</th>
            <th>Tip</th>
            <th>Row Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
function renderSummaryTab(data) {
  const s = data.summary;
  document.getElementById('drawerBody').innerHTML = `
    <div class="section-divider" style="margin-top:4px;">
      <span class="section-divider-label">Payout Components</span>
      <div class="section-divider-line"></div>
    </div>
    <div class="totals-box">
      <div class="totals-rows">
        <div class="total-row">
          <span class="total-label">Shift Pay (${data.shiftHours}h × ₹100)</span>
          <span class="total-val ${data.qualifiesShiftPay ? '' : 'val-zero'}">
            ${data.qualifiesShiftPay ? '₹' + data.shiftPay.toFixed(0) : '₹0 — ineligible'}
          </span>
        </div>
        <div class="total-row">
          <span class="total-label">Base (${s.completedDeliveries} × ₹35)</span>
          <span class="total-val">₹${s.totalBase}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Rain Bonus</span>
          <span class="total-val ${s.totalRain ? 'val-pos' : 'val-zero'}">
            ${s.totalRain ? '+₹' + s.totalRain : '—'}
          </span>
        </div>
        <div class="total-row">
          <span class="total-label">Peak Bonus</span>
          <span class="total-val ${s.totalPeak ? 'val-pos' : 'val-zero'}">
            ${s.totalPeak ? '+₹' + s.totalPeak : '—'}
          </span>
        </div>
        <div class="total-row">
          <span class="total-label">Long-Distance Bonus</span>
          <span class="total-val ${s.totalDistance ? 'val-pos' : 'val-zero'}">
            ${s.totalDistance ? '+₹' + s.totalDistance : '—'}
          </span>
        </div>
        <div class="total-row">
          <span class="total-label">Streak Bonus</span>
          <span class="total-val ${s.streakBonuses ? 'val-pos' : 'val-zero'}">
            ${s.streakBonuses ? '+₹' + s.streakBonuses : '—'}
          </span>
        </div>
        <div class="total-row">
          <span class="total-label">Tips</span>
          <span class="total-val">₹${s.totalTips}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Rejection Penalties (${s.rejectedDeliveries})</span>
          <span class="total-val ${s.totalPenalty < 0 ? 'val-neg' : 'val-zero'}">
            ${s.totalPenalty < 0 ? '−₹' + Math.abs(s.totalPenalty) : '—'}
          </span>
        </div>
      </div>
      <div class="grand-total-row">
        <span class="grand-total-label">Total Payout</span>
        <span class="grand-total-value">₹${data.grandTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;
}
async function deleteDriver(driverId) {
  try {
    const res = await fetch(`${API}/drivers/${driverId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    await loadDrivers();
  } catch (err) {
    alert(' Could not delete driver: ' + err.message);
  }
}
function confirmDelete(driverId, name) {
  const row = document.getElementById(`row-${driverId}`);
  if (!row || row.querySelector('.delete-confirm')) return;
  const banner = document.createElement('td');
  banner.colSpan = 8;
  banner.className = 'delete-confirm';
  banner.innerHTML = `
    <span class="delete-confirm-text">Delete <strong>${name}</strong>? This cannot be undone.</span>
    <button class="btn btn-danger" id="confirmYes-${driverId}">Yes, Delete</button>
    <button class="btn" id="confirmNo-${driverId}">Cancel</button>
  `;
  const confirmRow = document.createElement('tr');
  confirmRow.className = 'delete-confirm-row';
  confirmRow.id = `confirm-row-${driverId}`;
  confirmRow.appendChild(banner);
  row.insertAdjacentElement('afterend', confirmRow);
  document.getElementById(`confirmYes-${driverId}`).addEventListener('click', async () => {
    confirmRow.remove();
    await deleteDriver(driverId);
  });
  document.getElementById(`confirmNo-${driverId}`).addEventListener('click', () => {
    confirmRow.remove();
  });
}
loadDrivers();
const addDriverOverlay = document.getElementById('addDriverOverlay');
const openAddDriverBtn = document.getElementById('openAddDriver');
const closeAddDriverBtn = document.getElementById('closeAddDriver');
const modalCancelBtn   = document.getElementById('modalCancel');
const modalNextBtn     = document.getElementById('modalNext');
const modalBackBtn     = document.getElementById('modalBack');
const modalErrorEl     = document.getElementById('modalError');
let currentStep = 1;
let deliveryCount = 0;
let previewPayoutData = null;
function openAddDriverModal() {
  resetModal();
  addDriverOverlay.classList.add('active');
  addDriverOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('driverName').focus();
}
function closeAddDriverModal() {
  addDriverOverlay.classList.remove('active');
  addDriverOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
openAddDriverBtn.addEventListener('click', openAddDriverModal);
closeAddDriverBtn.addEventListener('click', closeAddDriverModal);
modalCancelBtn.addEventListener('click', closeAddDriverModal);
addDriverOverlay.addEventListener('click', (e) => {
  if (e.target === addDriverOverlay) closeAddDriverModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && addDriverOverlay.classList.contains('active')) closeAddDriverModal();
});
function resetModal() {
  currentStep = 1;
  deliveryCount = 0;
  previewPayoutData = null;
  document.getElementById('driverName').value    = '';
  document.getElementById('driverIdInput').value = '';
  document.getElementById('shiftLogin').value    = '09:00';
  document.getElementById('shiftLogout').value   = '15:00';
  document.getElementById('shiftLabel').value    = '';
  document.getElementById('deliveryRows').innerHTML = '';
  document.getElementById('previewContent').innerHTML =
    '<div class="drawer-loading"><span class="spinner"></span> Calculating payout…</div>';
  modalErrorEl.textContent = '';
  setStep(1);
  addDeliveryRow(); 
}
function setStep(step) {
  currentStep = step;
  [1, 2, 3].forEach(n => {
    document.getElementById(`modalStep${n}`).classList.toggle('hidden', n !== step);
  });
  [1, 2, 3].forEach(n => {
    const pip = document.getElementById(`step-pip-${n}`);
    pip.classList.remove('active', 'done');
    if (n < step)  pip.classList.add('done');
    if (n === step) pip.classList.add('active');
  });
  modalBackBtn.style.display = step > 1 ? 'inline-flex' : 'none';
  if (step === 3) {
    modalNextBtn.textContent = 'Save Driver';
  } else {
    modalNextBtn.textContent = 'Next';
  }
  const subtitles = {
    1: 'Enter driver shift and delivery details',
    2: 'Add each delivery for this shift',
    3: 'Review calculated payout before saving',
  };
  document.getElementById('modalSubtitle').textContent = subtitles[step];
  modalErrorEl.textContent = '';
}
function validateStep1() {
  const name  = document.getElementById('driverName').value.trim();
  const login  = document.getElementById('shiftLogin').value;
  const logout = document.getElementById('shiftLogout').value;
  if (!name)   { modalErrorEl.textContent = 'Driver name is required.'; return false; }
  if (!login)  { modalErrorEl.textContent = 'Shift login time is required.'; return false; }
  if (!logout) { modalErrorEl.textContent = 'Shift logout time is required.'; return false; }
  if (toMinutes(logout) <= toMinutes(login)) {
    modalErrorEl.textContent = 'Logout time must be after login time.';
    return false;
  }
  return true;
}
function validateStep2() {
  const rows = document.querySelectorAll('.delivery-row');
  if (rows.length === 0) {
    modalErrorEl.textContent = 'Add at least one delivery.';
    return false;
  }
  return true;
}
function collectDriverData() {
  const name   = document.getElementById('driverName').value.trim();
  const driverId = document.getElementById('driverIdInput').value.trim() || undefined;
  const login  = document.getElementById('shiftLogin').value;
  const logout = document.getElementById('shiftLogout').value;
  const label  = document.getElementById('shiftLabel').value.trim() || 'Shift';
  const deliveries = [];
  let num = 1;
  document.querySelectorAll('.delivery-row').forEach((row) => {
    const time       = row.querySelector('.del-time').value || '00:00';
    const distRaw    = row.querySelector('.del-dist').value;
    const tipRaw     = row.querySelector('.del-tip').value;
    const conditions = [];
    row.querySelectorAll('.cond-chip').forEach(chip => {
      if (chip.classList.contains('checked-peak'))   conditions.push('PEAK');
      if (chip.classList.contains('checked-rain'))   conditions.push('RAIN');
      if (chip.classList.contains('checked-dist'))   conditions.push('long-distance');
      if (chip.classList.contains('checked-reject')) conditions.push('REJECTED');
    });
    if (conditions.length === 0) conditions.push('normal');
    const isRejected = conditions.includes('REJECTED');
    deliveries.push({
      number:     num++,
      time,
      distanceKm: isRejected ? null : (distRaw ? parseFloat(distRaw) : 0),
      tip:        tipRaw ? parseFloat(tipRaw) : 0,
      conditions,
    });
  });
  return {
    name,
    driverId,
    shifts: [{ login, logout, label }],
    deliveries,
  };
}
async function loadPreview() {
  const driverData = collectDriverData();
  document.getElementById('previewContent').innerHTML =
    '<div class="drawer-loading"><span class="spinner"></span> Calculating payout…</div>';
  try {
    const res  = await fetch(`${API}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Calculation failed');
    previewPayoutData = data;
    renderPreview(data);
  } catch (err) {
    document.getElementById('previewContent').innerHTML =
      `<div class="alert alert-red">${err.message}</div>`;
  }
}
function renderPreview(data) {
  const s = data.summary;
  document.getElementById('previewContent').innerHTML = `
    <div class="preview-driver-header">
      <div class="preview-avatar">${initials(data.name)}</div>
      <div>
        <div class="preview-name">${data.name}</div>
        <div class="preview-meta">
          ${data.shifts[0].login} to ${data.shifts[0].logout} · ${data.shiftHours.toFixed(1)}h logged
          ${data.qualifiesShiftPay ? '· Qualifies for shift pay' : '·  No shift pay (< 4h)'}
        </div>
      </div>
    </div>
    <div class="totals-box">
      <div class="totals-rows">
        <div class="total-row">
          <span class="total-label">Shift Pay (${data.shiftHours.toFixed(1)}h × ₹100)</span>
          <span class="total-val ${data.qualifiesShiftPay ? '' : 'val-zero'}">
            ${data.qualifiesShiftPay ? '₹' + data.shiftPay.toFixed(0) : '₹0 — ineligible'}
          </span>
        </div>
        <div class="total-row">
          <span class="total-label">Base (${s.completedDeliveries} × ₹35)</span>
          <span class="total-val">₹${s.totalBase}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Rain Bonus</span>
          <span class="total-val ${s.totalRain ? 'val-pos' : 'val-zero'}">${s.totalRain ? '+₹' + s.totalRain : '—'}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Peak Bonus</span>
          <span class="total-val ${s.totalPeak ? 'val-pos' : 'val-zero'}">${s.totalPeak ? '+₹' + s.totalPeak : '—'}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Long-Distance Bonus</span>
          <span class="total-val ${s.totalDistance ? 'val-pos' : 'val-zero'}">${s.totalDistance ? '+₹' + s.totalDistance : '—'}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Streak Bonus</span>
          <span class="total-val ${s.streakBonuses ? 'val-pos' : 'val-zero'}">${s.streakBonuses ? '+₹' + s.streakBonuses : '—'}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Tips</span>
          <span class="total-val">₹${s.totalTips}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Rejection Penalties (${s.rejectedDeliveries})</span>
          <span class="total-val ${s.totalPenalty < 0 ? 'val-neg' : 'val-zero'}">
            ${s.totalPenalty < 0 ? '−₹' + Math.abs(s.totalPenalty) : '—'}
          </span>
        </div>
      </div>
      <div class="grand-total-row">
        <span class="grand-total-label">Total Payout</span>
        <span class="grand-total-value">₹${data.grandTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
    ${s.deactivationWarning
      ? `<div class="alert alert-red" style="margin-top:12px;"><div><strong>Deactivation Warning</strong> — ${s.rejectedDeliveries} rejections (limit: 2/day)</div>
        </div>`
      : ''}
  `;
}
async function saveDriver() {
  const driverData = collectDriverData();
  modalNextBtn.textContent = 'Saving…';
  modalNextBtn.disabled = true;
  modalErrorEl.textContent = '';
  try {
    const res  = await fetch(`${API}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save driver');
    closeAddDriverModal();
    await loadDrivers(); 
  } catch (err) {
    modalErrorEl.textContent = err.message;
    modalNextBtn.textContent = 'Save Driver';
    modalNextBtn.disabled = false;
  }
}
modalNextBtn.addEventListener('click', async () => {
  if (currentStep === 1) {
    if (!validateStep1()) return;
    setStep(2);
  } else if (currentStep === 2) {
    if (!validateStep2()) return;
    setStep(3);
    await loadPreview();
  } else if (currentStep === 3) {
    await saveDriver();
  }
});
modalBackBtn.addEventListener('click', () => {
  if (currentStep > 1) setStep(currentStep - 1);
});
document.getElementById('addDeliveryRow').addEventListener('click', addDeliveryRow);
function addDeliveryRow() {
  deliveryCount++;
  const idx = deliveryCount;
  const row = document.createElement('div');
  row.className = 'delivery-row';
  row.dataset.idx = idx;
  row.innerHTML = `
    <div class="delivery-row-header">
      <span class="delivery-row-num">Delivery #${idx}</span>
      <button class="delivery-row-delete" title="Remove this delivery">Remove</button>
    </div>
    <div class="delivery-row-grid">
      <div class="form-group">
        <label class="form-label">Time</label>
        <input class="form-input del-time" type="time" value="09:00" />
      </div>
      <div class="form-group">
        <label class="form-label">Distance (km)</label>
        <input class="form-input del-dist" type="number" min="0" step="0.1" placeholder="e.g. 4.5" />
      </div>
      <div class="form-group">
        <label class="form-label">Tip (₹)</label>
        <input class="form-input del-tip" type="number" min="0" step="1" placeholder="0" />
      </div>
    </div>
    <div class="cond-checkboxes">
      <label class="cond-chip" title="Peak hours: 12–14 & 19–21">
        <input type="checkbox" value="PEAK"> Peak
      </label>
      <label class="cond-chip" title="Rain bonus: +₹15">
        <input type="checkbox" value="RAIN"> Rain
      </label>
      <label class="cond-chip" title="Long-distance: >8km bonus">
        <input type="checkbox" value="long-distance"> >8km
      </label>
      <label class="cond-chip" title="Rejected delivery: −₹50 penalty">
        <input type="checkbox" value="REJECTED"> Rejected
      </label>
    </div>
  `;
  row.querySelectorAll('.cond-chip').forEach(chip => {
    const checkbox = chip.querySelector('input[type="checkbox"]');
    const classMap = {
      'PEAK': 'checked-peak',
      'RAIN': 'checked-rain',
      'long-distance': 'checked-dist',
      'REJECTED': 'checked-reject',
    };
    chip.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      chip.classList.toggle(classMap[checkbox.value], checkbox.checked);
      if (checkbox.value === 'REJECTED') {
        const distInput = row.querySelector('.del-dist');
        const tipInput  = row.querySelector('.del-tip');
        distInput.disabled = checkbox.checked;
        tipInput.disabled  = checkbox.checked;
        if (checkbox.checked) { distInput.value = ''; tipInput.value = ''; }
      }
    });
  });
  row.querySelector('.delivery-row-delete').addEventListener('click', () => {
    row.remove();
    renumberDeliveryRows();
  });
  document.getElementById('deliveryRows').appendChild(row);
}
function renumberDeliveryRows() {
  document.querySelectorAll('.delivery-row').forEach((row, i) => {
    row.querySelector('.delivery-row-num').textContent = `Delivery #${i + 1}`;
  });
}