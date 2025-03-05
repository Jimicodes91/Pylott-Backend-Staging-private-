import HttpError from "../utils/errorHandler";

export function normalizeURL(targetURL: string, baseURL?: string): string {
  // If the target URL starts with "//", assume "https" protocol
  if (targetURL.startsWith("//")) {
    targetURL = "https:" + targetURL;
  }
  // If the target URL is a relative path, append it to the base URL
  else if (targetURL.startsWith("/") && baseURL) {
    targetURL = baseURL + targetURL;
  }
  // If the target URL lacks a protocol, assume "https"
  else if (!targetURL.startsWith("http://") && !targetURL.startsWith("https://")) {
    targetURL = "https://" + targetURL;
  }

  try {
    // Attempt to parse the URL to validate it
    const parsedURL = new URL(targetURL);
    return parsedURL.href;
  } catch (error) {
    throw new HttpError('Link is invalid, please provide a valid link ⚠️', 400)
  }
}