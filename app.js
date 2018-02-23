const Koa = require('koa');
const router = require('koa-router')();
const bodyparser = require('koa-bodyparser');
const fs = require('fs');
let staticFiles = require('./static-files');
let templating = require('./templating');

const isProduction = process.env.NODE_ENV === 'production';

const app = new Koa();

function addMapping(router, mapping) {
    for (var url in mapping) {
        if (url.startsWith('GET ')) {
            var path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`register URL mapping: GET ${path}`);
        } else if (url.startsWith('POST ')) {
            var path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`register URL mapping: POST ${path}`);
        } else {
            console.log(`invalid URL: ${url}`);
        }
    }
}

function addControllers(router) {
    let files = fs.readdirSync(__dirname + '/controllers');
    let js_files = files.filter((f) => {
        return f.endsWith('js');
    });

    for (const f of js_files) {
        console.log(`process controller: ${f}...`);
        let mapping = require(__dirname + '/controllers/' + f);
        addMapping(router, mapping);
    }
}

addControllers(router);

app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}`); // 打印URL
    let
        start = new Date().getTime(),
        execTime;
    await next();
    execTime = new Date().getTime() - start;
    ctx.response.set('X-Response-Time', `${execTime}ms`);
});
// static files
app.use(staticFiles('/static/', __dirname + '/static'));
// post
app.use(bodyparser());
// template
app.use(templating('views', {
    noCache: !isProduction,
    watch: !isProduction
}));
// router
app.use(router.routes());

app.listen(3000);
console.log('app started at port 3000...');