let lastSchedule = null;
let originalRows = null;
let logoDataUrl = null;

let people = [];
let editingPersonId = null;

const $ = (id) => document.getElementById(id);

function parseNames(text) {
  return text
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateBR(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function dayNamePT(date) {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return days[date.getDay()];
}

function monthLabelFromInput(monthValue) {
  const [y, m] = monthValue.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getSelectedDaysSet() {
  const selected = new Set();
  if ($("daySun").checked) selected.add(0);
  if ($("dayMon").checked) selected.add(1);
  if ($("dayTue").checked) selected.add(2);
  if ($("dayWed").checked) selected.add(3);
  if ($("dayThu").checked) selected.add(4);
  if ($("dayFri").checked) selected.add(5);
  if ($("daySat").checked) selected.add(6);
  return selected;
}

function getCultDays(year, monthIndex0, selectedWeekdaysSet) {
  const dates = [];
  const d = new Date(year, monthIndex0, 1);
  while (d.getMonth() === monthIndex0) {
    if (selectedWeekdaysSet.has(d.getDay())) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getDayKey(dateObj) {
  const day = dateObj.getDay();
  if (day === 0) return "sun";
  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  if (day === 6) return "sat";
  return null;
}

function ensureGenerated() {
  if (!lastSchedule) {
    alert("Gere a escala primeiro.");
    return false;
  }
  return true;
}

function uniqueId() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

/* =========================
   PESSOAS
========================= */

function getAvailabilityLabel(p) {
  const days = [];
  if (p.availability.sun) days.push("Domingo");
  if (p.availability.mon) days.push("Segunda");
  if (p.availability.tue) days.push("Terça");
  if (p.availability.wed) days.push("Quarta");
  if (p.availability.thu) days.push("Quinta");
  if (p.availability.fri) days.push("Sexta");
  if (p.availability.sat) days.push("Sábado");
  return days.length ? days.join(", ") : "Nenhum dia";
}

function updatePeopleSummary() {
  const total = people.length;
  const active = people.filter(p => p.active).length;
  const inactive = total - active;

  if (total === 0) {
    $("peopleSummary").textContent = "Nenhuma pessoa cadastrada.";
    return;
  }

  $("peopleSummary").textContent =
    `${total} pessoa(s) cadastrada(s) • ${active} ativa(s) • ${inactive} inativa(s)`;
}

function renderPeople() {
  const list = $("peopleList");
  list.innerHTML = "";

  if (people.length === 0) {
    list.innerHTML = `<div class="summary-box">Nenhuma pessoa adicionada ainda.</div>`;
    updatePeopleSummary();
    updateStatsPreview();
    return;
  }

  people.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card" + (person.active ? "" : " inactive");

    card.innerHTML = `
      <div class="person-top">
        <div>
          <div class="person-name">${escapeHtml(person.name)}</div>
          <div class="person-meta">
            Disponível: ${escapeHtml(getAvailabilityLabel(person))}
            ${person.obs ? `<br>Obs: ${escapeHtml(person.obs)}` : ""}
          </div>
          <div class="person-tags">
            ${person.active ? `<span class="tag">Ativo</span>` : `<span class="tag light">Inativo</span>`}
            ${person.availability.sun ? `<span class="tag light">Dom</span>` : ""}
            ${person.availability.mon ? `<span class="tag light">Seg</span>` : ""}
            ${person.availability.tue ? `<span class="tag light">Ter</span>` : ""}
            ${person.availability.wed ? `<span class="tag light">Qua</span>` : ""}
            ${person.availability.thu ? `<span class="tag light">Qui</span>` : ""}
            ${person.availability.fri ? `<span class="tag light">Sex</span>` : ""}
            ${person.availability.sat ? `<span class="tag light">Sáb</span>` : ""}
          </div>
        </div>
      </div>

      <div class="person-actions">
        <button data-action="toggle" data-id="${person.id}">
          ${person.active ? "Desativar" : "Ativar"}
        </button>
        <button data-action="edit" data-id="${person.id}" class="ghost">Editar</button>
        <button data-action="remove" data-id="${person.id}">Remover</button>
      </div>
    `;

    list.appendChild(card);
  });

  list.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === "toggle") togglePerson(id);
      if (action === "edit") loadPersonForEdit(id);
      if (action === "remove") removePerson(id);
    });
  });

  updatePeopleSummary();
  updateStatsPreview();
}

