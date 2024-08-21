import nodemailer from 'nodemailer';

async function sendMail(
    emailHtml,
    email,
    previewText,
    emailText) {
     
    const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            secure: true,
            port: 465,
            auth: {
              user: "notifications@1lev1.com",	
              pass: import.meta.env.VITE_ZOHO,
            },
    });
    console.log(import.meta.env.VITE_ZOHO, 'import.meta.env.VITE_ZOHO')
    await new Promise((resolve, reject) => {
        transporter.verify(function (err, success) {
            if (err) {
                console.log(err)
                reject(err)
            }
            else {
                console.log(success)
                resolve(success)
            }
        });
       })

    const options = {
        from: "notifications@1lev1.com",
        to: email,
        subject: previewText,
        html: emailHtml,
        text: emailText
    };
    await new Promise((resolve, reject) => {
        transporter.sendMail(options, (err, info) => {
            if (err) {
                console.log(err)
                reject(err)
            }
            else {
                console.log(info)
                resolve(info)
            }
        });

    })

    return 'Email sent successfully';
}



export async function POST({ request }) {
    const data = await request.json();
    console.log("bolkmail 44", data); 
    const emailHtml = data.emailHtml;
    const emailText = data.emailText
    const email = data.email
    const previewText = data.previewText

    try {
        const result = await sendMail(
            emailHtml,
            email,
            previewText,
            emailText
        );
    
        return new Response(result);
    } catch (error) {
        console.error('Error sending mail:', error);
        return new Response('Failed to send mail', { status: 500 });
    }
}
