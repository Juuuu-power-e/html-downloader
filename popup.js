document.getElementById('downloadBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 제목 추출
        const getTitle = () => {
          const ogTitle = document.querySelector("meta[property='og:title']")
          if (ogTitle?.content) return ogTitle.content.trim()

          const docTitle = document.title
          if (docTitle) return docTitle.trim()

          const h1 = document.querySelector('h1')
          if (h1?.innerText) return h1.innerText.trim()

          return 'untitled'
        }

        // 본문 추출 (3단계 방식)
        const getMainText = () => {
          // 1단계: 셀렉터 우선 탐색
          const selectors = [
            'article',
            'main',
            '#articleBody',
            '.article_body',
            '.newsct_article',
            '.news-article',
            '#article-view-content-div',
            '#newsEndContents',
            '#newsct_article',
          ]
          for (const selector of selectors) {
            const el = document.querySelector(selector)
            if (el && el.innerText.trim().length > 200)
              return el.innerText.trim()
          }

          // 2단계: id/class에 'article'이 포함된 태그
          const candidates = Array.from(document.querySelectorAll('*')).filter(
            (el) => {
              const idClass = (el.id + ' ' + el.className).toLowerCase()
              return (
                idClass.includes('article') && el.innerText.trim().length > 200
              )
            }
          )
          if (candidates.length > 0) {
            return candidates
              .map((el) => el.innerText.trim())
              .reduce((a, b) => (a.length > b.length ? a : b))
          }

          // 3단계: 전체 중 가장 긴 텍스트 노드
          let longest = ''
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT
          )
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent?.trim()
            if (text && text.length > longest.length) {
              longest = text
            }
          }
          return longest
        }

        // 파일 저장 처리
        const title = getTitle()
        const content = getMainText()

        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const folderName = `${yyyy}-${mm}-${dd}_기사`
        const safeTitle = title.replace(/[^가-힣a-zA-Z0-9_\- ]/g, '')
        const fileName = `${folderName}/${safeTitle}.txt`

        const blob = new Blob(['\uFEFF' + `제목: ${title}\n\n${content}`], {
          type: 'text/plain',
        })
        const url = URL.createObjectURL(blob)

        chrome.runtime.sendMessage({ url, filename: fileName })
      },
    })
  })
})

// background 역할 대체
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.url && message.filename) {
    chrome.downloads.download(
      {
        url: message.url,
        filename: message.filename,
        saveAs: false,
      },
      () => {
        URL.revokeObjectURL(message.url)
      }
    )
  }
})