function clearPersonForm() {
  $("personName").value = "";
  $("personObs").value = "";
  $("personSun").checked = true;
  $("personMon").checked = false;
  $("personTue").checked = false;
  $("personWed").checked = true;
  $("personThu").checked = false;
  $("personFri").checked = false;
  $("personSat").checked = true;
  editingPersonId = null;
  $("btnAddPerson").textContent = "Adicionar pessoa";
}

function addOrUpdatePerson() {
  const name = $("personName").value.trim();
  const obs = $("personObs").value.trim();

  const availability = {
    sun: $("personSun").checked,
    mon: $("personMon").checked,
    tue: $("personTue").checked,
    wed: $("personWed").checked,
    thu: $("personThu").checked,
    fri: $("personFri").checked,
    sat: $("personSat").checked
  };

  if (!name) {
    alert("Digite o nome da pessoa.");
    return;
  }

  if (!Object.values(availability).some(Boolean)) {
    alert("Selecione pelo menos um dia de disponibilidade.");
    return;
  }

  if (editingPersonId) {
    const idx = people.findIndex(p => p.id === editingPersonId);
    if (idx >= 0) {
      people[idx] = {
        ...people[idx],
        name,
        obs,
        availability
      };
    }
  } else {
    const exists = people.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("Já existe uma pessoa com esse nome.");
      return;
    }

    people.push({
      id: uniqueId(),
      name,
      obs,
      active: true,
      availability
    });
  }

  clearPersonForm();
  renderPeople();
}

function togglePerson(id) {
  people = people.map(p => p.id === id ? { ...p, active: !p.active } : p);
  renderPeople();
}

function removePerson(id) {
  const person = people.find(p => p.id === id);
  if (!person) return;

  const ok = confirm(`Deseja remover "${person.name}"?`);
  if (!ok) return;

  people = people.filter(p => p.id !== id);

  if (editingPersonId === id) clearPersonForm();

  renderPeople();
}

function loadPersonForEdit(id) {
  const person = people.find(p => p.id === id);
  if (!person) return;

  editingPersonId = id;
  $("personName").value = person.name;
  $("personObs").value = person.obs || "";
  $("personSun").checked = !!person.availability.sun;
  $("personMon").checked = !!person.availability.mon;
  $("personTue").checked = !!person.availability.tue;
  $("personWed").checked = !!person.availability.wed;
  $("personThu").checked = !!person.availability.thu;
  $("personFri").checked = !!person.availability.fri;
  $("personSat").checked = !!person.availability.sat;
  $("btnAddPerson").textContent = "Salvar edição";
}

/* =========================
   GERAÇÃO INTELIGENTE
========================= */

function smartGenerateSchedule({ peopleList, cultDays, cooldownEvents = 1, peoplePerDay = 1 }) {
  const activePeople = peopleList.filter(p => p.active);

  const count = Object.fromEntries(activePeople.map(p => [p.id, 0]));
  const lastAssignedIndex = Object.fromEntries(activePeople.map(p => [p.id, -999]));
  const rows = [];

  for (let i = 0; i < cultDays.length; i++) {
    const dateObj = cultDays[i];
    const dayKey = getDayKey(dateObj);

    const availableCandidates = activePeople.filter(p => p.availability[dayKey]);

    const chosenIds = [];

    for (let slot = 0; slot < peoplePerDay; slot++) {
      let best = null;
      let bestScore = Infinity;

      const usableCandidates = availableCandidates.filter(p => !chosenIds.includes(p.id));

      if (usableCandidates.length === 0) break;

      for (const person of usableCandidates) {
        let score = 0;

        score += count[person.id] * 10;

        const diff = i - lastAssignedIndex[person.id];
        if (diff <= cooldownEvents) score += 100;

        score += Math.random();

        if (score < bestScore) {
          bestScore = score;
          best = person;
        }
      }

      if (!best) break;

      chosenIds.push(best.id);
      count[best.id] += 1;
      lastAssignedIndex[best.id] = i;
    }

    const assignedPeople = chosenIds.map(id => {
      const p = activePeople.find(x => x.id === id);
      return p ? p.name : "—";
    });

    rows.push({
      iso: toISODate(dateObj),
      date: formatDateBR(dateObj),
      dayName: dayNamePT(dateObj),
      persons: assignedPeople.length ? assignedPeople : ["—"]
    });
  }

  return rows;
}

