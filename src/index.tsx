import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { Config } from "sst/node/config";
import { instrumentClientFetch } from "../node_modules/@microlabs/otel-cf-workers/src/instrumentation/fetch"
import { runSomeRandomDBQueries } from './db';
import { otel } from './middleware';
import { BlogPage } from './blogPage';




const app = new Hono()
app.use(otel({ captureRequestBody: true, captureResponseBody: true }));

app.get('/', async (c) => {
    const config = {
        // @ts-ignore
        host: Config.DATABASE_HOST,
        // @ts-ignore
        username: Config.DATABASE_USERNAME,
        // @ts-ignore
        password: Config.DATABASE_PASSWORD,
        fetch: instrumentClientFetch(fetch, () => ({ includeTraceContext: true}))
    }
    try {
        const results = await runSomeRandomDBQueries(config, 1)
        return c.html(<BlogPage data={results} />)
    } catch(e) {
        console.error(e)
        return c.text(JSON.stringify(e))
    }
    
})

export const handler = handle(app)