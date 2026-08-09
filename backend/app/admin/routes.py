from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from ..extensions import db, bcrypt
from ..models import Product, Category, Order, User, Notification, Review, PaymentSettings, DeliverySettings
from ..payments.sasapay import get_access_token, SasaPayError
from datetime import datetime

admin_bp = Blueprint("admin", __name__)

VALID_STATUSES = ["confirmed", "packed", "out_for_delivery", "delivered", "delivery_failed"]


def _require_admin():
    user = User.query.get(int(get_jwt_identity()))
    return user and user.is_admin


# --- Stats ---

@admin_bp.get("/stats")
@jwt_required()
def stats():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    total_products = Product.query.count()
    visible_products = Product.query.filter(Product.quantity > 0).count()
    low_stock = Product.query.filter(Product.quantity > 0, Product.quantity < 5).count()
    out_of_stock = Product.query.filter(Product.quantity <= 0).count()

    all_orders = Order.query.all()
    total_orders = len(all_orders)
    total_income = sum(float(o.total) for o in all_orders)
    total_customers = User.query.filter_by(is_admin=False).count()

    # Category breakdown
    categories = Category.query.all()
    category_breakdown = [
        {"name": c.name, "product_count": Product.query.filter_by(category_id=c.id).count()}
        for c in categories
    ]

    # Payment method breakdown
    payment_rows = (
        db.session.query(Order.payment_method, func.count(Order.id), func.sum(Order.total))
        .group_by(Order.payment_method)
        .all()
    )
    payment_breakdown = [
        {"method": method, "count": count, "total": float(total or 0)}
        for method, count, total in payment_rows
    ]

    # Delivery zone breakdown
    delivery_rows = (
        db.session.query(Order.delivery_location, func.count(Order.id))
        .group_by(Order.delivery_location)
        .all()
    )
    delivery_breakdown = [{"location": loc, "count": count} for loc, count in delivery_rows]

    pending_reviews = Review.query.filter_by(status="pending").count()

    return jsonify({
        "total_products": total_products,
        "visible_products": visible_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "total_orders": total_orders,
        "total_income": total_income,
        "total_customers": total_customers,
        "category_breakdown": category_breakdown,
        "payment_breakdown": payment_breakdown,
        "delivery_breakdown": delivery_breakdown,
        "pending_reviews": pending_reviews,
        "riders_active": User.query.filter_by(is_rider=True).count(),
    })


# --- Orders ---

