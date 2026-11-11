/* Responsive SVG charts; fonts and colors inherit the portfolio theme. */
(function () {
	const namespace = 'http://www.w3.org/2000/svg';
	const chartStates = new WeakMap();

	function render(container, state) {
		const { series, breaks, xlabel, ylabel } = state;
		const width = Math.max(240, Math.round(container.getBoundingClientRect().width));
		const height = width < 480 ? 320 : 380;
		const bounds = { left: 63, right: width - 18, top: 32, bottom: height - 58 };
		const rows = series.flatMap(item => item.data);
		const xmin = Math.min(...rows.map(row => row.year));
		const xmax = Math.max(...rows.map(row => row.year));
		const ymax = Math.max(...rows.map(row => row.y)) * 1.08;
		const x = value => bounds.left + (value - xmin) / (xmax - xmin) * (bounds.right - bounds.left);
		const y = value => bounds.bottom - value / ymax * (bounds.bottom - bounds.top);

		const svg = document.createElementNS(namespace, 'svg');
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		svg.setAttribute('role', 'img');
		svg.setAttribute('aria-label', `${ylabel} over ${xlabel.toLowerCase()}. ${series.map(item => item.name).join(' compared with ')}.`);
		svg.classList.add('growth-chart');

		function add(tag, attributes, text) {
			const element = document.createElementNS(namespace, tag);
			for (const [key, value] of Object.entries(attributes)) {
				element.setAttribute(key, value);
			}
			if (text !== undefined) element.textContent = text;
			svg.append(element);
			return element;
		}

		const textStyle = {
			fill: 'var(--muted)',
			'font-size': 12,
			'font-family': 'var(--sans)'
		};

		for (let index = 0; index <= 4; index++) {
			const value = ymax * index / 4;
			add('line', {
				x1: bounds.left, x2: bounds.right,
				y1: y(value), y2: y(value), stroke: 'var(--line)'
			});
			add('text', {
				...textStyle, x: bounds.left - 10, y: y(value) + 4, 'text-anchor': 'end'
			}, value.toFixed(ymax < 10 ? 1 : 0));
		}

		const ticks = width < 480 ? 3 : 5;
		for (let index = 0; index <= ticks; index++) {
			const value = xmin + (xmax - xmin) * index / ticks;
			add('text', {
				...textStyle, x: x(value), y: bounds.bottom + 24, 'text-anchor': 'middle'
			}, Math.round(value));
		}

		for (const year of breaks) {
			add('line', {
				x1: x(year), x2: x(year), y1: bounds.top, y2: bounds.bottom,
				stroke: 'var(--muted)', 'stroke-dasharray': '4 6', opacity: .5
			});
			add('text', { ...textStyle, x: x(year), y: 18, 'text-anchor': 'middle' }, year);
		}

		for (const item of series) {
			add('path', {
				d: item.data.map((row, index) => `${index ? 'L' : 'M'}${x(row.year).toFixed(2)},${y(row.y).toFixed(2)}`).join(' '),
				fill: 'none',
				stroke: item.color,
				'stroke-width': 2.5,
				...(item.dash ? { 'stroke-dasharray': '7 6' } : {})
			});
		}

		add('text', {
			...textStyle, x: (bounds.left + bounds.right) / 2, y: height - 7, 'text-anchor': 'middle'
		}, xlabel);
		add('text', {
			...textStyle, transform: `translate(15 ${(bounds.top + bounds.bottom) / 2}) rotate(-90)`, 'text-anchor': 'middle'
		}, ylabel);

		const legend = document.createElement('div');
		legend.className = 'chart-legend';
		for (const item of series) {
			const label = document.createElement('span');
			const line = document.createElement('i');
			line.className = 'legend-line';
			line.style.borderColor = item.color;
			line.setAttribute('aria-hidden', 'true');
			if (item.dash) line.style.borderTopStyle = 'dashed';
			label.append(line, document.createTextNode(item.name));
			legend.append(label);
		}

		container.replaceChildren(svg, legend);
		state.width = width;
	}

	window.drawGrowthChart = function (container, series, breaks = [], xlabel = 'Year', ylabel = 'Output per worker ($1,000s)') {
		let state = chartStates.get(container);
		if (!state) {
			state = {};
			chartStates.set(container, state);
			state.observer = new ResizeObserver(() => {
				const width = Math.max(240, Math.round(container.getBoundingClientRect().width));
				if (width !== state.width) render(container, state);
			});
			state.observer.observe(container);
		}
		Object.assign(state, { series, breaks, xlabel, ylabel });
		render(container, state);
	};
})();
