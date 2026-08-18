"""
Minimal email sender for password-reset links.

If SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD are set in .env, sends a real email.
If they're not set (e.g. during local development), it prints the reset link
to the server console instead — so the reset flow is still testable without
setting up a mail provider first.
"""
import os
import smtplib
from email.mime.text import MIMEText


def send_password_reset_email(to_email, reset_link):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL", "no-reply@pleasurepop.co.ke")

    subject = "Reset your Pleasure Pop password"
    body = (
        f"We received a request to reset your password.\n\n"
        f"Click the link below to choose a new one. This link expires in 1 hour.\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )

    if not (smtp_host and smtp_username and smtp_password):
        # No SMTP configured — fall back to console so local testing still works.
        print("=" * 60)
        print(f"[DEV MODE — no SMTP configured] Password reset link for {to_email}:")
        print(reset_link)
        print("=" * 60)
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(from_email, [to_email], msg.as_string())
