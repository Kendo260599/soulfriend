/**
 * Test Email Service
 * Kiểm tra kết nối SMTP và gửi email test
 */

import emailService from '../services/emailService';
import logger from '../utils/logger';

async function testEmailService() {
  console.log('\n🧪 Testing Email Service...\n');

  // 1. Check if email service is configured
  if (!emailService.isReady()) {
    console.error('❌ Email service NOT configured!');
    console.log('\n📝 Add these to your .env file:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-gmail-app-password');
    console.log('\n📖 Gmail App Password Guide: https://myaccount.google.com/apppasswords\n');
    process.exit(1);
  }

  console.log('✅ Email service configured\n');

  // 2. Test SMTP connection
  console.log('🔌 Testing SMTP connection...');
  const connectionOk = await emailService.testConnection();
  
  if (!connectionOk) {
    console.error('❌ SMTP connection failed!');
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check SMTP credentials in .env');
    console.log('2. For Gmail: Enable "Less secure app access" or use App Password');
    console.log('3. Check firewall/network settings');
    console.log('4. Verify SMTP_HOST and SMTP_PORT are correct\n');
    process.exit(1);
  }

  console.log('✅ SMTP connection successful\n');

  // 3. Send test email
  console.log('📧 Sending test email...');
  
  try {
    const testEmailAddress = process.argv[2] || process.env.SMTP_USER;
    
    if (!testEmailAddress) {
      console.error('❌ No recipient email specified!');
      console.log('\n📝 Usage: npm run test:email [recipient@email.com]\n');
      process.exit(1);
    }

    const result = await emailService.send({
      to: testEmailAddress,
      subject: '🧪 SOULFRIEND Test Email - Email Service Working!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 10px 10px;
            }
            .status {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .info {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            code {
              background: #f4f4f4;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Email Service Test Successful!</h1>
            <p>SOULFRIEND V4.0 HITL System</p>
          </div>
          
          <div class="content">
            <div class="status">
              <strong>✅ Status: Email Service Working Correctly</strong>
            </div>
            
            <h2>📋 Test Details</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
            <p><strong>Recipient:</strong> ${testEmailAddress}</p>
            <p><strong>SMTP Server:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>System:</strong> SOULFRIEND V4.0 HITL</p>
            
            <h2>✨ What's Working</h2>
            <ul>
              <li>✅ SMTP connection established</li>
              <li>✅ Email sending functional</li>
              <li>✅ HTML template rendering</li>
              <li>✅ Ready for HITL crisis alerts</li>
            </ul>
            
            <div class="info">
              <strong>📌 Next Steps:</strong><br>
              The email service is now ready to send critical alerts when the HITL system detects crisis situations.
              Crisis team members will receive immediate notifications at the configured alert email addresses.
            </div>
            
            <h2>🚨 Crisis Alert Email Format</h2>
            <p>When a critical situation is detected, clinical team members will receive emails similar to this test email, but with:</p>
            <ul>
              <li>User risk level (CRITICAL, HIGH, MEDIUM, LOW)</li>
              <li>Risk type (suicidal ideation, self-harm, etc.)</li>
              <li>Detected keywords and context</li>
              <li>Timestamp and session information</li>
              <li>Quick action buttons</li>
            </ul>
            
            <h2>⚙️ Configuration</h2>
            <p>Alert emails will be sent to:</p>
            <code>${process.env.ALERT_EMAILS || 'Not configured'}</code>
            
            <p style="margin-top: 20px;">
              <a href="https://soulfriend.com" class="button">View Dashboard</a>
            </p>
          </div>
          
          <div class="footer">
            <p>SOULFRIEND Mental Health Support System</p>
            <p>This is an automated test email. Please do not reply.</p>
            <p>© 2025 SOULFRIEND. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
🎉 Email Service Test Successful!

SOULFRIEND V4.0 HITL System

✅ Status: Email Service Working Correctly

Test Details:
- Time: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
- Recipient: ${testEmailAddress}
- SMTP Server: ${process.env.SMTP_HOST}
- System: SOULFRIEND V4.0 HITL

What's Working:
✅ SMTP connection established
✅ Email sending functional
✅ Ready for HITL crisis alerts

The email service is now ready to send critical alerts when the HITL system detects crisis situations.

Alert emails will be sent to: ${process.env.ALERT_EMAILS || 'Not configured'}

---
SOULFRIEND Mental Health Support System
This is an automated test email. Please do not reply.
      `
    });

    console.log('✅ Test email sent successfully!\n');
    console.log('📬 Check inbox:', testEmailAddress);
    console.log('📧 Check spam folder if not in inbox\n');
    console.log('🎉 Email service is READY for HITL alerts!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

// Run test
testEmailService().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

