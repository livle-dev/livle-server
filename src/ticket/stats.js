'use strict'
const Ticket = require('./ticket')
const Partner = require('../partner/partner')
const _ = require('lodash')

module.exports = (params, respond) =>
  Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) =>
      Ticket.findOne({
        where: {
          id: params.path.ticketId,
        },
      }).then((ticket) => {
        if (!ticket) return respond(404, '해당 공연을 찾을 수 없습니다.')
        if (partner.id !== ticket.partner_id && !partner.isAdmin()) {
          return respond(403, '권한이 없습니다.')
        }

        return ticket.getReservations({ paranoid: false }) // 취소된 예약 포함
          .then((reservations) => {
            let ticketWithStats = ticket.dataValues
            ticketWithStats.reservations = _.map(reservations,
              (r) => r.dataValues)
            return respond(200, ticketWithStats)
          })
      })
    ).catch((err) => respond(401, err))