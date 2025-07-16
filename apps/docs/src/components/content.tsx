import clsx from 'clsx'

export const Content = ({ children }: { children: React.ReactNode }) => (
  <div className={clsx('container', 'margin-vert--lg')}>{children}</div>
)
