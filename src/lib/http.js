export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

export function redirect(location, status = 302) {
  return new Response(null, {
    status,
    headers: {
      location
    }
  });
}
