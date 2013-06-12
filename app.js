var app = {
    units: ko.observableArray()
};

ko.applyBindings(app);

function cells(data) {
    var units = [];

    console.log(data.feed.entry);

    data.feed.entry.forEach(function (item) {
        //console.log(item.content);
    });
}

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
