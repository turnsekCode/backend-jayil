import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import nodemailer from 'nodemailer';
import categoryRouter from './routes/categoryRoute.js'
import orderRoute from './routes/orderRoute.js'

// App config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json())
//app.use(cors({ origin: "*", credentials: true }));
const allowedOrigins = [
  "https://www.jayil.es",
  "https://admin-jayil.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));




// Configuración de Nodemailer (reemplaza con tus credenciales)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Usa el servicio que prefieras
  auth: {
    user: 'jayil.artesania@gmail.com', // Reemplaza con tu correo
    pass: 'fsun lgqw dvrw yrwh', // Reemplaza con tu contraseña: contraseña pixel: uifc sttc klfd qlqq
  },
});
// Ruta para enviar el correo
app.post('/send-email', (req, res) => {
  const { cartDetails, subtotal, shippingFee, total, currency, orderNumber, shippingInfo, discount, paymentType, envioPersonal } = req.body;

  // Verificar si faltan datos obligatorios
  if (!cartDetails || !subtotal || !shippingFee || !total || !currency || !orderNumber || !shippingInfo || discount === undefined) {
    return res.status(400).json({ success: false, message: 'Faltan datos obligatorios en la solicitud.' });
  }

  // Generar el bloque de descuento condicional
  const discountBlock = discount > 0
    ? `
    <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
        <strong style="font-weight: bold; color: #333333;">Descuento aplicado:</strong> <span style="color: #000000;">${discount.toFixed(2)}${currency} </span>
    </div>
    `
    : '';

  // Generar el contenido del correo
  const emailContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gracias por tu compra</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333;">
        <div style="max-width: 900px; margin: 0 auto; background-color: #fff; padding: 20px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <!-- Cabecera -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://res.cloudinary.com/dqfb8uqop/image/upload/v1737834820/logo_pck5bh.png" alt="Logo" style="max-width: 150px;">
            </div>
            
            <!-- Asunto y Encabezado -->
            <h2 style="color: #2c3e50; text-align: center;">¡Gracias por tu compra, <span style="font-weight: bold;">${shippingInfo?.name}</span>!</h2>
            <p style="font-size: 16px; text-align: center; color: #7f8c8d;">Número de pedido: <span style="font-weight: bold;">${orderNumber}</span></p>
            
            <!-- Mensaje Personalizado -->
            <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
                Hola <span style="font-weight: bold;">${shippingInfo?.name}</span>,<br><br>
                Muchas gracias por tu pedido, ¡Estamos emocionados de que esta creación llegue a tus manos!<br><br>
                ${!envioPersonal ? `
                  Dirección de envío:<br>
                  ${shippingInfo?.address}, ${shippingInfo?.province}, ${shippingInfo?.postalCode}, ${shippingInfo?.country}<br>
                  <br>
                ` : ''}
                Teléfono: ${shippingInfo?.phone}<br>
                <p style="font-size: 16px; color: #34495e; font-weight: bold; margin-bottom: 10px;">Detalles del producto</p>
            </p>

            <!-- Tabla de Detalles del Pedido -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd;">Producto</th>
                        <th style="text-align: left; padding-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd;">Precio</th>
                        <th style="text-align: left; padding-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd;">Imagen</th>
                    </tr>
                </thead>
                <tbody>
                    ${cartDetails.map(item => `
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 10px 0; font-size: 14px;">${item.name.slice(0, 30) + '...'} x ${item.quantity}</td>
                            <td style="padding: 10px 0; font-size: 14px;">${item.price.toFixed(2)}${currency}</td>
                            <td style="padding: 10px 0; text-align: center;">
                                <img style="width: 40px; height: 40px; object-fit: cover;" src="${item.image}" alt="${item.name}" />
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Precio y Total -->
            <div style="font-size: 16px; color: #555555; margin-bottom: 10px; margin-top: 20px;">
                <strong style="font-weight: bold; color: #333333;">Subtotal:</strong> <span style="color: #000000;">${subtotal.toFixed(2)}${currency}</span>
            </div>
            <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
                <strong style="font-weight: bold; color: #333333;">Tarifa de envio:</strong> <span style="color: #000000;">${!envioPersonal ? shippingFee : '0.00€'}</span>
            </div>
            ${discountBlock}
             <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
                <strong style="font-weight: bold; color: #333333;">Tipo de pago:</strong> <span style="color: #000000;">${paymentType}</span>
            </div>
            <div style="font-size: 18px; color: #333333; font-weight: bold; margin-top: 20px;">
                <strong>Total:</strong> <span style="color: #C15470;">${total.toFixed(2)}${currency}</span>
            </div>
               <!-- Tiempo de Entrega -->
        <p style="font-size: 16px; line-height: 1.6; color: #34495e; margin-top: 20px;">
            Recuerda que el tiempo estimado de entrega es entre 3 a 4 días laborables.
        </p>
        
        <!-- Botón de WhatsApp -->
        <div style="text-align: center; margin-top: 20px;">
            <a href="https://wa.me/672563452" target="_blank" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: bold;">
                Contáctanos en WhatsApp
            </a>
        </div>

        <!-- Recordatorio de Compartir -->
        <p style="font-size: 16px; line-height: 1.6; color: #34495e; text-align: center; margin-top: 30px;">
            No olvides compartirnos cómo usas tu nueva pieza, ¡nos encantaría verlo en acción!<br><br>
            Disfruta mucho de tu compra.
        </p>

        <!-- Pie de página -->
        <div style="text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 40px;">
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        </div>
        </div>
    </body>
    </html>
  `;

  // Configuración del correo
  const mailOptions = {
    from: 'jayil.artesania@gmail.com',
    to: shippingInfo?.email, // Correo del cliente
    cc: 'jayil.artesania@gmail.com',
    bcc: 'pixel.tech.t@gmail.com', // Copias ocultas
    subject: `Pedido realizado`,
    html: emailContent,
  };
  

  // Enviar correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      //console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
    res.status(200).json({ success: true, message: 'Correo enviado exitosamente' });
  });
});


