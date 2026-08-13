from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import cloudinary.uploader

from ..extensions import db
from ..models import (
    Product,
    Category,
    User,
    Review,
    WishlistItem,
)

products_bp = Blueprint("products", __name__)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def slugify(text):
    return text.strip().lower().replace(" ", "-").replace("&", "and")


def _require_admin():
    user = User.query.get(int(get_jwt_identity()))
    return user and user.is_admin


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

@products_bp.get("")
def list_products():
    """Public product listing.

    Only shows products with quantity > 0.

    Supports:
    ?category=slug
    ?search=term
    ?sort=price_asc|price_desc|newest
    ?featured=top_selling|new
    ?limit=number
    """
    query = Product.query.filter(Product.quantity > 0)

    category = request.args.get("category")
    if category and category != "all":
        query = query.join(Category).filter(Category.slug == category)

    search = request.args.get("search")
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    featured = request.args.get("featured")

    if featured == "top_selling":
        query = query.order_by(Product.units_sold.desc())

    elif featured == "new":
        query = (
            query
            .filter(Product.is_new.is_(True))
            .order_by(Product.created_at.desc())
        )

    sort = request.args.get("sort")

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())

    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())

    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())

    limit = request.args.get("limit", type=int)

    if limit:
        query = query.limit(limit)

    return jsonify([
        product.to_dict()
        for product in query.all()
    ])


@products_bp.get("/<int:product_id>")
def get_product(product_id):
    product = Product.query.get_or_404(product_id)

    return jsonify(product.to_dict())


@products_bp.get("/categories")
def list_categories():
    return jsonify([
        category.to_dict()
        for category in Category.query.all()
    ])


@products_bp.post("")
@jwt_required()
def create_product():
    if not _require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    data = request.get_json() or {}

    name = data.get("name", "").strip()

    if not name:
        return jsonify({
            "error": "Product name is required"
        }), 400

    product = Product(
        name=name,
        slug=slugify(name),
        description=data.get("description", ""),
        category_id=data.get("category_id"),
        price=data.get("price", 0),
        quantity=data.get("quantity", 0),
        image_url=data.get("image_url"),
        is_new=bool(data.get("is_new", False)),
    )

    db.session.add(product)
    db.session.commit()

    return jsonify(product.to_dict()), 201


@products_bp.put("/<int:product_id>")
@jwt_required()
def update_product(product_id):
    if not _require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    product = Product.query.get_or_404(product_id)

    data = request.get_json() or {}

    editable_fields = [
        "name",
        "description",
        "category_id",
        "price",
        "quantity",
        "image_url",
        "is_new",
        "is_bestseller",
    ]

    for field in editable_fields:
        if field in data:
            setattr(product, field, data[field])

    if "name" in data:
        product.slug = slugify(data["name"])

    db.session.commit()

    return jsonify(product.to_dict())


@products_bp.delete("/<int:product_id>")
@jwt_required()
def delete_product(product_id):
    if not _require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    product = Product.query.get_or_404(product_id)

    db.session.delete(product)
    db.session.commit()

    return jsonify({
        "message": "Product deleted"
    })


# ---------------------------------------------------------------------------
# Product Images - Cloudinary
# ---------------------------------------------------------------------------

@products_bp.post("/<int:product_id>/image")
@jwt_required()
def upload_product_image(product_id):
    if not _require_admin():
        return jsonify({
            "error": "Admin access required"
        }), 403

    product = Product.query.get_or_404(product_id)

    if "image" not in request.files:
        return jsonify({
            "error": "No image file provided"
        }), 400

    file = request.files["image"]

    if not file or file.filename == "":
        return jsonify({
            "error": "No image file selected"
        }), 400

    extension = (
        file.filename.rsplit(".", 1)[-1].lower()
        if "." in file.filename
        else ""
    )

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({
            "error": "Image must be png, jpg, jpeg, or webp"
        }), 400

    try:
        result = cloudinary.uploader.upload(
            file,
            folder="satin-and-seal/products",
            resource_type="image",
        )

        image_url = result.get("secure_url")

        if not image_url:
            return jsonify({
                "error": "Cloudinary did not return an image URL"
            }), 500

        product.image_url = image_url

        db.session.commit()

        return jsonify(product.to_dict()), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Image upload failed. Please try again."
        }), 500


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@products_bp.get("/<int:product_id>/reviews")
def list_reviews(product_id):
    """Public: only approved reviews are visible."""

    reviews = (
        Review.query
        .filter_by(
            product_id=product_id,
            status="approved"
        )
        .order_by(Review.created_at.desc())
        .all()
    )

    return jsonify([
        review.to_dict()
        for review in reviews
    ])


@products_bp.post("/<int:product_id>/reviews")
@jwt_required()
def submit_review(product_id):
    Product.query.get_or_404(product_id)

    user_id = int(get_jwt_identity())

    data = request.get_json() or {}

    rating = data.get("rating")

    if not rating:
        return jsonify({
            "error": "Rating must be between 1 and 5"
        }), 400

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Rating must be between 1 and 5"
        }), 400

    if not 1 <= rating <= 5:
        return jsonify({
            "error": "Rating must be between 1 and 5"
        }), 400

    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        comment=data.get("comment", "").strip(),
        status="pending",
    )

    db.session.add(review)
    db.session.commit()

    return jsonify({
        "message": "Thanks — your review is awaiting approval.",
        "review": review.to_dict(),
    }), 201


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------

@products_bp.get("/wishlist")
@jwt_required()
def get_wishlist():
    user_id = int(get_jwt_identity())

    items = (
        WishlistItem.query
        .filter_by(user_id=user_id)
        .order_by(WishlistItem.created_at.desc())
        .all()
    )

    return jsonify([
        item.to_dict()
        for item in items
    ])


@products_bp.post("/<int:product_id>/wishlist")
@jwt_required()
def add_to_wishlist(product_id):
    user_id = int(get_jwt_identity())

    Product.query.get_or_404(product_id)

    existing = WishlistItem.query.filter_by(
        user_id=user_id,
        product_id=product_id,
    ).first()

    if existing:
        return jsonify(existing.to_dict())

    item = WishlistItem(
        user_id=user_id,
        product_id=product_id,
    )

    db.session.add(item)
    db.session.commit()

    return jsonify(item.to_dict()), 201


@products_bp.delete("/<int:product_id>/wishlist")
@jwt_required()
def remove_from_wishlist(product_id):
    user_id = int(get_jwt_identity())

    item = WishlistItem.query.filter_by(
        user_id=user_id,
        product_id=product_id,
    ).first()

    if item:
        db.session.delete(item)
        db.session.commit()

    return jsonify({
        "message": "Removed from wishlist"
    })