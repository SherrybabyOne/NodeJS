const http = require('http');
const EventEmitter = require('events');
const context = require('./context');
const request = require('./request');
const response = require('./response');
const Stream = require('stream');

class Koa extends EventEmitter {
  constructor() {
    super();
    this.fn;
    this.context = context;
    this.request = request;
    this.response = response;
    this.middlewares = [];
  }
  use(fn) {
    this.middlewares.push(fn);
  }
  compose(middlewares, ctx) {
    function dispatch(index) {
      if (index === middlewares.length) return Promise.resolve();
      const middleware = middlewares[index];
      return Promise.resolve(middleware(ctx, () => dispatch(index + 1)));
    }
    return dispatch(0);
  }
  createContext(req, res) {
    // 使用继承不影响原对象
    const ctx = Object.create(this.context);
    const request = Object.create(this.request);
    const response = Object.create(this.response);

    // req、res是Node的request、response对象
    ctx.req = request.req = response.req = req;
    ctx.res = request.res = response.res = res;
    request.ctx = response.ctx = ctx;
    // request、response是Koa基于Node封装的对象
    request.response = response;
    response.request = request;
    ctx.request = request;
    ctx.response = response;
    return ctx;
  }
  handleRequest(req, res) {
    res.statusCode = 404; //默认404
    const ctx = this.createContext(req, res); //创建ctx
    const fn = this.compose(this.middlewares, ctx);
    fn.then(() => {
      if (typeof ctx.body === 'object') { //如果是个对象，按照JSON格式输出
        res.setHeader('Content-Type', 'application/json;charset=utf8');
        res.end(JSON.stringify(ctx.body));
      } else if (ctx.body instanceof Stream) {
        ctx.body.pipe(res);
      } else if (typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) { //如果是字符串或Buffer
        res.setHeader('Content-Type', 'text/html;charset=utf8');
        res.end(ctx.body);
      } else {
        res.end('Not found');
      }
    }).catch(err => {
      this.emit('error', error);
      res.statusCode = 500;
      res.end('server error');
    })
  }
  listen(...args) {
    const server = http.createServer(this.handleRequest.bind(this));
    server.listen(...args);
  }
}

module.exports = Koa;
