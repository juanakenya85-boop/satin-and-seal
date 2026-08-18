from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
from ..extensions import db
from ..models import BlogPost, User
from ..utils.cloudinary_upload import upload_image, UploadError

blog_bp = Blueprint("blog", __name__)


def _require_admin():
    user = User.query.get(int(get_jwt_identity()))
    return user and user.is_admin


def slugify(text):
    return text.strip().lower().replace(" ", "-").replace("&", "and")


# --- Public ---

@blog_bp.get("")
def list_posts():
    posts = BlogPost.query.filter_by(is_published=True).order_by(BlogPost.published_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])


@blog_bp.get("/<string:slug>")
def get_post(slug):
    post = BlogPost.query.filter_by(slug=slug, is_published=True).first_or_404()
    return jsonify(post.to_dict(full=True))


# --- Admin ---

@blog_bp.get("/admin/all")
@jwt_required()
def list_all_posts():
    """Admin: lists every post, published or not."""
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    posts = BlogPost.query.order_by(BlogPost.published_at.desc()).all()
    return jsonify([p.to_dict(full=True) for p in posts])


@blog_bp.post("")
@jwt_required()
def create_post():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not data.get("excerpt", "").strip():
        return jsonify({"error": "Excerpt is required"}), 400
    if not data.get("content", "").strip():
        return jsonify({"error": "Content is required"}), 400

    slug = slugify(title)
    if BlogPost.query.filter_by(slug=slug).first():
        return jsonify({"error": "A post with this title (or a very similar one) already exists"}), 409

    post = BlogPost(
        title=title,
        slug=slug,
        excerpt=data.get("excerpt", "").strip(),
        content=data.get("content", "").strip(),
        cover_image_url=data.get("cover_image_url"),
        author=data.get("author", "Pleasure Pop Team").strip() or "Pleasure Pop Team",
        is_published=bool(data.get("is_published", True)),
    )
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict(full=True)), 201


@blog_bp.put("/<int:post_id>")
@jwt_required()
def update_post(post_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    post = BlogPost.query.get_or_404(post_id)
    data = request.get_json() or {}

    if "title" in data and data["title"].strip():
        post.title = data["title"].strip()
        post.slug = slugify(post.title)
    for field in ["excerpt", "content", "author"]:
        if field in data:
            setattr(post, field, data[field])
    if "is_published" in data:
        post.is_published = bool(data["is_published"])

    db.session.commit()
    return jsonify(post.to_dict(full=True))


@blog_bp.delete("/<int:post_id>")
@jwt_required()
def delete_post(post_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    post = BlogPost.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted"})


@blog_bp.post("/<int:post_id>/cover-image")
@jwt_required()
def upload_cover_image(post_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    post = BlogPost.query.get_or_404(post_id)

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    file = request.files["image"]

    try:
        image_url = upload_image(
            file,
            folder="satin-and-seal/blog",
            public_id_prefix=f"blog-{post_id}-{uuid.uuid4().hex[:8]}",
        )
    except UploadError as e:
        return jsonify({"error": str(e)}), 400

    post.cover_image_url = image_url
    db.session.commit()
    return jsonify(post.to_dict(full=True))
