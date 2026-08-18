from datetime import datetime
from .extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_rider = db.Column(db.Boolean, default=False)
    age_confirmed = db.Column(db.Boolean, default=False)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    addresses = db.relationship("Address", backref="user", lazy=True)
    orders = db.relationship("Order", backref="user", lazy=True, foreign_keys="Order.user_id")
    cart_items = db.relationship("CartItem", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "is_admin": self.is_admin,
            "is_rider": self.is_rider,
        }


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    slug = db.Column(db.String(80), unique=True, nullable=False)

    products = db.relationship("Product", backref="category", lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "slug": self.slug}


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    slug = db.Column(db.String(160), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, default=0, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    is_new = db.Column(db.Boolean, default=False)
    is_bestseller = db.Column(db.Boolean, default=False)
    units_sold = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reviews = db.relationship("Review", backref="product", lazy=True)

    @property
    def is_visible(self):
        return self.quantity > 0

    @property
    def stock_status(self):
        if self.quantity <= 0:
            return "out_of_stock"
        if self.quantity < 5:
            return "low_stock"
        return "in_stock"

    @property
    def approved_reviews(self):
        return [r for r in self.reviews if r.status == "approved"]

    @property
    def average_rating(self):
        approved = self.approved_reviews
        if not approved:
            return None
        return round(sum(r.rating for r in approved) / len(approved), 1)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "category": self.category.to_dict() if self.category else None,
            "price": float(self.price),
            "quantity": self.quantity,
            "image_url": self.image_url,
            "is_new": self.is_new,
            "is_bestseller": self.is_bestseller,
            "stock_status": self.stock_status,
            "average_rating": self.average_rating,
            "review_count": len(self.approved_reviews),
        }


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    city = db.Column(db.String(80), nullable=False)
    address_line = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.String(255), nullable=True)
    is_default = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "phone": self.phone,
            "city": self.city,
            "address_line": self.address_line,
            "notes": self.notes,
            "is_default": self.is_default,
        }


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)

    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "product": self.product.to_dict(),
            "quantity": self.quantity,
            "line_total": float(self.product.price) * self.quantity,
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # null = guest order
    guest_email = db.Column(db.String(120), nullable=True)  # only set for guest orders
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    city = db.Column(db.String(80), nullable=False)
    address_line = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.String(255), nullable=True)
    delivery_location = db.Column(db.String(20), nullable=False)  # 'nairobi' | 'outside'
    delivery_fee = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)  # mpesa | card | cod
    payment_status = db.Column(db.String(20), default="pending")  # pending | paid | failed | manual
    sasapay_checkout_request_id = db.Column(db.String(120), nullable=True)
    sasapay_merchant_request_id = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(30), default="confirmed")
    # confirmed, packed, out_for_delivery, delivered, delivery_failed
    assigned_rider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assigned_rider = db.relationship("User", foreign_keys=[assigned_rider_id])

    items = db.relationship("OrderItem", backref="order", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "delivery_location": self.delivery_location,
            "delivery_fee": float(self.delivery_fee),
            "subtotal": float(self.subtotal),
            "total": float(self.total),
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "created_at": self.created_at.isoformat(),
            "is_guest": self.user_id is None,
            "guest_email": self.guest_email,
            "items": [i.to_dict() for i in self.items],
            "address": {
                "full_name": self.full_name,
                "phone": self.phone,
                "city": self.city,
                "address_line": self.address_line,
                "notes": self.notes,
            },
            "assigned_rider": {"id": self.assigned_rider.id, "name": self.assigned_rider.name} if self.assigned_rider else None,
        }

    def to_dict_for_rider(self):
        """Deliberately redacted: a rider gets what they need to complete a
        delivery — address, phone, item count, amount to collect if it's
        cash on delivery — and nothing about what's actually in the parcel.
        Discretion applies internally too, not just to the customer."""
        return {
            "id": self.id,
            "status": self.status,
            "delivery_location": self.delivery_location,
            "item_count": sum(i.quantity for i in self.items),
            "payment_method": self.payment_method,
            "amount_to_collect": float(self.total) if self.payment_method == "cod" else None,
            "created_at": self.created_at.isoformat(),
            "address": {
                "full_name": self.full_name,
                "phone": self.phone,
                "city": self.city,
                "address_line": self.address_line,
                "notes": self.notes,
            },
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    product_name = db.Column(db.String(160), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "product_name": self.product_name,
            "unit_price": float(self.unit_price),
            "quantity": self.quantity,
            "line_total": float(self.unit_price) * self.quantity,
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(30), nullable=False)  # order_placed | payment_confirmed | delivery_completed
    message = db.Column(db.String(255), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "message": self.message,
            "order_id": self.order_id,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="pending")  # pending | approved | rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "reviewer_name": self.user.name if self.user else "Anonymous",
            "rating": self.rating,
            "comment": self.comment,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class BlogPost(db.Model):
    __tablename__ = "blog_posts"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    excerpt = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)
    cover_image_url = db.Column(db.String(500), nullable=True)
    author = db.Column(db.String(120), default="Pleasure Pop Team")
    is_published = db.Column(db.Boolean, default=True)
    published_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, full=False):
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "excerpt": self.excerpt,
            "cover_image_url": self.cover_image_url,
            "author": self.author,
            "published_at": self.published_at.isoformat(),
        }
        if full:
            data["content"] = self.content
        return data


