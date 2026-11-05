import { NodeOperationError, type IDataObject, type IExecuteSingleFunctions } from 'n8n-workflow';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Turns the 'Accounts' parameter into post targets.
 * Each entry is either "network:accountId" (picked from the list) or a bare
 * network name such as "facebook", which targets that network's default account.
 */
export function toTargets(
	this: IExecuteSingleFunctions,
	value: unknown,
): Array<string | { platform: string; channelId: string }> {
	const entries = (Array.isArray(value) ? value : String(value ?? '').split(','))
		.map((entry) => String(entry).trim())
		.filter((entry) => entry !== '');

	if (entries.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No account selected in \'Accounts\'', {
			description: 'Pick at least one connected account to publish to.',
			itemIndex: this.getItemIndex(),
		});
	}

	return entries.map((entry) => {
		const separator = entry.indexOf(':');
		if (separator === -1) return entry.toLowerCase();
		const platform = entry.slice(0, separator).toLowerCase();
		const channelId = entry.slice(separator + 1);
		if (!UUID.test(channelId)) {
			throw new NodeOperationError(this.getNode(), `The account "${entry}" in 'Accounts' is not valid`, {
				description:
					'Pick the account from the list, or use the form "network:accountId" (for example "facebook:<account ID>").',
				itemIndex: this.getItemIndex(),
			});
		}
		return { platform, channelId };
	});
}

/** Offset in minutes of a time zone at a given instant, without any dependency. */
function offsetMinutes(timeZone: string, instant: Date): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(instant);
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
	return Math.round((asUtc - instant.getTime()) / 60000);
}

/**
 * Returns an ISO 8601 date with an offset, as the API expects.
 * A date without an offset is read in the workflow's time zone.
 */
export function toIsoDate(this: IExecuteSingleFunctions, value: unknown, label: string): string {
	const raw =
		value && typeof value === 'object' && 'toISO' in value
			? String((value as { toISO: () => string }).toISO())
			: String(value ?? '').trim();

	let date: Date;
	if (HAS_OFFSET.test(raw)) {
		date = new Date(raw);
	} else {
		const naive = new Date(`${raw}Z`);
		const zone = this.getTimezone();
		date = new Date(naive.getTime() - offsetMinutes(zone, naive) * 60000);
	}

	if (Number.isNaN(date.getTime())) {
		throw new NodeOperationError(this.getNode(), `The date in '${label}' is not valid`, {
			description: 'Use a date and time such as 2026-12-01T09:30:00.',
			itemIndex: this.getItemIndex(),
		});
	}
	return date.toISOString();
}

/** Reads a JSON parameter that may arrive as text or as an object. */
export function toObject(this: IExecuteSingleFunctions, value: unknown, label: string): IDataObject {
	if (value === undefined || value === null || value === '') return {};
	if (typeof value === 'object') return value as IDataObject;
	try {
		const parsed: unknown = JSON.parse(String(value));
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as IDataObject;
	} catch {
		// handled below
	}
	throw new NodeOperationError(this.getNode(), `'${label}' must be a JSON object`, {
		description: 'For example: {"youtube": {"privacyStatus": "unlisted"}}',
		itemIndex: this.getItemIndex(),
	});
}

/** Reads the 'Media URLs' list, entered one by one or as a comma-separated text. */
export function toMediaUrls(value: unknown): string[] {
	if (value && typeof value === 'object' && 'url' in value) {
		const urls = (value as { url: Array<{ value: string }> }).url ?? [];
		return urls.map((u) => String(u.value).trim()).filter((u) => u !== '');
	}
	return String(value ?? '')
		.split(',')
		.map((u) => u.trim())
		.filter((u) => u !== '');
}
