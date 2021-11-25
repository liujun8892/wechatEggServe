'use strict';

const Controller = require('egg').Controller;
// 引入
const crypto = require('crypto');

class UserController extends Controller {
  // 注册
  async reg() {
    const { ctx, app } = this;
    const { username, password, repassword } = ctx.request.body

    ctx.validate({
      username: { type: 'string', required: true, desc: '用户名称', range: { min: 3, max: 20 } },
      password: { type: 'string', required: true, desc: '密码' },
      repassword: { type: 'string', required: true, desc: '确认密码' }
    }, {
      equals: [
        ['password', 'repassword']
      ]
    });

    // 查用户名是否存在
    let user = await app.model.User.findOne({
      where: {
        username
      }
    })

    if (user) {
      ctx.throw(400, '用户名已存在')
    }

    // 创建用户
    let createUserReulst = await app.model.User.create({ username, password })

    if (!createUserReulst) {
      ctx.throw(400, '创建用户失败')
    }

    ctx.apiSuccess(createUserReulst)

  }

  // 登录
  async login() {
    // 校验参数
    const { ctx, app } = this;
    const { username, password } = ctx.request.body

    ctx.validate({
      username: { type: 'string', required: true, desc: '用户名称', range: { min: 3, max: 20 } },
      password: { type: 'string', required: true, desc: '密码' }
    });

    // 查询用户|用户状态
     let user = await app.model.User.findOne({
      where: {
        username,
        status: 1
      }
    })
    if(!user) {
      ctx.throw(400,'用户不存在或已被禁用')
    }

    // 校验密码
    let validPasswordFlag=  await this.checkPassword(password,user.password)
    if(!validPasswordFlag) {
      ctx.throw(400,'用户名或密码错误')
    }
    // 生产token
    user = JSON.parse(JSON.stringify(user))
    let token = ctx.getToken(user)
    console.log(token,'token11223');
    delete user.password
    user.token = token
    // 加入redis缓存
    let redisSetFlag = await ctx.service.cache.set('user_' + user.id, token)
    if(!redisSetFlag) {
      throw(400, '登录失败')
    }

    // 成功返回
    ctx.apiSuccess(user)
  }

  // 退出登录
  async logout() {
    const { ctx, app } = this;
    // 删除redis中token
    let logoutResult = await ctx.service.cache.remove('user_' + ctx.authUser.id)
    console.log(logoutResult,'1111');
    // if(!logoutResult) {
    //    ctx.throw(400,'退出登录失败')
    // }
    ctx.apiSuccess('退出成功')
  }

  // 校验密码
  async checkPassword(password,hashPassword) {
    const hmac = crypto.createHash('sha256',this.app.config.crypto.secret)
    hmac.update(password)
    let cryptoPassword = hmac.digest('hex')
    return cryptoPassword === hashPassword
  }
}

module.exports = UserController;
