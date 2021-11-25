'use strict';

const Controller = require('egg').Controller;

class ApplyController extends Controller {

    // 添加用户
    async addFriend() {
        const { ctx, app } = this
        // 参数验证
        ctx.validate({
            friend_id: { type: 'int', required: true, desc: '好友id' },
            nickname: { type: 'string', required: false, desc: '昵称' },
            lookme: { type: 'int', required: true, range: { in: [0, 1] }, desc: '看我' },
            lookhim: { type: 'int', required: true, range: { in: [0, 1] }, desc: '看他' },
        })
        const { friend_id, nickname, lookme, lookhim } = ctx.request.body
        let current_user_id = ctx.authUser.id

        // 不能添加自己
        if (current_user_id === friend_id) {
            ctx.throw(400, '不能添加自己')
        }

        // 已经申请过了
        let hadApplyResult = await app.model.Apply.findOne({
            where: {
                user_id: current_user_id,
                friend_id,
                status: ['pending', 'aggree']
            }
        })
        if (hadApplyResult) {
            ctx.throw(400, '您之前已经申请过了')
        }

        // 插入申请表数据
        let applyResult = await app.model.Apply.create({
            user_id: current_user_id,
            friend_id,
            nickname,
            lookme,
            lookhim
        })
        if (!applyResult) {
            ctx.throw(400, '申请失败')
        }

        // 返回申请结果
        ctx.apiSuccess(applyResult)

    }

    // 添加用户列表
    async list() {
        const { ctx, app } = this
        let limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10
        let page = ctx.params.page ? parseInt(ctx.params.page) : 1
        let offset = (page - 1) * limit
        let current_user_id = ctx.authUser.id

        let applyList = await app.model.Apply.findAll({
            where: {
                friend_id: current_user_id
            },
            include: [{
                model: app.model.User,
                attributes: ['id', 'username', 'nickname', 'avatar']
            }],
            offset,
            limit
        })

        let count = await app.model.Apply.count({
            where: {
                friend_id: current_user_id,
                status: "pending"
            }
        })

        ctx.apiSuccess({
            applyList,
            count
        })
    }

    // 处理申请
    async handleApply() {
        const { ctx, app, params } = this
        let user_id = ctx.params.id
        console.log(user_id, '用户id122.');
        // 校验参数
        // 参数验证
        ctx.validate({
            status: { type: 'string', required: true, range: { in: ['refuse', 'agree', 'ignore'] }, desc: '设置好友状态' },
            nickname: { type: 'string', required: true, desc: '昵称' },
            lookme: { type: 'int', required: true, range: { in: [0, 1] }, desc: '看我' },
            lookhim: { type: 'int', required: true, range: { in: [0, 1] }, desc: '看他' },
        })
        let current_user_id = ctx.authUser.id
       
        if (!user_id) {
            ctx.throw(400, '好友id不能为空')
        }
        user_id = parseInt(user_id)


        const { status, nickname, lookme, lookhim } = ctx.request.body

        // 查询申请表
        let applyRecord = await app.model.Apply.findOne({
            where: {
                friend_id: current_user_id,
                user_id,
                status: 'pending'
            }
        })
        if (!applyRecord) {
            ctx.throw(400, '申请记录不存在或已被删除')
        }

        // 更新申请表状态, 为agree, 往friend表插入两条记录, 开启事物
        let transaction
        try {
            transaction = await app.model.transaction()
            // 更新申请
            let updateApplyRecord = await applyRecord.update({ nickname, status, lookme, lookhim }, { transaction })
            if (!updateApplyRecord) {
                ctx.throw(400, '操作失败')
            }
            console.log(status,'status');
            // 是同意状态, 插好友记录
            if (status === 'agree') {
                // 自己的好友列表
                let userFriend = await app.model.Friend.findOne({
                    where: {
                        user_id: current_user_id,
                        friend_id: user_id
                    }
                })
                // 没有则添加
                if (!userFriend) {
                    app.model.Friend.create({ user_id: current_user_id, friend_id: user_id, nickname, lookme, lookhim })
                }
                // 对方的好友列表
                let friendUser = await app.model.Friend.findOne({
                    where: {
                        user_id: user_id,
                        friend_id: current_user_id
                    }
                })
                // 没有则添加
                if (!friendUser) {
                    app.model.Friend.create({ user_id: user_id, friend_id: current_user_id, nickname: applyRecord.nickname, lookme: applyRecord.lookme, lookhim: applyRecord.lookhim })
                }
            }
            // 提交事务
            transaction.commit()
            return ctx.apiSuccess('操作成功')
        } catch (error) {
            // 事务回滚
            await transaction.rollback()
            return ctx.apiFail('操作失败')
        }
    }
}

module.exports = ApplyController;
