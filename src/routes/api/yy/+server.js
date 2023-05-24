export const POST = async ({ request }) => {
    console.log("tryng", request.body)
    const data = await request.json()
    console.log("gg", data)
    const messegeText = data.message.text
    const isReg = messegeText.startsWith('/getnotification')
    const isShow = messegeText.startsWith('/showaddress')
    const isStart = messegeText.startsWith('/start')
    let name,det,action;
    if (isReg == true){
        //check if chatid is already in use else:
     name =""
     det =""
     action = "הרשמתך לעדכונים התקבלה בהצלחה!"
    } else if (isShow == true){
        name = ""
        det = ""
        action = '1lev1.vercel.app';
    } else if (isStart == true){
        const id = messegeText.split(' ')[1]
        console.log(id)
        name = ""
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

    const url = `https://api.telegram.org/bot${Token}/sendMessage?chat_id=${chatId}&text=${botMessage}`;
    const res = await fetch(url);
  //  const name = data.name;
  //  const job = data.job;
  //  console.log("ryng", name, job)

    return new Response()
}