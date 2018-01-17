const _ = require('lodash')
const handler = require('../handler')

function Gateway() {
  this.headers = {}
}

Gateway.prototype.setAuth = function (token) {
  this.headers.Authorization = token
}

const parsePathParams = (path) => {
}

const parseQuery = (path) => {
  const paths = path.split('?')
  if (paths.length === 1) return null
  const querys = paths[1].split('&')
  return _.reduce(querys, (pathParams, q) => {
    const parts = q.split('=')
    const name = parts[0]
    const value = parts[1]
    if (!name || !value) throw new Error('Malformed query string')
    pathParams[name] = value
    return pathParams
  }, { })
}

Gateway.prototype.apiCall = function (method, path, params) {
  let event = {
    headers: this.headers,
    body: params.body ? JSON.stringify(params.body) : null,
    queryStringParameters: parseQuery(path),
    pathParameters: {},
    httpMethod: method,
  }

  const promisify = (func) => (event) =>
    new Promise((resolve, reject) =>
      func(event, {},
        (err, res) => err ? reject(err) : resolve(res)
      )
    )

  const paths = path.split('?')[0].split('/')
  switch (paths[0]) {
    case 'user': {
      if (paths[1]) {
        switch (paths[1]) {
          case 'session':
            return promisify(handler.userSignin)(event)
          case 'facebook':
            return promisify(handler.userFacebook)(event)
          case 'password':
            if (method === 'POST') {
              return promisify(handler.userUpdatePassword)(event)
            } else if (method === 'GET') {
              return promisify(handler.userRequestPassword)(event)
            }
          case 'all':
              return promisify(handler.userAll)(event)
          default:
            throw new Error(`Unknown path: ${path}`)
        }
      } else {
        return promisify(handler.userRouter)(event)
      }
    }
  }
}

module.exports = Gateway