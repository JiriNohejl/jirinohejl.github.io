/* The portfolio's compact Solow experiment. */
(function () {
	const host = document.querySelector('#growth-demo');
	if (!host) return;

	const investment = host.querySelector('#demo-investment');
	const productivity = host.querySelector('#demo-productivity');
	const capitalShare = 1 / 3;
	const data = Array.from({ length: 51 }, (_, year) => ({
		year,
		y: 1,
		k: Math.pow(.25 / (.05 + .01), 1 / (1 - capitalShare))
	}));

	// Put the common initial state on the baseline's balanced growth path.
	const initialCapital = data[0].k;
	const outputGrowthFactor = Math.pow(1.01, 1 / (1 - capitalShare));
	data[0].y = ((1.01 * outputGrowthFactor - (1 - .05)) / .25) * initialCapital;

	function path(s, gA) {
		return GrowthModel.simulate(data, [], [{ s, n: .01, delta: .05, gA }], capitalShare, initialCapital)
			.map(row => ({ ...row, y: 100 * row.y / data[0].y }));
	}

	function update() {
		const baseline = path(.25, .01);
		const scenario = path(Number(investment.value), Number(productivity.value));
		host.querySelector('#demo-s-value').value = `${(Number(investment.value) * 100).toFixed(0)}%`;
		host.querySelector('#demo-g-value').value = `${(Number(productivity.value) * 100).toFixed(1)}%`;

		drawGrowthChart(host.querySelector('.demo-chart'), [
			{ name: 'Baseline', data: baseline, color: 'var(--growth-baseline)', dash: true },
			{ name: 'Your experiment', data: scenario, color: 'var(--accent)' }
		], [], 'Years', 'Output per worker (index)');

		host.querySelector('#demo-result').textContent =
			`After 50 years, your experiment reaches an output index of ${scenario[50].y.toFixed(0)}, compared with ${baseline[50].y.toFixed(0)} for the baseline.`;
	}

	investment.addEventListener('input', update);
	productivity.addEventListener('input', update);
	host.querySelector('#demo-reset').addEventListener('click', () => {
		investment.value = .30;
		productivity.value = .01;
		update();
	});
	update();
})();
