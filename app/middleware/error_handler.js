module.exports = (option, app) => {
    return async function errorHandler(ctx, next) {
        try {
            await next(); 
            // 404 处理
            if(ctx.status === 404 && !ctx.body){
              console.log();
               ctx.body = { 
                   msg:"fail",
                   data:'404 错误'
               };
            }
          } catch (err) {
            // 记录一条错误日志
            app.emit('error', err, ctx);
    
            const status = err.status || 500;
            // 生产环境时 500 错误的详细错误内容不返回给客户端，因为可能包含敏感信息
            const error = status === 500 && app.config.env === 'prod'
              ? 'Internal Server Error'
              : err.message;
    
            ctx.status = status;

            // 如果是验证错误
            if(status === 422 && err.message === 'Validation Failed') {
              if(err.errors && Array.isArray(err.errors))
              ctx.body = {
                msg: 'fail',
                data: err.errors[0].err[0] || err.errors[0].err[1]
              }
              return
            }

            // 从 error 对象上读出各个属性，设置到响应中
            ctx.body = { 
                msg:"fail",
                data:error
            };
           
          }
    }
}