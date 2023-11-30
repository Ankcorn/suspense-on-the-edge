import { Hono } from 'hono'
import { renderToReadableStream, Suspense } from 'hono/jsx/streaming'
const app = new Hono()

const AsyncComponent = async () => {
  await new Promise((r) => setTimeout(r, 5000)) 
  return <div>Done!</div>
}

app.get('/', (c) => {
  const stream = renderToReadableStream(
    <html>
      <body>
        <h1>This is a fantastic website</h1>
        <Suspense fallback={<div>loading...</div>}>
          <AsyncComponent />
        </Suspense>
      </body>
    </html>
  )
 
  return c.body(stream, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Transfer-Encoding': 'chunked',
    },
  })
})

export default app


