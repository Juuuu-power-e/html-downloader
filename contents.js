function extractAndDownloadArticle() {
  // 제목 추출 시도
  const getTitle = () => {
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle?.content) return ogTitle.content.trim();

    const docTitle = document.title;
    if (docTitle) return docTitle.trim();

    const h1 = document.querySelector("h1");
    if (h1?.innerText) return h1.innerText.trim();

    return "untitled";
  };

  // 본문 추출 시도
  const getMainText = () => {
    const selectors = [
      "article",
      "main",
      "#articleBody",
      ".article_body",
      ".newsct_article",
      ".news-article",
      "#newsEndContents",
      "#newsct_article"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 200) return el.innerText.trim();
    }

    // fallback: 가장 긴 텍스트를 가진 요소 찾기
    let longest = "";
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walk.nextNode()) {
      const text = walk.currentNode.innerText;
      if (text && text.length > longest.length) {
        longest = text;
      }
    }
    return longest.trim();
  };

  const title = getTitle();
  const content = getMainText();
  const blob = new Blob([`제목: ${title}\n\n${content}`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^가-힣a-zA-Z0-9_\- ]/g, "")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
