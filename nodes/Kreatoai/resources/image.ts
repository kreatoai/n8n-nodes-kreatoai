import type { INodeProperties } from 'n8n-workflow';
import { handleApiError } from '../shared/errors';

const show = (operation: string[]) => ({ resource: ['image'], operation });

export const imageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['image'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create image',
				description:
					'Create an image from a sentence (2 credits). It is ready in about 30 seconds.',
				routing: {
					request: { method: 'POST', url: '/v1/generations' },
					output: { postReceive: [handleApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete image',
				description: 'Remove an image from your creations',
				routing: {
					request: { method: 'DELETE', url: '=/v1/generations/{{$parameter.imageId}}' },
					output: { postReceive: [handleApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get image',
				description: 'Retrieve an image, its status and its link once it is ready',
				routing: {
					request: { method: 'GET', url: '=/v1/generations/{{$parameter.imageId}}' },
					output: { postReceive: [handleApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many images',
				description: 'Retrieve a list of your latest creations',
				routing: {
					request: { method: 'GET', url: '/v1/generations' },
					output: {
						postReceive: [
							handleApiError,
							{ type: 'rootProperty', properties: { property: 'data' } },
						],
					},
				},
			},
		],
		default: 'create',
	},

	// Create
	{
		displayName: 'Description',
		name: 'prompt',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		placeholder: 'e.g. A cup of coffee on a wooden table, morning light',
		displayOptions: { show: show(['create']) },
		description: 'What the image should show, in one sentence (3 to 1,800 characters)',
		routing: { send: { type: 'body', property: 'prompt' } },
	},
	{
		displayName: 'Aspect Ratio',
		name: 'aspectRatio',
		type: 'options',
		default: '9:16',
		displayOptions: { show: show(['create']) },
		options: [
			{ name: 'Vertical (9:16)', value: '9:16' },
			{ name: 'Square (1:1)', value: '1:1' },
			{ name: 'Horizontal (16:9)', value: '16:9' },
		],
		routing: { send: { type: 'body', property: 'aspectRatio' } },
	},

	// Get, Delete
	{
		displayName: 'Image ID',
		name: 'imageId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: show(['get', 'delete']) },
		description: 'The ID returned when the image was created',
	},

	// Get Many
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: show(['getAll']) },
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			send: { paginate: '={{ $value }}', type: 'query', property: 'limit', value: '50' },
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body.nextCursor }}',
						request: { qs: { cursor: '={{ $response.body.nextCursor }}' } },
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 50,
		displayOptions: { show: { ...show(['getAll']), returnAll: [false] } },
		description: 'Max number of results to return',
		routing: {
			send: { type: 'query', property: 'limit' },
			output: { maxResults: '={{$value}}' },
		},
	},
];
