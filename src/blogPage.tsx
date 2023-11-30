import { html } from 'hono/html'

export interface Result {
    blogResults: BlogResult[];
    commentResults: CommentResult[];
    userResults: UserResult[];
}

export interface BlogResult {
    blog_id: number;
    title: string;
    content: string;
    author_id: number;
    created_at: Date;
}

export interface CommentResult {
    comment_id: number;
    blog_id: number;
    user_id: number;
    comment_text: string;
    created_at: Date;
}


export interface UserResult {
    user_id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
}


export function BlogPage(props: { data: Result }) {
    const blog = props.data.blogResults[0];
    const author = props.data.userResults.find(user => user.user_id === blog.author_id) || { username: 'Thomas' };
    const comments = props.data.commentResults.filter(comment => comment.blog_id === blog.blog_id);


    const users = props.data.userResults;
    return (
        <div className="blog-page">
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
    ttfb.innerHTML = '<div class="bg-blue-500 text-white px-4 py-2"> TTFB ' + Math.floor(metric.value) + 'ms </div>'
  });
`}
            </script>
            <div id="ttfb"></div>
            <h1 class="text-3xl font-bold mb-2">This is AWS ${process.env.AWS_REGION}</h1>
            <div class="p-4 bg-gray-100">
                <h1 class="text-3xl font-bold mb-2">{blog.title}</h1>
                <p class="text-gray-700 mb-4">{blog.content}</p>
                <p class="text-gray-600">Author: {author.username}</p>

                <h2 class="text-2xl font-bold mt-6 mb-3">Comments</h2>
                <ul>
                    {comments.map(comment => (
                        <li key={comment.comment_id} class="mb-4">
                            <p class="text-gray-700">{comment.comment_text}</p>
                            <p class="text-gray-600">By: {(users.find(user => user.user_id === comment.user_id) || { username: 'Thomas' }).username}</p>
                            <p class="text-gray-600">Posted at: {comment.created_at}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
} 