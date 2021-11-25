'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    // ctx.throw(500,'customer error')
    let data = [
      {
        id: 1,
        username: '张三'
      },
      {
        id: 2,
        username: '李四'
      }
    ]
    ctx.apiSuccess(data)
    // ctx.body = {
    //   msg: 'ok',
    //   data: 'hi, egg!'
    // };
  }
}

module.exports = HomeController;
