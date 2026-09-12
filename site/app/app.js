import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const config = window.STORYLOOM_CONFIG ?? {};
const isConfigured = /^https:\/\/.+\.supabase\.co$/i.test(config.supabaseUrl ?? '')
  && typeof config.supabasePublishableKey === 'string'
  && config.supabasePublishableKey.length > 20;

const elements = {
  setup: document.querySelector('#setup-panel'),
  hero: document.querySelector('.hero'),
  toolbar: document.querySelector('.toolbar'),
  layout: document.querySelector('.layout'),
  authButton: document.querySelector('#auth-button'),
  publishButton: document.querySelector('#publish-button'),
  authDialog: document.querySelector('#auth-dialog'),
  authForm: document.querySelector('#auth-form'),
  authTitle: document.querySelector('#auth-title'),
  authCopy: document.querySelector('#auth-copy'),
  authMode: document.querySelector('#auth-mode'),
  authSubmit: document.querySelector('#auth-submit'),
  authClose: document.querySelector('#auth-close'),
  nameLabel: document.querySelector('#display-name-label'),
  termsLabel: document.querySelector('#terms-label'),
  notice: document.querySelector('#notice'),
  search: document.querySelector('#search'),
  refreshButton: document.querySelector('#refresh-button'),
  storyList: document.querySelector('#story-list'),
  storyCount: document.querySelector('#story-count'),
  storyDetail: document.querySelector('#story-detail'),
  writerPanel: document.querySelector('#writer-panel'),
  storyForm: document.querySelector('#story-form'),
  myStoriesPanel: document.querySelector('#my-stories-panel'),
  myStoriesList: document.querySelector('#my-stories-list'),
  moderationPanel: document.querySelector('#moderation-panel'),
  moderationList: document.querySelector('#moderation-list'),
  reportsPanel: document.querySelector('#reports-panel'),
  reportsList: document.querySelector('#reports-list'),
  reportDialog: document.querySelector('#report-dialog'),
  reportForm: document.querySelector('#report-form'),
  reportClose: document.querySelector('#report-close')
};

const state = {
  client: isConfigured ? createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null,
  session: null,
  profile: null,
  stories: [],
  currentStoryId: null,
  blockedIds: new Set(),
  authMode: 'signin',
  reportTarget: null
};

function clear(node) {
  node.replaceChildren();
}

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.type) node.type = options.type;
  if (options.name) node.name = options.name;
  if (options.value !== undefined) node.value = options.value;
  if (options.hidden !== undefined) node.hidden = options.hidden;
  if (options.disabled !== undefined) node.disabled = options.disabled;
  if (options.title) node.title = options.title;
  if (options.ariaLabel) node.setAttribute('aria-label', options.ariaLabel);
  if (options.href) {
    node.href = options.href;
    if (options.target) {
      node.target = options.target;
      node.rel = 'noreferrer';
    }
  }
  if (options.onClick) node.addEventListener('click', options.onClick);
  if (options.onSubmit) node.addEventListener('submit', options.onSubmit);
  for (const child of children) node.append(child);
  return node;
}

function showNotice(message, kind = 'info') {
  elements.notice.textContent = message;
  elements.notice.dataset.kind = kind;
  elements.notice.hidden = false;
}

function hideNotice() {
  elements.notice.hidden = true;
  elements.notice.textContent = '';
}

function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  console.error(error);
  const message = error?.message ?? '';
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.';
  if (/email not confirmed/i.test(message)) return 'Confirm your email address, then sign in.';
  if (/already registered|already been registered/i.test(message)) return 'An account with this email already exists. Try signing in.';
  if (/password should be at least/i.test(message)) return 'Use a password with at least 12 characters.';
  if (/rate limit/i.test(message)) return 'Please slow down and try again in a few minutes.';
  if (/row-level security|permission denied|not authorized/i.test(message)) return 'You do not have permission to do that.';
  return fallback;
}

function profileName(profile, fallback = 'Storyloom writer') {
  const item = Array.isArray(profile) ? profile[0] : profile;
  return item?.display_name ?? fallback;
}