app.post('/send-email-status', async (req, res) => {
  const { orderId, status, email, orderNumber } = req.body;
  if (!orderId || !status || !email || !orderNumber) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  // Función para obtener el mensaje según el estado
  const getStatusMessage = (status) => {
    switch (status) {
      case 'Empacando':
        return `<h2 style="color: #C15470;">¡Hola!</h2>
        <p>Tenemos noticias emocionantes de tu pedido: <strong>${orderNumber}</strong></p>
        <p><strong>Nuevo estado:</strong> ${status}</p>
        <p>Empaquetamos con cuidado y detalle, estimamos que llegará a tu dirección en 3 a 4 días hábiles por Correos.
        ¿Tienes alguna pregunta o inquietud? No dudes en hacérnoslo saber. Estamos aquí para ayudarte.</p>
        <p>Gracias por elegirnos.</p>`;
      case 'Enviado':
        return `<h2 style="color: #C15470;">¡Hola!</h2>
        <p>¡Buenas noticias!</p>
        <p>Tu pedido: <strong>${orderNumber}</strong> ya fué enviado y está en camino hacia ti.</p>
        <p><strong>Nuevo estado:</strong> ${status}</p>
        <p>Estimamos que llegará a tu dirección en 3 a 4 días hábiles por Correos. Esperamos que estés emocionado de recibir tu pedido. Si tienes alguna pregunta o inquietud, no dudes en hacérnoslo saber. Estamos aquí para ayudarte.</p>
        <p>Nuevamente, gracias por elegirnos.</p>`;
      default:
        return `<h2 style="color: #C15470;">¡Hola!</h2>
          <p>Queremos informarte que el estado de tu pedido <strong>${orderNumber}</strong> ha cambiado.</p>
          <p><strong>Nuevo estado:</strong> ${status}</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Gracias por tu preferencia.</p>`;
    }
  };

  // Generar el HTML dinámico
  const statusMessage = getStatusMessage(status);

  const mailOptions = {
    from: 'jayil.artesania@gmail.com',
    to: email,
    cc: 'jayil.artesania@gmail.com',
    bcc: 'pixel.tech.t@gmail.com', // Copias ocultas
    subject: `Estado de tu pedido: ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 600px; margin: auto;">
        ${statusMessage}
        <footer style="margin-top: 20px; font-size: 12px; color: #888;">
          <p>Atentamente,</p>
          <p>El equipo de nuestra tienda</p>
        </footer>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Correo enviado con éxito.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al enviar el correo.', error });
  }
});


// Ruta para recibir el webhook de SumUp
app.post("/webhook/sumup", (req, res) => {
  const { event, data } = req.body;
//console.log("webhook",req.body)
  if (event === "transaction.successful") {
    //console.log("Pago recibido:", data);
    // Actualizar base de datos o enviar confirmación al cliente
  }

  res.sendStatus(200); // Confirmar que recibiste el webhook
});

// api endpoints 
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/category', categoryRouter)
app.use('/api/order', orderRoute)

app.get('/', (req, res) => {
  res.send("Api working")
})

app.listen(port, () => console.log('Servidor corriendo en puerto:' + port))