import type { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';
import { handleApiError } from '../shared/errors';

async function buildUploadBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const source = this.getNodeParameter('source') as string;

	if (source === 'url') {
		requestOptions.body = { url: this.getNodeParameter('url') as string };
		return requestOptions;
	}

	const property = this.getNodeParameter('binaryPropertyName') as string;
	this.helpers.assertBinaryData(property);
	const buffer = await this.helpers.getBinaryDataBuffer(property);
	requestOptions.body = { base64: buffer.toString('base64') };
	return requestOptions;
}

const show = { resource: ['media'], operation: ['upload'] };

export const mediaDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['media'] } },
		options: [
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload media',
				description:
					'Host an image, a video or a PDF on Kreatoai and get a link to use in a post',
				routing: {
					request: { method: 'POST', url: '/v1/media' },
					send: { preSend: [buildUploadBody] },
					output: { postReceive: [handleApiError] },
				},
			},
		],
		default: 'upload',
	},
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		default: 'url',
		displayOptions: { show },
		options: [
			{ name: 'URL', value: 'url', description: 'Copy a file that is already online' },
			{
				name: 'Binary File',
				value: 'binary',
				description: 'Send a file from a previous node. Best for images; use a URL for large videos.',
			},
		],
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. https://example.com/video.mp4',
		displayOptions: { show: { ...show, source: ['url'] } },
		description: 'Public link to the image, video or PDF',
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: { show: { ...show, source: ['binary'] } },
		hint: 'The name of the input binary field containing the file to upload',
	},
];
