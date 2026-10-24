import { useEffect, useState } from "react"

interface CopyButtonProps {
  text: string
  idle: string
  className?: string
  failedClassName?: string
}

const CopyButton = ({ text, idle, className, failedClassName }: CopyButtonProps) => {
  const [notice, setNotice] = useState<{ kind: "copied" | "failed"; id: number } | null>(null)

  useEffect(() => {
    setNotice(null)
  }, [text])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const onClick = () => {
    const write = navigator.clipboard?.writeText
    if (!write) {
      setNotice({ kind: "failed", id: Date.now() })
      return
    }

    write.call(navigator.clipboard, text).then(
      () => setNotice({ kind: "copied", id: Date.now() }),
      () => setNotice({ kind: "failed", id: Date.now() })
    )
  }

  const label = notice?.kind === "copied" ? "Copied" : notice?.kind === "failed" ? "Copy failed" : idle
  const buttonClass = notice?.kind === "failed" && failedClassName
    ? `${className ?? ""} ${failedClassName}`.trim()
    : className

  return (
    <button type="button" className={buttonClass} onClick={onClick}>
      {label}
    </button>
  )
}

export default CopyButton
