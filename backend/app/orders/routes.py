import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import CartItem, Order, OrderItem, Notification, User, Product, PaymentSettings, DeliverySettings
from ..payments.sasapay import request_payment, SasaPayError

orders_bp = Blueprint("orders", __name__)


def _finalize_order(order_line_items, form_data, user_id=None, guest_email=None):
    """Shared by both the logged-in checkout and guest checkout endpoints.

    order_line_items: list of (product, quantity) tuples — already stock-checked.
    form_data: the request JSON with full_name/phone/city/address_line/notes/
               delivery_location/payment_method.
    Returns (order, error_response). error_response is None on success.
    """
    delivery_location = form_data.get("delivery_location", "nairobi")
    if delivery_location not in ("nairobi", "outside"):
        return None, (jsonify({"error": "Invalid delivery location"}), 400)

    rates = DeliverySettings.get()
    delivery_fee = float(rates.nairobi_fee) if delivery_location == "nairobi" else float(rates.outside_fee)
    payment_method = form_data.get("payment_method", "mpesa")

    subtotal = float(sum(product.price * qty for product, qty in order_line_items))
    total = subtotal + delivery_fee

    order = Order(
        user_id=user_id,
        guest_email=guest_email,
        full_name=form_data.get("full_name", ""),
        phone=form_data.get("phone", ""),
        city=form_data.get("city", ""),
        address_line=form_data.get("address_line", ""),
        notes=form_data.get("notes", ""),
        delivery_location=delivery_location,
        delivery_fee=delivery_fee,
        subtotal=subtotal,
        total=total,
        payment_method=payment_method,
        payment_status="pending",
        status="confirmed",
    )
    db.session.add(order)
    db.session.flush()  # get order.id before commit

    for product, qty in order_line_items:
        db.session.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            unit_price=product.price,
            quantity=qty,
        ))
        # Decrement stock — item auto-hides from shop once it hits 0
        product.quantity -= qty
        product.units_sold = (product.units_sold or 0) + qty

    db.session.commit()

    if user_id:
        customer = User.query.get(user_id)
        customer_label = customer.name if customer else "a customer"
    else:
        customer_label = f"a guest ({guest_email})" if guest_email else "a guest"

    db.session.add(Notification(
        type="order_placed",
        message=f"New order #{order.id} placed by {customer_label} — KSh {total:,.0f}",
        order_id=order.id,
    ))
    db.session.commit()

    payment_note = None
    if payment_method == "mpesa":
        settings = PaymentSettings.get()
        if settings.is_enabled and settings.sasapay_client_id and settings.sasapay_client_secret and settings.sasapay_merchant_code:
            try:
                base_url = os.getenv("APP_BASE_URL", "http://localhost:5000")
                callback_url = f"{base_url}/api/orders/sasapay-callback"
                result = request_payment(
                    settings,
                    phone_number=order.phone,
                    amount=total,
                    account_reference=f"Order{order.id}",
                    callback_url=callback_url,
                    description=f"Pleasure Pop order #{order.id}",
                )
                order.sasapay_checkout_request_id = result.get("CheckoutRequestID")
                order.sasapay_merchant_request_id = result.get("MerchantRequestID")
                db.session.commit()
                payment_note = "A payment prompt has been sent to your phone. Complete it to confirm your order."
            except SasaPayError as e:
                order.payment_status = "manual"
                db.session.commit()
                payment_note = f"We couldn't reach the payment provider automatically ({e}). Your order is saved — we'll follow up on payment directly."
        else:
            order.payment_status = "manual"
            db.session.commit()
            payment_note = "Automatic M-Pesa payment isn't set up yet. Your order is saved — we'll contact you to arrange payment."

    return order, payment_note


