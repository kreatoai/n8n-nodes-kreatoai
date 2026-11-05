import type { INodeProperties } from 'n8n-workflow';
import { handleApiError } from '../shared/errors';

export const accountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many accounts',
				description: 'Retrieve the social accounts connected to Kreatoai',
				routing: {
					request: { method: 'GET', url: '/v1/accounts' },
					output: {
						postReceive: [
							handleApiError,
							{ type: 'rootProperty', properties: { property: 'items' } },
						],
					},
				},
			},
		],
		default: 'getAll',
	},
];
