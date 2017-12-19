'use strict'

const Op = require('sequelize').Op
const User = require('../user/user')
const iamport = require('../config/iamport')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.getSubscriptions({
        where: {
          [Op.or]: [
            { cancelled_at: null },
            { valid_by: { [Op.gt]: new Date() } },
          ],
        },
      })
      .then((subs) => {
        if (subs.length === 0) {
          return respond(404, '구독 정보가 없습니다.')
        }
        const subscription = subs[0]

        return iamport.subscribe_customer.get({
          customer_uid: subscription.id,
        }).then((res) => respond(200, {
          card_name: res.card_name,
          latest_paid_at: subscription.latest_paid_at,
          last_four_digits: subscription.last_four_digits,
        })
        ).catch((err) => respond(500, err))
      })
    ).catch((err) =>
      respond(401, '로그인이 필요합니다.')
    )
}
