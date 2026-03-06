/**
 * Twitter/X media upload via v1.1 API
 * Downloads an image from URL, converts to base64, uploads to Twitter
 */

import { createOAuthHeader } from "./oauth.ts";

const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

export async function uploadMediaToTwitter(
  imageUrl: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): Promise<string> {
  // 1. Download the image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);

  const imgBuffer = await imgRes.arrayBuffer();
  const imgBytes = new Uint8Array(imgBuffer);

  // 2. Convert to base64
  let binary = "";
  for (let i = 0; i < imgBytes.length; i++) {
    binary += String.fromCharCode(imgBytes[i]);
  }
  const base64Data = btoa(binary);

  // 3. Upload via multipart/form-data (body params NOT in OAuth signature)
  const boundary = `----Boundary${crypto.randomUUID().replace(/-/g, "")}`;
  const contentType = imgRes.headers.get("content-type") || "image/png";

  const multipartBody = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="media_data"`,
    "",
    base64Data,
    `--${boundary}`,
    `Content-Disposition: form-data; name="media_category"`,
    "",
    "tweet_image",
    `--${boundary}--`,
  ].join("\r\n");

  const authHeader = await createOAuthHeader(
    "POST", MEDIA_UPLOAD_URL,
    consumerKey, consumerSecret, accessToken, accessTokenSecret
    // No extraParams — multipart/form-data params are NOT included in OAuth sig
  );

  const uploadRes = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Media upload failed [${uploadRes.status}]: ${JSON.stringify(uploadData)}`);
  }

  const mediaId = uploadData.media_id_string;
  if (!mediaId) throw new Error("No media_id_string in upload response");

  return mediaId;
}
