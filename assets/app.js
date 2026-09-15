(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }
  function two(n){ return (n < 10 ? "0" : "") + n; }

  /* ── мобильное меню ── */
  var burger = $("burger"), nav = $("nav");
  if (burger && nav) {
    burger.addEventListener("click", function(){
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      burger.textContent = open ? "✕" : "☰";
    });
    nav.addEventListener("click", function(e){
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        burger.textContent = "☰";
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── высота шапки со строкой статуса: от неё считается высота первого экрана.
     На узком экране строка статуса переносится, поэтому меряем, а не угадываем. ── */
  function measureChrome(){
    var top = document.querySelector(".top"), led = document.querySelector(".led");
    if (!top || !led) return;
    var h = Math.round(top.getBoundingClientRect().height + led.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--chrome", h + "px");
  }
  measureChrome();
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(measureChrome);
    [".top", ".led"].forEach(function(sel){
      var el = document.querySelector(sel);
      if (el) ro.observe(el);
    });
  }
  window.addEventListener("resize", measureChrome);
  window.addEventListener("orientationchange", measureChrome);

  /* ── время бара: Альметьевск живёт по Москве, UTC+3 ── */
  function barNow(){
    var n = new Date();
    return new Date(n.getTime() + (n.getTimezoneOffset() + 180) * 60000);
  }
  /* открытие после отпуска: 24 сентября 2026, 11:00 */
  var REOPEN = new Date(2026, 8, 24, 11, 0, 0);

  /* график: [час открытия, час закрытия следующим утром] по дню недели (0 — вс) */
  var SCHEDULE = { 0:[10,2], 1:[11,2], 2:[11,2], 3:[11,2], 4:[11,2], 5:[11,3], 6:[10,3] };

  function openState(now){
    var d = now.getDay(), h = now.getHours();
    var today = SCHEDULE[d], yesterday = SCHEDULE[(d + 6) % 7];
    if (h < yesterday[1]) return { open:true, until: yesterday[1] };
    if (h >= today[0])    return { open:true, until: today[1] };
    return { open:false, from: today[0] };
  }

  var now = barNow();
  var dot = $("statusDot"), txt = $("statusText"), sub = $("statusSub");

  if (txt && sub) {
    if (now < REOPEN) {
      var days = Math.ceil((REOPEN - now) / 86400000);
      var tail = (days % 10 === 1 && days % 100 !== 11) ? "день"
               : ([2,3,4].indexOf(days % 10) > -1 && [12,13,14].indexOf(days % 100) === -1) ? "дня" : "дней";
      txt.textContent = "Бар в отпуске — открываемся 24 сентября";
      sub.textContent = "Осталось " + days + " " + tail + " · Ленина, 24, вход со стороны Пушкина";
    } else {
      var st = openState(now);
      if (st.open) {
        if (dot) dot.classList.add("on");
        txt.textContent = "Открыто — работаем до " + two(st.until) + ":00";
      } else {
        txt.textContent = "Закрыто — откроемся в " + two(st.from) + ":00";
      }
      sub.textContent = "Альметьевск, Ленина, 24 · вход со стороны Пушкина";
    }
  }

  /* ── подсветка сегодняшней строки в графике доставки ── */
  var wd = now.getDay();
  var key = (wd === 0) ? "0" : (wd === 5) ? "5" : (wd === 6) ? "6" : "1";
  var row = document.querySelector('#hours li[data-d="' + key + '"]');
  if (row) row.classList.add("today");

  /* ── афиша ───────────────────────────────────────────────────────────
     Заполните массив — список отрисуется вместо заглушки:
     var MATCHES = [
       { time:"22:00", teams:"«Кристал Пэлас» — «Манчестер Сити»", league:"АПЛ · 28 сентября" },
       { time:"17:00", teams:"«Ак Барс» — «Сибирь»",              league:"КХЛ · 29 сентября" }
     ];                                                                   */
  var MATCHES = [];

  var list = $("matchList"), empty = $("matchEmpty");
  if (list && empty && MATCHES.length) {
    empty.style.display = "none";
    list.innerHTML = MATCHES.map(function(m){
      return '<li class="match"><time>' + m.time + '</time><b>' + m.teams + '</b><i>' + m.league + '</i></li>';
    }).join("");
  }

  /* ── фильтр меню ── */
  var filterBtns = document.querySelectorAll(".filters button");
  if (filterBtns.length) {
    var cats = document.querySelectorAll(".cat");
    filterBtns.forEach(function(btn){
      btn.addEventListener("click", function(){
        var f = btn.dataset.f;
        filterBtns.forEach(function(b){ b.setAttribute("aria-pressed", String(b === btn)); });
        cats.forEach(function(c){
          c.style.display = (f === "all" || c.dataset.c === f) ? "" : "none";
        });
      });
    });
  }

  /* ── бронь ── */
  var form = $("bookForm");
  if (form) {
    var dateEl = $("bDate");
    var t = new Date(barNow().getTime() + 86400000);
    dateEl.value = t.getFullYear() + "-" + two(t.getMonth() + 1) + "-" + two(t.getDate());

    var bookingText = function(){
      var d = dateEl.value ? dateEl.value.split("-").reverse().join(".") : "—";
      var parts = [
        "Здравствуйте! Хочу забронировать стол в «БомБАРдире».",
        "Дата: " + d,
        "Время: " + ($("bTime").value || "—"),
        "Гостей: " + $("bGuests").value
      ];
      var match = $("bMatch").value.trim();
      if (match) parts.push("Смотрим: " + match);
      var who = $("bName").value.trim();
      if (who) parts.push("Меня зовут: " + who);
      return parts.join("\n");
    };

    var refresh = function(){
      var text = bookingText();
      $("bPreview").textContent = text;
      $("bWa").href = "https://wa.me/79178835742?text=" + encodeURIComponent(text);
    };

    form.addEventListener("input", refresh);
    refresh();

    $("bTg").addEventListener("click", function(){
      if (navigator.clipboard) navigator.clipboard.writeText(bookingText()).catch(function(){});
    });
  }

  /* строку статуса мы уже переписали, а шрифты ещё грузятся — перемеряем оба раза */
  measureChrome();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureChrome);
})();
