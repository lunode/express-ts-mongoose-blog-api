// 相比于其它 HTTP ERROR, 鉴权未通过有很多场景, 因为实现了refreshToken无感刷新
// 所以前端需要一个code辨识哪一种 Unauthorized是因为acess_token过期, 而refresh_token未过期的状态
// 从而依据此状态调用refresh Token状态
export class UnAuthError {
  errCode: number;
  code: number;
  status: number;
  statusCode: number;
  message: string;
  /**
   * @description token过期
   */
  static tokenExpired() {
    return new UnAuthError(4010, "access_token已过期");
  }
  /**
   * @description 账号或密码错误
   */
  static wrongPassword() {
    return new UnAuthError(4011, "账号或密码错误");
  }
  /**
   * @description 用户已退出登录
   * 场景: 用户登录期间保存了有效的access_token, 退出登录后利用保存的acess_token请求api
   *      由于access_token本就是用户凭证, 无需在redis中存储凭证, 所以access_token经过校验后是合法
   *      但用户已经登出了, 所以要根据refresh_token校验用户是否是登录态(refresh_token每次签名都会存入redis)
   */
  static userSignOut() {
    return new UnAuthError(4012, "用户已退出登录");
  }
  static invalidTokenFormat() {
    return new UnAuthError(4013, "Authorization Header 格式不正确");
  }
  static invalidToken() {
    return new UnAuthError(4014, "token非法");
  }
  constructor(code: number, message: string) {
    this.errCode = this.code = code;
    this.status = this.statusCode = 401;
    this.message = message;
  }
  toString() {
    return `autFailedCode: ${this.code} ${this.message}`;
  }
}
