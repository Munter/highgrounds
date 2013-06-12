var app = new (function () {
    var self = this;

    self.units = ko.observableArray();
    self.filter = ko.observable('');
    self.displayed = ko.computed(function () {
        var needle = self.filter().trim(),
            units = self.units();

        if (!needle) {
            return units;
        }

        return units.filter(function (unit) {
            return Object.keys(unit).some(function (key) {
                return unit[key].toLowerCase().indexOf(needle) !== -1;
            });
        });
    });

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
            rarity: entry.title.$t
        };

        order.forEach(function (key) {
            var value = entry[key].$t,
                extrakey,
                match;

            unit[map[key]] = value;

            if (value.indexOf('\n') !== -1) {
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

    app.units(units);
}
