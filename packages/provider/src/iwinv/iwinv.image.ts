import { fail, KMsgError, KMsgErrorCode, ok, type Result } from "@k-msg/core";
import type { IWINVImageInput } from "./iwinv.internal.types";

function getFileExtension(filename: string): string {
  const safe = filename.split(/[?#]/, 1)[0] ?? filename;
  const lastDot = safe.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === safe.length - 1) return "";
  return safe.slice(lastDot).toLowerCase();
}

function guessImageContentType(filename: string): string | undefined {
  const ext = getFileExtension(filename);
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return undefined;
  }
}

export function resolveImageInput(
  options: unknown,
  providerId: string,
): Result<IWINVImageInput | undefined, KMsgError> {
  const record =
    options && typeof options === "object"
      ? (options as Record<string, unknown>)
      : {};
  const media =
    record.media && typeof record.media === "object"
      ? (record.media as Record<string, unknown>)
      : undefined;
  const image = media?.image as Record<string, unknown> | undefined;

  if (image && typeof image === "object") {
    if (image.bytes instanceof Uint8Array) {
      return ok({
        bytes: image.bytes,
        filename:
          typeof image.filename === "string" ? image.filename : undefined,
        contentType:
          typeof image.contentType === "string" ? image.contentType : undefined,
      });
    }
    if (image.blob instanceof Blob) {
      return ok({
        blob: image.blob,
        filename:
          typeof image.filename === "string" ? image.filename : undefined,
        contentType:
          typeof image.contentType === "string" ? image.contentType : undefined,
      });
    }
    if (typeof image.ref === "string" && image.ref.trim().length > 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "IWINV MMS caller must provide blob/bytes in options.media.image",
          { providerId, field: "media.image.ref" },
        ),
      );
    }
  }

  const imageUrlRaw = record.imageUrl;
  if (typeof imageUrlRaw === "string" && imageUrlRaw.trim().length > 0) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "IWINV MMS caller must provide blob/bytes in options.media.image",
        { providerId, field: "imageUrl" },
      ),
    );
  }

  return ok(undefined);
}

export async function toImageBlob(input: IWINVImageInput): Promise<{
  blob: Blob;
  filename: string;
  contentType: string;
  size: number;
}> {
  if ("blob" in input) {
    const contentType =
      input.contentType || input.blob.type || "application/octet-stream";
    const filename = input.filename || "image";
    const blob =
      input.contentType && input.contentType !== input.blob.type
        ? new Blob([await input.blob.arrayBuffer()], { type: contentType })
        : input.blob;

    return { blob, filename, contentType, size: blob.size };
  }

  const contentType = input.contentType || "application/octet-stream";
  const copied = new Uint8Array(input.bytes.byteLength);
  copied.set(input.bytes);
  const blob = new Blob([copied], { type: contentType });
  const filename = input.filename || "image";
  return { blob, filename, contentType, size: blob.size };
}

export function resolveImageFilename(image: {
  filename: string;
  contentType: string;
}): string {
  const hasExt = getFileExtension(image.filename).length > 0;
  if (hasExt) return image.filename;

  const guessedExt =
    guessImageContentType(image.filename) === "image/png"
      ? ".png"
      : guessImageContentType(image.filename) === "image/gif"
        ? ".gif"
        : guessImageContentType(image.filename) === "image/webp"
          ? ".webp"
          : image.contentType === "image/png"
            ? ".png"
            : image.contentType === "image/gif"
              ? ".gif"
              : image.contentType === "image/webp"
                ? ".webp"
                : ".jpg";

  return `${image.filename}${guessedExt}`;
}
