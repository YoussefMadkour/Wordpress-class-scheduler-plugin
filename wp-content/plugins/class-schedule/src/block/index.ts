// This builds a minimal editor script; the PHP registers a dynamic block
declare const wp: any;

if (typeof wp !== 'undefined' && wp.blocks) {
	const { registerBlockType } = wp.blocks;
	const { createElement: h } = wp.element;
	registerBlockType('class-schedule/schedule', {
		title: 'Class Schedule',
		icon: 'schedule',
		category: 'widgets',
		edit: function () {
			return h('div', { className: 'class-schedule-block-placeholder' }, 'Class Schedule will render on the frontend.');
		},
		save: function () { return null; },
	});
}


