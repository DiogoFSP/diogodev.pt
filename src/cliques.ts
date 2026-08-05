export function cliqueSimples(e: {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): boolean {
  return !e.button && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
