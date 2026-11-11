import {
	NodeApiError,
	type IExecuteSingleFunctions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';
import { platformName } from './loadOptions';

const DASHBOARD = 'https://kreatoai.com/dashboard';

/** What to do for each error code returned by the Kreatoai API. */
const HINTS: Record<string, string> = {
	invalid_api_key: `Check the API key in the Kreatoai credential, or create a new one in ${DASHBOARD}/settings?tab=developers.`,
	api_key_expired: `This API key has expired. Create a new one in ${DASHBOARD}/settings?tab=developers and update the credential.`,
	api_key_revoked: `This API key was revoked. Create a new one in ${DASHBOARD}/settings?tab=developers and update the credential.`,
	insufficient_scope: `This API key doesn't allow this action. Create a key with the right permissions in ${DASHBOARD}/settings?tab=developers.`,
	invalid_targets: 'Nothing was published. The reason for each network:',
	targets_in_several_workspaces:
		'These accounts are in different Kreatoai workspaces. Create one post per workspace, with only its own accounts.',
	channel_limit_exceeded: `Your Kreatoai account has more connected accounts than its plan allows, so nothing was published. Disconnect some in ${DASHBOARD}/channels or upgrade in ${DASHBOARD}/billing.`,
	subscription_required: `The free plan limit is reached, so nothing was done. A free account creates 10 posts per month. Upgrade in ${DASHBOARD}/billing.`,
	youtube_daily_limit: 'The YouTube daily limit is reached for that day. Schedule this video on another day.',
	scheduled_at_in_past: "'Schedule Time' must be in the future.",
	media_unreadable: "The media can't be read from its URL. Check that the link is public and points to an image or a video.",
	media_too_large: 'This file is too large: up to 20 MB for an image and 512 MB for a video.',
	file_too_large: 'This file is too large: up to 20 MB for an image and 512 MB for a video.',
	upload_quota_reached: 'The upload limit for the last 24 hours is reached. Try again tomorrow, or reuse a media URL already uploaded.',
	post_not_found: "This post doesn't exist in your workspace. Check the 'Post ID'.",
	post_not_editable: 'This post has already been published, is being sent, or was cancelled, so it can no longer be changed.',
	post_not_cancellable: 'This post has already been published or cancelled, so there is nothing to cancel.',
	rate_limit_exceeded: 'Too many requests. Wait a minute, then try again.',
	rate_limited: 'Too many requests. Wait a minute, then try again.',
	payload_too_large: 'The request is too large. For a big file, use Media > Upload with a URL instead of a binary file.',
};

/** Why a network refused the post, one reason per code. */
const TARGET_REASONS: Record<string, string> = {
	invalid_target:
		'this network is not supported. Kreatoai publishes on Facebook, Instagram, TikTok, LinkedIn, YouTube, Bluesky, Google Business and Pinterest.',
	duplicate_target: 'the same account is selected twice.',
	channel_not_connected: `no account of this network is connected. Connect it in ${DASHBOARD}/channels.`,
	ambiguous_target: "several accounts of this network match. Pick the exact account in 'Accounts'.",
	content_too_long_for_target: 'the text is too long for this network.',
	media_required_for_target: 'this network needs an image or a video, never text alone.',
	video_required_for_target: 'YouTube only publishes a video (a Short), not text or images.',
	document_linkedin_only: 'a PDF can only be published on LinkedIn.',
	document_alone: 'a PDF must be published alone, without other media.',
	story_unsupported_target: 'stories are only for Facebook and Instagram.',
	story_single_media: 'a story has exactly one image or video.',
	video_unsupported_target: "this network doesn't publish videos. Use an image or text only.",
	too_many_media_for_target: 'too many media files for this network.',
	pinterest_board_required: "the Pinterest board in 'Network Options' doesn't belong to this account.",
};

function targetReasons(details: unknown): string {
	if (!Array.isArray(details)) return '';
	return details
		.map((detail) => {
			const { platform, error } = (detail ?? {}) as { platform?: string; error?: string };
			const reason = error ? (TARGET_REASONS[error] ?? error) : undefined;
			return platform && reason ? `${platformName(platform)}: ${reason}` : '';
		})
		.filter((line) => line !== '')
		.join(' ');
}

/**
 * Turns an error answer of the API into a clear message: what happened, and
 * how to fix it. Runs first in every operation's output.
 */
export async function handleApiError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (response.statusCode < 400) return items;

	const body = (response.body ?? {}) as { error?: string; message?: string; details?: unknown };
	const code = body.error ?? `http_${response.statusCode}`;
	const hint = HINTS[code] ?? 'Check the parameters of this node, then try again.';
	const reasons = code === 'invalid_targets' ? targetReasons(body.details) : '';

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		message: `Kreatoai refused the request (${code})`,
		description: reasons ? `${hint} ${reasons}` : hint,
		httpCode: String(response.statusCode),
		itemIndex: this.getItemIndex(),
	});
}