function authorName(row) {
  return profileName(row.author);
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

function createButton(text, onClick, className = 'text-button') {
  return element('button', { type: 'button', className, text, onClick });
}

function requireSession() {
  if (state.session && state.profile) return true;
  showAuthDialog();
  showNotice('Sign in to use community features.');
  return false;
}

function renderHeader() {
  if (state.session && state.profile) {
    elements.authButton.textContent = `Sign out · ${state.profile.display_name}`;
    elements.publishButton.disabled = false;
  } else {
    elements.authButton.textContent = 'Sign in';
    elements.publishButton.disabled = false;
  }
}

function showSetupMode() {
  elements.setup.hidden = false;
  elements.hero.hidden = true;
  elements.toolbar.hidden = true;
  elements.layout.hidden = true;
  elements.authButton.disabled = true;
  elements.publishButton.disabled = true;
}

function renderStories() {
  clear(elements.storyList);
  const query = elements.search.value.trim().toLocaleLowerCase();
  const results = state.stories.filter((story) => {
    const searchable = `${story.title} ${story.summary} ${story.genre} ${authorName(story)}`.toLocaleLowerCase();
    return !query || searchable.includes(query);
  });
  elements.storyCount.textContent = `${results.length} ${results.length === 1 ? 'story' : 'stories'}`;
  if (!results.length) {
    elements.storyList.append(element('p', { className: 'muted', text: query ? 'No safe published stories match that search.' : 'No stories have been published yet.' }));
    return;
  }
  for (const story of results) {
    const card = element('button', {
      type: 'button',
      className: 'story-card',
      ariaLabel: `Read ${story.title}`,
      onClick: () => openStory(story.id)
    });
    card.append(
      element('small', { text: `${story.genre} · ${story.content_rating}` }),
      element('h3', { text: story.title }),
      element('p', { text: `by ${authorName(story)}` }),
      element('p', { text: story.summary })
    );
    elements.storyList.append(card);
  }
}

async function loadStories() {
  if (!state.client) return;
  const { data, error } = await state.client
    .from('stories')
    .select('id,title,summary,genre,content_rating,published_at,author_id,author:profiles!stories_author_id_fkey(display_name)')
    .order('published_at', { ascending: false })
    .limit(60);
  if (error) {
    showNotice(friendlyError(error, 'Stories could not be loaded yet.'), 'error');
    return;
  }
  state.stories = data ?? [];
  renderStories();
}

async function refreshIdentity() {
  if (!state.session) {
    state.profile = null;
    state.blockedIds = new Set();
    elements.writerPanel.hidden = true;
    elements.myStoriesPanel.hidden = true;
    elements.moderationPanel.hidden = true;
    elements.reportsPanel.hidden = true;
    renderHeader();
    return;
  }
  const [{ data: profile, error: profileError }, { data: blocks, error: blocksError }] = await Promise.all([
    state.client.from('profiles').select('id,display_name,is_admin').eq('id', state.session.user.id).maybeSingle(),
    state.client.from('user_blocks').select('blocked_id').eq('blocker_id', state.session.user.id)
  ]);
  if (profileError || blocksError || !profile) {
    showNotice('Your account is not ready yet. If you just registered, confirm your email and sign in again.', 'error');
    state.profile = null;
    return;
  }
  state.profile = profile;
  state.blockedIds = new Set((blocks ?? []).map((row) => row.blocked_id));
  renderHeader();
  elements.writerPanel.hidden = false;
  elements.myStoriesPanel.hidden = false;
  elements.moderationPanel.hidden = !profile.is_admin;
  elements.reportsPanel.hidden = !profile.is_admin;
  await loadMyStories();
  if (profile.is_admin) await Promise.all([loadModerationQueue(), loadReports()]);
}

async function openStory(id) {
  state.currentStoryId = id;
  clear(elements.storyDetail);
  elements.storyDetail.append(element('p', { className: 'muted', text: 'Loading story…' }));
  const storyResult = await state.client
    .from('stories')
    .select('id,title,summary,body,genre,content_rating,published_at,author_id,author:profiles!stories_author_id_fkey(display_name)')
    .eq('id', id)
    .maybeSingle();
  if (storyResult.error || !storyResult.data) {
    clear(elements.storyDetail);
    elements.storyDetail.append(element('p', { className: 'muted', text: 'This story is unavailable or no longer public.' }));
    return;
  }
  const story = storyResult.data;
  const [commentsResult, reviewsResult] = await Promise.all([
    state.client.from('comments').select('id,body,created_at,author_id,author:profiles!comments_author_id_fkey(display_name)').eq('story_id', id).eq('state', 'visible').order('created_at', { ascending: true }),
    state.client.from('reviews').select('id,rating,body,created_at,author_id,author:profiles!reviews_author_id_fkey(display_name)').eq('story_id', id).eq('state', 'visible').order('created_at', { ascending: false })
  ]);
  renderStoryDetail(story, commentsResult.data ?? [], reviewsResult.data ?? []);
}

function detailHeading(story) {
  const wrap = element('section');
  wrap.append(
    element('div', { className: 'eyebrow', text: `${story.genre} · ${story.content_rating}` }),
    element('h2', { text: story.title }),
    element('p', { className: 'muted', text: `by ${authorName(story)} · ${formatDate(story.published_at)}` }),
    element('p', { className: 'muted', text: story.summary }),
    element('div', { className: 'story-body', text: story.body })
  );
  return wrap;
}

function renderStoryDetail(story, comments, reviews) {
  clear(elements.storyDetail);
  elements.storyDetail.append(detailHeading(story));
  const score = reviews.length ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1) : null;
  const actions = element('div', { className: 'detail-actions' });
  if (score) actions.append(element('span', { text: `★ ${score} from ${reviews.length} reader${reviews.length === 1 ? '' : 's'}` }));
  if (state.session && state.profile && story.author_id !== state.profile.id) {
    const isBlocked = state.blockedIds.has(story.author_id);
    actions.append(createButton(isBlocked ? 'Unblock author' : 'Block author', () => toggleBlock(story.author_id)));
    actions.append(createButton('Report story', () => openReport({ storyId: story.id })));
  }
  elements.storyDetail.append(actions);

  const reviewSection = element('section');
  reviewSection.append(element('h3', { text: 'Reader reviews' }));
  if (!reviews.length) reviewSection.append(element('p', { className: 'muted', text: 'No reader reviews yet.' }));
  for (const review of reviews) {
    const card = element('article', { className: 'comment' });
    const line = element('div');
    line.append(element('strong', { text: `${authorName(review)} · ★ ${review.rating}` }));
    if (state.session && state.profile && review.author_id !== state.profile.id) line.append(document.createTextNode(' '), createButton('Report', () => openReport({ storyId: story.id, reviewId: review.id })));
    card.append(line, element('p', { text: review.body || 'No written review.' }));
    reviewSection.append(card);
  }
  if (state.session && state.profile && story.author_id !== state.profile.id) reviewSection.append(createReviewForm(story.id));
  elements.storyDetail.append(reviewSection);

  const commentSection = element('section');
  commentSection.append(element('h3', { text: 'Discussion' }));
  if (!comments.length) commentSection.append(element('p', { className: 'muted', text: 'Start the conversation thoughtfully.' }));
  for (const comment of comments) {
    const card = element('article', { className: 'comment' });
    const line = element('div');
    line.append(element('strong', { text: authorName(comment) }));
    if (state.session && state.profile && comment.author_id !== state.profile.id) line.append(document.createTextNode(' '), createButton('Report', () => openReport({ storyId: story.id, commentId: comment.id })));
    card.append(line, element('p', { text: comment.body }));
    commentSection.append(card);
  }
  if (state.session && state.profile) commentSection.append(createCommentForm(story.id));
  else commentSection.append(element('p', { className: 'muted', text: 'Sign in to add a comment or report a concern.' }));
  elements.storyDetail.append(commentSection);
}

