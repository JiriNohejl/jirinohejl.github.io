/* Studio state is kept in memory for the current page session. */
(function () {
	const element = id => document.getElementById(id);
	const clone = value => JSON.parse(JSON.stringify(value));
	const definitions = [
		['s', 'Investment rate', .01, 1, .005],
		['n', 'Labour force growth', -.1, .1, .001],
		['delta', 'Depreciation', 0, .2, .001],
		['gA', 'TFP growth', -.05, .15, .001]
	];
	let data;
	let breaks = [];
	let parameters = [];
	let alpha = .333;
	let initialCapital;
	let baseline = null;
	let selected = 0;

	function status(message) {
		element('status').textContent = message;
	}

	function render() {
		try {
			const series = [{
				name: element('country').value === 'CUSTOM' ? 'Uploaded data' : 'Teaching sample',
				data,
				color: 'var(--muted)'
			}];
			if (baseline) {
				series.push({ name: 'Saved baseline', data: baseline, color: 'var(--growth-baseline)', dash: true });
			}
			series.push({
				name: baseline ? 'Your experiment' : 'Model path',
				data: GrowthModel.simulate(data, breaks, parameters, alpha, initialCapital),
				color: 'var(--accent)'
			});
			element('studio-chart').hidden = false;
			drawGrowthChart(element('studio-chart'), series, breaks);
			element('clear-baseline').hidden = !baseline;
			element('alpha-value').value = alpha.toFixed(3);
		} catch (error) {
			element('studio-chart').hidden = true;
			status(error.message);
		}
	}

	function update(message) {
		status(message);
		render();
	}

	function controls() {
		element('regime').replaceChildren();
		parameters.forEach((regime, index) => {
			const firstYear = breaks[index - 1] ?? data[0].year;
			const lastYear = breaks[index] ? breaks[index] - 1 : data.at(-1).year;
			element('regime').add(new Option(`${index + 1} · ${firstYear}–${lastYear}`, index));
		});
		element('regime').value = selected;
		element('remove-break').disabled = selected === 0;
		element('parameters').replaceChildren();

		for (const [key, title, minimum, maximum, step] of definitions) {
			const label = document.createElement('label');
			const row = document.createElement('span');
			const output = document.createElement('output');
			const input = document.createElement('input');
			row.className = 'control-label';
			row.append(document.createTextNode(title), output);
			input.type = 'range';
			input.id = `param-${key}`;
			input.min = Math.min(minimum, parameters[selected][key]);
			input.max = Math.max(maximum, parameters[selected][key]);
			input.step = step;
			input.value = parameters[selected][key];
			label.htmlFor = input.id;
			output.htmlFor = input.id;
			output.value = `${(parameters[selected][key] * 100).toFixed(1)}%`;
			label.append(row, input);
			element('parameters').append(label);

			input.addEventListener('input', () => {
				parameters[selected][key] = Number(input.value);
				output.value = `${(Number(input.value) * 100).toFixed(1)}%`;
				update(baseline ? 'Comparing your changed assumptions with the saved baseline.' : 'Model updated. Save this path to compare an alternative.');
			});
		}
		element('initial-k').value = initialCapital;
		element('alpha').value = alpha;
	}

	function load() {
		const sample = GROWTH_SAMPLES[element('country').value];
		data = clone(sample.data);
		alpha = .333;
		initialCapital = data[0].k;
		breaks = [...(sample.default_breaks || [])];
		parameters = GrowthModel.estimate(data, breaks, alpha);
		baseline = null;
		selected = 0;
		element('break-form').hidden = true;
		element('data-caption').textContent = element('country').value === 'CUSTOM'
			? `${sample.name} · Uploaded data · ${data.length} annual observations`
			: `${sample.name} · Illustrative teaching sample · Source not verified`;
		controls();
		update('Starting parameters estimated from data. Change an assumption or fit TFP growth.');
	}

	for (const [code, sample] of Object.entries(GROWTH_SAMPLES)) {
		element('country').add(new Option(`Teaching sample: ${sample.name}`, code));
	}
	// Retain the starting dataset selected by the supplied project.
	// These bundled series have unverified provenance; they remain teaching samples.
	element('country').value = 'CHL';
	element('country').addEventListener('change', load);
	element('reset').addEventListener('click', load);
	element('regime').addEventListener('change', () => {
		selected = Number(element('regime').value);
		controls();
	});

	/* Compare alternative historical model paths. */
	element('keep-baseline').addEventListener('click', () => {
		try {
			baseline = GrowthModel.simulate(data, breaks, parameters, alpha, initialCapital);
			update('Baseline saved. Now change a parameter to compare model paths.');
		} catch (error) {
			status(error.message);
		}
	});
	element('clear-baseline').addEventListener('click', () => {
		baseline = null;
		update('Comparison cleared.');
	});
	element('estimate').addEventListener('click', () => {
		parameters = GrowthModel.estimate(data, breaks, alpha);
		controls();
		update('All regimes initialized from means and endpoint TFP growth. This is not an optimized fit.');
	});
	element('fit').addEventListener('click', () => {
		try {
			const result = GrowthModel.fit(data, breaks, parameters, alpha, initialCapital);
			controls();
			update(`TFP fit complete: log-RMSE ${result.before.toFixed(4)} → ${result.after.toFixed(4)}. Other parameters held fixed.`);
		} catch (error) {
			status(error.message);
		}
	});
	element('alpha').addEventListener('input', () => {
		alpha = Number(element('alpha').value);
		update('Capital share changed; initial TFP adjusts to preserve initial observed output.');
	});
	element('initial-k').addEventListener('change', () => {
		const value = Number(element('initial-k').value);
		if (!Number.isFinite(value) || value <= 0) {
			element('initial-k').value = initialCapital;
			status('Enter positive, finite initial capital.');
			return;
		}
		initialCapital = value;
		update('Initial capital changed; initial output remains anchored to the data.');
	});

	/* Add and remove structural breaks without silently re-estimating parameters. */
	element('add-break').addEventListener('click', () => {
		element('break-form').hidden = false;
		element('break-year').min = data[0].year + 2;
		element('break-year').max = data.at(-1).year - 1;
		element('break-year').value = Math.round((data[0].year + data.at(-1).year) / 2);
		element('break-year').focus();
	});
	element('cancel-break').addEventListener('click', () => {
		element('break-form').hidden = true;
	});
	element('break-form').addEventListener('submit', event => {
		event.preventDefault();
		const year = Number(element('break-year').value);
		const points = [data[0].year, ...breaks, data.at(-1).year + 1];
		if (!Number.isInteger(year) || points.some(point => Math.abs(point - year) < 2) || year <= data[0].year || year >= data.at(-1).year) {
			status('Each regime needs at least two annual observations. Choose a distinct interior year.');
			return;
		}
		const index = breaks.filter(point => point < year).length;
		parameters.splice(index + 1, 0, { ...parameters[index] });
		breaks.splice(index, 0, year);
		selected = index + 1;
		element('break-form').hidden = true;
		controls();
		update(`Break added at ${year}. The new regime inherits preceding assumptions; change them to explore a structural shift.`);
	});
	element('remove-break').addEventListener('click', () => {
		if (!selected) return;
		const year = breaks[selected - 1];
		breaks.splice(selected - 1, 1);
		parameters.splice(selected, 1);
		selected--;
		controls();
		update(`Break at ${year} removed; the preceding regime now continues through this period.`);
	});

	/* CSV data never leaves the browser. */
	element('upload').addEventListener('change', async () => {
		const file = element('upload').files[0];
		if (!file) return;
		try {
			const rows = parseCountryCSV(await file.text());
			GROWTH_SAMPLES.CUSTOM = { name: file.name, data: rows, default_breaks: [] };
			let option = element('country').querySelector('[value="CUSTOM"]');
			if (!option) {
				option = new Option('', 'CUSTOM');
				element('country').add(option);
			}
			option.textContent = `Uploaded: ${file.name}`;
			element('country').value = 'CUSTOM';
			load();
			update(`Loaded ${rows.length} observations with zero breaks. Your CSV stays in this browser.`);
		} catch (error) {
			status(`Upload rejected: ${error.message}`);
		} finally {
			element('upload').value = '';
		}
	});
	element('download-sample').addEventListener('click', () => {
		const keys = ['year', 'y', 's', 'n', 'delta', 'k'];
		const csv = [keys.join(','), ...data.map(row => keys.map(key => row[key]).join(','))].join('\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'growth-studio-input.csv';
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	});

	load();
})();
