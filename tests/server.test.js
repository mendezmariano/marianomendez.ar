import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../scripts/serve.mjs';

async function request(url) {
  const result = {};
  await handleRequest({url},{writeHead(status,headers){result.status=status;result.headers=headers;},end(body){result.body=String(body);}});
  return result;
}
test('the homepage and JavaScript modules are served with their actual content and MIME types',async()=>{
  const home=await request('/');assert.equal(home.status,200);assert.match(home.headers['Content-Type'],/text\/html/);assert.match(home.body,/<html lang="es">/);
  const script=await request('/app.js');assert.equal(script.status,200);assert.match(script.headers['Content-Type'],/text\/javascript/);assert.match(script.body,/openTerminal/);
  const posts=await request('/posts.js');assert.equal(posts.status,200);assert.match(posts.headers['Content-Type'],/text\/javascript/);assert.match(posts.body,/export const posts/);assert.match(posts.body,/La curiosidad/);
});
test('missing files and malformed URLs return errors',async()=>{
  assert.equal((await request('/absent.txt')).status,404);assert.equal((await request('/%INVALID')).status,400);
});
test('encoded traversal cannot read files outside dist',async()=>{
  const result=await request('/..%2fpackage.json');assert.equal(result.status,403);assert.equal(result.body,'Forbidden');
});
