import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { accountDescription } from './resources/account';
import { mediaDescription } from './resources/media';
import { postDescription } from './resources/post';
import { workspaceDescription } from './resources/workspace';
import { getAccounts } from './shared/loadOptions';
import { BASE_URL } from './shared/transport';

export class Kreatoai implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kreatoai',
		name: 'kreatoai',
		icon: { light: 'file:../../icons/kreatoai.svg', dark: 'file:../../icons/kreatoai.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Publish and schedule posts on Facebook, Instagram, TikTok, LinkedIn, YouTube, Bluesky, Google Business and Pinterest',
		defaults: {
			name: 'Kreatoai',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'kreatoaiApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: BASE_URL,
			// Error answers reach handleApiError, which explains them in plain words.
			ignoreHttpStatusErrors: true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Media', value: 'media' },
					{ name: 'Post', value: 'post' },
					{ name: 'Workspace', value: 'workspace' },
				],
				default: 'post',
			},
			...accountDescription,
			...mediaDescription,
			...postDescription,
			...workspaceDescription,
		],
	};

	methods = {
		loadOptions: {
			getAccounts,
		},
	};
}
