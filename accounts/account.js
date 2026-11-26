// Renders one GitHub account's repos in the hub's own look.
const ACCT = document.body.dataset.acct;
const REPOS = ACCOUNTS[ACCT] || [];
const ICON = t => t === "HTML" ? "book" : t === "JavaScript" ? "gamepad" : "sparkle";
const ACCENT = "#6741D9";

document.documentElement.style.setProperty("--accent", ACCENT);
document.querySelector('meta[name="theme-color"]')?.setAttribute("content", ACCENT);
document.title = ACCT;
document.querySelectorAll("[data-ic]").forEach(el => el.innerHTML = svgIcon(el.dataset.ic));
document.getElementById("dot").textContent = ACCT[0].toUpperCase();
document.getElementById("whoName").textContent = ACCT;
document.getElementById("hello").textContent = ACCT;
document.getElementById("sub").textContent = REPOS.length + (REPOS.length === 1 ? " project" : " projects") + " on GitHub";

const rows = document.getElementById("rows");
REPOS.forEach(r => {
  const a = document.createElement("a");
  a.className = "tile";
  a.href = r.url; a.target = "_blank"; a.rel = "noopener";
  a.style.setProperty("--c", ACCENT);
  a.innerHTML = '<div class="ic" aria-hidden="true"></div><div class="tx"><h3></h3><p></p></div><span class="go" aria-hidden="true"></span>';
  a.querySelector(".ic").innerHTML = svgIcon(ICON(r.type));
  a.querySelector(".go").innerHTML = svgIcon("arrow");
  a.querySelector("h3").textContent = r.name;
  a.querySelector("p").textContent = (r.type ? r.type + " · " : "") + "Updated " + r.updated;
  rows.appendChild(a);
});
