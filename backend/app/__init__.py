import os
from flask import Flask, send_from_directory
from dotenv import load_dotenv
from .extensions import db, jwt, bcrypt, cors

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/satin_and_seal"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")

    upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB max upload

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    allowed_origins = os.getenv("CORS_ORIGINS", "*")
    origins_list = [o.strip() for o in allowed_origins.split(",")] if allowed_origins != "*" else "*"
    cors.init_app(app, resources={r"/api/*": {"origins": origins_list}})

    from .auth.routes import auth_bp
    from .products.routes import products_bp
    from .cart.routes import cart_bp
    from .orders.routes import orders_bp
    from .admin.routes import admin_bp
    from .blog.routes import blog_bp
    from .rider.routes import rider_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(blog_bp, url_prefix="/api/blog")
    app.register_blueprint(rider_bp, url_prefix="/api/rider")

    @app.get("/api/health")
    def health():
        try:
            from sqlalchemy import text
            db.session.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as e:
            return {"status": "error", "database": "disconnected", "message": str(e)}, 500

    @app.get("/api/delivery-rates")
    def delivery_rates():
        from .models import DeliverySettings
        return DeliverySettings.get().to_dict()

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    with app.app_context():
        db.create_all()

    return app
