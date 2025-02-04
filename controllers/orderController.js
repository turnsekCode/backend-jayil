import orderModel from '../models/orderModel.js'
import Stripe from 'stripe'
import axios from 'axios'

// global variables
const currency = 'eur'
const deliveryCharge = 4

const CLIENT_ID = process.env.SUMUP_CLIENT_ID;
const CLIENT_SECRET = process.env.SUMUP_CLIENT_SECRET;
// Stripe config
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// placing orders using COD metodo
const placeOrder = async (req,res) => {

    try {
        const {items, amount, address, orderNumber} = req.body;

        const orderData = {
            items,
            address,
            orderNumber,
            amount, 
            paymentMethod: 'WhatsApp',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        res.json({success:true,message:"Order placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}


// placing orders using stripe metodo

const placeOrderStripe = async (req, res) => {
    try {
        const { items, amount, address, orderNumber, delivery_fee } = req.body;
        const { origin } = req.headers;

        // Verificar si el monto total supera el límite para envío gratis
        let adjustedDeliveryFee = delivery_fee;
        if (amount > 45) {
            adjustedDeliveryFee = 0; // Envío gratis si el monto es mayor a 45
        }

        const orderData = {
            items,
            address,
            orderNumber,
            delivery_fee: adjustedDeliveryFee,
            amount,
            paymentMethod: 'Stripe',
            payment: false,
            date: Date.now()
        };
       
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Convertir el fee ajustado a centavos
        const deliveryFeeInCents = Math.round(adjustedDeliveryFee * 100);

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency, // Asegúrate de usar la moneda correcta
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(item.price * 100) // Convertir a centavos
            },
            quantity: item.quantity
        }));

        // Agregar el cargo de envío (solo si no es gratis)
        if (adjustedDeliveryFee > 0) {
            line_items.push({
                price_data: {
                    currency: currency, // Asegúrate de usar la moneda correcta
                    product_data: {
                        name: 'Delivery Charge'
                    },
                    unit_amount: deliveryFeeInCents // Fee convertido a entero en centavos
                },
                quantity: 1
            });
        } else {
            console.log("Envío gratis aplicado");
        }

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Verify order after payment
const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    console.log("req.body", req.body);  // Verifica que los datos estén llegando

    try {
        if (success === 'true') {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: 'Order placed successfully' });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: 'Order failed' });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const placeOrderSumUp = async (req, res) => {
    try {
      const {  amount, orderNumber } = req.body;
      //console.log("📝 Recibido:", req.body);

  
      // Obtener token de acceso de SumUp
      console.log("🔑 Obteniendo token de acceso de SumUp...");
      const authResponse = await axios.post(
        "https://api.sumup.com/token",
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
  
      console.log("🔐 Token recibido:", authResponse.data);
      const accessToken = authResponse.data.access_token;
  console.log("🔐 Token recibido:", authResponse.data);
      // Crear el checkout en SumUp
      console.log("💳 Creando checkout en SumUp...");
      const checkoutResponse = await axios.post(
        "https://api.sumup.com/v0.1/checkouts",
        {
          amount,
          currency: "EUR",
          checkout_reference: orderNumber,
          return_url: "http://localhost:4000/webhook/sumup",
          pay_to_email: "4b3a3ce28a504ba388a6269f0291411b@developer.sumup.com",
          returnUrl: "http://localhost:3000/success",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ Checkout creadoo:", checkoutResponse.data);
  
      // 🔹 Devolver también el ID de la orden creada
      res.json({
        checkoutToken: checkoutResponse.data,
      });
  
    } catch (error) {
      console.error("❌ Error en el proceso:", error);
      res.status(500).json({ error: "Error al crear el checkout" });
    }
  };
  
  

// Verify order after payment
const verifyOrderSumUp = async (req, res) => {
    try {
        const { checkoutId, orderData, orderCancel } = req.body;
        const { items, amount, address, orderNumber, delivery_fee } = orderData;

        console.log("📝 Recibido orderCancel:", orderCancel);

        // Si orderCancel es true, no guardamos la orden y salimos temprano
        if (orderCancel) {
            return res.json({ success: false, message: "El pago ha sido cancelado, no se guarda la orden." });
        }

        let adjustedDeliveryFee = amount > 45 ? 0 : delivery_fee;

        // Si orderCancel es falso, creamos y guardamos la orden
        const newOrder = new orderModel({
            items,
            address,
            orderNumber,
            delivery_fee: adjustedDeliveryFee,
            amount,
            paymentMethod: "Sumup",
            payment: false,
            date: Date.now(),
        });

        await newOrder.save();

        console.log("✅ Orden guardada con éxito:", newOrder._id);  // <-- Guardamos el ID
        let orderId = newOrder._id;

        // 🔹 Crear y guardar la orden en la base de datos
        console.log("checkoutId", checkoutId);

        // Obtener token de acceso de SumUp
        const authResponse = await axios.post(
            "https://api.sumup.com/token",
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const accessToken = authResponse.data.access_token;

        // Obtener estado del pago desde SumUp
        const response = await axios.get(
            `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        console.log("🔍 Estado del pago:", response.data);

        if (!orderId) {
            return res.status(400).json({ error: "Falta el ID de la orden" });
        }

        // Buscar la orden en la base de datos
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        if (response.data.status === "PAID") {
            // ✅ Marcar orden como pagada
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Pago confirmado" });
        } else if (response.data.status === "FAILED") {
            // ❌ Eliminar la orden si el pago falló
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "El pago falló, orden eliminada" });
        } else {
            res.json({ status: "PENDING", message: "Pago en proceso" });
        }
    } catch (error) {
        console.error("❌ Error al verificar el pago:", error);
        res.status(500).json({ error: "Error al verificar el pago" });
    }
};

  



// All orders using to admin panel

const allOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({})
        res.json({success:true,orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// User orders data for frontend

const userOrders = async (req,res) => {

}

// update order status for admin panel 

const updateStatus = async (req,res) => {
    try {
        const {orderId, status} = req.body;
        await orderModel.findOneAndUpdate({_id:orderId},{status})
        res.json({success:true,message:"Order status updated"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

export {placeOrder,placeOrderStripe,allOrders,userOrders,updateStatus, verifyOrder,placeOrderSumUp, verifyOrderSumUp}