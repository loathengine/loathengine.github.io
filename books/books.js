(function () {
  var body = document.body;
  if (!body) return;

  var currentBook = body.getAttribute('data-book-slug') || '';
  var currentPageTitle = body.getAttribute('data-page-label') || '';
  var searchUrl = body.getAttribute('data-search-url') || '/books/books-search.json';

  var pdfLinks = document.querySelectorAll('[data-pdf-dl]');
  for (var i = 0; i < pdfLinks.length; i++) {
    pdfLinks[i].addEventListener('click', function (ev) {
      var el = ev.currentTarget;
      if (typeof window.gtag === 'function' && el) {
        window.gtag('event', 'book_pdf_download', {
          book_slug: el.getAttribute('data-pdf-dl') || '',
          transport_type: 'beacon',
        });
      }
    });
  }

  if (currentBook && currentPageTitle) {
    try {
      localStorage.setItem(
        'ep-book-last:' + currentBook,
        JSON.stringify({ url: location.pathname, label: currentPageTitle })
      );
    } catch (_) {
      
    }
  }

  var continueSlots = document.querySelectorAll('[data-continue-slot]');
  for (var c = 0; c < continueSlots.length; c++) {
    var slot = continueSlots[c];
    var slug = slot.getAttribute('data-continue-slot');
    if (!slug) continue;
    try {
      var raw = localStorage.getItem('ep-book-last:' + slug);
      if (!raw) continue;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved.url !== 'string' || typeof saved.label !== 'string') continue;
      if (saved.url === location.pathname || saved.url === '/books/' + slug + '/') continue;
      var a = document.createElement('a');
      a.className = 'bk-continue-link';
      a.href = saved.url;
      a.textContent = 'Continue: ' + saved.label + ' →';
      slot.appendChild(a);
    } catch (_) {
      
    }
  }

  var sidebar = document.getElementById('bk-sidebar');
  var backdrop = document.getElementById('bk-backdrop');
  var menuBtn = document.querySelector('[data-bk-menu]');
  var closeBtn = document.querySelector('[data-bk-close]');

  function setDrawer(open) {
    if (!sidebar) return;
    sidebar.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', function () {
      setDrawer(!sidebar.classList.contains('is-open'));
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      setDrawer(false);
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', function () {
      setDrawer(false);
    });
  }
  if (sidebar) {
    var activeSb = sidebar.querySelector('.is-active');
    if (activeSb && window.innerWidth >= 1024 && typeof activeSb.scrollIntoView === 'function') {
      activeSb.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }

  var switcher = document.querySelector('.bk-switcher');
  if (switcher) {
    document.addEventListener('click', function (ev) {
      if (switcher.open && !switcher.contains(ev.target)) {
        switcher.open = false;
      }
    });
  }

  var railLinks = document.querySelectorAll('.toc-rail-list a[href^="#"]');
  if (railLinks.length > 1 && typeof IntersectionObserver === 'function') {
    var linkById = {};
    var targets = [];
    for (var r = 0; r < railLinks.length; r++) {
      var id = railLinks[r].getAttribute('href').slice(1);
      var targetEl = document.getElementById(id);
      if (targetEl) {
        linkById[id] = railLinks[r];
        targets.push(targetEl);
      }
    }
    var setActiveToc = function (activeId) {
      for (var k = 0; k < railLinks.length; k++) {
        railLinks[k].classList.toggle('is-active', railLinks[k].getAttribute('href') === '#' + activeId);
      }
    };
    if (targets.length > 0) {
      var io = new IntersectionObserver(
        function (entries) {
          for (var e = 0; e < entries.length; e++) {
            if (entries[e].isIntersecting) {
              setActiveToc(entries[e].target.id);
              break;
            }
          }
        },
        { rootMargin: '-64px 0px -72% 0px', threshold: 0 }
      );
      for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
    }
  }

  var tableFilter = document.querySelector('[data-table-filter]');
  if (tableFilter) {
    var tblId = tableFilter.getAttribute('data-table-filter');
    var tbl = document.getElementById(tblId);
    var countEl = document.querySelector('[data-filter-count="' + tblId + '"]');
    var rows = tbl ? tbl.querySelectorAll('tbody tr') : [];
    var applyTableFilter = function () {
      var q = tableFilter.value.trim().toLowerCase();
      var tokens = q ? q.split(/\s+/) : [];
      var shown = 0;
      for (var j = 0; j < rows.length; j++) {
        var hay = rows[j].getAttribute('data-search') || rows[j].textContent.toLowerCase();
        var ok = true;
        for (var ti = 0; ti < tokens.length; ti++) {
          if (hay.indexOf(tokens[ti]) === -1) {
            ok = false;
            break;
          }
        }
        rows[j].hidden = !ok;
        if (ok) shown++;
      }
      if (countEl) countEl.textContent = shown + ' of ' + rows.length;
    };
    tableFilter.addEventListener('input', applyTableFilter);
  }

  var compFilter = document.querySelector('[data-comp-filter]');
  var brandChips = document.querySelectorAll('[data-brand-chip]');
  if (compFilter || brandChips.length > 0) {
    var activeBrand = 'all';
    var compSections = document.querySelectorAll('.comp-brand-sec');
    var compCountEl = document.querySelector('[data-comp-count]');
    var compEmptyEl = document.getElementById('comp-empty');
    var totalComp = document.querySelectorAll('.comp-row').length;

    var applyCompFilter = function () {
      var q = compFilter ? compFilter.value.trim().toLowerCase() : '';
      var tokens = q ? q.split(/\s+/) : [];
      var shown = 0;
      for (var s = 0; s < compSections.length; s++) {
        var sec = compSections[s];
        var secBrand = sec.getAttribute('data-brand') || '';
        var brandMatch = activeBrand === 'all' || secBrand === activeBrand;
        var items = sec.querySelectorAll('.comp-row');
        var secShown = 0;
        for (var m = 0; m < items.length; m++) {
          var ok = brandMatch;
          if (ok && tokens.length > 0) {
            var hay = items[m].getAttribute('data-search') || '';
            for (var ti = 0; ti < tokens.length; ti++) {
              if (hay.indexOf(tokens[ti]) === -1) {
                ok = false;
                break;
              }
            }
          }
          items[m].hidden = !ok;
          if (ok) {
            secShown++;
            shown++;
          }
        }
        sec.hidden = secShown === 0;
      }
      if (compCountEl) compCountEl.textContent = shown + ' of ' + totalComp;
      if (compEmptyEl) compEmptyEl.hidden = shown > 0;
    };

    var selectBrand = function (brand) {
      activeBrand = brand;
      for (var bi = 0; bi < brandChips.length; bi++) {
        var chip = brandChips[bi];
        var isSel = chip.getAttribute('data-brand-chip') === brand;
        chip.classList.toggle('is-active', isSel);
        chip.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      }
      applyCompFilter();
    };

    for (var b = 0; b < brandChips.length; b++) {
      brandChips[b].addEventListener('click', function (ev) {
        ev.preventDefault();
        var br = ev.currentTarget.getAttribute('data-brand-chip') || 'all';
        selectBrand(br);
      });
    }
    if (compFilter) compFilter.addEventListener('input', applyCompFilter);

    if (location.hash && location.hash.indexOf('#brand-') === 0) {
      var initBrand = location.hash.slice('#brand-'.length);
      for (var hb = 0; hb < brandChips.length; hb++) {
        if (brandChips[hb].getAttribute('data-brand-chip') === initBrand) {
          selectBrand(initBrand);
          break;
        }
      }
    }
  }

  var dlg = document.getElementById('bk-search-dlg');
  var searchBtns = document.querySelectorAll('[data-bk-search]');
  var searchInput = document.getElementById('bk-search-in');
  var searchRes = document.getElementById('bk-search-res');
  var scopeBtns = document.querySelectorAll('[data-search-scope]');
  var searchIndex = null;
  var searchLoading = false;
  var searchScope = currentBook ? 'book' : 'all';
  var selIdx = 0;

  var KIND_LABEL = {
    book: 'Book',
    front: 'Guide',
    chapter: 'Chapter',
    section: 'Section',
    table: 'Table',
    powder: 'Powder',
  };

  function loadSearchIndex(cb) {
    if (searchIndex) {
      cb();
      return;
    }
    if (searchLoading) return;
    searchLoading = true;
    fetch(searchUrl)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        searchIndex = data;
        searchLoading = false;
        cb();
      })
      .catch(function () {
        searchLoading = false;
        if (searchRes) {
          searchRes.innerHTML = '<li class="bk-sdlg-empty">Search index unavailable.</li>';
        }
      });
  }

  function renderSearchResults() {
    if (!searchRes || !searchIndex) return;
    var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var tokens = q ? q.split(/\s+/) : [];
    var curBookIdx = searchIndex.books.indexOf(currentBook);
    var items = searchIndex.items;
    var scored = [];

    for (var idx = 0; idx < items.length; idx++) {
      var it = items[idx];
      if (searchScope === 'book' && curBookIdx >= 0 && it.b !== curBookIdx) continue;
      if (tokens.length === 0) {
        if (it.k === 'chapter' || it.k === 'front' || it.k === 'book' || it.k === 'table') {
          var base = it.b === curBookIdx ? 50 : 10;
          if (it.k === 'book') base += 20;
          scored.push({ it: it, score: base });
        }
        continue;
      }
      var titleLow = it.t.toLowerCase();
      var hay = titleLow + ' ' + it.s.toLowerCase() + ' ' + (it.q || '');
      var match = true;
      for (var ti = 0; ti < tokens.length; ti++) {
        if (hay.indexOf(tokens[ti]) === -1) {
          match = false;
          break;
        }
      }
      if (!match) continue;
      var sc = 0;
      if (titleLow === q) sc += 200;
      else if (titleLow.indexOf(q) === 0) sc += 120;
      else if (titleLow.indexOf(q) !== -1) sc += 80;
      for (var tj = 0; tj < tokens.length; tj++) {
        if (titleLow.indexOf(tokens[tj]) !== -1) sc += 25;
      }
      if (it.k === 'book') sc += 30;
      else if (it.k === 'chapter' || it.k === 'table') sc += 20;
      else if (it.k === 'powder') sc += 18;
      else if (it.k === 'front') sc += 14;
      if (curBookIdx >= 0 && it.b === curBookIdx) sc += 15;
      scored.push({ it: it, score: sc });
    }

    if (tokens.length > 0) {
      scored.sort(function (a, b) {
        return b.score - a.score;
      });
    }
    var top = scored.slice(0, 24);
    selIdx = 0;
    searchRes.innerHTML = '';

    if (top.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'bk-sdlg-empty';
      empty.textContent = q ? 'No matches for "' + q + '".' : 'Type to search chapters, sections, or powders.';
      searchRes.appendChild(empty);
      return;
    }

    for (var ri = 0; ri < top.length; ri++) {
      var rec = top[ri].it;
      var li = document.createElement('li');
      var link = document.createElement('a');
      link.href = rec.u;
      if (ri === 0) link.className = 'is-sel';
      link.addEventListener('click', function () {
        if (dlg && dlg.open) dlg.close();
      });

      var left = document.createElement('div');
      var tSpan = document.createElement('span');
      tSpan.className = 'bk-sdlg-t';
      tSpan.textContent = rec.t;
      var sSpan = document.createElement('span');
      sSpan.className = 'bk-sdlg-s';
      sSpan.textContent = rec.s;
      left.appendChild(tSpan);
      left.appendChild(sSpan);

      var badge = document.createElement('span');
      badge.className = 'bk-sdlg-k';
      badge.textContent = KIND_LABEL[rec.k] || rec.k;

      link.appendChild(left);
      link.appendChild(badge);
      li.appendChild(link);
      searchRes.appendChild(li);
    }
  }

  function openSearch() {
    if (!dlg) return;
    setDrawer(false);
    if (!dlg.open) dlg.showModal();
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    loadSearchIndex(renderSearchResults);
  }

  for (var sb = 0; sb < searchBtns.length; sb++) {
    searchBtns[sb].addEventListener('click', openSearch);
  }

  for (var sc = 0; sc < scopeBtns.length; sc++) {
    scopeBtns[sc].addEventListener('click', function (ev) {
      searchScope = ev.currentTarget.getAttribute('data-search-scope') || 'all';
      for (var k = 0; k < scopeBtns.length; k++) {
        scopeBtns[k].classList.toggle('is-active', scopeBtns[k].getAttribute('data-search-scope') === searchScope);
      }
      renderSearchResults();
      if (searchInput) searchInput.focus();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderSearchResults);
    searchInput.addEventListener('keydown', function (ev) {
      if (!searchRes) return;
      var links = searchRes.querySelectorAll('a');
      if (links.length === 0) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        selIdx = (selIdx + 1) % links.length;
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        selIdx = (selIdx - 1 + links.length) % links.length;
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        links[selIdx].click();
        return;
      } else {
        return;
      }
      for (var li = 0; li < links.length; li++) {
        links[li].classList.toggle('is-sel', li === selIdx);
      }
      links[selIdx].scrollIntoView({ block: 'nearest' });
    });
  }

  if (dlg) {
    var escBtn = dlg.querySelector('[data-search-close]');
    if (escBtn) {
      escBtn.addEventListener('click', function () {
        dlg.close();
      });
    }
    dlg.addEventListener('click', function (ev) {
      if (ev.target === dlg) dlg.close();
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      setDrawer(false);
      if (switcher && switcher.open) switcher.open = false;
      return;
    }
    var tag = ev.target && ev.target.tagName ? ev.target.tagName.toLowerCase() : '';
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || (ev.target && ev.target.isContentEditable);
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      openSearch();
    } else if (ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      openSearch();
    }
  });
})();
