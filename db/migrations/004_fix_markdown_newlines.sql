UPDATE posts
SET post_content = REPLACE(REPLACE(post_content, '\r\n', char(10)), '\n', char(10))
WHERE post_content LIKE '%\n%';
