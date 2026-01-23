import { OTP } from '../interfaces/otp.interface';

export const generateOTPEmailTemplate = (
    otp_code: string,
    type: OTP['type'] = 'registration',
    recipient_name: string = 'User'
): string => {
    const purposeMap = {
        registration: {
            title: 'Complete Your Registration',
            description: 'Welcome to KLAR CRM! Use this code to complete your registration.',
            buttonText: 'Complete Registration'
        },
        password_reset: {
            title: 'Reset Your Password',
            description: 'We received a request to reset your password. Use this code to set a new password.',
            buttonText: 'Reset Password'
        },
        login: {
            title: 'Complete Your Login',
            description: 'Use this verification code to securely log into your KLAR CRM account.',
            buttonText: 'Verify Login'
        },
        email_verification: {
            title: 'Verify Your Email',
            description: 'Please verify your email address to activate your KLAR CRM account.',
            buttonText: 'Verify Email'
        }
    };

    const purpose = purposeMap[type] || purposeMap.registration;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${purpose.title} | KLAR CRM</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
        }
        
        .logo-text {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 24px;
        }
        
        .code-container {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        
        .code-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .otp-code {
            font-size: 48px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .instructions {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 30px 0;
        }
        
        .instructions h3 {
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .instructions ul {
            list-style: none;
            padding-left: 0;
        }
        
        .instructions li {
            padding: 8px 0;
            position: relative;
            padding-left: 24px;
        }
        
        .instructions li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .social-icon {
            color: #6b7280;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .social-icon:hover {
            color: #667eea;
        }
        
        .expiry-note {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
            color: #92400e;
        }
        
        .highlight {
            background: linear-gradient(120deg, #a5b4fc 0%, #d8b4fe 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
        }
        
        @media (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            
            .otp-code {
                font-size: 32px;
                letter-spacing: 4px;
                padding: 15px;
            }
            
            .header {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <div class="logo-icon">K</div>
                <div class="logo-text">KLAR CRM</div>
            </div>
            <h1 style="font-size: 24px; margin-top: 10px;">${purpose.title}</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="greeting">Hello <span class="highlight">${recipient_name}</span>,</p>
            
            <p>${purpose.description}</p>
            
            <div class="code-container">
                <div class="code-label">Your Verification Code</div>
                <div class="otp-code">${otp_code}</div>
                <div style="color: #6b7280; font-size: 14px;">Enter this code in the verification page</div>
            </div>
            
            <div style="text-align: center;">
                <a href="#" class="cta-button">${purpose.buttonText}</a>
            </div>
            
            <div class="expiry-note">
                ⏰ This code will expire in <strong>10 minutes</strong>. Please use it before it expires.
            </div>
            
            <div class="instructions">
                <h3>Need Help?</h3>
                <ul>
                    <li>Enter the code exactly as shown (case-sensitive)</li>
                    <li>Do not share this code with anyone</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>For assistance, contact support@klarcrm.com</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div style="margin-bottom: 20px;">
                <strong>KLAR CRM</strong><br>
                Streamlining Travel Business Operations
            </div>
            
            <div class="social-links">
                <a href="#" class="social-icon">Website</a>
                <a href="#" class="social-icon">Twitter</a>
                <a href="#" class="social-icon">LinkedIn</a>
                <a href="#" class="social-icon">Support</a>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} KLAR CRM. All rights reserved.<br>
                123 Business Street, Suite 456, Business City, BC 10001
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

export const getOTPEmailSubject = (type: OTP['type']): string => {
    const subjectMap = {
        registration: 'Your Registration Verification Code',
        password_reset: 'Password Reset Verification Code',
        login: 'Your Login Verification Code',
        email_verification: 'Email Verification Code'
    };

    return subjectMap[type] || 'Your Verification Code';
};
