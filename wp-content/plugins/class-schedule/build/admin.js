/*! Admin UI - Vanilla JS (no build step required) */
(function(){
  const root = document.getElementById('class-schedule-admin-app');
  if(!root) return;

  const API_ROOT = (window.CLASS_SCHEDULE_CONFIG && window.CLASS_SCHEDULE_CONFIG.root) || '/wp-json/class-schedule/v1/';
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
      const btnDelete = h('button', { type: 'button', text: 'Delete' });
      btnDelete.addEventListener('click', () => {
        locations = locations.filter(l => l.id !== loc.id);
        saveLocations(locations).then(() => render());
      });
      item.appendChild(btnDelete);
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
    const inputInstructor = h('input', { placeholder: 'Instructor', required: 'true' });
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
      if(!newItem.title || !newItem.instructor) return;
      items = items.concat([newItem]);
      saveSchedule(items).then(()=>render());
      form.reset();
    });

    const list = h('div', { class: 'cs-list' });
    const byDay = { mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[] };
    items.forEach(it => byDay[it.day] && byDay[it.day].push(it));
    dayOrder.forEach(d => byDay[d].sort((a,b)=>a.start.localeCompare(b.start)));

    dayOrder.forEach(function(day){
      const box = h('div', { class: 'cs-day' });
      box.appendChild(h('h3', { text: dayLabels[day] }));
      const listForDay = byDay[day];
      if(listForDay.length === 0){
        box.appendChild(h('p', { class: 'cs-empty', text: 'No classes' }));
      } else {
        listForDay.forEach(function(it){
          const row = h('div', { class: 'cs-item' });
          row.appendChild(h('div', { class: 'cs-item-title', text: it.title }));
          row.appendChild(h('div', { class: 'cs-item-meta', text: it.instructor + ' — ' + it.start + '–' + it.end }));
          if(it.location) row.appendChild(h('div', { class: 'cs-item-location', text: 'Location: ' + it.location }));
          const actions = h('div', { class: 'cs-actions' });
          const btnDel = h('button', { type: 'button', text: 'Delete' });
          btnDel.addEventListener('click', function(){
            items = items.filter(x => x.id !== it.id);
            saveSchedule(items).then(()=>render());
          });
          const btnEdit = h('button', { type: 'button', text: 'Edit' });
          btnEdit.addEventListener('click', function(){
            const nt = prompt('Title', it.title) || it.title;
            const ni = prompt('Instructor', it.instructor) || it.instructor;
            const ns = prompt('Start (HH:MM)', it.start) || it.start;
            const ne = prompt('End (HH:MM)', it.end) || it.end;
            items = items.map(x => x.id === it.id ? Object.assign({}, x, { title: nt, instructor: ni, start: ns, end: ne }) : x);
            saveSchedule(items).then(()=>render());
          });
          actions.appendChild(btnDel);
          actions.appendChild(btnEdit);
          row.appendChild(actions);
          box.appendChild(row);
        });
      }
      list.appendChild(box);
    });

    root.appendChild(form);
    root.appendChild(list);
  }

  root.innerHTML = '<p>Loading…</p>';
  fetchSchedule().then(function(data){ items = data; render(); });
})();


