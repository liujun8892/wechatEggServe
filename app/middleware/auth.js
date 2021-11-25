module.exports = (option, app) => {
    return async function errorHandler(ctx, next) {
      const {token} = ctx.header
      // 验证是否有token
      if(!token) {
          ctx.throw(400, '您没有访问接口的权限')
      }
      // 根据token获取用户信息
      let user = {}
      try {
        user = ctx.verifyToken(token)
      } catch (error) {
        let fail = error.name === 'TokenExpiredError' ? 'token 已过期! 请重新获取令牌' : 'Token 令牌不合法!';
        ctx.throw(400, fail);
      }
      // 对比redis中的token
      let redisToken = await ctx.service.cache.get('user_' + user.id)
      if(!redisToken || redisToken !==  token) {
          ctx.throw(400, 'Token 令牌不合法!')
      }
      // 对比数据库中的用户
      user = await app.model.User.findByPk(user.id)
      if(!user || user.status == 0) {
          ctx.throw(400,'用户不存在或已被禁用')
      }
      // 挂载user到ctx中
      ctx.authUser = user

      await next()
    }
}