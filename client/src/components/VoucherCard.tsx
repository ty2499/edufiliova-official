import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Ticket, Gift } from 'lucide-react';

interface VoucherCardProps {
  code: string;
  amount: number;
  description?: string;
  recipientName?: string;
  expiresAt?: string;
  className?: string;
  showBack?: boolean;
}

export function VoucherCard({
  code,
  amount,
  description = "Gift Voucher",
  recipientName,
  expiresAt,
  className,
  showBack = false
}: VoucherCardProps) {
  const formattedAmount = amount.toFixed(2);
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;

  if (showBack) {
    return (
      <Card className={cn(
        "relative w-full max-w-md aspect-[1.6/1] overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-2xl",
        className
      )}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        
        <div className="relative h-full flex flex-col justify-between p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Gift className="w-12 h-12 text-lime-300" />
            </div>
            <h2 className="text-2xl font-bold text-lime-300 mb-2">{description}</h2>
          </div>

          <div className="space-y-3 text-sm bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div>
              <p className="text-white/70 text-xs mb-1">How to Use:</p>
              <p className="text-white text-xs leading-relaxed">
                Enter this code at checkout to redeem your ${formattedAmount} credit. 
                Valid for any purchase on our platform.
              </p>
            </div>
            
            <div>
              <p className="text-white/70 text-xs mb-1">Terms & Conditions:</p>
              <ul className="text-white text-xs space-y-1 leading-relaxed">
                <li>• One-time use only per customer</li>
                <li>• Cannot be combined with other offers</li>
                <li>• Non-transferable and non-refundable</li>
                {expiryDate && <li>• Valid until {expiryDate}</li>}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-3">
            <div className="flex items-center justify-center gap-2 text-xs text-white/60">
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-2 h-2 border border-white/40 transform rotate-45" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative w-full max-w-md aspect-[1.6/1] overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-2xl border-2 border-orange-500",
      className
    )}>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-br from-orange-500 to-orange-600" 
             style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }} 
        />
      </div>
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      
      <div className="relative h-full flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {description}
              </h3>
            </div>
            {recipientName && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                For: <span className="font-medium">{recipientName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="mb-4">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold text-orange-600 dark:text-orange-500">
                  ${formattedAmount.split('.')[0]}
                </span>
                {formattedAmount.split('.')[1] && (
                  <span className="text-2xl font-semibold text-orange-600 dark:text-orange-500">
                    .{formattedAmount.split('.')[1]}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Voucher Value
              </p>
            </div>

            <div className="bg-gray-900 dark:bg-white rounded-lg px-3 py-2 inline-block">
              <p className="text-xs text-gray-400 dark:text-gray-600 mb-1 font-mono">CODE</p>
              <p className="text-lg font-bold text-lime-400 dark:text-lime-600 font-mono tracking-wider">
                {code}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full border-4 border-orange-500 shadow-lg">
            <Gift className="w-12 h-12 text-orange-600 dark:text-orange-500" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div>
            {expiryDate ? (
              <span>Valid until: {expiryDate}</span>
            ) : (
              <span>No expiry date</span>
            )}
          </div>
          <div className="flex gap-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-orange-500 transform rotate-45" />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function generateVoucherEmailHTML(
  code: string,
  amount: number,
  description: string = "Gift Voucher",
  recipientName?: string,
  expiresAt?: string
): string {
  const formattedAmount = amount.toFixed(2);
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gift Voucher</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0C332C 0%, #ff4520 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .voucher-card {
      background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
      margin: 30px;
      padding: 40px;
      border-radius: 12px;
      border: 3px solid #0C332C;
      position: relative;
    }
    .voucher-code {
      background: #1a1a1a;
      color: #c4f03b;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
    }
    .amount {
      font-size: 48px;
      font-weight: bold;
      color: #0C332C;
      text-align: center;
      margin: 20px 0;
    }
    .instructions {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #0C332C;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 14px;
    }
    .pattern-dots {
      position: relative;
    }
    .pattern-dots::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background-image: repeating-linear-gradient(90deg, #0C332C 0, #0C332C 10px, transparent 10px, transparent 20px);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🎁 Gift Voucher</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${description}</p>
    </div>

    <div class="voucher-card">
      ${recipientName ? `<p style="text-align: center; color: #666; margin-bottom: 20px;">For: <strong>${recipientName}</strong></p>` : ''}
      
      <div class="amount">$${formattedAmount}</div>
      
      <div class="voucher-code">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #888; letter-spacing: 2px;">YOUR CODE</p>
        <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 3px;">${code}</p>
      </div>

      <div class="instructions">
        <h3 style="margin-top: 0; color: #333;">How to Redeem:</h3>
        <ol style="color: #666; line-height: 1.8; margin: 10px 0;">
          <li>Visit our store and add items to your cart</li>
          <li>Enter code <strong>${code}</strong> at checkout</li>
          <li>Enjoy your $${formattedAmount} credit!</li>
        </ol>
      </div>

      <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <h4 style="margin-top: 0; color: #0C332C;">Terms & Conditions:</h4>
        <ul style="color: #666; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>One-time use only per customer</li>
          <li>Cannot be combined with other offers</li>
          <li>Non-transferable and non-refundable</li>
          ${expiryDate ? `<li><strong>Valid until: ${expiryDate}</strong></li>` : '<li>No expiry date</li>'}
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #e0e0e0;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Keep this email safe. You'll need the code to redeem your voucher.
        </p>
      </div>
    </div>

    <div class="footer pattern-dots">
      <p style="margin: 0;">Thank you for choosing us!</p>
      <p style="margin: 10px 0 0 0; font-size: 12px;">
        Questions? Contact our support team
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
