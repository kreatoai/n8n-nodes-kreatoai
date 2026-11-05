import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KreatoaiApi implements ICredentialType {
	name = 'kreatoaiApi';

	displayName = 'Kreatoai API';

	icon: Icon = { light: 'file:../icons/kreatoai.svg', dark: 'file:../icons/kreatoai.dark.svg' };

	documentationUrl = 'https://kreatoai.com/developers/api-keys?ref=n8n-node';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'e.g. sk-kre-v1-...',
			description:
				'Create a key in your Kreatoai dashboard, under ChatGPT, Claude and API > API keys. The full key is shown only once.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.kreatoai.com',
			url: '/v1/workspace',
			method: 'GET',
		},
	};
}