/* =========================
   PRÉVIA / STATS
========================= */

function updateStatsPreview() {
  const month = $("month").value;
  const selected = getSelectedDaysSet();
  const activePeople = people.filter(p => p.active);
  const peoplePerDay = Math.max(1, Number($("peoplePerDay").value) || 1);

  let eventCount = 0;
  if (month && selected.size > 0) {
    const [year, monthNum] = month.split("-").map(Number);
    const monthIndex0 = monthNum - 1;
    eventCount = getCultDays(year, monthIndex0, selected).length;
  }

  const assignments = eventCount * peoplePerDay;
  const average = activePeople.length ? (assignments / activePeople.length).toFixed(2) : "0";

  $("statPeople").textContent = activePeople.length;
  $("statEvents").textContent = eventCount;
  $("statAssignments").textContent = assignments;
  $("statAverage").textContent = average;

  const warningBox = $("warningBox");
  warningBox.hidden = true;
  warningBox.textContent = "";

  if (activePeople.length === 0 && month) {
    warningBox.hidden = false;
    warningBox.textContent = "Nenhuma pessoa ativa cadastrada para gerar a escala.";
    return;
  }

  if (assignments > 0 && activePeople.length > 0 && assignments > activePeople.length) {
    warningBox.hidden = false;
    warningBox.textContent = "Aviso: há mais escalas do que pessoas ativas. Repetições serão necessárias ao longo do mês.";
  }
}

function updatePreviewHeader(title, subtitle) {
  $("previewTitle").textContent = title || "Escala";
  $("previewSub").textContent = subtitle || "Selecione um mês e gere a escala";
}

/* =========================
   CALENDÁRIO
========================= */

function renderCalendar({ year, monthIndex0, selectedWeekdaysSet, assignmentByISO = {} }) {
  const cal = $("calendar");
  cal.innerHTML = "";

  const monthStart = new Date(year, monthIndex0, 1);
  const monthEnd = new Date(year, monthIndex0 + 1, 0);
  const daysInMonth = monthEnd.getDate();

  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  labels.forEach(l => {
    const el = document.createElement("div");
    el.className = "cal-weekday";
    el.textContent = l;
    cal.appendChild(el);
  });

  const startWeekday = monthStart.getDay();
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-cell muted";
    empty.innerHTML = `<div class="cal-day"> </div>`;
    cal.appendChild(empty);
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = new Date(year, monthIndex0, dayNum);
    const iso = toISODate(d);
    const isCult = selectedWeekdaysSet.has(d.getDay());

    const assigned = assignmentByISO[iso] || [];
    const text = Array.isArray(assigned) ? assigned.join("\n") : "";

    const cell = document.createElement("div");
    cell.className = "cal-cell" + (isCult ? " cult" : "");
    cell.innerHTML = `
      <div class="cal-day">${dayNum}</div>
      <div class="cal-name">${isCult ? escapeHtml(text) : ""}</div>
    `;
    cal.appendChild(cell);
  }

  const cellsAfterHeader = startWeekday + daysInMonth;
  const remainder = cellsAfterHeader % 7;
  const trailing = remainder === 0 ? 0 : (7 - remainder);

  for (let i = 0; i < trailing; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-cell muted";
    empty.innerHTML = `<div class="cal-day"> </div>`;
    cal.appendChild(empty);
  }
}

function rebuildCalendarFromSchedule() {
  const month = $("month").value;
  if (!month) return;

  const selected = getSelectedDaysSet();
  const [year, monthNum] = month.split("-").map(Number);
  const monthIndex0 = monthNum - 1;

  const assignmentByISO = {};
  if (lastSchedule?.rows) {
    lastSchedule.rows.forEach(r => assignmentByISO[r.iso] = r.persons);
  }

  $("calendarMonthLabel").textContent = monthLabelFromInput(month);
  renderCalendar({ year, monthIndex0, selectedWeekdaysSet: selected, assignmentByISO });
}

