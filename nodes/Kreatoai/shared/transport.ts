import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const BASE_URL = 'https://api.kreatoai.com';

export async function kreatoaiApiRequest(
	this: ILoadOptionsFunctions | IExecuteSingleFunctions,
	method: IHttpRequestMethods,
	path: string,
	qs: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${path}`,
		qs,
		json: true,
	};

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'kreatoaiApi',
		options,
	)) as IDataObject;
}
