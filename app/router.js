'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);

  // 用户相关
  router.post('/reg', controller.user.reg);
  router.post('/login', controller.user.login);
  router.post('/logout', controller.user.logout);

  // 搜索相关
  router.post('/search/user', controller.search.user);

  // 申请相关
  router.post('/apply/addFriend', controller.apply.addFriend);
  router.get('/apply/list/:page', controller.apply.list);
  router.post('/apply/handleApply/:id', controller.apply.handleApply);

  // 通讯录
  router.get('/friend/list', controller.friend.list);
  router.get('/friend/detail/:id', controller.friend.detail);
  router.post('/friend/setBlack/:id', controller.friend.setBlack);
  
};
