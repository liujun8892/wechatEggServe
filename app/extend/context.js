const user = require("../model/user")

module.exports = {
    // api成功返回
    apiSuccess(data = '', msg = 'ok', code = 200) {
        this.status = code
        this.body = {
            msg,
            data
        }
    },
    // api失败返回
    apiFail(data = '', msg = 'fail', code = 400) {
        this.status = code
        this.body = {
            msg,
            data
        }
    },
    // 获取token
    getToken(value) {
        return this.app.jwt.sign(value, this.app.config.jwt.secret)
    },
    // 验证token
    verifyToken(token) {
        try {
            let user = this.app.jwt.verify(token, this.app.config.jwt.secret)
            return user
        } catch (err) {
            let fail = err.name === 'TokenExpiredError' ? 'token 已过期! 请重新获取令牌' : 'Token 令牌不合法!';
            return ctx.apiFail(fail);
        }
    }
}