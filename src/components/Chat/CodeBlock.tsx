import { createContext, memo, useContext } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { refractor } from "refractor/all"

import { Copy } from "lucide-react"

import CopyButton from "./CopyButton"
import styles from "./codeBlock.module.scss"

export const ShowCodeCopy = createContext(false)

interface CodeBlockProps {
  code: string
  language: string | null
}

const highlighterStyle = {
  margin: 0,
  padding: "12px 14px",
  background: "transparent",
  fontSize: "0.85rem",
  lineHeight: 1.5,
  overflow: "visible",
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const knownLanguage = language && refractor.registered(language) ? language : null
  const showCopy = useContext(ShowCodeCopy)

  return (
    <div className={styles.wrap}>
      {(knownLanguage || showCopy) ? (
        <div className={styles.toolbar}>
          <span className={styles.lang}>{knownLanguage ?? ""}</span>
          {showCopy ? (
            <CopyButton
              text={code}
              idle="Copy"
              className={styles.copy}
              failedClassName={styles.failed}
              icon={<Copy size={14} />}
            />
          ) : null}
        </div>
      ) : null}
      <div className={styles.frame}>
        {knownLanguage ? (
          <SyntaxHighlighter
            language={knownLanguage}
            style={oneDark}
            PreTag="div"
            customStyle={highlighterStyle}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <pre className={styles.plain}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

export default memo(
  CodeBlock,
  (prev, next) => prev.code === next.code && prev.language === next.language
)
