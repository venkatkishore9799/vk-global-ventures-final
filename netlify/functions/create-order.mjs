export default async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { name, email, phone, amount } = await req.json();

    const amountInRupees = Number(amount);

    if (!name || !email || !phone || !amountInRupees || amountInRupees <= 0) {
      return new Response(
        JSON.stringify({ error: "Please provide valid payment details." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials are not configured." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Math.round(amountInRupees * 100),
          currency: "INR",
          receipt: `VK-${Date.now()}`,
          notes: {
            customer_name: name,
            customer_email: email,
            customer_phone: phone
          }
        })
      }
    );

    const order = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      return new Response(
        JSON.stringify({ error: order.error?.description || "Razorpay order creation failed." }),
        {
          status: razorpayResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        key_id: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error while creating payment order." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
