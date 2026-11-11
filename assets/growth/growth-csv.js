/* Parse annual input data locally; rates are fractions, not percentages. */
function parseCountryCSV(text) {
	const rows = [];
	let row = [];
	let field = '';
	let quoted = false;
	text = text.replace(/^\uFEFF/, '');

	for (let index = 0; index < text.length; index++) {
		const char = text[index];
		if (char === '"') {
			if (quoted && text[index + 1] === '"') {
				field += '"';
				index++;
			} else {
				quoted = !quoted;
			}
		} else if (!quoted && char === ',') {
			row.push(field.trim());
			field = '';
		} else if (!quoted && (char === '\n' || char === '\r')) {
			if (char === '\r' && text[index + 1] === '\n') index++;
			row.push(field.trim());
			if (row.some(value => value.length)) rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	if (quoted) throw new Error('CSV contains an unclosed quote.');
	row.push(field.trim());
	if (row.some(value => value.length)) rows.push(row);
	if (rows.length < 6) {
		throw new Error('CSV needs a header and at least 5 annual observations.');
	}

	const header = rows.shift().map(value => value.toLowerCase());
	const keys = ['year', 'y', 's', 'n', 'delta', 'k'];
	if (keys.some(key => header.filter(name => name === key).length !== 1)) {
		throw new Error('CSV requires exactly one column each: year,y,s,n,delta,k. No assumptions are inserted.');
	}

	const data = rows.map((values, index) => {
		const record = {};
		for (const key of keys) {
			const value = values[header.indexOf(key)];
			if (!value || !Number.isFinite(Number(value))) {
				throw new Error(`Row ${index + 2}: ${key} must be a finite number.`);
			}
			record[key] = Number(value);
		}

		if (!Number.isInteger(record.year) || record.year < 1800 || record.year > 2200 ||
			record.y <= 0 || record.k <= 0 || record.s <= 0 || record.s > 1 ||
			record.n <= -1 || record.n > 1 || record.delta < 0 || record.delta >= 1) {
			throw new Error(`Row ${index + 2}: invalid year, nonpositive output/capital, or rate outside its economic range. Rates are fractions, not percentages.`);
		}
		return record;
	}).sort((first, second) => first.year - second.year);

	for (let index = 1; index < data.length; index++) {
		if (data[index].year !== data[index - 1].year + 1) {
			throw new Error('Years must be consecutive and unique; repair gaps or duplicates before uploading.');
		}
	}
	return data;
}
