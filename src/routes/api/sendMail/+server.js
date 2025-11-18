import nodemailer from 'nodemailer';

export async function POST({ request }) {
    const data = await request.json();
    console.log("bolkmail 44", data.email); 
    const emailHtml = data.emailHtml.html;
    const emailText = data.emailHtml.text
    const email = data.email
    const previewText = data.previewText

    const transporter = nodemailer.createTransport({
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
  transporter.verify(function(err, success) {
  if (err) {
    console.log(err)
    return 'error';
} 
else {
  console.log(success)
    return 'OK';
}
});
        return new Response('Success to send mail', { status: 200 });
   /* } catch (error) {
        console.error('Error sending mail:', error);
        return new Response('Failed to send mail', { status: 500 });
    }*/
}
