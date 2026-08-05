const body = document.body;

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = value;
}

function setLink(selector, href, label) {
  const el = document.querySelector(selector);
  if (!el) return;

  if (!href || !label) {
    el.hidden = true;
    return;
  }

  el.hidden = false;
  el.textContent = label;
  el.setAttribute('href', href);
}

function setList(selector, rawItems) {
  const list = document.querySelector(selector);
  if (!list) return;

  list.innerHTML = '';
  const items = rawItems
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
}

const pageTitle = body.dataset.pageTitle || document.title;
if (pageTitle) {
  document.title = pageTitle;
}

setText('[data-role="brand"]', body.dataset.brand || 'USAS Class Timetable');
setText('[data-role="icon"]', body.dataset.icon || 'ERR');
setText('[data-role="eyebrow"]', body.dataset.eyebrow || 'Error');
setText('[data-role="title"]', body.dataset.title || 'Something went wrong.');
setText('[data-role="lead"]', body.dataset.lead || '');
setText('[data-role="callout-title"]', body.dataset.calloutTitle || 'What to do');

if (body.dataset.items) {
  setList('[data-role="items"]', body.dataset.items);
}

setLink('[data-role="primary"]', body.dataset.primaryHref || '/', body.dataset.primaryLabel || 'Go home');
setLink('[data-role="secondary"]', body.dataset.secondaryHref || '', body.dataset.secondaryLabel || '');
setText('[data-role="footer"]', body.dataset.footer || '');
