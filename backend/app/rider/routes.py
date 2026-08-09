from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Order, User, Notification

rider_bp = Blueprint("rider", __name__)

RIDER_SETTABLE_STATUSES = ["out_for_delivery", "delivered", "delivery_failed"]


def _current_rider():
    user = User.query.get(int(get_jwt_identity()))
    return user if user and user.is_rider else None


@rider_bp.get("/orders")
@jwt_required()
def my_deliveries():
    rider = _current_rider()
    if not rider:
        return jsonify({"error": "Rider access required"}), 403

    orders = Order.query.filter_by(assigned_rider_id=rider.id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict_for_rider() for o in orders])


@rider_bp.put("/orders/<int:order_id>/status")
@jwt_required()
def update_delivery_status(order_id):
    rider = _current_rider()
    if not rider:
        return jsonify({"error": "Rider access required"}), 403

    order = Order.query.filter_by(id=order_id, assigned_rider_id=rider.id).first()
    if not order:
        return jsonify({"error": "Order not found or not assigned to you"}), 404

    data = request.get_json() or {}
    status = data.get("status")
    if status not in RIDER_SETTABLE_STATUSES:
        return jsonify({"error": f"Status must be one of {RIDER_SETTABLE_STATUSES}"}), 400

    order.status = status
    db.session.commit()

    if status == "delivered":
        db.session.add(Notification(
            type="delivery_completed",
            message=f"Order #{order.id} was marked as delivered by {rider.name}.",
            order_id=order.id,
        ))
        db.session.commit()
    elif status == "delivery_failed":
        db.session.add(Notification(
            type="delivery_completed",
            message=f"Delivery failed for order #{order.id} — {rider.name} could not reach the customer.",
            order_id=order.id,
        ))
        db.session.commit()

    return jsonify(order.to_dict_for_rider())
