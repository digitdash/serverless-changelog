export function parsePostFormData(formData) {
  const postDateSort = String(formData.get("postDateSort") || "");
  const postTitle = String(formData.get("postTitle") || "");
  const postSubtitle = String(formData.get("postSubtitle") || "");
  const postContent = String(formData.get("postContent") || "");
  const tagIds = formData.getAll("tagIds").map((value) => String(value));

  return {
    postDateSort,
    postTitle,
    postSubtitle,
    postContent,
    tagIds
  };
}

export function validatePostValues(values) {
  if (!values.postDateSort || !values.postTitle || !values.postSubtitle || !values.postContent) {
    return "Please complete the date, title, subtitle, and content fields.";
  }

  if (!values.tagIds?.length) {
    return "Select at least one tag for the post.";
  }

  return null;
}
