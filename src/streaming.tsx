import { Hono } from 'hono'
import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { Suspense } from 'hono/jsx/streaming'
import { html } from 'hono/html'
import { connect } from '@planetscale/database'
import { instrument, ResolveConfigFn } from '@microlabs/otel-cf-workers'
import { otel } from './middleware'

export interface Env {
	BASELIME_API_KEY: string
    SERVICE_NAME: string
}

const app = new Hono()

let db: any;
function useDB() {
    try {
        if(db) {
            return db;
        }
        const context = useRequestContext()
        const config = {
            host: context.env.DATABASE_HOST,
            username: context.env.DATABASE_USERNAME,
            password: context.env.DATABASE_PASSWORD,
            // @ts-ignore
            fetch: (url, init) => {
                delete init['cache']
                return fetch(url, init)
            }
    
        }
        db = connect(config)
        return db;
    } catch(e) {
        console.log(e)
    }
    
}
const Blog = async (props: { blog_id: number }) => {
    const db = useDB();
    const blogResult = await db.execute('select * from blogs where blog_id=?', [props.blog_id])

    const blog = blogResult.rows[0] as { title: string, content: string, blog_id: number, author_id: string }
    return (<div class="p-4 bg-gray-100">
        <h1 class="text-3xl font-bold mb-2">{blog.title}</h1>
        <p class="text-gray-700 mb-4">{blog.content}</p>
        <Suspense fallback={<div>loading...</div>}>
            <Author user_id={blog.author_id} />
        </Suspense>
        <h2 class="text-2xl font-bold mt-6 mb-3">Comments</h2>
        <ul>
            <Suspense fallback={<div>loading...</div>}>
                <Comments blog_id={blog.blog_id} />
            </Suspense>
        </ul>
    </div>)
}


const Comments = async (props: { blog_id: number }) => {
    const db = useDB();
    const commentResults = await db.execute('select * from comments where blog_id=?', [props.blog_id])
    const comments = commentResults.rows as { comment_text: string, comment_id: string, created_at: string, user_id: string }[]
    return (<ul>

        {comments.map(comment => (
            <li key={comment.comment_id} class="mb-4">
                <p class="text-gray-700">{comment.comment_text}</p>
                <Suspense fallback={<div>loading...</div>}>
                    <Author user_id={comment.user_id} />
                </Suspense>
                <p class="text-gray-600">Posted at: {comment.created_at}</p>
            </li>
        ))}
    </ul>)
}


const Author = async (props: { user_id: string }) => {
    const db = useDB();
    const userResults = await db.execute('select * from users where user_id=?', [props.user_id])
    const user = userResults.rows[0] as { username: string }
    return <p class="text-gray-600">By: {user.username}</p>
}

app.use(otel())
app.get(
    '*',
    jsxRenderer(
        ({ children }) => {
            return (
                <html>
                    <head>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <script type="module">
                            {html`import {
    onCLS,
    onFID,
    onLCP,
    onTTFB
  } from 'https://unpkg.com/web-vitals@3/dist/web-vitals.attribution.js?module';

  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
  onTTFB(console.log);
  onTTFB((metric) => {
    const ttfb = document.getElementById('ttfb');
    ttfb.innerHTML = '<div class="bg-blue-500 text-white px-4 py-2"> TTFB ' + Math.floor(metric.value) + 'ms Rating=' + metric.rating + '</div>'
  });
`}
                        </script>
                    </head>
                    <body>
                        <div id="ttfb"></div>
                        <h1 class="text-3xl font-bold mb-2">I'm Gonna stream from the edge</h1>
                        {children}
                    </body>
                </html>
            )
        },
        { stream: true }
    )
)



app.get('/', (c) => {
    return c.render(
        <Suspense fallback={<div>loading...</div>}>
            <Blog blog_id={1} />
        </Suspense>
    )

})

const config: ResolveConfigFn = (env: Env, _trigger) => {
	return {
		exporter: {
			url: 'https://otel.baselime.cc/v1',
			headers: { 'x-api-key': env.BASELIME_API_KEY },
		},
		service: { name: env.SERVICE_NAME },
	}
}

export default instrument(app, config)

