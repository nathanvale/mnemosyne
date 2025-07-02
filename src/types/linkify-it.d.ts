declare module 'linkify-it' {
  interface LinkifyIt {
    match(text: string): Match[] | null
  }

  interface Match {
    schema: string
    index: number
    lastIndex: number
    raw: string
    text: string
    url: string
  }

  function linkifyit(): LinkifyIt
  export = linkifyit
}
