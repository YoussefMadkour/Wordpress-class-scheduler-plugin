/*! Admin UI - Vanilla JS (no build step required) */
(function(){
  const root = document.getElementById('class-schedule-admin-app');
  if(!root) return;

  const API_ROOT = (window.CLASS_SCHEDULE_CONFIG && window.CLASS_SCHEDULE_CONFIG.root) || '/?rest_route=/class-schedule/v1/';
  const NONCE = (window.CLASS_SCHEDULE_CONFIG && window.CLASS_SCHEDULE_CONFIG.nonce) || '';

  function h(tag, attrs, children){
    const el = document.createElement(tag);
    if(attrs){
      for(const k in attrs){
        if(k === 'class') el.className = attrs[k];
        else if(k === 'text') el.textContent = attrs[k];
        else el.setAttribute(k, attrs[k]);
      }
    }
    (children||[]).forEach(c => el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return el;
  }

  function fetchSchedule(){
    return fetch(API_ROOT + 'schedule', { credentials: 'same-origin' }).then(r=>r.json()).then(a=>Array.isArray(a)?a:[]);
  }
  function saveSchedule(items){
    return fetch(API_ROOT + 'schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': NONCE },
      body: JSON.stringify(items),
      credentials: 'same-origin'
    }).then(r=>r.json());
  }

  const dayLabels = { sat:'Saturday', sun:'Sunday', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday (OFF)' };
  const dayOrder = ['sat','sun','mon','tue','wed','thu','fri'];

  let items = [];
  let locations = [];
  let editingId = null;
  let filters = { location: '', day: '', query: '' };
  const collapsedDays = new Set();

  function renderToolbar(){
    const bar = h('div', { class: 'cs-toolbar' });

    const daySel = h('select');
    daySel.appendChild(h('option', { value: '', text: 'All days' }));
    dayOrder.forEach(d => daySel.appendChild(h('option', { value: d, text: dayLabels[d] })));
    daySel.value = filters.day;
    daySel.addEventListener('change', ()=>{ filters.day = daySel.value; render(); });

    const locSel = h('select');
    locSel.appendChild(h('option', { value: '', text: 'All locations' }));
    locations.forEach(loc => locSel.appendChild(h('option', { value: loc.id, text: loc.name })));
    locSel.value = filters.location;
    locSel.addEventListener('change', ()=>{ filters.location = locSel.value; render(); });

    const search = h('input', { placeholder: 'Search title or instructor…' });
    search.value = filters.query;
    search.addEventListener('input', ()=>{ filters.query = search.value.trim().toLowerCase(); render(); });

    const clearBtn = h('button', { type: 'button', text: 'Clear' });
    clearBtn.addEventListener('click', ()=>{ filters = { location:'', day:'', query:'' }; render(); });

    const expandBtn = h('button', { type: 'button', text: 'Expand all' });
    expandBtn.addEventListener('click', ()=>{ collapsedDays.clear(); render(); });

    const collapseBtn = h('button', { type: 'button', text: 'Collapse all' });
    collapseBtn.addEventListener('click', ()=>{ dayOrder.forEach(d=>collapsedDays.add(d)); render(); });

    [daySel, locSel, search, clearBtn, expandBtn, collapseBtn].forEach(el => bar.appendChild(el));
    return bar;
  }

  function renderBulkImport() {
    const section = h('div', { class: 'cs-bulk-import' });
    section.appendChild(h('h3', { text: 'Bulk Import' }));

    const helper = h('div', { class: 'cs-bulk-help' }, [
      h('div', { text: 'Paste CSV (one item per line). Examples:' }),
      h('pre', {}, [
        'Locations: name,slug\n',
        'EDGEFIT,zayed-dunes\n',
        'CORE,woc--beverly-hills\n\n',
        'Classes: title,instructor,day(start mon..sun),locationId,start,end\n',
        'Zak,moh,sat,zayed-dunes,06:00,08:00\n'
      ])
    ]);

    const locLabel = h('label', { class: 'cs-bulk-label', text: 'Locations CSV' });
    const locArea = h('textarea', { class: 'cs-bulk-textarea', placeholder: 'name,slug' });
    const clsLabel = h('label', { class: 'cs-bulk-label', text: 'Classes CSV' });
    const clsArea = h('textarea', { class: 'cs-bulk-textarea', placeholder: 'title,instructor,day,locationId,start,end' });
    const importBtn = h('button', { type: 'button', text: 'Import' });

    importBtn.addEventListener('click', () => {
      const dayMap = { saturday: 'sat', sunday: 'sun', monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu', friday: 'fri', sat:'sat', sun:'sun', mon:'mon', tue:'tue', wed:'wed', thu:'thu', fri:'fri' };

      // Parse locations
      const locLines = locArea.value.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const newLocs = [];
      locLines.forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const name = parts[0];
          const slug = parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
          newLocs.push({ id: slug, name, slug });
        }
      });

      if (newLocs.length) {
        // Merge by id, overwrite existing
        const map = Object.fromEntries(locations.map(l=>[l.id,l]));
        newLocs.forEach(l => { map[l.id] = l; });
        locations = Object.values(map);
      }

      // Ensure locations from classes exist
      const ensureLocation = (id) => {
        if (!id) return;
        if (!locations.some(l => l.id === id)) {
          // Create name from id (humanize)
          const name = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          locations = locations.concat([{ id, name, slug: id }]);
        }
      };

      // Parse classes
      const clsLines = clsArea.value.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const newItems = [];
      clsLines.forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 6) {
          const [title, instructor, dayRaw, locationId, start, end] = parts;
          const dayKey = dayMap[dayRaw.toLowerCase()];
          if (!dayKey) return;
          ensureLocation(locationId);
          newItems.push({ id: Math.random().toString(36).slice(2)+Date.now().toString(36), title, instructor, day: dayKey, location: locationId, start, end });
        }
      });

      if (newItems.length) {
        // Append new classes
        items = items.concat(newItems);
      }

      Promise.all([
        saveLocations(locations),
        saveSchedule(items)
      ]).then(() => render());
    });

    section.appendChild(helper);
    section.appendChild(locLabel);
    section.appendChild(locArea);
    section.appendChild(clsLabel);
    section.appendChild(clsArea);
    section.appendChild(importBtn);
    return section;
  }

  function renderLocationManager() {
    const section = h('div', { class: 'cs-location-manager' });
    section.appendChild(h('h3', { text: 'Manage Locations' }));
    
    const form = h('form', { class: 'cs-location-form' });
    const inputName = h('input', { placeholder: 'Location name (e.g., Main Gym)', required: 'true' });
    const inputSlug = h('input', { placeholder: 'Slug (e.g., main-gym)', required: 'true' });
    const btnAddLocation = h('button', { type: 'submit', text: 'Add Location' });
    
    form.appendChild(inputName);
    form.appendChild(inputSlug);
    form.appendChild(btnAddLocation);
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const newLocation = {
        id: inputSlug.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: inputName.value.trim(),
        slug: inputSlug.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      };
      if (!newLocation.name || !newLocation.slug) return;
      
      locations = locations.concat([newLocation]);
      saveLocations(locations).then(() => render());
      form.reset();
    });
    
    const locationsList = h('div', { class: 'cs-locations-list' });
    locations.forEach(loc => {
      const item = h('div', { class: 'cs-location-item' });
      item.appendChild(h('span', { text: loc.name + ' (' + loc.id + ')' }));
      
      const actions = h('div', { class: 'cs-location-actions' });
      
      const btnEdit = h('button', { type: 'button', text: 'Edit' });
      btnEdit.addEventListener('click', () => {
        const newName = prompt('Location name:', loc.name);
        const newSlug = prompt('Location slug:', loc.slug);
        if (newName && newSlug) {
          const updatedLocation = {
            ...loc,
            name: newName.trim(),
            slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            id: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          };
          locations = locations.map(l => l.id === loc.id ? updatedLocation : l);
          saveLocations(locations).then(() => render());
        }
      });
      
      const btnDelete = h('button', { type: 'button', text: 'Delete' });
      btnDelete.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this location? All classes assigned to this location will remain but may not display correctly.')) {
          locations = locations.filter(l => l.id !== loc.id);
          saveLocations(locations).then(() => render());
        }
      });
      
      actions.appendChild(btnEdit);
      actions.appendChild(btnDelete);
      item.appendChild(actions);
      locationsList.appendChild(item);
    });
    
    section.appendChild(form);
    section.appendChild(locationsList);
    return section;
  }

  function saveLocations(locs) {
    return fetch(window.CLASS_SCHEDULE_CONFIG.root + 'locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.CLASS_SCHEDULE_CONFIG.nonce },
      body: JSON.stringify(locs),
      credentials: 'same-origin'
    }).then(r => r.json());
  }

  function render(){
    root.innerHTML = '';
    const form = h('form', { class: 'cs-form' });
    const inputTitle = h('input', { placeholder: 'Class title', required: 'true' });
    const inputInstructor = h('input', { placeholder: 'Instructor (optional)' });
    const selectDay = h('select');
    dayOrder.forEach(d => selectDay.appendChild(h('option', { value: d, text: dayLabels[d] })));
    const selectLocation = h('select');
    // Populate with current locations
    locations.forEach(loc => selectLocation.appendChild(h('option', {value: loc.id, text: loc.name})));
    const inputStart = h('input', { type: 'time', value: '06:00' });
    const inputEnd = h('input', { type: 'time', value: '08:00' });
    const btnAdd = h('button', { type: 'submit', text: 'Add Class' });
    [inputTitle, inputInstructor, selectDay, selectLocation, inputStart, inputEnd, btnAdd].forEach(el => form.appendChild(el));
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const newItem = { id: Math.random().toString(36).slice(2)+Date.now().toString(36), title: inputTitle.value.trim(), instructor: inputInstructor.value.trim(), day: selectDay.value, location: selectLocation.value, start: inputStart.value, end: inputEnd.value };
      if(!newItem.title) return;
      items = items.concat([newItem]);
      saveSchedule(items).then(()=>render());
      form.reset();
    });

    const list = h('div', { class: 'cs-list' });
    const byDay = { mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[] };
    const filtered = items.filter(it => {
      if (filters.location && it.location !== filters.location) return false;
      if (filters.day && it.day !== filters.day) return false;
      if (filters.query) {
        const q = filters.query;
        const inTitle = (it.title||'').toLowerCase().includes(q);
        const inInstr = (it.instructor||'').toLowerCase().includes(q);
        if (!inTitle && !inInstr) return false;
      }
      return true;
    });
    filtered.forEach(it => byDay[it.day] && byDay[it.day].push(it));
    dayOrder.forEach(d => byDay[d].sort((a,b)=>a.start.localeCompare(b.start)));

    dayOrder.forEach(function(day){
      const box = h('div', { class: 'cs-day' + (collapsedDays.has(day) ? ' cs-collapsed' : '') });
      const header = h('h3', { text: dayLabels[day] });
      header.style.cursor = 'pointer';
      header.addEventListener('click', ()=>{
        if (collapsedDays.has(day)) collapsedDays.delete(day); else collapsedDays.add(day);
        render();
      });
      box.appendChild(header);
      const listForDay = byDay[day];
      if(listForDay.length === 0){
        box.appendChild(h('p', { class: 'cs-empty', text: 'No classes' }));
      } else {
        if (collapsedDays.has(day)) {
          box.appendChild(h('p', { class: 'cs-collapsed-hint', text: listForDay.length + ' classes' }));
          list.appendChild(box);
          return;
        }
        listForDay.forEach(function(it){
          const isEditing = editingId === it.id;
          const row = h('div', { class: 'cs-item' + (isEditing ? ' cs-item-editing' : '') });

          if(!isEditing){
            row.appendChild(h('div', { class: 'cs-item-title', text: it.title }));
            const metaText = (it.instructor ? it.instructor + ' — ' : '') + it.start + '–' + it.end;
            row.appendChild(h('div', { class: 'cs-item-meta', text: metaText }));
            if(it.location) row.appendChild(h('div', { class: 'cs-item-location', text: 'Location: ' + it.location }));
            const actions = h('div', { class: 'cs-actions' });
            const btnDel = h('button', { type: 'button', text: 'Delete' });
            btnDel.addEventListener('click', function(){
              items = items.filter(x => x.id !== it.id);
              saveSchedule(items).then(()=>render());
            });
            const btnEdit = h('button', { type: 'button', text: 'Edit' });
            const btnDup = h('button', { type: 'button', text: 'Duplicate' });
            btnEdit.addEventListener('click', function(){ editingId = it.id; render(); });
            btnDup.addEventListener('click', function(){
              const copy = { ...it, id: Math.random().toString(36).slice(2)+Date.now().toString(36) };
              items = items.concat([copy]);
              saveSchedule(items).then(()=>render());
            });
            actions.appendChild(btnDel);
            actions.appendChild(btnEdit);
            actions.appendChild(btnDup);
            row.appendChild(actions);
          } else {
            const titleInput = h('input', { value: it.title, placeholder: 'Title' });
            const instrInput = h('input', { value: it.instructor || '', placeholder: 'Instructor (optional)' });
            const daySel = h('select');
            dayOrder.forEach(d => daySel.appendChild(h('option', { value: d, text: dayLabels[d] })));
            daySel.value = it.day;
            const locSel = h('select');
            locations.forEach(loc => locSel.appendChild(h('option', { value: loc.id, text: loc.name })));
            locSel.value = it.location || '';
            const startInput = h('input', { type: 'time', value: it.start });
            const endInput = h('input', { type: 'time', value: it.end });
            const actions = h('div', { class: 'cs-actions' });
            const saveBtn = h('button', { type: 'button', text: 'Save' });
            const cancelBtn = h('button', { type: 'button', text: 'Cancel' });
            saveBtn.addEventListener('click', function(){
              const updated = {
                ...it,
                title: titleInput.value.trim() || it.title,
                instructor: (instrInput.value||'').trim(),
                day: daySel.value,
                location: locSel.value,
                start: startInput.value || it.start,
                end: endInput.value || it.end
              };
              items = items.map(x => x.id === it.id ? updated : x);
              editingId = null;
              saveSchedule(items).then(()=>render());
            });
            cancelBtn.addEventListener('click', function(){ editingId = null; render(); });
            [titleInput, instrInput, daySel, locSel, startInput, endInput].forEach(el => row.appendChild(el));
            actions.appendChild(saveBtn);
            actions.appendChild(cancelBtn);
            row.appendChild(actions);
          }

          box.appendChild(row);
        });
      }
      list.appendChild(box);
    });

    root.appendChild(renderLocationManager());
    root.appendChild(renderToolbar());
    root.appendChild(renderBulkImport());
    root.appendChild(form);
    root.appendChild(list);
  }

  root.innerHTML = '<p>Loading…</p>';
  // Load both schedule and locations
  Promise.all([
    fetchSchedule(),
    fetch(window.CLASS_SCHEDULE_CONFIG.root + 'locations').then(r => r.json())
  ]).then(function([scheduleData, locationsData]) {
    items = Array.isArray(scheduleData) ? scheduleData : [];
    locations = Array.isArray(locationsData) ? locationsData : [];
    render();
  });
})();


