import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))

def _send_email(to_email: str, subject: str, html_content: str):
    """Internal helper to send email via SMTP."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning(f"SMTP not configured. Logging email to {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Content: {html_content}")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.APP_NAME} <{settings.SMTP_USER}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))

        if settings.SMTP_SECURE:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

def send_otp_email(email: str, otp_code: str):
    """Send OTP activation email."""
    subject = f"{otp_code} is your {settings.APP_NAME} activation code"
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #570df8;">Activation Code</h2>
                <p>Hello,</p>
                <p>Thank you for registering. Please use the following code to activate your account:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #570df8; border-radius: 8px; margin: 20px 0;">
                    {otp_code}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">&copy; {settings.APP_NAME}. All rights reserved.</p>
            </div>
        </body>
    </html>
    """
    _send_email(email, subject, html)

def send_support_email(user_email: str, user_name: str, message: str):
    """Send support request to admin and auto-reply to user."""
    # 1. Send to Admin
    admin_subject = f"New Support Request from {user_name}"
    admin_html = f"""
    <html>
        <body>
            <h2>New Support Message</h2>
            <p><b>From:</b> {user_name} ({user_email})</p>
            <p><b>Message:</b></p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #570df8;">
                {message}
            </div>
        </body>
    </html>
    """
    _send_email(settings.SUPPORT_EMAIL or settings.SMTP_USER, admin_subject, admin_html)

    # 2. Auto-reply to User
    user_subject = "We received your message - " + settings.APP_NAME
    user_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #570df8;">Terima kasih sudah menghubungi kami!</h2>
                <p>Halo {user_name},</p>
                <p>Kami telah menerima pesan Anda dan tim kami akan segera meninjau permintaan tersebut.</p>
                <p>Pesan Anda:</p>
                <div style="font-style: italic; color: #666; border-left: 2px solid #ddd; padding-left: 15px;">
                    "{message}"
                </div>
                <p>Mohon tunggu kabar selanjutnya dari kami.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">Ini adalah balasan otomatis. Mohon tidak membalas email ini.</p>
            </div>
        </body>
    </html>
    """
    _send_email(user_email, user_subject, user_html)
