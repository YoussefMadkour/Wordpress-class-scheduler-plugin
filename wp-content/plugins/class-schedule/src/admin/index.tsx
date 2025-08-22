import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClassItem, DAY_LABELS, DAY_ORDER, DayKey, generateId } from '../shared/types';

declare global {
	interface Window {
		CLASS_SCHEDULE_CONFIG: { root: string; nonce?: string };
	}
}

async function fetchSchedule(): Promise<ClassItem[]> {
	const res = await fetch(`${window.CLASS_SCHEDULE_CONFIG.root}schedule`);
	return (await res.json()) as ClassItem[];
}

async function saveSchedule(items: ClassItem[]): Promise<void> {
	await fetch(`${window.CLASS_SCHEDULE_CONFIG.root}schedule`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': window.CLASS_SCHEDULE_CONFIG.nonce || '',
		},
		body: JSON.stringify(items),
	});
}

function AdminApp() {
	const [items, setItems] = useState<ClassItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState<Omit<ClassItem, 'id'>>({
		title: '',
		instructor: '',
		day: 'mon',
		start: '06:00',
		end: '08:00',
	});

	useEffect(() => {
		fetchSchedule().then((data) => {
			setItems(Array.isArray(data) ? data : []);
			setLoading(false);
		});
	}, []);

	const grouped = useMemo(() => {
		const g: Record<DayKey, ClassItem[]> = {
			mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
		};
		for (const it of items) g[it.day].push(it);
		for (const d of DAY_ORDER) g[d].sort((a, b) => a.start.localeCompare(b.start));
		return g;
	}, [items]);

	function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		const newItem: ClassItem = { id: generateId(), ...form };
		const next = [...items, newItem];
		setItems(next);
		saveSchedule(next);
	}

	function handleDelete(id: string) {
		const next = items.filter((i) => i.id !== id);
		setItems(next);
		saveSchedule(next);
	}

	function handleEdit(id: string, update: Partial<ClassItem>) {
		const next = items.map((i) => (i.id === id ? { ...i, ...update } : i));
		setItems(next);
		saveSchedule(next);
	}

	if (loading) return <p>Loading…</p>;

	return (
		<div className="class-schedule-admin">
			<form onSubmit={handleAdd} className="cs-form">
				<input required placeholder="Class title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
				<input required placeholder="Instructor" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
				<select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value as DayKey })}>
					{DAY_ORDER.map((d) => (
						<option value={d} key={d}>{DAY_LABELS[d]}</option>
					))}
				</select>
				<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
				<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
				<button type="submit">Add Class</button>
			</form>

			<div className="cs-list">
				{DAY_ORDER.map((d) => (
					<div key={d} className="cs-day">
						<h3>{DAY_LABELS[d]}</h3>
						{grouped[d].length === 0 && <p className="cs-empty">No classes</p>}
						{grouped[d].map((it) => (
							<div key={it.id} className="cs-item">
								<div className="cs-item-title">{it.title}</div>
								<div className="cs-item-meta">{it.instructor} — {it.start}–{it.end}</div>
								<div className="cs-actions">
									<button type="button" onClick={() => handleDelete(it.id)}>Delete</button>
									<button type="button" onClick={() => handleEdit(it.id, { title: prompt('New title', it.title) || it.title })}>Rename</button>
								</div>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

function mount() {
	const el = document.getElementById('class-schedule-admin-app');
	if (!el) return;
	const root = createRoot(el);
	root.render(<AdminApp />);
}

mount();