function createCommentForm(storyId) {
  const form = element('form', { onSubmit: async (event) => {
    event.preventDefault();
    const body = new FormData(form).get('comment')?.toString().trim() ?? '';
    if (body.length < 2) return showNotice('A comment needs at least two characters.', 'error');
    const { error } = await state.client.from('comments').insert({ story_id: storyId, author_id: state.profile.id, body });
    if (error) return showNotice(friendlyError(error, 'Your comment could not be posted.'), 'error');
    form.reset();
    showNotice('Comment posted.');
    await openStory(storyId);
  }});
  const label = element('label', { text: 'Add a respectful comment' });
  const field = element('textarea', { name: 'comment' });
  field.required = true; field.minLength = 2; field.maxLength = 2000; field.rows = 4;
  label.append(field);
  form.append(label, createButton('Post comment', null, 'button'));
  form.querySelector('button').type = 'submit';
  return form;
}

function createReviewForm(storyId) {
  const form = element('form', { onSubmit: async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const rating = Number(data.get('rating'));
    const body = data.get('review')?.toString().trim() ?? '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return showNotice('Choose a rating from 1 to 5.', 'error');
    if (body && body.length < 2) return showNotice('Write at least two characters or leave the review text blank.', 'error');
    const { error } = await state.client.from('reviews').upsert({ story_id: storyId, author_id: state.profile.id, rating, body: body || null }, { onConflict: 'story_id,author_id' });
    if (error) return showNotice(friendlyError(error, 'Your review could not be saved.'), 'error');
    showNotice('Review saved.');
    await openStory(storyId);
  }});
  const ratingLabel = element('label', { text: 'Your rating' });
  const select = element('select', { name: 'rating' });
  for (let score = 5; score >= 1; score -= 1) select.append(element('option', { value: String(score), text: `${score} star${score === 1 ? '' : 's'}` }));
  ratingLabel.append(select);
  const textLabel = element('label', { text: 'Review (optional)' });
  const field = element('textarea', { name: 'review' });
  field.maxLength = 2000; field.rows = 3;
  textLabel.append(field);
  form.append(ratingLabel, textLabel, createButton('Save review', null, 'button'));
  form.querySelector('button').type = 'submit';
  return form;
}

