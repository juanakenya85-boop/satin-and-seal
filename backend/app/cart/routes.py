from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import CartItem, Product

cart_bp = Blueprint("cart", __name__)


@cart_bp.get("")
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    items = CartItem.query.filter_by(user_id=user_id).all()
    subtotal = sum(i.product.price * i.quantity for i in items)
    return jsonify({
        "items": [i.to_dict() for i in items],
        "subtotal": float(subtotal),
    })


@cart_bp.post("")
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    product = Product.query.get_or_404(product_id)
    if product.quantity < quantity:
        return jsonify({"error": "Not enough stock available"}), 400

    existing = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        existing.quantity += quantity
    else:
        existing = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(existing)

    db.session.commit()
    return jsonify(existing.to_dict()), 201


@cart_bp.put("/<int:item_id>")
@jwt_required()
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    data = request.get_json() or {}
    quantity = int(data.get("quantity", item.quantity))

    if quantity <= 0:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item removed"})

    if item.product.quantity < quantity:
        return jsonify({"error": "Not enough stock available"}), 400

    item.quantity = quantity
    db.session.commit()
    return jsonify(item.to_dict())


@cart_bp.delete("/<int:item_id>")
@jwt_required()
def remove_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item removed"})
