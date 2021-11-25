'use strict';

const Controller = require('egg').Controller;
const SortWord = require('sort-word');


class FriendController extends Controller {
    // 获取好友列表  
    async list() {
        const { app, ctx } = this
        let current_user_id = ctx.authUser.id

        let friendList = await app.model.Friend.findAndCountAll({
            where: {
                user_id: current_user_id
            },
            include: [
                {
                    model: app.model.User,
                    attributes: ['id', 'username', 'nickname', 'avatar'],
                    as: 'friendInfo'
                }
            ]
        })

        // 取关键字段
        let res = friendList.rows.map(item => {
            let name = item.friendInfo.nickname ? item.friendInfo.nickname : item.friendInfo.username
            if (item.nickname) {
                name = item.nickname
            }
            return {
                id: item.id,
                user_id: item.user_id,
                name,
                username: item.friendInfo.username,
                avatar: item.friendInfo.avatar
            }
        })

        friendList.rows = new SortWord(res, 'name')

        ctx.apiSuccess(friendList)
    }


    // 好友详情
    async detail() {
        const { app, ctx } = this
        let current_user_id = ctx.authUser.id
        let friend_id = ctx.params.id

        let friend = await app.model.Friend.findOne({
            where: {
                user_id: current_user_id,
                friend_id
            },
            include: [{
                model: app.model.User,
                as: 'friendInfo',
                attributes: {
                    exclude: 'password'
                }
            }]
        })

        if (!friend) {
            ctx.throw(400, '好友不存在')
        }

        ctx.apiSuccess(friend)
    }

    // 好友详情
    async setBlack() {
        const { app, ctx } = this
        let current_user_id = ctx.authUser.id
        let friend_id = ctx.params.id
        // 参数验证
        ctx.validate({
            isblack: { type: 'int', required: true, range: { in: [0, 1] }, desc: '是否设置黑名单' }
        })
        let friend = await app.model.Friend.findOne({
            where: {
                user_id: current_user_id,
                friend_id
            }
        })

        if (!friend) {
            ctx.throw(400, '好友不存在')
        }

        // 更新好友
        friend.isblack = ctx.request.body.isblack
        friend =  await friend.save()

        ctx.apiSuccess(friend)
    }
}

module.exports = FriendController;
