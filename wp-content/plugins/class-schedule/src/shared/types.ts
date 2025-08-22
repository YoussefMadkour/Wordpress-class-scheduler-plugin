export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ClassItem {
	id: string;
	title: string;
	instructor: string;
	day: DayKey;
	start: string; // HH:mm
	end: string; // HH:mm
}

export const DAY_LABELS: Record<DayKey, string> = {
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday',
	sun: 'Sunday',
};

export const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function generateId(): string {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseTimeToMinutes(time: string): number {
	const [h, m] = time.split(':').map((v) => parseInt(v, 10));
	return h * 60 + m;
}