function openReport(target) {
  if (!requireSession()) return;
  state.reportTarget = target;
  elements.reportForm.reset();
  elements.reportDialog.showModal();
}

async function toggleBlock(authorId) {
  if (!requireSession()) return;
  const isBlocked = state.blockedIds.has(authorId);
  const request = isBlocked
    ? state.client.from('user_blocks').delete().eq('blocker_id', state.profile.id).eq('blocked_id', authorId)
    : state.client.from('user_blocks').insert({ blocker_id: state.profile.id, blocked_id: authorId });
  const { error } = await request;
  if (error) return showNotice(friendlyError(error, 'That block setting could not be changed.'), 'error');
  showNotice(isBlocked ? 'Author unblocked.' : 'Author blocked. Their public stories and comments are hidden for you.');
  await refreshIdentity();
  await loadStories();
  clear(elements.storyDetail);
  elements.storyDetail.append(element('p', { className: 'muted', text: isBlocked ? 'Author unblocked. Choose a story to continue.' : 'Author blocked.' }));
}

async function submitStory(event) {
  event.preventDefault();
  if (!requireSession()) return;
  const data = new FormData(elements.storyForm);
  const payload = {
    author_id: state.profile.id,
    title: data.get('title')?.toString().trim(),
    genre: data.get('genre')?.toString().trim(),
    summary: data.get('summary')?.toString().trim(),
    body: data.get('body')?.toString().trim(),
    content_rating: data.get('contentRating')
  };
  const { error } = await state.client.from('stories').insert(payload);
  if (error) return showNotice(friendlyError(error, 'Your story could not be submitted.'), 'error');
  elements.storyForm.reset();
  showNotice('Story submitted for moderation. It will not appear publicly until approved.');
  await loadMyStories();
  if (state.profile.is_admin) await loadModerationQueue();
}

async function loadMyStories() {
  if (!state.profile) return;
  const { data, error } = await state.client
    .from('stories')
    .select('id,title,status,review_note,content_rating,updated_at')
    .eq('author_id', state.profile.id)
    .order('updated_at', { ascending: false });
  clear(elements.myStoriesList);
  if (error) {
    elements.myStoriesList.append(element('p', { className: 'muted', text: 'Your submissions could not be loaded.' }));
    return;
  }
  if (!data?.length) {
    elements.myStoriesList.append(element('p', { className: 'muted', text: 'Your submitted stories will appear here.' }));
    return;
  }
  for (const story of data) {
    const item = element('article', { className: 'moderation-item' });
    item.append(
      element('h3', { text: story.title }),
      element('p', { className: 'status-line', text: `${story.status} · ${story.content_rating}` })
    );
    if (story.review_note) item.append(element('p', { className: 'muted', text: `Moderator note: ${story.review_note}` }));
    elements.myStoriesList.append(item);
  }
}

