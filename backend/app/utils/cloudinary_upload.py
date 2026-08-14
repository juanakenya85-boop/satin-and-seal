"""
Uploads image files to Cloudinary and returns the permanent, publicly
served URL. Replaces the old local-disk /uploads approach, which doesn't
survive a redeploy or restart on Render's free tier (ephemeral filesystem).

Requires these three env vars to be set (from your Cloudinary dashboard):
    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET
"""
import os
import cloudinary
import cloudinary.uploader

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

_configured = False


def _ensure_configured():
    global _configured
    if _configured:
        return
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )
    _configured = True


class UploadError(Exception):
    pass


def upload_image(file_storage, folder, public_id_prefix):
    """
    file_storage: the Werkzeug FileStorage object from request.files["image"]
    folder: Cloudinary folder to organize uploads, e.g. "satin-and-seal/products"
    public_id_prefix: a short prefix for the generated filename, e.g. "product-3"

    Returns the full secure HTTPS URL to the uploaded image.
    Raises UploadError with a human-readable message on any failure.
    """
    if not os.getenv("CLOUDINARY_CLOUD_NAME"):
        raise UploadError(
            "Cloudinary isn't configured on the server — CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set as environment "
            "variables on Render."
        )

    if file_storage.filename == "":
        raise UploadError("No image file selected")

    ext = file_storage.filename.rsplit(".", 1)[-1].lower() if "." in file_storage.filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise UploadError("Image must be png, jpg, jpeg, or webp")

    _ensure_configured()

    try:
        result = cloudinary.uploader.upload(
            file_storage,
            folder=folder,
            public_id=public_id_prefix,
            overwrite=True,
            resource_type="image",
        )
    except Exception as e:
        raise UploadError(f"Cloudinary upload failed: {e}")

    return result["secure_url"]
