import { createMemo } from 'solid-js'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/atom-one-dark.min.css'
import type { Loader } from '../core/types'
import * as docs from './docs'
import styles from './DescriptionPanel.module.css'

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

export default function DescriptionPanel(props: {
  fieldId: string
  loader: Loader
}) {
  const key = () =>
    props.fieldId === 'mod_loader' ? `loader_${props.loader}` : props.fieldId

  const html = createMemo(() => {
    const md = (docs as Record<string, string>)[key()] ?? docs.welcome
    return marked.parse(md) as string
  })

  return (
    <aside class={styles.panel}>
      <div class={styles.header}>documentation</div>
      <div class={styles.body} innerHTML={html()} />
    </aside>
  )
}
