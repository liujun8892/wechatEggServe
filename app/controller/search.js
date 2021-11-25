'use strict';

const Controller = require('egg').Controller;

class SearchController extends Controller {
  // 搜索
  async user() {
     // 校验参数
     const { ctx, app } = this;
    
     ctx.validate({
       keywords: { type: 'string', required: true, desc: '关键词'}
     });

     const { keywords } = ctx.request.body

     let user = await ctx.model.User.findOne({
         where: {
             username: keywords
         },
         attributes: {
             exclude: ['password'] 
         }
     })

     ctx.apiSuccess(user)
 
  }
}

module.exports = SearchController;
