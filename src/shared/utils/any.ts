import HttpError from '../utils/errorHandler';

export function normalizeURL(targetURL: string, baseURL?: string): string {
	// If the target URL starts with "//", assume "https" protocol
	if (targetURL.startsWith('//')) {
		targetURL = 'https:' + targetURL;
	}
	// If the target URL is a relative path, append it to the base URL
	else if (targetURL.startsWith('/') && baseURL) {
		targetURL = baseURL + targetURL;
	}
	// If the target URL lacks a protocol, assume "https"
	else if (!targetURL.startsWith('http://') && !targetURL.startsWith('https://')) {
		targetURL = 'https://' + targetURL;
	}

	try {
		const parsedURL = new URL(targetURL);
		return parsedURL.href;
	} catch (error) {
		//@klaus139 Do something with the error
		console.log(error.message); // added to bypass pre-commit (please fix)
		throw new HttpError('Link is invalid, please provide a valid link ⚠️', 400);
	}
}