/* =========================
   TABELA EDITÁVEL
========================= */

function getEligiblePeopleByDayName(dayName) {
  const dayMap = {
    "Domingo": "sun",
    "Segunda": "mon",
    "Terça": "tue",
    "Quarta": "wed",
    "Quinta": "thu",
    "Sexta": "fri",
    "Sábado": "sat"
  };

  const dayKey = dayMap[dayName];
  return people.filter(p => p.active && p.availability[dayKey]);
}

function renderEditableTable() {
  const body = $("tblBody");
  body.innerHTML = "";

  if (!lastSchedule?.rows?.length) return;

  lastSchedule.rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.textContent = row.date;

    const tdDay = document.createElement("td");
    tdDay.textContent = row.dayName;

    const tdNames = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "select-wrap";

    const eligible = getEligiblePeopleByDayName(row.dayName);

    const selectedCount = row.persons.length;

    for (let i = 0; i < selectedCount; i++) {
      const select = document.createElement("select");
      select.className = "select";

      const options = [`<option value="">—</option>`]
        .concat(
          eligible.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
        );

      select.innerHTML = options.join("");
      select.value = row.persons[i] === "—" ? "" : row.persons[i];

      select.addEventListener("change", () => {
        const newValue = select.value?.trim() || "—";
        lastSchedule.rows[rowIndex].persons[i] = newValue;
        lastSchedule.rows[rowIndex].persons = lastSchedule.rows[rowIndex].persons.map(x => x || "—");

        $("btnResetEdits").disabled = false;
        rebuildCalendarFromSchedule();
      });

      wrap.appendChild(select);
    }

    tdNames.appendChild(wrap);

    tr.appendChild(tdDate);
    tr.appendChild(tdDay);
    tr.appendChild(tdNames);

    body.appendChild(tr);
  });
}

/* =========================
   GERAÇÃO
========================= */

function onGenerate() {
  const title = $("title").value.trim();
  const subtitleInput = $("subtitle").value.trim();
  const month = $("month").value;
  const selected = getSelectedDaysSet();

  const peoplePerDay = Math.max(1, Number($("peoplePerDay").value) || 1);
  const cooldownEvents = Math.max(0, Number($("cooldownEvents").value) || 0);

  if (!month) {
    alert("Selecione o mês.");
    return;
  }

  if (selected.size === 0) {
    alert("Selecione pelo menos 1 dia de culto.");
    return;
  }

  const activePeople = people.filter(p => p.active);
  if (activePeople.length < 1) {
    alert("Cadastre pelo menos 1 pessoa ativa.");
    return;
  }

  const [year, monthNum] = month.split("-").map(Number);
  const monthIndex0 = monthNum - 1;

  const cultDays = getCultDays(year, monthIndex0, selected);
  const monthLabel = monthLabelFromInput(month);
  const subtitle = subtitleInput || monthLabel;

  const rows = smartGenerateSchedule({
    peopleList: people,
    cultDays,
    cooldownEvents,
    peoplePerDay
  });

  lastSchedule = {
    title,
    subtitle,
    monthLabel,
    month,
    rows,
    peoplePerDay,
    cooldownEvents
  };

  originalRows = rows.map(r => ({
    ...r,
    persons: [...r.persons]
  }));

  updatePreviewHeader(title, subtitle);
  $("calendarMonthLabel").textContent = monthLabel;

  renderEditableTable();
  rebuildCalendarFromSchedule();
  $("btnResetEdits").disabled = true;
}

/* =========================
   RESET
========================= */

$("btnResetEdits").addEventListener("click", () => {
  if (!lastSchedule || !originalRows) return;

  lastSchedule.rows = originalRows.map(r => ({
    ...r,
    persons: [...r.persons]
  }));

  renderEditableTable();
  rebuildCalendarFromSchedule();
  $("btnResetEdits").disabled = true;
});

/* =========================
   EXPORTAR EXCEL
========================= */

