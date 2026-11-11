import type { INodeProperties } from 'n8n-workflow';
import { handleApiError } from '../shared/errors';

export const workspaceDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['workspace'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get workspace',
				description: 'Retrieve your workspace: brand and plan',
				routing: {
					request: { method: 'GET', url: '/v1/workspace' },
					output: { postReceive: [handleApiError] },
				},
			},
		],
		default: 'get',
	},
];
