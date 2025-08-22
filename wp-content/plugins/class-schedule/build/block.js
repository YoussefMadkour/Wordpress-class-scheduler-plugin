(function(){
  if(!window.wp || !window.wp.blocks) return;
  const { registerBlockType } = window.wp.blocks;
  const { createElement: h } = window.wp.element;
  registerBlockType('class-schedule/schedule', {
    title: 'Class Schedule',
    icon: 'schedule',
    category: 'widgets',
    edit: function(){
      return h('div', { className: 'class-schedule-block-placeholder' }, 'Class Schedule will render on the frontend.');
    },
    save: function(){ return null; }
  });
})();