@orders_bp.post("/checkout")
@jwt_required()
def checkout():
    """Checkout for a logged-in customer — pulls items from their server-side cart."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({"error": "Your cart is empty"}), 400

    for item in cart_items:
        if item.product.quantity < item.quantity:
            return jsonify({"error": f"'{item.product.name}' no longer has enough stock"}), 400

    line_items = [(item.product, item.quantity) for item in cart_items]

    order, payment_note_or_error = _finalize_order(line_items, data, user_id=user_id)
    if order is None:
        return payment_note_or_error  # this is actually (jsonify(...), status) on validation failure

    for item in cart_items:
        db.session.delete(item)
    db.session.commit()

    response = order.to_dict()
    if payment_note_or_error:
        response["payment_note"] = payment_note_or_error
    return jsonify(response), 201


@orders_bp.post("/guest-checkout")
def guest_checkout():
    """Checkout without an account. Items are sent directly in the request
    body rather than read from a server-side cart, since a guest has no
    server-side cart to begin with — the frontend keeps their cart in
    localStorage until this moment."""
    data = request.get_json() or {}

    items_payload = data.get("items", [])
    if not items_payload:
        return jsonify({"error": "Your cart is empty"}), 400

    email = data.get("email", "").strip()
    if not email:
        return jsonify({"error": "Email is required so we can send your order confirmation"}), 400

    line_items = []
    for entry in items_payload:
        product = Product.query.get(entry.get("product_id"))
        qty = int(entry.get("quantity", 0))
        if not product or qty <= 0:
            continue
        if product.quantity < qty:
            return jsonify({"error": f"'{product.name}' no longer has enough stock"}), 400
        line_items.append((product, qty))

    if not line_items:
        return jsonify({"error": "Your cart is empty"}), 400

    order, payment_note_or_error = _finalize_order(line_items, data, user_id=None, guest_email=email)
    if order is None:
        return payment_note_or_error

    response = order.to_dict()
    if payment_note_or_error:
        response["payment_note"] = payment_note_or_error
    return jsonify(response), 201


@orders_bp.get("")
@jwt_required()
def list_orders():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@orders_bp.get("/<int:order_id>")
@jwt_required()
def get_order(order_id):
    user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, user_id=user_id).first_or_404()
    return jsonify(order.to_dict())


@orders_bp.get("/guest/<int:order_id>")
def get_guest_order(order_id):
    """Public lookup for a guest's own order confirmation page right after
    checkout. Deliberately requires the email used at checkout as a basic
    check — not real auth, but enough to stop someone guessing sequential
    order IDs and seeing a stranger's address."""
    email = request.args.get("email", "").strip().lower()
    order = Order.query.filter_by(id=order_id, user_id=None).first_or_404()
    if not order.guest_email or order.guest_email.lower() != email:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order.to_dict())


@orders_bp.post("/sasapay-callback")
def sasapay_callback():
    """SasaPay hits this URL directly (not through the frontend) once a
    payment request is resolved. No auth — SasaPay can't send a JWT — so
    this endpoint only trusts data it can match against an existing order.

    NOTE: the exact shape of SasaPay's callback payload should be confirmed
    against what actually arrives in your sandbox logs (this handler logs
    the full body either way) and adjusted here if field names differ.
    """
    data = request.get_json(silent=True) or {}
    current_app.logger.info(f"SasaPay callback received: {data}")

    checkout_request_id = (
        data.get("CheckoutRequestID") or data.get("checkoutRequestId") or data.get("CheckoutRequestId")
    )
    if not checkout_request_id:
        return jsonify({"error": "No CheckoutRequestID in callback payload"}), 400

    order = Order.query.filter_by(sasapay_checkout_request_id=checkout_request_id).first()
    if not order:
        return jsonify({"error": "No matching order found"}), 404

    result_code = str(data.get("ResultCode", data.get("resultCode", "")))
    success = data.get("status") is True or result_code == "0"

    order.payment_status = "paid" if success else "failed"
    db.session.commit()

    if success:
        db.session.add(Notification(
            type="payment_confirmed",
            message=f"Payment confirmed for order #{order.id} — KSh {float(order.total):,.0f}",
            order_id=order.id,
        ))
        db.session.commit()

    return jsonify({"message": "Callback processed"})


@orders_bp.put("/<int:order_id>/assign-rider")
@jwt_required()
def assign_rider(order_id):
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or not admin.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}
    rider_id = data.get("rider_id")

    order = Order.query.get_or_404(order_id)

    if rider_id is None:
        order.assigned_rider_id = None
        db.session.commit()
        return jsonify(order.to_dict())

    rider = User.query.get(rider_id)
    if not rider or not rider.is_rider:
        return jsonify({"error": "That user is not a rider"}), 400

    order.assigned_rider_id = rider.id
    db.session.commit()
    return jsonify(order.to_dict())
