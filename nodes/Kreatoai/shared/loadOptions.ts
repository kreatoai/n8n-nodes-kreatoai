import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { kreatoaiApiRequest } from './transport';

type Account = {
	id: string;
	platform: string;
	name: string | null;
	workspace?: { id: string; name: string };
};

const PLATFORM_NAMES: Record<string, string> = {
	facebook: 'Facebook',
	instagram: 'Instagram',
	tiktok: 'TikTok',
	linkedin: 'LinkedIn',
	youtube: 'YouTube',
	bluesky: 'Bluesky',
	google_business: 'Google Business',
	pinterest: 'Pinterest',
	threads: 'Threads',
};

export function platformName(platform: string): string {
	return PLATFORM_NAMES[platform] ?? platform;
}

/**
 * Lists the connected accounts. The value carries both the network and the
 * account ID, because a post target needs the two.
 */
export async function getAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await kreatoaiApiRequest.call(this, 'GET', '/v1/accounts');
	const accounts = (response.items ?? []) as Account[];

	return accounts
		.map((account) => {
			const network = platformName(account.platform);
			const workspace = account.workspace?.name ? ` · ${account.workspace.name}` : '';
			return {
				name: `${account.name ?? network} (${network}${workspace})`,
				value: `${account.platform}:${account.id}`,
				description: `Account ID: ${account.id}`,
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}
