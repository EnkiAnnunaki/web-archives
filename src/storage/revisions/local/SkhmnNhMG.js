import browser from 'webextension-polyfill';

const message = 'Add installTime, searchCount and contribPageLastOpen';

const revision = 'SkhmnNhMG';
const downRevision = 'SJltHx2rW';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};
  changes.installTime = new Date().getTime();
  changes.searchCount = 0;
  changes.contribPageLastOpen = 0;

  changes.storageVersion = revision;
  return storage.set(changes);
}

export {message, revision, upgrade};
