import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClassItem, DAY_LABELS, DAY_ORDER, DayKey, parseTimeToMinutes } from '../shared/types';

declare global {
	interface Window {
		CLASS_SCHEDULE_CONFIG: { root: string };
		ClassScheduleMounts?: string[];
	}
}

async function fetchSchedule(): Promise<ClassItem[]> {
	const res = await fetch(`${window.CLASS_SCHEDULE_CONFIG.root}schedule`);
	return (await res.json()) as ClassItem[];
}

function Grid() {
	const [items, setItems] = useState<ClassItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSchedule().then((data) => {
			setItems(Array.isArray(data) ? data : []);
			setLoading(false);
		});
	}, []);

	const dayToItems = useMemo(() => {
		const map: Record<DayKey, ClassItem[]> = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
		for (const it of items) map[it.day].push(it);
		for (const d of DAY_ORDER) map[d].sort((a, b) => a.start.localeCompare(b.start));
		return map;
	}, [items]);

	const timeMarks = useMemo(() => {
		// derive from data with default 06:00-20:00
		const start = Math.min(360, ...items.map((i) => parseTimeToMinutes(i.start)));
		const end = Math.max(1200, ...items.map((i) => parseTimeToMinutes(i.end)));
		const marks: string[] = [];
		for (let m = start; m <= end; m += 120) {
			const hh = String(Math.floor(m / 60)).padStart(2, '0');
			const mm = String(m % 60).padStart(2, '0');
			marks.push(`${hh}:00`);
		}
		return marks;
	}, [items]);

	if (loading) return <p>Loading…</p>;

	return (
		<div className="cs-frontend">
			<div className="cs-grid">
				<div className="cs-col cs-times">
					{timeMarks.map((t) => (
						<div key={t} className="cs-time">{t}</div>
					))}
				</div>
				{DAY_ORDER.map((day) => (
					<div key={day} className="cs-col">
						<div className="cs-col-header">{DAY_LABELS[day]}</div>
						<div className="cs-col-body">
							{dayToItems[day].map((it) => (
								<div key={it.id} className="cs-tile">
									<div className="cs-tile-title">{it.title}</div>
									<div className="cs-tile-sub">{it.instructor}</div>
									<div className="cs-tile-time">{it.start}–{it.end}</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function mount(containerId: string) {
	const el = document.getElementById(containerId);
	if (!el) return;
	const root = createRoot(el);
	root.render(<Grid />);
}

window.ClassScheduleMounts = window.ClassScheduleMounts || [];
for (const id of window.ClassScheduleMounts) {
	mount(id);
}


