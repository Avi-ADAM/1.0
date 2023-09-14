export const POST = async ({ request }) => {
    console.log("tryng", request.body)
    const data = await request.json()
    console.log("gg", data, data.message?.text)
    const messegeText = data.message.text
    const isReg = messegeText.startsWith('/getnotification')
    const isShow = messegeText.startsWith('/showaddress')
    const isStart = messegeText.startsWith('/start')
    console.log(isStart, data.message.entities);
    let name,det,action;
    if (isReg == true){
        //check if chatid is already in use else:
     name =""
     det =""
     action = "הרשמתך לעדכונים התקבלה בהצלחה!"
    } else if (isShow == true){
        name = ""
        det = ""
        action = 'https://1lev1.vercel.app';
    } else if (isStart == true){
        name = '';
        const startCommand = '/start';
        console.log(data.message.entities);
        const startParameter = data.message.text.substr(startCommand.length);
      if (startParameter) {
        const [userId, verificationCode, un, lang] = startParameter.split('_');
        console.log(userId, verificationCode, 'you here');
        if (userId && verificationCode) {
          name = un;
        }
      }

        //lang un
        det = ""
        action = "הרשמתך לעדכונים התקבלה בהצלחה!"
}
    const botMessage = `${name} %0A 
     ${action} %0A 
     ${det}`;

     //getNutifiction => check for id and email and username alse ask for email and if exsist send to login with explanation how to reg
    // %0A is url encoded '\n' which is used for new line. 
    const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = data.message.from.id
    console.log(chatId)
    const dat = {
      reply_markup: {
        resize_keyboard: true,
        inline_keyboard: [
          [
            {
              text: 'הצגת כתובת',
              callback_data: 'Button 1'
            },
            {
              text: 'Button 2',
              callback_data: 'Button 2'
            }
          ]
        ]
      }
    };

    const url = `https://api.telegram.org/bot${Token}/sendMessage?chat_id=${chatId}&text=${botMessage}`;
    const res = await fetch(url,{
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(dat)});
  //  const name = data.name;
  //  const job = data.job;
  //  console.log("ryng", name, job)

    return new Response()
}