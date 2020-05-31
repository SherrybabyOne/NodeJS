const proto = {

}
function defineGetter (prop, name) {
    proto.__defineGetter__(name, function(){
        return this[prop][name]
    })
}
function defineSetter (prop, name) {
    proto.__defineSetter__(name, function(val){ // 用__defineSetter__方法设置值
        this[prop][name] = val
    })
}
defineGetter('request', 'url')
defineGetter('request', 'path')
defineGetter('response', 'body') // 同样代理response的body属性
defineSetter('response', 'body') // 同理
module.exports = proto
