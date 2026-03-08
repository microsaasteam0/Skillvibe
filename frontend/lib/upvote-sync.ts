/**
 * Upvote Widget Sync
 * Dispatches custom events to synchronize Upvote widget with app authentication state
 */

export const syncUpvoteLogin = (user: any) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('upvote:login', {
        detail: user,
      })
    );
  }
};

export const syncUpvoteLogout = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('upvote:logout'));
  }
};
