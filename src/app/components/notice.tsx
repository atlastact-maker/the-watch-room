// The one notice. Every "done", "received", "not yet" and "that did not
// work" on the account pages is this: a coloured rule down the left, a
// plain heading, a sentence or two. The same shape whether it is a
// form's success state or a standing panel, so the site reads as one
// voice. Styled by the console's stylesheet so it matches the console.

import styles from "@/app/menu/watch-menu.module.css";

const TONES = {
  ok: styles.noticeOk,
  amber: styles.noticeAmber,
  critical: styles.noticeStop,
  info: styles.noticeInfo,
  neutral: "",
} as const;

export function Notice({ tone = "neutral", title, children, className = "" }: { tone?: keyof typeof TONES; title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`${styles.notice} ${TONES[tone]} ${className}`.trim()} role={tone === "critical" ? "alert" : "status"}>
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}
