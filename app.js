var data = [];
if ('localStorage' in window && window['localStorage'] !== null) {
    if (localStorage.highgrounds) {
        data = JSON.parse(localStorage.highgrounds);
    }
}

var app = new (function () {
    var self = this;

    self.units = ko.observableArray(data);
    self.filter = ko.observable('');
    self.sortFn = ko.observable();
    self.displayed = ko.computed(function () {
        var needle = self.filter().trim(),
            units = self.units(),
            sortFn = self.sortFn(),
            result;

        if (!needle) {
            result = units;
        } else {
            result = units.filter(function (unit) {
                return Object.keys(unit).some(function (key) {
                    return String(unit[key]).toLowerCase().indexOf(needle) !== -1;
                });
            });
        }

        if (sortFn) {
            result.sort(sortFn);
        }

        return result;
    });

    self.lastSort = ko.observable({
        key: 'none'
    });

    self.sortNumeric = function (key, self) {
        var ascending = true,
            lastSort = self.lastSort();

        if (lastSort && lastSort.key === key) {
            ascending = !lastSort.ascending;
        }

        self.sortFn(function (a, b) {
            a = parseInt(a[key], 10);
            b = parseInt(b[key], 10);
            return (ascending ? 1 : -1) * (a - b);
        });

        self.lastSort({
            key: key,
            ascending: ascending
        });
    };

    self.sortText = function (key, self) {
        var ascending = true,
            lastSort = self.lastSort();

        if (lastSort && lastSort.key === key) {
            ascending = !lastSort.ascending;
        }

        self.sortFn(function (a, b) {
            a = a[key].toLowerCase();
            b = b[key].toLowerCase();
            return (ascending ? 1 : -1) * ((a < b) ? -1 : (a > b) ? 1 : 0);
        });

        self.lastSort({
            key: key,
            ascending: ascending
        });
    };

    return self;
})();

ko.applyBindings(app);

function list(data) {
    var order = [],
        units = [],
        entries = data.feed.entry,
        first = entries.shift(),
        map = {};

    first.content.$t.match(/_c[^:]+/g).forEach(function (key) {
        map['gsx$' + key] = first['gsx$' + key].$t.toLowerCase();
        order.push('gsx$' + key);
    });

    entries.forEach(function (entry) {
        var unit = {
            rarity: entry.title.$t,
            rarityClass: entry.title.$t.replace(' ', '').toLowerCase()
        };

        order.forEach(function (key) {
            var value = entry[key].$t,
                extrakey,
                match;

            if (Number(value)) {
                value = Number(value);
            }

            unit[map[key]] = value;

            if (isNaN(value) && value.indexOf('\n') !== -1) {
                match = entry.content.$t.match(new RegExp(value + ', [^:]+'));

                if (match) {
                    extrakey = match[0].split(', ').pop();
                    unit[map[key]] = value.replace('\n', ', ') + entry['gsx$' + extrakey].$t;
                } else {
                    unit[map[key]] = value.replace('\n', '');
                }
            }
        });

        units.push(unit);
    });

    units = units.map(function (unit) {
        unit.resourceClass = unit.resource.toLowerCase();

        return unit;
    });

    localStorage.highgrounds = JSON.stringify(units);

    app.units(units);
}
