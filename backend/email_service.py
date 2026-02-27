
import os
import requests
import logging
import json
from typing import List, Optional, Dict, Any

# Configure logger
logger = logging.getLogger("EmailService")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('[%(name)s] %(message)s'))
logger.addHandler(handler)

class BrevoEmailService:
    def __init__(self):
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.api_key = os.getenv("BREVO_API_KEY")
        self.sender_email = os.getenv("BREVO_FROM_EMAIL", "mohit@entrext.in")
        self.sender_name = os.getenv("BREVO_FROM_NAME", "SkillVibe")
        
        if not self.api_key:
            logger.warning("BREVO_API_KEY not found. Email service disabled.")
        elif self.api_key.startswith("xsmtpsib"):
            logger.warning("BREVO_API_KEY starts with 'xsmtpsib'. This looks like an SMTP key. The API requires an 'xkeysib' key. Emails might fail.")
        else:
            logger.info("Brevo service initialized successfully")

    def send_verification_email(self, to_email: str, username: str, verification_token: str) -> bool:
        """Send account verification email"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verify_url = f"{frontend_url}/verify-email?token={verification_token}"
        
        subject = "Confirm your SkillVibe account"
        
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        
        logo_url = "https://skillvibe.entrext.com/logo.png"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm your BuildInPublic account</title> 
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <div style="background-color: #111827; padding: 40px 20px; text-align: center;">
                    <img src="{logo_url}" alt="BuildInPublic" style="width: 64px; height: 64px; margin-bottom: 16px; border-radius: 12px; background-color: #1f2937; padding: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">SkillVibe</h1>
                </div>

                <!-- Content -->
                <div style="padding: 40px 32px;">
                    <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Hi {username},</h2>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
                        Thanks for joining SkillVibe! We're excited to help you verify your skills and build your elite reputation.
                    </p>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">
                        To secure your account and access all features, please verify your email address.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{verify_url}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 13px; color: #4f46e5; word-break: break-all; font-family: monospace; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                        {verify_url}
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                        &copy; 2026 SkillVibe. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)

    def send_password_reset_email(self, to_email: str, username: str, reset_token: str) -> bool:
        """Send password reset email"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        subject = "Reset your SkillVibe password"
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        logo_url = "https://skillvibe.entrext.com/logo.png"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your BuildInPublic password</title> 
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <div style="background-color: #111827; padding: 40px 20px; text-align: center;">
                    <img src="{logo_url}" alt="BuildInPublic" style="width: 64px; height: 64px; margin-bottom: 16px; border-radius: 12px; background-color: #1f2937; padding: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">SkillVibe</h1>
                </div>

                <!-- Content -->
                <div style="padding: 40px 32px;">
                    <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Hi {username},</h2>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
                        We received a request to reset your password. No worries, we've got you covered!
                    </p>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">
                        Click the button below to choose a new password. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{reset_url}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 13px; color: #4f46e5; word-break: break-all; font-family: monospace; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                        {reset_url}
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                        This link will expire in 1 hour.
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                        &copy; 2026 SkillVibe. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)

    def send_recruiter_contact_email(self, to_email: str, candidate_name: str, recruiter_name: str, recruiter_email: str, subject: str, message: str) -> bool:
        """Send a recruiter contact message to a candidate"""

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Opportunity from SkillVibe</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

                <!-- Header -->
                <div style="background-color: #111827; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">SkillVibe</h1>
                    <p style="color: #06b6d4; margin: 8px 0 0 0; font-size: 14px;">Someone reached out to you</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 32px;">
                    <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Hi {candidate_name},</h2>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
                        <strong>{recruiter_name}</strong> from your SkillVibe network has an exciting opportunity for you!
                    </p>

                    <!-- Subject -->
                    <div style="background-color: #f3f4f6; padding: 16px; border-left: 4px solid #06b6d4; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Subject</p>
                        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600; color: #111827;">{subject}</p>
                    </div>

                    <!-- Message -->
                    <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
                        <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563; white-space: pre-wrap; line-height: 1.8;">{message}</p>
                    </div>

                    <!-- Contact Info -->
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 600;">Contact Information</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">
                            Email: <a href="mailto:{recruiter_email}" style="color: #06b6d4; text-decoration: none;">{recruiter_email}</a>
                        </p>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                        This message was sent through SkillVibe. Reply directly to the email address above to connect with them.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                        &copy; 2026 SkillVibe. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return self.send_email(to_email, f"[SkillVibe] {subject}", html_content)

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using the Brevo (Sendinblue) API via HTTP.
        Equivalent to the Node.js sendMail function.
        """
        logger.info(f"sendMail called for: {to_email}")

        if not self.api_key:
            logger.error("Brevo not initialized (No API Key). Cannot send email.")
            return False

        headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
        
        payload = {
            "sender": {
                "name": self.sender_name,
                "email": self.sender_email
            },
            "to": [
                {
                    "email": to_email
                }
            ],
            "subject": subject,
            "htmlContent": html_content
        }
        
        if text_content:
            payload["textContent"] = text_content

        try:
            logger.info(f"Sending email via Brevo API to {to_email}...")
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code in [200, 201]:
                data = response.json()
                message_id = data.get("messageId", "unknown")
                logger.info(f"Email sent successfully via Brevo. Message ID: {message_id}")
                return True
            else:
                logger.error(f"Brevo Error while sending to {to_email}: Status {response.status_code}")
                logger.error(f"Brevo Error details: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Brevo Error while sending to {to_email}: {str(e)}")
            return False

# Singleton instance
email_service = BrevoEmailService()
