import { connect } from '@planetscale/database'
import { BlogResult, CommentResult, UserResult } from './blogPage';


export async function runSomeRandomDBQueries(config: any, blog_id: number) {
    const conn = connect({
        host: "us-west.connect.psdb.cloud",
        username: config.username,
        password: config.password,
        fetch: config.fetch
    })
    const blogResults = await conn.execute('select * from blogs where blog_id=?', [blog_id])

    const blogId = (blogResults.rows[0] as { blog_id: string }).blog_id;

    const commentResults = await conn.execute('select * from comments where blog_id=?', [blogId])
    const comments = commentResults.rows as CommentResult[];
    const users = await Promise.all(comments.map(async (comment) => {
        const userResults = await conn.execute('select * from users where user_id=?', [comment.user_id])
        return userResults.rows[0]
    }));
    return {
        blogResults: blogResults.rows as BlogResult[],
        commentResults: comments,
        userResults: users as UserResult[],
    }
}
