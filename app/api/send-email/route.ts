import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { to_email, to_name, pdf_attachment, ...emailData } = data

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Faltan credenciales de Gmail")
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    // Configurar el transporter de nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Verificar la conexión
    try {
      await transporter.verify()
    } catch (error) {
      console.error("Error al verificar la conexión con Gmail:", error)
      return NextResponse.json(
        { error: "Error al conectar con el servidor de correo" },
        { status: 500 }
      )
    }

    // Configurar el correo
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to_email,
      cc: "aplicaciones3@omicroncorp.com",
      subject: `Acta de Inicio - ${emailData.project_name}`,
      replyTo: "josegabmuz507@gmail.com",
  
      html: `
        <h2>Acta de Inicio de Proyecto</h2>
        <p>Estimado/a ${to_name},</p>
        <p>Se adjunta el acta de inicio del proyecto ${emailData.project_name}.</p>
        <p>Detalles del proyecto:</p>
        <ul>
          <li><strong>Código:</strong> ${emailData.project_code}</li>
          <li><strong>Fecha de Inicio:</strong> ${emailData.start_date}</li>
          <li><strong>Fecha de Finalización:</strong> ${emailData.end_date}</li>
          <li><strong>Tipo de Proyecto:</strong> ${emailData.project_type}</li>
        </ul>
        <p>Saludos cordiales,</p>
        <p>Omicron Corp</p>
      `,
      attachments: [
        {
          filename: `Acta_Inicio_${emailData.project_name.replace(/\s+/g, "_")}.pdf`,
          content: pdf_attachment.split("base64,")[1],
          encoding: "base64",
        },
      ],
    }

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions)
    console.log("Correo enviado:", info)

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error al enviar el correo:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al enviar el correo" },
      { status: 500 }
    )
  }
} 