function exportExcel() {
  if (!ensureGenerated()) return;

  const { title, subtitle, rows } = lastSchedule;

  const sheetData = [
    ["Título", title || "Escala"],
    ["Subtítulo", subtitle || ""],
    [],
    ["Data", "Dia", "Escalados"]
  ];

  rows.forEach(r => {
    sheetData.push([r.date, r.dayName, r.persons.filter(Boolean).join(", ").replaceAll("—", "")]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, "Escala");

  const safeName = (title || "escala").replace(/[^\w\-]+/g, "_");
  XLSX.writeFile(wb, `${safeName}.xlsx`);
}

/* =========================
   EXPORTAR PDF
========================= */

function exportPDF() {
  if (!ensureGenerated()) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const { title, subtitle, rows } = lastSchedule;
  const pageW = doc.internal.pageSize.getWidth();

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 40, 32, 50, 50);
    } catch {
      try {
        doc.addImage(logoDataUrl, "JPEG", 40, 32, 50, 50);
      } catch {}
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title || "Escala", pageW / 2, 52, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(subtitle || "", pageW / 2, 70, { align: "center" });

  const body = rows.map(r => [
    r.date,
    r.dayName,
    r.persons.filter(Boolean).join(", ").replaceAll("—", "")
  ]);

  doc.autoTable({
    startY: 105,
    head: [["Data", "Dia", "Escalados"]],
    body,
    theme: "striped",
    margin: { left: 70, right: 70 },
    tableWidth: pageW - 140,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 6,
      halign: "center",
      valign: "middle"
    },
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: 255,
      halign: "center"
    },
    bodyStyles: {
      halign: "center"
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 90, halign: "center" },
      1: { cellWidth: 110, halign: "center" },
      2: { cellWidth: "auto", halign: "center" }
    }
  });

  const safeName = (title || "escala").replace(/[^\w\-]+/g, "_");
  doc.save(`${safeName}.pdf`);
}

/* =========================
   LOGO
========================= */

$("logo").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    logoDataUrl = null;
    $("logoPreview").style.display = "none";
    $("logoPreview").src = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    logoDataUrl = reader.result;
    $("logoPreview").src = logoDataUrl;
    $("logoPreview").style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* =========================
   EVENTOS DE TELA
========================= */

$("btnAddPerson").addEventListener("click", addOrUpdatePerson);

$("btnClearPeople").addEventListener("click", () => {
  if (people.length === 0) return;

  const ok = confirm("Deseja remover todas as pessoas cadastradas?");
  if (!ok) return;

  people = [];
  clearPersonForm();
  renderPeople();
});

$("month").addEventListener("change", () => {
  const month = $("month").value;
  if (!month) return;

  const selected = getSelectedDaysSet();
  const [year, monthNum] = month.split("-").map(Number);
  const monthIndex0 = monthNum - 1;

  $("calendarMonthLabel").textContent = monthLabelFromInput(month);
  renderCalendar({ year, monthIndex0, selectedWeekdaysSet: selected, assignmentByISO: {} });

  updateStatsPreview();
});

[
  "daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat",
  "peoplePerDay", "cooldownEvents"
].forEach(id => {
  $(id).addEventListener("change", () => {
    updateStatsPreview();

    const month = $("month").value;
    if (!month) return;

    if (!lastSchedule) {
      const selected = getSelectedDaysSet();
      const [year, monthNum] = month.split("-").map(Number);
      const monthIndex0 = monthNum - 1;

      $("calendarMonthLabel").textContent = monthLabelFromInput(month);
      renderCalendar({ year, monthIndex0, selectedWeekdaysSet: selected, assignmentByISO: {} });
      return;
    }

    rebuildCalendarFromSchedule();
  });
});

$("title").addEventListener("input", () => {
  updatePreviewHeader($("title").value.trim(), $("subtitle").value.trim() || lastSchedule?.monthLabel || "");
});

$("subtitle").addEventListener("input", () => {
  updatePreviewHeader($("title").value.trim(), $("subtitle").value.trim() || lastSchedule?.monthLabel || "");
});

$("btnGenerate").addEventListener("click", onGenerate);
$("btnExcel").addEventListener("click", exportExcel);
$("btnPdf").addEventListener("click", exportPDF);

/* =========================
   INICIALIZAÇÃO
========================= */

clearPersonForm();
renderPeople();
updateStatsPreview();