// Robot-vision HUD for driving a machine from a HERMES relay. You steer the
// unit on the normal isometric map (so trees, terrain and other machines read
// clearly), and this overlay adds the "through their eyes" layer on top:
//   - a robot-vision PANEL top-right (like the minimap) — the scene right in
//     front of the unit, resampled as ASCII with a targeting reticle;
//   - target brackets on the driven unit and everything near it, out in world;
//   - readouts: unit, integrity, link range back to the relay, the relay's
//     solar cell, and the self-destruct / release prompt.
// Deliberately crude and roboty — a machine's cheap sensor feed.

const RAMP = ' .,:;irsXA253hMHGS#9B&@'; // dark -> bright glyph ramp
let sampCanvas = null, sampCtx = null;

// info: { srcCanvas, w, h, t, robot, unitLabel, relay, dist, maxRange, heading,
//   gait, integrity, battery, entities:[{x,y,label,kind}], project, selfDestructT }
export function drawRobotVision(ctx, info) {
  const { w, h, t } = info;
  const amber = '#ffb23a', green = '#6cff8a', red = '#ff5a44';
  ctx.save();

  // A very light scan tint + soft vignette over the whole view — enough to read
  // as "on a sensor" without hiding the landscape you're driving through.
  ctx.fillStyle = 'rgba(120,30,10,0.06)';
  ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.55, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

  // ---- In-world target brackets ----
  ctx.font = "10px ui-monospace, 'Courier New', monospace";
  const bracket = (x, y, s, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * s, y + sy * s - sy * 5);
      ctx.lineTo(x + sx * s, y + sy * s);
      ctx.lineTo(x + sx * s - sx * 5, y + sy * s);
      ctx.stroke();
    }
  };
  for (const e of info.entities || []) {
    const p = info.project(e.x, e.y);
    if (!p || p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;
    const col = e.kind === 'human' ? green : e.kind === 'hostile' ? red : amber;
    bracket(p.x, p.y - 8, 12, col);
    ctx.fillStyle = col;
    ctx.fillText(e.label, p.x + 14, p.y - 12);
  }
  // The unit you ARE: a bright override marker centred on it.
  const rp = info.project(info.robot.x, info.robot.y);
  if (rp) {
    bracket(rp.x, rp.y - 8, 18, green);
    ctx.strokeStyle = green; ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t / 300));
    ctx.beginPath(); ctx.arc(rp.x, rp.y - 8, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = green; ctx.font = "9px ui-monospace, 'Courier New', monospace";
    ctx.fillText('◉ RON OVERRIDE', rp.x + 20, rp.y - 16);
  }

  // ---- Robot-vision panel, top-right ----
  const PW = Math.min(260, Math.round(w * 0.4)), PH = 196;
  const px = w - PW - 12, py = 12;
  const feedH = PH - 74;
  ctx.fillStyle = 'rgba(8,4,0,0.82)';
  ctx.fillRect(px, py, PW, PH);
  ctx.strokeStyle = amber; ctx.lineWidth = 1.4;
  ctx.strokeRect(px + 0.5, py + 0.5, PW - 1, PH - 1);
  // header
  ctx.fillStyle = amber; ctx.font = "11px ui-monospace, 'Courier New', monospace";
  ctx.fillText(`◉ ${info.unitLabel}  ·  RON OVERRIDE`, px + 8, py + 15);
  ctx.strokeStyle = 'rgba(255,150,60,0.4)';
  ctx.beginPath(); ctx.moveTo(px + 6, py + 21); ctx.lineTo(px + PW - 6, py + 21); ctx.stroke();

  // ASCII feed: a crop of the scene around the unit, resampled into the panel.
  const fx = px + 6, fy = py + 26, fw = PW - 12, fh = feedH;
  ctx.save();
  ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
  ctx.fillStyle = '#050200'; ctx.fillRect(fx, fy, fw, fh);
  const dpr = info.srcCanvas.width / w;
  const cropW = w * 0.42, cropH = cropW * (fh / fw);
  const cxp = rp ? rp.x : w / 2, cyp = rp ? rp.y - 8 : h / 2;
  const sx = Math.max(0, (cxp - cropW / 2) * dpr), sy = Math.max(0, (cyp - cropH / 2) * dpr);
  const sw = cropW * dpr, sh = cropH * dpr;
  const CELL = 7;
  const cols = Math.max(1, Math.floor(fw / CELL)), rows = Math.max(1, Math.floor(fh / CELL));
  if (!sampCanvas || sampCanvas.width !== cols || sampCanvas.height !== rows) {
    sampCanvas = document.createElement('canvas');
    sampCanvas.width = cols; sampCanvas.height = rows;
    sampCtx = sampCanvas.getContext('2d', { willReadFrequently: true });
  }
  let data = null;
  try {
    sampCtx.clearRect(0, 0, cols, rows);
    sampCtx.drawImage(info.srcCanvas, sx, sy, sw, sh, 0, 0, cols, rows);
    data = sampCtx.getImageData(0, 0, cols, rows).data;
  } catch (e) { data = null; }
  if (data) {
    ctx.font = `${CELL + 2}px ui-monospace, 'Courier New', monospace`;
    ctx.textBaseline = 'top';
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const i = (cy * cols + cx) * 4;
        let lum = (0.3 * data[i] + 0.6 * data[i + 1] + 0.11 * data[i + 2]) / 255;
        lum = Math.min(1, Math.pow(lum, 0.6) * 1.7);
        if (lum < 0.05) continue;
        const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))];
        ctx.fillStyle = `rgba(${Math.round(180 + 60 * lum)},${Math.round(120 + 130 * lum)},${Math.round(40 + 60 * lum * lum)},${(0.6 + 0.4 * lum).toFixed(2)})`;
        ctx.fillText(ch, fx + cx * CELL, fy + cy * CELL);
      }
    }
  }
  ctx.textBaseline = 'alphabetic';
  // scanlines + a small centre reticle in the feed
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = fy; y < fy + fh; y += 3) ctx.fillRect(fx, y, fw, 1);
  const rcx = fx + fw / 2, rcy = fy + fh / 2;
  ctx.strokeStyle = green; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(rcx - 7, rcy); ctx.lineTo(rcx + 7, rcy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rcx, rcy - 7); ctx.lineTo(rcx, rcy + 7); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Readouts under the feed: three bars, then the prompt.
  const bar = (frac, n) => { const on = Math.round(Math.max(0, Math.min(1, frac)) * n); return '▓'.repeat(on) + '░'.repeat(n - on); };
  const rangeFrac = 1 - Math.min(1, info.dist / info.maxRange);
  const near = info.dist > info.maxRange * 0.8;
  ctx.font = "10px ui-monospace, 'Courier New', monospace";
  let ly = py + PH - 44;
  ctx.fillStyle = info.integrity < 0.3 ? red : amber;
  ctx.fillText(`HULL ${bar(info.integrity, 9)}`, px + 8, ly);
  ctx.fillStyle = near ? red : green;
  ctx.fillText(`LINK ${bar(rangeFrac, 9)} ${info.dist.toFixed(0)}/${info.maxRange}m`, px + 8, ly + 13);
  ctx.fillStyle = (info.battery ?? 1) < 0.2 ? red : amber;
  ctx.fillText(`CELL ${bar(info.battery ?? 1, 9)} ${Math.round((info.battery ?? 1) * 100)}%`, px + 8, ly + 26);

  // Bottom prompt line (full width, under the whole view).
  ctx.font = "12px ui-monospace, 'Courier New', monospace";
  ctx.fillStyle = amber;
  ctx.fillText(`HEADING ${info.heading}   GAIT ${info.gait}`, 16, h - 18);
  ctx.textAlign = 'right';
  if (info.selfDestructT >= 0) {
    ctx.fillStyle = (Math.sin(t / 60) > 0) ? red : '#ffd0c0';
    ctx.fillText(`⚠ SELF-DESTRUCT ${info.selfDestructT.toFixed(1)}s  [X] abort`, w - 16, h - 18);
  } else {
    ctx.fillStyle = green;
    ctx.fillText('[X] self-destruct   [ESC] release', w - 16, h - 18);
  }
  ctx.textAlign = 'left';
  if (near && info.selfDestructT < 0) {
    ctx.font = "bold 14px ui-monospace, 'Courier New', monospace";
    ctx.fillStyle = (Math.sin(t / 100) > 0) ? red : 'rgba(255,90,68,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ LINK DEGRADING — RETURN TOWARD RELAY', w / 2, h - 40);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}
