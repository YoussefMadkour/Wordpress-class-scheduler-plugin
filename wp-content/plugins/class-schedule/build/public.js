/*! Frontend renderer - Vanilla JS (grid with time slots + mobile view + locations) */
(function(){
  const API_ROOT = (window.CLASS_SCHEDULE_CONFIG && window.CLASS_SCHEDULE_CONFIG.root) || '/?rest_route=/class-schedule/v1/';
  const mounts = window.ClassScheduleMounts || [];
  
  let currentLocation = null;
  let allLocations = [];

  function h(tag, attrs, children){
    const el=document.createElement(tag);
    if(attrs){
      for(const k in attrs){
        if(k==='class') el.className=attrs[k]; else if(k==='text') el.textContent=attrs[k]; else el.setAttribute(k, attrs[k]);
      }
    }
    (children||[]).forEach(c=>el.appendChild(typeof c==='string'?document.createTextNode(c):c));
    return el;
  }

  const dayLabels={sat:'Saturday',sun:'Sunday',mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday'};
  const dayOrder=['sat','sun','mon','tue','wed','thu','fri'];
  // Time slots used to place tiles on the grid. Adjusted to evening bands to match your data.
  const slots=[
    {start:'18:00', end:'19:00', label:'18.00 - 19.00'},
    {start:'19:00', end:'20:00', label:'19.00 - 20.00'},
    {start:'20:00', end:'21:00', label:'20.00 - 21.00'},
    {start:'20:30', end:'21:30', label:'20.30 - 21.30'},
    {start:'21:00', end:'22:00', label:'21.00 - 22.00'},
  ];

  function findSlotIndex(item){
    for(let i=0;i<slots.length;i++){
      if(item.start===slots[i].start && item.end===slots[i].end) return i;
    }
    return -1;
  }

  function formatTimeLabel(time){
    // time is HH:MM in 24-hour, return h:MM AM/PM
    const [hStr, m] = time.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + m + ' ' + ampm;
  }

  function renderGrid(container, items){
    const byDay={mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[]};
    items.forEach(it=>byDay[it.day]&&byDay[it.day].push(it));

    const grid=h('div',{class:'cs-grid'});

    // Header row: empty top-left then each day header
    grid.appendChild(h('div',{class:'cs-header cs-time-header'}));
    dayOrder.forEach(d=>{
      grid.appendChild(h('div',{class:'cs-header cs-day-header', text: dayLabels[d]}));
    });

    // For each time slot, add time label + day cells
    slots.forEach((slot)=>{
      const timeLabel = formatTimeLabel(slot.start) + ' - ' + formatTimeLabel(slot.end);
      grid.appendChild(h('div',{class:'cs-time-cell'}, [h('div',{class:'cs-time-label', text: timeLabel})]));
      dayOrder.forEach(d=>{
        const cell=h('div',{class:'cs-slot'});
        
        // Show "OFF" for Friday
        if(d === 'fri') {
          cell.classList.add('cs-slot-off');
          cell.appendChild(h('div',{class:'cs-off-label', text: 'OFF'}));
        } else {
          const matches=(byDay[d]||[]).filter(it=>findSlotIndex(it)!==-1 && it.start===slot.start && it.end===slot.end);
          matches.forEach(it=>{
            const tile=h('div',{class:'cs-tile'});
            tile.appendChild(h('div',{class:'cs-tile-title', text: (it.title||'').toUpperCase()}));
            if(it.instructor) tile.appendChild(h('div',{class:'cs-tile-sub', text: it.instructor}));
            tile.appendChild(h('div',{class:'cs-tile-time', text: formatTimeLabel(it.start)+'–'+formatTimeLabel(it.end)}));
            cell.appendChild(tile);
          });
        }
        grid.appendChild(cell);
      });
    });

    container.appendChild(grid);
  }

  function renderMobile(container, items){
    const wrapper=h('div',{class:'cs-mobile'});
    const byDay={mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[]};
    items.forEach(it=>byDay[it.day]&&byDay[it.day].push(it));
    dayOrder.forEach(d=>{
      const section=h('div',{class:'cs-mobile-day'});
      section.appendChild(h('div',{class:'cs-mobile-day-title',text:dayLabels[d]}));
      const list=h('div',{class:'cs-mobile-list'});
      const itemsForDay=byDay[d].slice().sort((a,b)=>a.start.localeCompare(b.start));
      if(itemsForDay.length===0){
        list.appendChild(h('div',{class:'cs-mobile-empty',text:'No classes'}));
      } else {
        itemsForDay.forEach(it=>{
          const tile=h('div',{class:'cs-tile'});
          tile.appendChild(h('div',{class:'cs-tile-title',text:(it.title||'').toUpperCase()}));
          if(it.instructor) tile.appendChild(h('div',{class:'cs-tile-sub',text:it.instructor}));
          tile.appendChild(h('div',{class:'cs-tile-time',text:formatTimeLabel(it.start)+'–'+formatTimeLabel(it.end)}));
          list.appendChild(tile);
        });
      }
      section.appendChild(list);
      wrapper.appendChild(section);
    });
    container.appendChild(wrapper);
  }

  function renderLocationPicker(container, locations, currentLoc) {
    const picker = h('div', {class: 'cs-location-picker'});
    
    // Previous arrow
    const prevBtn = h('button', {class: 'cs-nav-arrow cs-nav-prev'}, ['‹']);
    
    // Location display
    const locationDisplay = h('div', {class: 'cs-location-display'});
    const currentIndex = locations.findIndex(l => l.id === currentLoc);
    const current = locations[currentIndex] || locations[0];
    if (current) {
      locationDisplay.appendChild(h('div', {class: 'cs-location-name', text: current.name}));
    }
    
    // Next arrow  
    const nextBtn = h('button', {class: 'cs-nav-arrow cs-nav-next'}, ['›']);
    
    // Navigation logic
    prevBtn.addEventListener('click', () => {
      const idx = locations.findIndex(l => l.id === currentLocation);
      const newIdx = idx > 0 ? idx - 1 : locations.length - 1;
      switchLocation(container, locations[newIdx].id);
    });
    
    nextBtn.addEventListener('click', () => {
      const idx = locations.findIndex(l => l.id === currentLocation);
      const newIdx = idx < locations.length - 1 ? idx + 1 : 0;
      switchLocation(container, locations[newIdx].id);
    });
    
    picker.appendChild(prevBtn);
    picker.appendChild(locationDisplay);
    picker.appendChild(nextBtn);
    
    return picker;
  }

  function switchLocation(container, locationId) {
    currentLocation = locationId;
    container.innerHTML = '<div class="cs-loading">Loading…</div>';
    
    // Always fetch full schedule; filter client-side for robustness
    const url = API_ROOT + 'schedule';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const filtered = currentLocation ? list.filter(it => it && it.location === currentLocation) : list;
        setTimeout(() => {
          render(container, filtered);
        }, 200); // Small delay for smooth transition
      })
      .catch((error) => {
        console.error('Failed to load schedule:', error);
        container.innerHTML = '<div>Failed to load schedule.</div>';
      });
  }

  function render(container, items){
    container.innerHTML='';
    
    // Add location picker if we have locations
    if (allLocations.length > 1) {
      container.appendChild(renderLocationPicker(container, allLocations, currentLocation));
    }
    
    const scheduleWrapper = h('div', {class: 'cs-schedule-wrapper'});
    renderGrid(scheduleWrapper, items);
    renderMobile(scheduleWrapper, items);
    container.appendChild(scheduleWrapper);
  }

  function init(id){
    const container=document.getElementById(id);
    if(!container) return;
    container.innerHTML='<div class="cs-loading">Loading…</div>';
    
    // Load locations first
    fetch(API_ROOT + 'locations')
      .then(r => r.json())
      .then(locations => {
        allLocations = Array.isArray(locations) ? locations : [];
        currentLocation = allLocations.length > 0 ? allLocations[0].id : null;
        
        // Load full schedule; we'll filter client-side
        const url = API_ROOT + 'schedule';
        return fetch(url);
      })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const filtered = currentLocation ? list.filter(it => it && it.location === currentLocation) : list;
        render(container, filtered);
      })
      .catch((error) => {
        console.error('Failed to load schedule:', error);
        container.innerHTML = '<div>Failed to load schedule.</div>';
      });
  }

  mounts.forEach(init);
})();


