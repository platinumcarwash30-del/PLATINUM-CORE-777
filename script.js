const storyChapters = [
  { number: '01 / 30', title: 'Every big journey starts in reality.', image: 'assets/story/01.png' },
  { number: '02 / 30', title: 'It is not always easy.', image: 'assets/story/02.png' },
  { number: '03 / 30', title: 'Real work. Real results.', image: 'assets/story/03.png' },
  { number: '04 / 30', title: 'Details make the difference.', image: 'assets/story/04.png' },
  { number: '05 / 30', title: 'Hard work brings smiles.', image: 'assets/story/05.png' },
  { number: '06 / 30', title: 'More than a car. A lifestyle.', image: 'assets/story/06.png' },
  { number: '07 / 30', title: 'Premium cars. Real trust.', image: 'assets/story/07.png' },
  { number: '08 / 30', title: 'Excellence in every detail.', image: 'assets/story/08.png' },
  { number: '09 / 30', title: 'Iconic cars deserve iconic care.', image: 'assets/story/09.png' },
  { number: '10 / 30', title: 'The standard keeps rising.', image: 'assets/story/10.png' },
  { number: '11 / 30', title: 'One team. One direction.', image: 'assets/story/11.png' },
  { number: '12 / 30', title: 'A bigger idea takes shape.', image: 'assets/story/12.png' },
  { number: '13 / 30', title: 'PLATINUM CORE 777 is born.', image: 'assets/story/13.png' },
  { number: '14 / 30', title: 'From problems to solutions.', image: 'assets/story/14.png' },
  { number: '15 / 30', title: 'Ideas become systems.', image: 'assets/story/15.png' },
  { number: '16 / 30', title: 'Built around real people.', image: 'assets/story/16.png' },
  { number: '17 / 30', title: 'A brighter way to work.', image: 'assets/story/17.png' },
  { number: '18 / 30', title: 'The next chapter begins.', image: 'assets/story/18.png' },
  { number: 'CORE / 01', title: 'Less chaos. More control.', image: 'assets/story/19.png' },
  { number: 'CORE / 02', title: 'From stress to success.', image: 'assets/story/20.png' },
  { number: 'CORE / 03', title: 'A business that works. A life that matters.', image: 'assets/story/21.png' }
];

const storyGrid = document.querySelector('#story-grid');
const year = document.querySelector('#year');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

if (storyGrid) {
  storyGrid.innerHTML = storyChapters.map((chapter) => `
    <article class="story-card">
      <img src="${chapter.image}" alt="${chapter.title}" loading="lazy" />
      <div class="story-card__label">
        <span class="story-card__number">${chapter.number}</span>
        <h3 class="story-card__title">${chapter.title}</h3>
      </div>
    </article>
  `).join('');
}

if (year) year.textContent = new Date().getFullYear();

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
