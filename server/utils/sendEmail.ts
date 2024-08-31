import nodemailer from "nodemailer";
import config from "../config/config";
const transporter = nodemailer.createTransport({
  host: "smtpdm.aliyun.com",
  port: 465,
  //"secureConnection": true, // use SSL, the port is 465
  auth: {
    user: config.aliEmail.user, // user name
    pass: config.aliEmail.pass, // password
  },
});
interface SendEmailOptions {
  username: string | undefined;
  userEmail: string;
  message: string;
  to: string;
}
const sendEmail = async ({
  username, // 留言的用户名
  userEmail, // 留言的邮箱
  message, // 留言信息
  to, // 管理员邮箱
}: SendEmailOptions) => {
  const mailOptions = {
    from: `博客留言通知<${config.aliEmail.user}>`,
    to,
    html: `
      <p>用户名: ${username || ""}</p>
      <p>用户邮箱: ${userEmail || ""}</p>
      <p>留言内容:<p>
      <div>${message}</div>
    `,
  };
  console.log(mailOptions);
  const ret = await transporter.sendMail(mailOptions);
  console.log(ret);
  if (ret.accepted.length > 0) {
    return ret;
  } else {
    return false;
  }
};
export default sendEmail;
