'use strict'
const _ = require('lodash')
const Ticket = require('./ticket')
const Artist = require('./artist')
const Partner = require('../partner/partner')
const User = require('../user/user')
const Subscription = require('../subscription')

module.exports = (params, respond) =>
  Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) =>
      Ticket.findOne({
        where: {
          id: params.path.ticketId,
        },
        include: [{ model: Artist }],
      }).then((ticket) => {
        if (!ticket) return respond(404, '해당 공연을 찾을 수 없습니다.')
        if (partner.id !== ticket.partner_id && !partner.isAdmin()) {
          return respond(403, '권한이 없습니다.')
        }

        return ticket.getReservations({
          paranoid: false, // 취소된 예약 포함
          include: [{ model: Subscription,
              attributes: ['user_id'],
              include: [
              { model: User, attributes: ['email', 'nickname'] },
              ],
            }],
        }).then((reservations) => {
          let ticketWithStats = ticket.dataValues
          ticketWithStats.reservations = _.map(reservations,
            (r) => {
              let data = r.dataValues
              if (r.subscription) {
                if (r.subscription.user) {
                  data.user = r.subscription && r.subscription.user.dataValues
                } else {
                  console.error('유저 정보 미아')
                  console.error(r)
                }
              } else {
                console.error('구독 정보 미아')
                console.error(r)
              }
              data.subscription = undefined
              return data
            })
          return respond(200, ticketWithStats)
        })
      })
    ).catch((err) => {
      console.error(err)
      respond(401, err)
    })
