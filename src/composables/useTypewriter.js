/**
 * Typewriter — slowly reveal a body of text. Click anywhere to skip
 * to the end. Returns reactive `display` string and progress flags.
 */
import { ref, watch, onBeforeUnmount } from 'vue';
import { TIMING } from '@/utils/timing';

export function useTypewriter(textRef, opts = {}) {
  const speed = opts.speed ?? TIMING.TYPEWRITER_CHAR_MS;
  const onChar = opts.onChar ?? (() => {});
  const display = ref('');
  const done = ref(false);
  let timer = null;

  function start() {
    stop();
    display.value = '';
    done.value = false;
    const text = textRef.value || '';
    if (!text) { done.value = true; return; }
    let i = 0;
    timer = setInterval(() => {
      i++;
      const char = text[i - 1];
      display.value = text.slice(0, i);
      onChar(char);
      if (i >= text.length) { stop(); done.value = true; }
    }, speed);
  }

  function skip() {
    stop();
    display.value = textRef.value || '';
    done.value = true;
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  watch(textRef, (v) => {
    if (v == null) { display.value = ''; return; }
    start();
  }, { immediate: true });

  onBeforeUnmount(stop);

  return { display, done, skip, restart: start };
}
