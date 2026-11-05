import {
	NodeOperationError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeProperties,
} from 'n8n-workflow';
import { handleApiError } from '../shared/errors';
import { toIsoDate, toMediaUrls, toObject, toTargets } from '../shared/utils';

const FIRST_COMMENT_NETWORKS = ['facebook', 'instagram'];

function networksOf(targets: ReturnType<typeof toTargets>): string[] {
	return targets.map((t) => (typeof t === 'string' ? t : t.platform));
}

/** Builds the options object from the simple fields and the advanced JSON. */
function buildOptions(
	this: IExecuteSingleFunctions,
	fields: IDataObject,
	networks: string[] | null,
): IDataObject | undefined {
	const options: IDataObject = toObject.call(this, fields.networkOptions, 'Network Options');

	if (fields.format) options.format = fields.format;

	const firstComment = String(fields.firstComment ?? '').trim();
	if (firstComment !== '') {
		const concerned = networks
			? FIRST_COMMENT_NETWORKS.filter((n) => networks.includes(n))
			: FIRST_COMMENT_NETWORKS;
		for (const network of concerned) {
			options[network] = { ...((options[network] as IDataObject) ?? {}), firstComment };
		}
	}

	return Object.keys(options).length > 0 ? options : undefined;
}

async function buildCreateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const targets = toTargets.call(this, this.getNodeParameter('accounts'));
	const text = String(this.getNodeParameter('text', '') ?? '');
	const fields = this.getNodeParameter('additionalFields', {}) as IDataObject;

	const body: IDataObject = { targets, content: text };

	const mediaUrls = toMediaUrls(fields.mediaUrls);
	if (mediaUrls.length > 0) body.mediaUrls = mediaUrls;
	if (fields.scheduledAt) body.scheduledAt = toIsoDate.call(this, fields.scheduledAt, 'Schedule Time');
	if (fields.idempotencyKey) body.idempotencyKey = String(fields.idempotencyKey);

	const options = buildOptions.call(this, fields, networksOf(targets));
	if (options) body.options = options;

	requestOptions.body = body;
	return requestOptions;
}

async function buildUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as IDataObject;
	const body: IDataObject = {};

	if (fields.text !== undefined && String(fields.text) !== '') body.content = String(fields.text);
	if (fields.mediaUrls !== undefined) body.mediaUrls = toMediaUrls(fields.mediaUrls);
	if (fields.scheduledAt) body.scheduledAt = toIsoDate.call(this, fields.scheduledAt, 'Schedule Time');

	const options = buildOptions.call(this, fields, null);
	if (options) body.options = options;

	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(this.getNode(), 'Nothing to update', {
			description: "Add at least one field under 'Update Fields'.",
			itemIndex: this.getItemIndex(),
		});
	}

	requestOptions.body = body;
	return requestOptions;
}

async function confirmCancel(this: IExecuteSingleFunctions): Promise<INodeExecutionData[]> {
	const postId = this.getNodeParameter('postId') as string;
	return [{ json: { cancelled: true, id: postId } }];
}

const show = (operation: string[]) => ({ resource: ['post'], operation });

const mediaUrlsField: INodeProperties = {
	displayName: 'Media URLs',
	name: 'mediaUrls',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Media URL',
	default: {},
	description:
		'Public links to the images or video to publish, up to 10. Use Media > Upload first for a file that is not online.',
	options: [
		{
			displayName: 'URL',
			name: 'url',
			values: [
				{
					displayName: 'URL',
					name: 'value',
					type: 'string',
					default: '',
					placeholder: 'e.g. https://example.com/image.png',
				},
			],
		},
	],
};

const scheduledAtField: INodeProperties = {
	displayName: 'Schedule Time',
	name: 'scheduledAt',
	type: 'dateTime',
	default: '',
	description:
		"When to publish. Leave empty to publish right away. A time without a time zone is read in the workflow's time zone.",
};

const formatField: INodeProperties = {
	displayName: 'Format',
	name: 'format',
	type: 'options',
	default: 'post',
	options: [
		{ name: 'Post', value: 'post', description: 'A regular post' },
		{
			name: 'Story',
			value: 'story',
			description: 'A Facebook or Instagram story: one image or video, no text',
		},
	],
};

const firstCommentField: INodeProperties = {
	displayName: 'First Comment',
	name: 'firstComment',
	type: 'string',
	typeOptions: { rows: 2 },
	default: '',
	description:
		'A comment posted by your account right after the post, on Facebook and Instagram. Handy for links and hashtags.',
};

const networkOptionsField: INodeProperties = {
	displayName: 'Network Options',
	name: 'networkOptions',
	type: 'json',
	default: '{}',
	description:
		'Advanced settings per network, as described in the API documentation (https://kreatoai.com/developers?ref=n8n-node). For example {"youtube": {"privacyStatus": "unlisted"}}.',
};

export const postDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['post'] } },
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel post',
				description: 'Cancel a scheduled post that has not been published yet',
				routing: {
					request: { method: 'DELETE', url: '=/v1/posts/{{$parameter.postId}}' },
					output: { postReceive: [handleApiError, confirmCancel] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create post',
				description: 'Publish or schedule a post on one or more social accounts',
				routing: {
					request: { method: 'POST', url: '/v1/posts' },
					send: { preSend: [buildCreateBody] },
					output: { postReceive: [handleApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get post',
				description: 'Retrieve a post and its status on each network',
				routing: {
					request: { method: 'GET', url: '=/v1/posts/{{$parameter.postId}}' },
					output: { postReceive: [handleApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many posts',
				description: 'Retrieve a list of your latest posts',
				routing: {
					request: { method: 'GET', url: '/v1/posts' },
					output: {
						postReceive: [
							handleApiError,
							{ type: 'rootProperty', properties: { property: 'items' } },
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update post',
				description: 'Change the text, media or time of a scheduled post',
				routing: {
					request: { method: 'PATCH', url: '=/v1/posts/{{$parameter.postId}}' },
					send: { preSend: [buildUpdateBody] },
					output: { postReceive: [handleApiError] },
				},
			},
		],
		default: 'create',
	},

	// Create
	{
		displayName: 'Account Names or IDs',
		name: 'accounts',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getAccounts' },
		required: true,
		default: [],
		displayOptions: { show: show(['create']) },
		description:
			'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		hint: 'In an expression, write each account as "network:accountId", or just the network (for example "facebook") for its default account',
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 5 },
		default: '',
		displayOptions: { show: show(['create']) },
		description:
			'The text of the post. Each network has its own length limit; a story has no text.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['create']) },
		options: [
			firstCommentField,
			formatField,
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'A unique value of your choice. If the same key is sent twice, the post is created only once.',
			},
			mediaUrlsField,
			networkOptionsField,
			scheduledAtField,
		],
	},

	// Get, Update, Cancel
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: show(['get', 'update', 'cancel']) },
		description: 'The ID returned when the post was created',
	},

	// Update
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['update']) },
		options: [
			firstCommentField,
			formatField,
			mediaUrlsField,
			networkOptionsField,
			scheduledAtField,
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				description: 'The new text of the post',
			},
		],
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
