import nodemailer from 'nodemailer';

async function sendMail(
    emailHtml,
    email,
    previewText,
    emailText) {
       
    const transporter = nodemailer.createTransport({
       /* service: 'gmail',
        auth: {
            user: "ehad1one@gmail.com",
            pass: import.meta.env.VITE_APP
        }*/
            host: 'smtp.zoho.com',
            secure: true,
            port: 465,
            auth: {
              user: "notifications@1lev1.com",	
              pass: import.meta.env.VITE_ZOHO,
            },
    });


    const options = {
        from: "notifications@1lev1.com",
        to: email,
        subject: previewText,
        html: emailHtml,
        text: emailText
    };

    transporter.sendMail(options);
    transporter.verify(function (err, success) {
        if (err) {
            console.log(err)
            return 'error';
        }
        else {
            console.log(success)
            return 'OK';
        }
    });
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