async function loadModerationQueue() {
  if (!state.profile?.is_admin) return;
  const { data, error } = await state.client
    .from('stories')
    .select('id,title,summary,body,genre,content_rating,created_at,author:profiles!stories_author_id_fkey(display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  clear(elements.moderationList);
  if (error) {
    elements.moderationList.append(element('p', { className: 'muted', text: 'Moderation queue could not be loaded.' }));
    return;
  }
  if (!data?.length) {
    elements.moderationList.append(element('p', { className: 'muted', text: 'No pending stories.' }));
    return;
  }
  for (const story of data) {
    const item = element('article', { className: 'moderation-item' });
    const submittedText = element('details');
    submittedText.append(element('summary', { text: 'Read submitted text' }), element('p', { className: 'story-body', text: story.body }));
    item.append(element('h3', { text: story.title }), element('p', { className: 'muted', text: `${authorName(story)} · ${story.genre} · ${story.content_rating}` }), element('p', { text: story.summary }), submittedText);
    const note = element('input'); note.type = 'text'; note.maxLength = 1000; note.placeholder = 'Review note (optional)'; note.setAttribute('aria-label', `Review note for ${story.title}`);
    const actions = element('div', { className: 'detail-actions' });
    actions.append(
      createButton('Publish', () => moderateStory(story.id, 'published', note.value), 'button'),
      createButton('Lock', () => moderateStory(story.id, 'locked', note.value)),
      createButton('Reject', () => moderateStory(story.id, 'rejected', note.value))
    );
    item.append(note, actions);
    elements.moderationList.append(item);
  }
}

async function moderateStory(id, status, note) {
  const update = {
    status,
    is_locked: status === 'locked',
    review_note: note.trim() || null,
    reviewed_by: state.profile.id,
    published_at: status === 'published' ? new Date().toISOString() : null
  };
  const { error } = await state.client.from('stories').update(update).eq('id', id);
  if (error) return showNotice(friendlyError(error, 'That moderation action could not be saved.'), 'error');
  showNotice(`Story ${status}.`);
  await Promise.all([loadModerationQueue(), loadStories()]);
}

async function loadReports() {
  if (!state.profile?.is_admin) return;
  const { data, error } = await state.client
    .from('reports')
    .select('id,story_id,comment_id,review_id,reason,status,created_at,reporter:profiles!reports_reporter_id_fkey(display_name),reported_story:stories!reports_story_id_fkey(title),reported_comment:comments!reports_comment_id_fkey(body),reported_review:reviews!reports_review_id_fkey(body,rating)')
    .neq('status', 'resolved')
    .order('created_at', { ascending: true });
  clear(elements.reportsList);
  if (error) {
    elements.reportsList.append(element('p', { className: 'muted', text: 'Reports could not be loaded.' }));
    return;
  }
  if (!data?.length) {
    elements.reportsList.append(element('p', { className: 'muted', text: 'No open reports.' }));
    return;
  }
  for (const report of data) {
    const item = element('article', { className: 'moderation-item' });
    item.append(
      element('h3', { text: report.review_id ? 'Review report' : report.comment_id ? 'Comment report' : 'Story report' }),
      element('p', { className: 'status-line', text: `${report.status} · from ${profileName(report.reporter, 'Storyloom member')}` }),
      element('p', { text: report.reason })
    );
    const targetText = report.reported_review
      ? `Reported review: ★ ${report.reported_review.rating} · ${report.reported_review.body || 'No written review.'}`
      : report.reported_comment
        ? `Reported comment: ${report.reported_comment.body}`
        : report.reported_story
          ? `Reported story: ${report.reported_story.title}`
          : 'Reported content is no longer available.';
    item.append(element('p', { className: 'muted', text: targetText }));
    const actions = element('div', { className: 'detail-actions' });
    if (report.status === 'new') actions.append(createButton('Mark reviewing', () => updateReport(report.id, 'reviewing')));
    if (report.comment_id) actions.append(createButton('Hide comment', () => hideComment(report.comment_id)));
    if (report.review_id) actions.append(createButton('Hide review', () => hideReview(report.review_id)));
    if (report.story_id) actions.append(createButton('Lock story', () => moderateStory(report.story_id, 'locked', 'Locked after a community report.')));
    actions.append(createButton('Resolve', () => updateReport(report.id, 'resolved'), 'button'));
    item.append(actions);
    elements.reportsList.append(item);
  }
}

async function updateReport(id, status) {
  const { error } = await state.client.from('reports').update({ status }).eq('id', id);
  if (error) return showNotice(friendlyError(error, 'That report could not be updated.'), 'error');
  showNotice(`Report marked ${status}.`);
  await loadReports();
}

async function hideComment(id) {
  const { error } = await state.client.from('comments').update({ state: 'hidden' }).eq('id', id);
  if (error) return showNotice(friendlyError(error, 'That comment could not be hidden.'), 'error');
  showNotice('Comment hidden from public discussion.');
  await loadReports();
  if (state.currentStoryId) await openStory(state.currentStoryId);
}

async function hideReview(id) {
  const { error } = await state.client.from('reviews').update({ state: 'hidden' }).eq('id', id);
  if (error) return showNotice(friendlyError(error, 'That review could not be hidden.'), 'error');
  showNotice('Review hidden from public discussion.');
  await loadReports();
  if (state.currentStoryId) await openStory(state.currentStoryId);
}

function showAuthDialog() {
  if (!elements.authDialog.open) elements.authDialog.showModal();
}

function renderAuthMode() {
  const isSignup = state.authMode === 'signup';
  elements.authTitle.textContent = isSignup ? 'Create your account' : 'Sign in';
  elements.authCopy.textContent = isSignup
    ? 'Create an account to publish, review, discuss, report, or block. You must be at least 13.'
    : 'Sign in to comment, review, report, block, or submit a story.';
  elements.authSubmit.textContent = isSignup ? 'Create account' : 'Sign in';
  elements.authMode.textContent = isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one';
  elements.nameLabel.hidden = !isSignup;
  elements.termsLabel.hidden = !isSignup;
  const nameInput = elements.authForm.elements.displayName;
  const termsInput = elements.authForm.elements.terms;
  nameInput.required = isSignup;
  termsInput.required = isSignup;
  elements.authForm.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
}

async function submitAuth(event) {
  event.preventDefault();
  const data = new FormData(elements.authForm);
  const email = data.get('email')?.toString().trim();
  const password = data.get('password')?.toString() ?? '';
  if (!email || password.length < 12) return showNotice('Use a valid email and a password with at least 12 characters.', 'error');
  let error;
  if (state.authMode === 'signup') {
    const displayName = data.get('displayName')?.toString().trim() ?? '';
    if (displayName.length < 2 || !data.get('terms')) return showNotice('Enter a display name and confirm your age and acceptance of the Terms and Privacy Notice.', 'error');
    ({ error } = await state.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, terms_accepted: 'yes', age_confirmed: 'yes' } }
    }));
    if (!error) showNotice('Check your email to confirm your account, then sign in.');
  } else {
    ({ error } = await state.client.auth.signInWithPassword({ email, password }));
    if (!error) showNotice('Signed in.');
  }
  if (error) return showNotice(friendlyError(error, 'Your account request could not be completed.'), 'error');
  elements.authDialog.close();
  elements.authForm.reset();
}