class PaymentSettings(db.Model):
    """Singleton row (id always 1) holding SasaPay credentials, set from the
    admin Settings tab rather than environment variables, so the store owner
    can configure payments without touching code or redeploying."""
    __tablename__ = "payment_settings"

    id = db.Column(db.Integer, primary_key=True)
    sasapay_client_id = db.Column(db.String(255), nullable=True)
    sasapay_client_secret = db.Column(db.String(255), nullable=True)
    sasapay_merchant_code = db.Column(db.String(50), nullable=True)
    sasapay_network_code = db.Column(db.String(20), default="63902")  # 63902 = M-Pesa
    is_enabled = db.Column(db.Boolean, default=False)
    last_verified_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, reveal_secret=False):
        return {
            "sasapay_client_id": self.sasapay_client_id,
            "sasapay_client_secret": self.sasapay_client_secret if reveal_secret else _mask(self.sasapay_client_secret),
            "sasapay_merchant_code": self.sasapay_merchant_code,
            "sasapay_network_code": self.sasapay_network_code,
            "is_enabled": self.is_enabled,
            "is_configured": bool(self.sasapay_client_id and self.sasapay_client_secret and self.sasapay_merchant_code),
            "last_verified_at": self.last_verified_at.isoformat() if self.last_verified_at else None,
        }

    @staticmethod
    def get():
        settings = PaymentSettings.query.get(1)
        if not settings:
            settings = PaymentSettings(id=1)
            db.session.add(settings)
            db.session.commit()
        return settings


def _mask(value):
    if not value:
        return None
    if len(value) <= 4:
        return "••••"
    return "••••" + value[-4:]


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"
    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_user_product_wishlist"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "product": self.product.to_dict(),
            "saved_at": self.created_at.isoformat(),
        }


class DeliverySettings(db.Model):
    """Singleton row (id always 1) holding delivery pricing, set from the
    admin Settings tab. Checkout, cart, and marketing copy all read from
    here instead of a hardcoded number."""
    __tablename__ = "delivery_settings"

    id = db.Column(db.Integer, primary_key=True)
    nairobi_fee = db.Column(db.Numeric(10, 2), default=300)
    outside_fee = db.Column(db.Numeric(10, 2), default=700)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "nairobi_fee": float(self.nairobi_fee),
            "outside_fee": float(self.outside_fee),
        }

    @staticmethod
    def get():
        settings = DeliverySettings.query.get(1)
        if not settings:
            settings = DeliverySettings(id=1)
            db.session.add(settings)
            db.session.commit()
        return settings
