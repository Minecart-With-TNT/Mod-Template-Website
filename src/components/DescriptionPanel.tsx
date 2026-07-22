import { createMemo } from 'solid-js'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/atom-one-dark.min.css'
import docs from '../docs'
import { getCurrentDoc } from '../store'
import styles from './DescriptionPanel.module.css'
import Card from './Card'

hljs.registerLanguage('java', java)

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return code
  },
}))

export default function DescriptionPanel() {
  const html = createMemo(() => {
    const md = docs[getCurrentDoc()] ?? docs['welcome']
    return marked.parse(md) as string
  })

  return (
    <Card title="documentation">
      <div class={styles.body} innerHTML={html()} />
    </Card>
  )
}
