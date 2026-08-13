import os
import cloudinary

from flask import Flask
from dotenv import load_dotenv

from .extensions import db, jwt, bcrypt, cors


# Load environment variables from .env locally.
# On Render, these values come from the service Environment Variables.
load_dotenv()


def create_app():
    app = Flask(__name__)

    # -----------------------------------------------------------------------
    # Cloudinary configuration
    # -----------------------------------------------------------------------
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )

    # -----------------------------------------------------------------------
    # Database configuration
    # -----------------------------------------------------------------------
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost:3306/satin_and_seal",
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # -----------------------------------------------------------------------
    # JWT configuration
    # -----------------------------------------------------------------------
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "dev-secret-change-me",
    )

    # -----------------------------------------------------------------------
    # Upload configuration
    #
    # Images are now stored in Cloudinary, not on Render's local filesystem.
    # This limit only controls the maximum size accepted by Flask.
    # -----------------------------------------------------------------------
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB

    # -----------------------------------------------------------------------
    # Initialize extensions
    # -----------------------------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # -----------------------------------------------------------------------
    # CORS configuration
    #
    # Locally:
    #   CORS_ORIGINS=http://localhost:5173
    #
    # Production:
    #   CORS_ORIGINS=https://your-vercel-domain.vercel.app
    #
    # Multiple origins can be separated by commas.
    # -----------------------------------------------------------------------
    allowed_origins = os.getenv("CORS_ORIGINS", "*")

    origins_list = (
        [origin.strip() for origin in allowed_origins.split(",")]
        if allowed_origins != "*"
        else "*"
    )

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": origins_list
            }
        },
    )

    # -----------------------------------------------------------------------
    # Register blueprints
    # -----------------------------------------------------------------------
    from .auth.routes import auth_bp
    from .products.routes import products_bp
    from .cart.routes import cart_bp
    from .orders.routes import orders_bp
    from .admin.routes import admin_bp
    from .blog.routes import blog_bp
    from .rider.routes import rider_bp

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth",
    )

    app.register_blueprint(
        products_bp,
        url_prefix="/api/products",
    )

    app.register_blueprint(
        cart_bp,
        url_prefix="/api/cart",
    )

    app.register_blueprint(
        orders_bp,
        url_prefix="/api/orders",
    )

    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin",
    )

    app.register_blueprint(
        blog_bp,
        url_prefix="/api/blog",
    )

    app.register_blueprint(
        rider_bp,
        url_prefix="/api/rider",
    )

    # -----------------------------------------------------------------------
    # Health check
    # -----------------------------------------------------------------------
    @app.get("/api/health")
    def health():
        try:
            from sqlalchemy import text

            db.session.execute(text("SELECT 1"))

            return {
                "status": "ok",
                "database": "connected",
            }

        except Exception as error:
            return {
                "status": "error",
                "database": "disconnected",
                "message": str(error),
            }, 500

    # -----------------------------------------------------------------------
    # Delivery rates
    # -----------------------------------------------------------------------
    @app.get("/api/delivery-rates")
    def delivery_rates():
        from .models import DeliverySettings

        return DeliverySettings.get().to_dict()

    # -----------------------------------------------------------------------
    # Database initialization
    #
    # This creates missing tables when the application starts.
    # -----------------------------------------------------------------------
    with app.app_context():
        db.create_all()

    return app