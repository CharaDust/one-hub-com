/**
 * Maps server option LoginRedirectPath to a client route.
 * zh_CN UI: 「控制台」console, 「聊天」playground, 「令牌」token
 */
export function pathFromLoginRedirectSetting(loginRedirectPath) {
  switch (loginRedirectPath) {
    case 'playground':
      return '/panel/playground';
    case 'token':
      return '/panel/token';
    case 'console':
    default:
      return '/panel';
  }
}
