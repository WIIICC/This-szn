(function () {
  "use strict";

  var CLUB_COLORS = {
    "Manchester City": "#6CABDD",
    Arsenal: "#EF0107",
    Liverpool: "#C8102E",
    "Real Madrid": "#FEBE10",
    Barcelona: "#A50044",
    "Atlético Madrid": "#CB3524",
    "Bayern Munich": "#DC052D",
    "Borussia Dortmund": "#FDE100",
    Inter: "#010E80",
    Juventus: "#DCDCDC",
    "AC Milan": "#FB090B",
    "Paris Saint-Germain": "#004170",
  };

  var LEAGUE_ORDER = [
    "Premier League",
    "La Liga",
    "Bundesliga",
    "Serie A",
    "Ligue 1",
  ];

  var CLUB_ORDER = [
    "Manchester City",
    "Arsenal",
    "Liverpool",
    "Real Madrid",
    "Barcelona",
    "Atlético Madrid",
    "Bayern Munich",
    "Borussia Dortmund",
    "Inter",
    "Juventus",
    "AC Milan",
    "Paris Saint-Germain",
  ];

  var players = Array.isArray(window.PLAYERS) ? window.PLAYERS.slice() : [];

  var state = {
    league: null,
    club: null,
    query: "",
    detailId: null,
  };

  var els = {
    nav: document.getElementById("league-nav"),
    list: document.getElementById("player-list"),
    listView: document.getElementById("list-view"),
    detail: document.getElementById("detail"),
    meta: document.getElementById("list-meta"),
    empty: document.getElementById("empty"),
    search: document.getElementById("search"),
    back: document.getElementById("back-btn"),
    rail: document.getElementById("rail"),
  };

  function clubsPresent() {
    var set = {};
    players.forEach(function (p) {
      set[p.club] = true;
    });
    return CLUB_ORDER.filter(function (c) {
      return set[c];
    });
  }

  function leaguesPresent() {
    var clubs = clubsPresent();
    var map = {};
    clubs.forEach(function (c) {
      var p = players.find(function (x) {
        return x.club === c;
      });
      if (p) map[p.league] = true;
    });
    return LEAGUE_ORDER.filter(function (l) {
      return map[l];
    });
  }

  function photoSrc(photo) {
    if (!photo) return "";
    var url = photo.commonsUrl || "";
    var marker = "/wiki/File:";
    var i = url.indexOf(marker);
    if (i >= 0) {
      return (
        "https://commons.wikimedia.org/wiki/Special:FilePath/" +
        url.slice(i + marker.length) +
        "?width=640"
      );
    }
    // BUG FIX: append width param to direct file URLs too, to avoid loading full-size images
    var file = photo.file || "";
    if (file && file.indexOf("width=") === -1) {
      return file + (file.indexOf("?") >= 0 ? "&" : "?") + "width=640";
    }
    return file;
  }

  function monogram(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function natLabel(p) {
    var n = p.nationality;
    if (!n) return "—";
    if (n.flag) return n.flag + " " + (n.country || "");
    return n.country || "—";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildNav() {
    var html = "";
    html +=
      '<button type="button" class="all-btn' +
      (!state.league && !state.club ? " active" : "") +
      '" data-all="1">All clubs</button>';

    leaguesPresent().forEach(function (league) {
      html += '<div class="league-block">';
      html +=
        '<button type="button" class="league-label' +
        (state.league === league && !state.club ? " active" : "") +
        '" data-league="' +
        escapeHtml(league) +
        '">' +
        escapeHtml(league) +
        "</button>";
      clubsPresent()
        .filter(function (c) {
          var sample = players.find(function (p) {
            return p.club === c;
          });
          return sample && sample.league === league;
        })
        .forEach(function (club) {
          var color = CLUB_COLORS[club] || "#666";
          html +=
            '<button type="button" class="club-btn' +
            (state.club === club ? " active" : "") +
            '" data-club="' +
            escapeHtml(club) +
            '" style="--club-color:' +
            color +
            '"><span class="club-swatch" aria-hidden="true"></span>' +
            escapeHtml(club) +
            "</button>";
        });
      html += "</div>";
    });
    els.nav.innerHTML = html;
  }

  function matchesFilters(p) {
    if (state.club && p.club !== state.club) return false;
    if (state.league && !state.club && p.league !== state.league) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var hay = [
      p.name,
      p.club,
      p.league,
      p.nationality && p.nationality.country,
      p.position,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function filtered() {
    return players.filter(matchesFilters);
  }

  function renderList() {
    var rows = filtered();
    var label = "All clubs";
    if (state.club) label = state.club;
    else if (state.league) label = state.league;
    els.meta.textContent =
      label + " · " + rows.length + " player" + (rows.length === 1 ? "" : "s");

    if (!rows.length) {
      els.list.innerHTML = "";
      els.empty.classList.remove("hidden");
      return;
    }
    els.empty.classList.add("hidden");

    els.list.innerHTML = rows
      .map(function (p) {
        var src = photoSrc(p.photo);
        var photo = src
          ? '<img class="avatar" src="' +
            escapeHtml(src) +
            '" alt="" width="40" height="40" loading="lazy" />'
          : '<div class="monogram" aria-hidden="true">' +
            escapeHtml(monogram(p.name)) +
            "</div>";
        var salary =
          p.salary && p.salary.available && p.salary.grossAnnual
            ? escapeHtml(p.salary.grossAnnual)
            : "—";
        var goals =
          p.stats && typeof p.stats.goalsTotal === "number"
            ? String(p.stats.goalsTotal)
            : "—";
        var goalsClass =
          typeof (p.stats && p.stats.goalsTotal) === "number"
            ? "cell-goals"
            : "cell-goals is-empty";
        return (
          '<li><button type="button" class="player-row" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<span class="cell-player">' +
          photo +
          '<span class="player-text"><span class="player-name">' +
          escapeHtml(p.name) +
          '</span><span class="player-nat">' +
          escapeHtml(natLabel(p)) +
          "</span></span></span>" +
          '<span class="cell-club">' +
          escapeHtml(p.club) +
          "</span>" +
          '<span class="cell-age">' +
          (p.age != null ? escapeHtml(String(p.age)) : "—") +
          "</span>" +
          '<span class="cell-salary">' +
          salary +
          "</span>" +
          '<span class="' +
          goalsClass +
          '">' +
          escapeHtml(goals) +
          "</span>" +
          "</button></li>"
        );
      })
      .join("");
  }

  function fmtStat(val) {
    if (val === null || val === undefined) {
      return { text: "unavailable", unavail: true };
    }
    return { text: String(val), unavail: false };
  }

  function renderDetail(p) {
    if (!p) {
      els.detail.innerHTML = '<p class="stats-note">Player not found.</p>';
      return;
    }

    var photoHtml;
    var src = photoSrc(p.photo);
    if (src) {
      photoHtml =
        '<img class="detail-photo" src="' +
        escapeHtml(src) +
        '" alt="' +
        escapeHtml(p.name) +
        '" />' +
        '<p class="photo-credit">' +
        escapeHtml(p.photo.license || "") +
        (p.photo.credit ? " · " + escapeHtml(p.photo.credit) : "") +
        (p.photo.commonsUrl
          ? ' · <a href="' +
            escapeHtml(p.photo.commonsUrl) +
            '" target="_blank" rel="noopener noreferrer">Commons</a>'
          : "") +
        "</p>";
    } else {
      photoHtml =
        '<div class="detail-monogram" aria-hidden="true">' +
        escapeHtml(monogram(p.name)) +
        "</div>";
    }

    var salaryHtml;
    if (p.salary && p.salary.available && p.salary.grossAnnual) {
      salaryHtml =
        '<div class="salary-block">' +
        '<div class="salary-annual">' +
        escapeHtml(p.salary.grossAnnual) +
        "</div>" +
        (p.salary.grossWeekly
          ? '<div class="salary-weekly">' +
            escapeHtml(p.salary.grossWeekly) +
            " / week</div>"
          : "") +
        '<div class="salary-label">Capology estimated gross fixed per year for 2026/27</div>' +
        (p.salary.sourceUrl
          ? '<a class="salary-link" href="' +
            escapeHtml(p.salary.sourceUrl) +
            '" target="_blank" rel="noopener noreferrer">Capology source</a>'
          : "") +
        "</div>";
    } else {
      salaryHtml =
        '<div class="salary-block"><p class="salary-unavailable">Salary unavailable</p>' +
        (p.salary && p.salary.sourceUrl
          ? '<a class="salary-link" href="' +
            escapeHtml(p.salary.sourceUrl) +
            '" target="_blank" rel="noopener noreferrer">Capology</a>'
          : "") +
        "</div>";
    }

    var statsHtml = '<h2 class="stats-heading">2026/27 by competition</h2>';
    // BUG FIX: safely check competitions exists before checking .length
    if (
      !p.stats ||
      !p.stats.available ||
      !p.stats.competitions ||
      !p.stats.competitions.length
    ) {
      statsHtml +=
        '<p class="stats-note">2026/27 goals and assists are not published for this player yet.</p>';
    } else {
      statsHtml +=
        '<table class="stats-table"><thead><tr><th>Competition</th><th class="num">Goals</th><th class="num">Assists</th></tr></thead><tbody>';
      p.stats.competitions.forEach(function (c) {
        var g = fmtStat(c.goals);
        var a = fmtStat(c.assists);
        statsHtml +=
          "<tr><td>" +
          escapeHtml(c.competition) +
          '</td><td class="num' +
          (g.unavail ? " unavail" : "") +
          '">' +
          escapeHtml(g.text) +
          '</td><td class="num' +
          (a.unavail ? " unavail" : "") +
          '">' +
          escapeHtml(a.text) +
          "</td></tr>";
      });
      statsHtml += "</tbody></table>";
    }

    els.detail.innerHTML =
      '<div class="detail-photo-wrap">' +
      photoHtml +
      "</div>" +
      '<div class="detail-body">' +
      '<h1 class="detail-name">' +
      escapeHtml(p.name) +
      "</h1>" +
      '<div class="detail-nat">' +
      escapeHtml(natLabel(p)) +
      "</div>" +
      '<div class="detail-meta">' +
      '<div class="meta-item"><span class="meta-label">Age</span><span class="meta-value">' +
      (p.age != null ? escapeHtml(String(p.age)) : "—") +
      (p.ageSource
        ? ' <span style="color:var(--muted);font-size:12px">(' +
          escapeHtml(p.ageSource) +
          ")</span>"
        : "") +
      "</span></div>" +
      '<div class="meta-item"><span class="meta-label">Club</span><span class="meta-value">' +
      escapeHtml(p.club) +
      "</span></div>" +
      '<div class="meta-item"><span class="meta-label">Position</span><span class="meta-value">' +
      escapeHtml(p.position || "—") +
      "</span></div>" +
      "</div>" +
      salaryHtml +
      statsHtml +
      "</div>";
  }

  function showList() {
    state.detailId = null;
    els.listView.classList.remove("hidden");
    els.detail.classList.add("hidden");
    els.back.classList.add("hidden");
    renderList();
  }

  function showDetail(id) {
    var p = players.find(function (x) {
      return x.id === id;
    });
    state.detailId = id;
    els.listView.classList.add("hidden");
    els.detail.classList.remove("hidden");
    els.back.classList.remove("hidden");
    els.meta.textContent = p ? p.name : "Player";
    renderDetail(p);
    // BUG FIX: scroll to top so the detail view starts at the top on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyRoute() {
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash) {
      showDetail(decodeURIComponent(hash));
    } else {
      showList();
    }
  }

  function setHash(id) {
    if (id) {
      history.pushState(null, "", "#" + encodeURIComponent(id));
    } else {
      history.pushState(null, "", location.pathname + location.search);
    }
  }

  els.nav.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-all")) {
      state.league = null;
      state.club = null;
    } else if (btn.hasAttribute("data-league")) {
      state.league = btn.getAttribute("data-league");
      state.club = null;
    } else if (btn.hasAttribute("data-club")) {
      state.club = btn.getAttribute("data-club");
      state.league = null;
    } else {
      return;
    }
    buildNav();
    if (state.detailId) {
      setHash("");
      showList();
    } else {
      renderList();
    }
  });

  els.list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-id]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    setHash(id);
    showDetail(id);
  });

  els.back.addEventListener("click", function () {
    setHash("");
    showList();
    // BUG FIX: scroll to top when going back to list
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.search.addEventListener("input", function () {
    state.query = els.search.value || "";
    if (state.detailId) {
      setHash("");
      showList();
    } else {
      renderList();
    }
  });

  // BUG FIX: remove hashchange listener — popstate already covers back/forward,
  // and hashchange causes applyRoute to fire twice on every back/forward navigation
  window.addEventListener("popstate", applyRoute);

  buildNav();
  applyRoute();
})();
