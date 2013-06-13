var data = [];
if ('localStorage' in window && window['localStorage'] !== null) {
    if (localStorage.highgrounds) {
        data = JSON.parse(localStorage.highgrounds);
    }
}

var app = new (function () {
    var self = this;

    self.units = ko.observableArray();
    self.army = ko.observableArray();
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
                return needle.split(' ').every(function (subNeedle) {
                    return Object.keys(unit).some(function (key) {
                        return String(unit[key]).toLowerCase().indexOf(subNeedle) !== -1;
                    });
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

    self.armyAdd = function (item) {
        if (self.army().length > 27) {
            return;
        }

        if (self.army().filter(function (unit) {
            return item.name === unit.name;
        }).length < 2) {
            var copy = ko.toJS(item);

            self.army.push(copy);
        }
    };

    self.armyRemove = function (item) {
        self.army.remove(item);
    };

    self.army.subscribe(function (units) {
        var army = units.map(function (unit) {
            return unit.name;
        });

        location.hash = army.join(',');
    });

    self.load = ko.observable(location.hash.length > 1 ? location.hash.replace('#', '').split(',') : undefined);

    self.units.subscribe(function (units) {
        var names = self.load();

        if (names) {
            self.army.removeAll();

            self.load().forEach(function (name) {
                self.armyAdd(ko.utils.arrayFirst(units, function (item) {
                    return item.name === name;
                }));
            });
        }
    });

    self.units(data);

    document.body.addEventListener('keypress', function (e) {
        var typedChar = String.fromCharCode(e.charCode);

        if (/[a-z ]/i.test(typedChar)) {
            self.filter(self.filter() + typedChar);
            if (e.target.nodeName === 'INPUT') {
                e.preventDefault();
            }
        }
    }, false);

    document.body.addEventListener('keydown', function (e) {
        if (e.keyCode === 27) {
            self.filter('');

            if (e.target.nodeName === 'INPUT') {
                e.preventDefault();
            }
        }

        if (e.keyCode === 8) {
            self.filter(self.filter().slice(0, -1));

            if (e.target.nodeName === 'INPUT') {
                e.preventDefault();
            }
        }

    }, false);

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

            if (map[key].indexOf(' row') !== -1) {
                unit[map[key]] = [{
                    text: value,
                    amount: parseInt(value, 10),
                    type: value.replace(/\d| |^x/gi, '').toLowerCase()
                }];
            } else {
                unit[map[key]] = value;
            }

            if (isNaN(value) && value.indexOf('\n') !== -1) {
                match = entry.content.$t.match(new RegExp(value + ', [^:]+'));

                if (match) {
                    extrakey = match[0].split(', ').pop();
                    if (map[key].indexOf(' row') !== -1) {
                        value = entry['gsx$' + extrakey].$t;
                        unit[map[key]].push({
                            text: value,
                            amount: parseInt(value, 10),
                            type: value.replace(/\d| |^x/gi, '').toLowerCase()
                        });
                    } else {
                        unit[map[key]] = value.replace('\n', ', ') + entry['gsx$' + extrakey].$t;
                    }
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