async function handleAuthButton() {
  if (state.session) {
    const { error } = await state.client.auth.signOut();
    if (error) showNotice(friendlyError(error, 'Could not sign out.'), 'error');
    else showNotice('Signed out.');
  } else {
    showAuthDialog();
  }
}

function bindEvents() {
  elements.authButton.addEventListener('click', handleAuthButton);
  elements.publishButton.addEventListener('click', () => {
    if (!requireSession()) return;
    elements.writerPanel.hidden = false;
    elements.writerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    elements.storyForm.elements.title.focus();
  });
  elements.authMode.addEventListener('click', () => {
    state.authMode = state.authMode === 'signin' ? 'signup' : 'signin';
    renderAuthMode();
  });
  elements.authClose.addEventListener('click', () => elements.authDialog.close());
  elements.reportClose.addEventListener('click', () => elements.reportDialog.close());
  elements.authForm.addEventListener('submit', submitAuth);
  elements.storyForm.addEventListener('submit', submitStory);
  elements.reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireSession() || !state.reportTarget) return;
    const reason = new FormData(elements.reportForm).get('reason')?.toString().trim() ?? '';
    if (reason.length < 5) return showNotice('Explain the problem in at least five characters.', 'error');
    const { error } = await state.client.from('reports').insert({
      reporter_id: state.profile.id,
      story_id: state.reportTarget.storyId ?? null,
      comment_id: state.reportTarget.commentId ?? null,
      review_id: state.reportTarget.reviewId ?? null,
      reason
    });
    if (error) return showNotice(friendlyError(error, 'Your report could not be sent.'), 'error');
    elements.reportDialog.close();
    showNotice('Report sent to moderators.');
  });
  elements.search.addEventListener('input', renderStories);
  elements.refreshButton.addEventListener('click', async () => {
    hideNotice();
    await loadStories();
    if (state.profile) await loadMyStories();
    if (state.profile?.is_admin) await Promise.all([loadModerationQueue(), loadReports()]);
    showNotice('Shelf refreshed.');
  });
}

async function start() {
  bindEvents();
  renderAuthMode();
  if (!isConfigured) return showSetupMode();
  const { data: { session } } = await state.client.auth.getSession();
  state.session = session;
  await refreshIdentity();
  await loadStories();
  state.client.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    await refreshIdentity();
    await loadStories();
  });
}

start().catch((error) => {
  console.error(error);
  showNotice('Storyloom could not start. Check the database configuration and try again.', 'error');
});
