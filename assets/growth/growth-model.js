/* Discrete Solow model: y = A k^alpha. Rates are annual fractions. */
(function (root) {
	function simulate(data, breaks, params, alpha, initialCapital) {
		let capital = initialCapital;
		let productivity = data[0].y / Math.pow(initialCapital, alpha);

		return data.map(row => {
			const regime = breaks.filter(year => row.year >= year).length;
			const assumptions = params[regime];
			const output = productivity * Math.pow(capital, alpha);
			if (!(output > 0) || !Number.isFinite(output)) {
				throw new Error('These assumptions produce an invalid model path. Try less extreme rates or a different initial state.');
			}
			capital = ((1 - assumptions.delta) * capital + assumptions.s * output) / (1 + assumptions.n);
			productivity *= 1 + assumptions.gA;
			return { year: row.year, y: output };
		});
	}

	function estimate(data, breaks, alpha) {
		return Array.from({ length: breaks.length + 1 }, (_, index) => {
			const start = breaks[index - 1] ?? -Infinity;
			const end = breaks[index] ?? Infinity;
			const rows = data.filter(row => row.year >= start && row.year < end);
			const first = rows[0];
			const last = rows.at(-1);
			const mean = key => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
			const productivityGrowth = Math.expm1(
				(Math.log(last.y / first.y) - alpha * Math.log(last.k / first.k)) / (last.year - first.year)
			);
			return {
				s: mean('s'),
				n: mean('n'),
				delta: mean('delta'),
				gA: Math.max(-.05, Math.min(.15, productivityGrowth))
			};
		});
	}

	function loss(data, breaks, params, alpha, initialCapital) {
		const path = simulate(data, breaks, params, alpha, initialCapital);
		return Math.sqrt(path.reduce((sum, row, index) => {
			return sum + Math.log(row.y / data[index].y) ** 2;
		}, 0) / path.length);
	}

	// Preserve the supplied fitter: coordinate descent and golden-section search.
	function fit(data, breaks, params, alpha, initialCapital) {
		const before = loss(data, breaks, params, alpha, initialCapital);
		for (let sweep = 0; sweep < 30; sweep++) {
			const previous = loss(data, breaks, params, alpha, initialCapital);
			for (const regime of params) {
				const original = regime.gA;
				let lower = -.05;
				let upper = .15;
				const ratio = (Math.sqrt(5) - 1) / 2;
				function objective(value) {
					regime.gA = value;
					try {
						return loss(data, breaks, params, alpha, initialCapital);
					} catch {
						return Infinity;
					}
				}

				let x1 = upper - ratio * (upper - lower);
				let x2 = lower + ratio * (upper - lower);
				let f1 = objective(x1);
				let f2 = objective(x2);
				for (let iteration = 0; iteration < 45; iteration++) {
					if (f1 < f2) {
						upper = x2;
						x2 = x1;
						f2 = f1;
						x1 = upper - ratio * (upper - lower);
						f1 = objective(x1);
					} else {
						lower = x1;
						x1 = x2;
						f1 = f2;
						x2 = lower + ratio * (upper - lower);
						f2 = objective(x2);
					}
				}
				const candidate = (lower + upper) / 2;
				const candidateLoss = objective(candidate);
				const originalLoss = objective(original);
				regime.gA = candidateLoss < originalLoss ? candidate : original;
			}
			if (previous - loss(data, breaks, params, alpha, initialCapital) < 1e-10) break;
		}
		return { before, after: loss(data, breaks, params, alpha, initialCapital) };
	}

	root.GrowthModel = { simulate, estimate, loss, fit };
})(typeof window === 'undefined' ? globalThis : window);
