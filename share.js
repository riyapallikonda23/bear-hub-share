"use strict";
// Read-only viewer for data.json (published by Bear Hub). No login, no tracking.
const TZ = "America/Los_Angeles";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const when = (iso, t = true) => !iso ? "—" : new Date(iso).toLocaleString("en-US", Object.assign({ timeZone: TZ, weekday: "short", month: "short", day: "numeric" }, t ? { hour: "numeric", minute: "2-digit" } : {}));
const pct = p => p == null ? "—" : `${Number(p).toFixed(1)}%`;
const STATUS = { graded: ["ok", "graded"], submitted: ["blue", "submitted"], missing: ["bad", "missing"], excused: ["", "excused"], open: ["", "not yet"] };
let DATA, open = null;

function render() {
  const d = DATA;
  document.getElementById("who").textContent = d.student ? `${d.student}'s classes` : "My classes";
  document.getElementById("updated").textContent = `Updated ${when(d.generated_at)} (Pacific)`;
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="grid">${d.courses.map((c, i) => `
      <button class="card course ${open === i ? "open" : ""}" data-i="${i}">
        <div class="small muted">${esc(c.term || "")}</div><div class="code">${esc(c.code)}</div><div class="name">${esc(c.name)}</div>
        <div class="big">${pct(c.grade_pct)}</div><div class="small muted">${esc(c.grade_letter || "")}</div></button>`).join("") || `<div class="empty">No classes.</div>`}</div>
    ${open !== null ? detail(d.courses[open]) : `<p class="small muted">Tap a class to see the grade breakdown.</p>`}
    <h2>Coming up (next 30 days)</h2>
    <div class="card">${d.upcoming.length ? d.upcoming.map(a => `<div class="row"><span class="pill">${esc(a.course)}</span>
      <div class="grow"><div>${esc(a.name)}</div><div class="small muted">${when(a.due_at)}${a.points != null ? " · " + esc(a.points) + " pts" : ""}</div></div>
      ${a.done ? `<span class="pill ok">done</span>` : ""}</div>`).join("") : `<div class="empty">Nothing due.</div>`}</div>
    ${d.events.length ? `<h2>Exams & events</h2><div class="card">${d.events.map(e => `<div class="row"><span class="pill">${esc(e.course)}</span>
      <div class="grow"><div>${esc(e.title)}</div><div class="small muted">${when(e.start_at)}${e.location ? " · " + esc(e.location) : ""}</div></div></div>`).join("")}</div>` : ""}`;
  app.querySelectorAll(".course").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i; open = open === i ? null : i; render(); }));
}

function detail(c) {
  const byGroup = {};
  c.assignments.forEach(a => (byGroup[a.group || "Other"] = byGroup[a.group || "Other"] || []).push(a));
  const groups = c.groups.length ? c.groups : Object.keys(byGroup).map(n => ({ name: n }));
  return `<div class="card detail"><h2 style="margin-top:0">${esc(c.code)} — ${pct(c.grade_pct)} ${esc(c.grade_letter || "")}</h2>
    <div class="scroll"><table><thead><tr><th>Assignment</th><th>Due</th><th>Score</th><th></th></tr></thead><tbody>
    ${groups.map(g => `<tr class="grp"><td colspan="2">${esc(g.name)}${c.weighted && g.weight ? ` <span class="pill">${esc(g.weight)}%</span>` : ""}</td>
      <td colspan="2">${g.pct != null ? pct(g.pct) : ""}</td></tr>
      ${(byGroup[g.name] || []).map(a => { const [cls, label] = STATUS[a.status] || ["", a.status];
        return `<tr><td>${esc(a.name)}</td><td class="small">${when(a.due_at, false)}</td>
        <td>${a.score != null ? esc(a.score) : "—"} / ${a.points != null ? esc(a.points) : "—"}</td><td><span class="pill ${cls}">${esc(label)}</span></td></tr>`; }).join("")}`).join("")}
    </tbody></table></div></div>`;
}

fetch("data.json", { cache: "no-store" }).then(r => r.json()).then(d => { DATA = d; render(); })
  .catch(() => { document.getElementById("app").innerHTML = `<p class="empty">Couldn't load the snapshot.</p>`; });
