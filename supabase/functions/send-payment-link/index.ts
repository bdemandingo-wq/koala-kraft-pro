import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentLinkRequest {
  email: string;
  customerName: string;
  amount: number;
  serviceName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, customerName, amount, serviceName }: PaymentLinkRequest = await req.json();

    if (!email || !customerName || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a simple payment link placeholder
    // In production, you would integrate with Stripe to create a payment link
    const paymentLink = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/payment?amount=${amount}`;

    const emailResponse = await resend.emails.send({
      from: "South Florida Cleaning <onboarding@resend.dev>",
      to: [email],
      subject: "Complete Your Booking Payment",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .amount { font-size: 36px; font-weight: bold; color: #10b981; margin: 20px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Complete Your Payment</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Thank you for choosing our cleaning services! Please complete your payment to confirm your booking.</p>
              
              <div class="details">
                <h3>Booking Details</h3>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p class="amount">$${amount.toFixed(2)}</p>
              </div>
              
              <p>Click the button below to securely enter your payment details:</p>
              
              <center>
                <a href="${paymentLink}" class="button">Pay Now</a>
              </center>
              
              <p style="color: #666; font-size: 14px;">
                Your card will not be charged until after the service is complete. 
                We only collect your payment information to secure your booking.
              </p>
            </div>
            <div class="footer">
              <p>Questions? Reply to this email or call us at (813) 735-6859</p>
              <p>&copy; 2024 South Florida Cleaning. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Payment link email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-payment-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);