@admin_bp.get("/orders")
@jwt_required()
def all_orders():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@admin_bp.put("/orders/<int:order_id>/status")
@jwt_required()
def update_order_status(order_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    status = data.get("status")
    if status not in VALID_STATUSES:
        return jsonify({"error": f"Status must be one of {VALID_STATUSES}"}), 400

    order = Order.query.get_or_404(order_id)
    order.status = status
    db.session.commit()

    if status == "delivered":
        db.session.add(Notification(
            type="delivery_completed",
            message=f"Order #{order.id} was marked as delivered.",
            order_id=order.id,
        ))
        db.session.commit()

    return jsonify(order.to_dict())


# --- Notifications ---

@admin_bp.get("/notifications")
@jwt_required()
def list_notifications():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = Notification.query.filter_by(is_read=False).count()
    return jsonify({
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count,
    })


@admin_bp.put("/notifications/<int:notification_id>/read")
@jwt_required()
def mark_notification_read(notification_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    notification = Notification.query.get_or_404(notification_id)
    notification.is_read = True
    db.session.commit()
    return jsonify(notification.to_dict())


@admin_bp.put("/notifications/read-all")
@jwt_required()
def mark_all_notifications_read():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    Notification.query.filter_by(is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"})


# --- Review moderation ---

@admin_bp.get("/reviews")
@jwt_required()
def list_all_reviews():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    status_filter = request.args.get("status", "pending")
    query = Review.query
    if status_filter != "all":
        query = query.filter_by(status=status_filter)
    reviews = query.order_by(Review.created_at.desc()).all()
    return jsonify([
        {**r.to_dict(), "product_name": r.product.name if r.product else "Unknown product"}
        for r in reviews
    ])


@admin_bp.put("/reviews/<int:review_id>")
@jwt_required()
def moderate_review(review_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    status = data.get("status")
    if status not in ["approved", "rejected"]:
        return jsonify({"error": "Status must be 'approved' or 'rejected'"}), 400

    review = Review.query.get_or_404(review_id)
    review.status = status
    db.session.commit()
    return jsonify(review.to_dict())


# --- Payment settings (SasaPay) ---

@admin_bp.get("/settings/sasapay")
@jwt_required()
def get_sasapay_settings():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    settings = PaymentSettings.get()
    return jsonify(settings.to_dict())


@admin_bp.put("/settings/sasapay")
@jwt_required()
def update_sasapay_settings():
    """Saving these credentials tests them against SasaPay's auth endpoint
    first. If the test fails, nothing is saved and the admin sees why —
    this is the 'wires up on submission' behavior."""
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    client_id = data.get("sasapay_client_id", "").strip()
    client_secret = data.get("sasapay_client_secret", "").strip()
    merchant_code = data.get("sasapay_merchant_code", "").strip()
    network_code = data.get("sasapay_network_code", "63902").strip() or "63902"
    is_enabled = bool(data.get("is_enabled", False))

    settings = PaymentSettings.get()

    # If the secret field arrives masked (unchanged from a previous save),
    # keep the existing stored secret instead of overwriting it with dots.
    if client_secret.startswith("••••"):
        client_secret = settings.sasapay_client_secret

    if is_enabled:
        if not (client_id and client_secret and merchant_code):
            return jsonify({"error": "Client ID, Client Secret, and Merchant Code are all required to enable SasaPay"}), 400
        try:
            get_access_token(client_id, client_secret)
        except SasaPayError as e:
            return jsonify({"error": f"Connection test failed — settings were not saved. {e}"}), 400
        settings.last_verified_at = datetime.utcnow()

    settings.sasapay_client_id = client_id
    settings.sasapay_client_secret = client_secret
    settings.sasapay_merchant_code = merchant_code
    settings.sasapay_network_code = network_code
    settings.is_enabled = is_enabled
    db.session.commit()

    message = "Connected — SasaPay is verified and enabled." if is_enabled else "Settings saved. SasaPay is currently disabled."
    return jsonify({"message": message, "settings": settings.to_dict()})


# --- Riders ---

@admin_bp.get("/riders")
@jwt_required()
def list_riders():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    riders = User.query.filter_by(is_rider=True).order_by(User.name).all()
    result = []
    for r in riders:
        active_count = Order.query.filter(
            Order.assigned_rider_id == r.id,
            Order.status.in_(["packed", "out_for_delivery"])
        ).count()
        result.append({**r.to_dict(), "active_deliveries": active_count})
    return jsonify(result)


@admin_bp.post("/riders")
@jwt_required()
def create_rider():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    rider = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        is_rider=True,
        age_confirmed=True,
    )
    db.session.add(rider)
    db.session.commit()
    return jsonify(rider.to_dict()), 201


@admin_bp.delete("/riders/<int:rider_id>")
@jwt_required()
def delete_rider(rider_id):
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    rider = User.query.filter_by(id=rider_id, is_rider=True).first_or_404()
    # Unassign any orders currently sitting with this rider rather than
    # cascading a delete into order history.
    Order.query.filter_by(assigned_rider_id=rider.id).update({"assigned_rider_id": None})
    db.session.delete(rider)
    db.session.commit()
    return jsonify({"message": "Rider removed"})


# --- Delivery rate settings ---

@admin_bp.get("/settings/delivery")
@jwt_required()
def get_delivery_settings():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403
    return jsonify(DeliverySettings.get().to_dict())


@admin_bp.put("/settings/delivery")
@jwt_required()
def update_delivery_settings():
    if not _require_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    try:
        nairobi_fee = float(data.get("nairobi_fee"))
        outside_fee = float(data.get("outside_fee"))
    except (TypeError, ValueError):
        return jsonify({"error": "Both fees must be numbers"}), 400

    if nairobi_fee < 0 or outside_fee < 0:
        return jsonify({"error": "Fees can't be negative"}), 400

    settings = DeliverySettings.get()
    settings.nairobi_fee = nairobi_fee
    settings.outside_fee = outside_fee
    db.session.commit()
    return jsonify({"message": "Delivery rates updated.", "settings": settings.to_dict()})
