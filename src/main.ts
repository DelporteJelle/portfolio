import { mountBoards } from './hex';

/** The footer year, so it never goes stale. */
function stampYear(): void {
  const year = String(new Date().getFullYear());
  for (const node of document.querySelectorAll<HTMLElement>('[data-year]')) {
    node.textContent = year;
  }
}

/**
 * The resume PDF is this page printed through print.css, so the download
 * button opens the print dialog rather than serving a second file.
 */
function wirePrintButton(): void {
  for (const button of document.querySelectorAll<HTMLElement>('[data-print]')) {
    button.addEventListener('click', () => window.print());
  }
}

stampYear();
wirePrintButton();
mountBoards();
