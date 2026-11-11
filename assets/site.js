const menuButton = document.querySelector('.nav-toggle');
const navigation = document.querySelector('#main-navigation');
const compactNavigation = window.matchMedia('(max-width: 850px)');

function setMenuOpen(open) {
	navigation.hidden = !open;
	menuButton.setAttribute('aria-expanded', String(open));
}

function syncMenu() {
	const focusWasInNavigation = navigation.contains(document.activeElement);
	menuButton.hidden = !compactNavigation.matches;
	setMenuOpen(!compactNavigation.matches);
	if (compactNavigation.matches && focusWasInNavigation) menuButton.focus();
}

syncMenu();
compactNavigation.addEventListener('change', syncMenu);
menuButton.addEventListener('click', () => setMenuOpen(navigation.hidden));
document.querySelector('.navigation').addEventListener('keydown', event => {
	if (event.key === 'Escape' && compactNavigation.matches && !navigation.hidden) {
		setMenuOpen(false);
		menuButton.focus();
	}
});

const mediaTools = document.querySelector('#media-tools');

if (mediaTools) {
	const filters = [...mediaTools.querySelectorAll('[data-filter]')];
	const cards = [...document.querySelectorAll('.media-card[data-category]')];
	const search = document.querySelector('#media-search');
	const results = document.querySelector('#media-results');
	const emptyState = document.querySelector('#no-results');
	let selectedFormat = 'All';

	const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

	function filterMedia() {
		const terms = normalize(search.value).trim().split(/\s+/);
		let visible = 0;
		for (const card of cards) {
			const matchesFormat = selectedFormat === 'All' || card.dataset.category === selectedFormat;
			const searchableText = normalize(card.dataset.search || card.textContent);
			card.hidden = !matchesFormat || !terms.every(term => searchableText.includes(term));
			if (!card.hidden) visible++;
		}
		results.textContent = `${visible} ${visible === 1 ? 'item' : 'items'} · newest first`;
		emptyState.hidden = visible !== 0;
	}

	for (const button of filters) {
		button.addEventListener('click', () => {
			selectedFormat = button.dataset.filter;
			for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
			filterMedia();
		});
	}
	search.addEventListener('input', filterMedia);
	mediaTools.hidden = false;
	filterMedia();
}

const printButton = document.querySelector('#print-cv');
if (printButton) {
	printButton.hidden = false;
	printButton.addEventListener('click', () => window.print());
}
